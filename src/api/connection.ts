import * as _ from 'lodash';
import * as jQuery from 'jquery';
import * as Rx from 'rx';
import 'jquery.cookie';

import {QueryObserverManager} from './queryobserver';
import {APIError, RequestError, ServerError, WebsocketError} from './errors';
import * as random from '../core/utils/random';

/**
 * Message exchanged via WebSocket.
 */
export interface Message {
    msg: string;
    observer: string;
    primary_key: string;
    order: number;
    item: {};
}

/**
 * Response to REST API observe requests.
 */
export interface QueryObserverResponse {
    observer: string;
    items: any[];
}

export interface Connection {
    /**
     * Establishes a connection with the genesis platform server.
     *
     * @param uri Genesis platform server URI
     */
    connect(restUri: string, websocketUri: string);

    /**
     * Closes the connection.
     */
    disconnect();

    /**
     * Returns an observable that emits whether websocket connection is established or not.
     *
     * @return An observable that emits true/false
     */
    isConnected(): Rx.Observable<boolean>;

    /**
     * Performs a REST API GET request against the genesis platform backend.
     *
     * @param path Request path
     * @param parameters Request parameters
     * @return An observable that emits the response
     */
    get<T>(path: string, parameters?: {}): Rx.Observable<T>;

    /**
     * Performs a REST API POST request against the genesis platform backend.
     *
     * @param path Request path
     * @param data Request body
     * @param parameters Request parameters
     * @return An observable that emits the response
     */
    post<T>(path: string, data: {}, parameters?: {}): Rx.Observable<T>;

    /**
     * Performs a REST API PUT request against the genesis platform backend.
     *
     * @param path Request path
     * @param data Request body
     * @param parameters Request parameters
     * @return An observable that emits the response
     */
    put<T>(path: string, data: {}, parameters?: {}): Rx.Observable<T>;

    /**
     * Performs a REST API PATCH request against the genesis platform backend.
     *
     * @param path Request path
     * @param data Request body
     * @param parameters Request parameters
     * @return An observable that emits the response
     */
    patch<T>(path: string, data: {}, parameters?: {}): Rx.Observable<T>;

    /**
     * Performs a REST API DELETE request against the genesis platform backend.
     *
     * @param path Request path
     * @param data Request body
     * @param parameters Request parameters
     * @return An observable that emits the response
     */
    delete<T>(path: string, data: {}, parameters?: {}): Rx.Observable<T>;

    /**
     * Returns an absolute API URI for a specific resource path.
     *
     * @param path API resource path
     * @param queryParameters Query parameters
     * @return Absolute URI
     */
    createUriFromPath(path: string, queryParameters?: {}): string;

    /**
     * Returns the CSRF cookie value that must be used when doing POST requests.
     */
    csrfCookie(): string;

    /**
     * A stream of incoming WebSocket messages.
     */
    messages(): Rx.Observable<Message>;

    /**
     * A stream of error messages.
     */
    errors(): Rx.Observable<APIError>;

    /**
     * Returns the current unique session identifier.
     */
    sessionId(): string;

    /**
     * Returns the QueryObserverManager instance associated with this connection.
     */
    queryObserverManager(): QueryObserverManager;
}

/**
 * A pending request that should be executed once the connection is in a proper state.
 */
interface PendingRequest {
    request: () => Rx.IPromise<any>;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
}

/**
 * An concrete implementation of a connection.
 */
export class SimpleConnection implements Connection {
    private _restUri: string;
    private _websocketUri: string;
    private _sessionId: string;
    private _websocket: WebSocket;
    private _observable: Rx.ConnectableObservable<any>;
    private _disposableConnection: Rx.Disposable;
    private _queryObserverManager: QueryObserverManager;
    private _requestQueue: PendingRequest[];
    private _isConnected: boolean;
    private _isConnectedSubject: Rx.Subject<boolean>;
    private _errors: Rx.Subject<APIError>;

    /**
     * Constructs a new connection.
     */
    constructor() {
        this._sessionId = random.randomUuid();
        this._observable = null;
        this._requestQueue = [];
        this._isConnectedSubject = new Rx.Subject<boolean>();
        this._errors = new Rx.Subject<APIError>();
        this._queryObserverManager = new QueryObserverManager(this, this._errors);
    }

    /**
     * @inheritdoc
     */
    public sessionId(): string {
        return this._sessionId;
    }

    /**
     * @inheritdoc
     */
    public csrfCookie(): string {
        return jQuery.cookie('csrftoken');
    }

    /**
     * @inheritdoc
     */
    public connect(restUri: string, websocketUri: string) {
        if (this._observable) {
            console.warn("Attempted to connect an already initialized connection.");
            return;
        }

        this._restUri = restUri;
        this._websocketUri = websocketUri;

        this._observable = Rx.Observable.create((observer) => {
            const reconnect = _.throttle(() => {
                this._websocket = new WebSocket(this._websocketUri + this._sessionId + '?subscribe-broadcast');

                // Register message and error handlers.
                this._websocket.onmessage = observer.onNext.bind(observer);
                // Don't handle `onerror` because it doesn't provide any useful information
                // https://www.w3.org/TR/websockets/#concept-websocket-close-fail
                this._websocket.onopen = () => {
                    this._processRequests();
                    this._handleIsConnected(true);
                };
                // Register reconnection handler. We reconnect immediately after the socket gets closed.
                this._websocket.onclose = (event) => {
                    const error = new WebsocketError(`Websocket error ${event.code}`, event);
                    this._errors.onNext(error);
                    reconnect();
                    this._handleIsConnected(false);
                };
            }, 5000);

            reconnect();

            // There is no way to unsubscribe as we always want to have the socket connected.
            return _.noop;
        }).publish();
        this._disposableConnection = this._observable.connect();

        // Subscribe to item cache updates.
        this.messages().subscribe(this._queryObserverManager.update.bind(this._queryObserverManager));
    }

    /**
     * @inheritdoc
     */
    public disconnect() {
        this._disposableConnection.dispose();
    }

    /**
     * @inheritdoc
     */
    public isConnected(): Rx.Observable<boolean> {
        return this._isConnectedSubject;
    }

    /**
     * Notifies isConnected observers.
     *
     * @param isConnected True if connection established
     */
    private _handleIsConnected(isConnected: boolean): void {
        if (this._isConnected !== isConnected) {
            this._isConnected = isConnected;
            if (!_.isUndefined(this._isConnectedSubject)) {
                this._isConnectedSubject.onNext(this._isConnected);
            }
        }
    }

    /**
     * Performs a request against the remote server. If the connection has not
     * yet been established, the request is queued.
     *
     * @param request Any function, which returns a promise
     * @return A promise, which is fulfilled when the initial promise is
     */
    private _request(request: () => Rx.IPromise<any>): Rx.IPromise<any> {
        let promise = new Promise((resolve, reject) => {
            this._requestQueue.push({
                request: request,
                resolve: resolve,
                reject: reject,
            });

            if (this._websocket && this._websocket.readyState === WebSocket.OPEN) {
                this._processRequests();
            }
        });

        return promise;
    }

    /**
     * Processes any pending requests.
     */
    private _processRequests() {
        if (!this._requestQueue.length) {
            return;
        }

        for (let request of this._requestQueue) {
            request.request().then(request.resolve, request.reject);
        }

        this._requestQueue = [];
    }

    /**
     * @inheritdoc
     */
    public createUriFromPath(path: string, queryParameters?: {}): string {
        const parameters = !_.isEmpty(queryParameters) ? '?' + jQuery.param(queryParameters) : '';
        return this._restUri + path + parameters;
    }

    /**
     * @inheritdoc
     */
    public get(path: string, parameters: {} = {}): Rx.Observable<any> {
        const url = this.createUriFromPath(path, parameters);

        return Rx.Observable.fromPromise(this._request((): Rx.IPromise<any> => {
            const jQueryXHR = jQuery.ajax({
                type: 'get',
                url: url,
                contentType: 'application/json',
            });

            this._interceptErrors(url, jQueryXHR);

            return jQueryXHR;
        }));
    }

    /**
     * @inheritdoc
     */
    public post(path: string, data: {}, parameters: {} = {}): Rx.Observable<any> {
        return this._update('POST', path, data, parameters);
    }

    /**
     * @inheritdoc
     */
    public put(path: string, data: {}, parameters: {} = {}): Rx.Observable<any> {
        return this._update('PUT', path, data, parameters);
    }

    /**
     * @inheritdoc
     */
    public patch(path: string, data: {}, parameters: {} = {}): Rx.Observable<any> {
        return this._update('PATCH', path, data, parameters);
    }

    /**
     * @inheritdoc
     */
    public delete(path: string, data: {}, parameters: {} = {}): Rx.Observable<any> {
        return this._update('DELETE', path, data, parameters);
    }

    /**
     * Performs a REST API request against the genesis platform backend.
     *
     * @param method Request method
     * @param path Request path
     * @param data Request body
     * @param parameters Request parameters
     * @return An observable that emits the response
     */
    private _update(method: string, path: string, data: {}, parameters: {} = {}): Rx.Observable<any> {
        const url = this.createUriFromPath(path, parameters);

        return Rx.Observable.fromPromise(this._request((): Rx.IPromise<any> => {
            const jQueryXHR = jQuery.ajax({
                type: method,
                url: url,
                data: JSON.stringify(data),
                contentType: 'application/json',
                beforeSend: (xhr, settings) => {
                    xhr.setRequestHeader('X-CSRFToken', this.csrfCookie());
                },
            });

            this._interceptErrors(url, jQueryXHR);

            return jQueryXHR;
        }));
    }

    /**
     * @inheritdoc
     */
    public messages(): Rx.Observable<Message> {
        return this._observable.map(
            (event) => {
                return JSON.parse(event.data);
            }
        ).filter(
            (data) => data.msg
        ).map(
            (data): Message => {
                return {
                    msg: data.msg,
                    observer: data.observer,
                    primary_key: data.primary_key,
                    order: data.order,
                    item: data.item,
                };
            }
        );
    }

    /**
     * @inheritdoc
     */
    public errors(): Rx.Observable<APIError> {
        return this._errors;
    }

    /**
     * @inheritdoc
     */
    public queryObserverManager(): QueryObserverManager {
        return this._queryObserverManager;
    }

    /**
     * Checks XHR and notifies error observers.
     */
    private _interceptErrors(url: string, xhr: JQueryXHR): void {
        xhr.then((response: {}) => {
            if (_.has(response, 'error')) {
                const error = new RequestError(url, <string> response['error'], response);
                this._errors.onNext(error);
            }
        });

        xhr.fail((jqXHR: JQueryXHR, textStatus: string, errorThrown: string) => {
            if (jqXHR.status === 413) {
                const error = new RequestError(url, `${jqXHR.status}: ${errorThrown}`, jqXHR);
                this._errors.onNext(error);
            }
            if (500 <= jqXHR.status && jqXHR.status < 600) {
                const error = new ServerError(url, `${jqXHR.status}: ${errorThrown}`, jqXHR);
                this._errors.onNext(error);
            }
        });
    }
}
