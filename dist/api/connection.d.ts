import * as Rx from 'rx';
import 'jquery.cookie';
import { QueryObserverManager } from './queryobserver';
import { APIError } from './errors';
/**
 * Message exchanged via WebSocket.
 */
export interface Message {
    msg: string;
    observer: string;
    primary_key: string;
    order: number;
    item: Object;
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
     * @param {string} uri Genesis platform server URI
     */
    connect(restUri: string, websocketUri: string): any;
    /**
     * Closes the connection.
     */
    disconnect(): any;
    /**
     * Returns an observable that emits whether websocket connection is established or not.
     *
     * @return {Rx.Observable<boolean>} An observable that emits true/false
     */
    isConnected(): Rx.Observable<boolean>;
    /**
     * Performs a REST API GET request against the genesis platform backend.
     *
     * @param {string} path Request path
     * @param {Object} parameters Request parameters
     * @return {Rx.Observable<T>} An observable that emits the response
     */
    get<T>(path: string, parameters?: Object): Rx.Observable<T>;
    /**
     * Performs a REST API POST request against the genesis platform backend.
     *
     * @param {string} path Request path
     * @param {Object} data Request body
     * @param {Object} parameters Request parameters
     * @return {Rx.Observable<T>} An observable that emits the response
     */
    post<T>(path: string, data: Object, parameters?: Object): Rx.Observable<T>;
    /**
     * Performs a REST API PUT request against the genesis platform backend.
     *
     * @param {string} path Request path
     * @param {Object} data Request body
     * @param {Object} parameters Request parameters
     * @return {Rx.Observable<T>} An observable that emits the response
     */
    put<T>(path: string, data: Object, parameters?: Object): Rx.Observable<T>;
    /**
     * Performs a REST API PATCH request against the genesis platform backend.
     *
     * @param {string} path Request path
     * @param {Object} data Request body
     * @param {Object} parameters Request parameters
     * @return {Rx.Observable<T>} An observable that emits the response
     */
    patch<T>(path: string, data: Object, parameters?: Object): Rx.Observable<T>;
    /**
     * Performs a REST API DELETE request against the genesis platform backend.
     *
     * @param {string} path Request path
     * @param {Object} data Request body
     * @param {Object} parameters Request parameters
     * @return {Rx.Observable<T>} An observable that emits the response
     */
    delete<T>(path: string, data: Object, parameters?: Object): Rx.Observable<T>;
    /**
     * Returns an absolute API URI for a specific resource path.
     *
     * @param {string} path API resource path
     * @return {string} Absolute URI
     */
    createUriFromPath(path: string): string;
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
 * An concrete implementation of a connection.
 */
export declare class SimpleConnection implements Connection {
    private _restUri;
    private _websocketUri;
    private _sessionId;
    private _websocket;
    private _observable;
    private _disposableConnection;
    private _queryObserverManager;
    private _requestQueue;
    private _isConnected;
    private _isConnectedSubject;
    private _errors;
    /**
     * Constructs a new connection.
     */
    constructor();
    /**
     * @inheritdoc
     */
    sessionId(): string;
    /**
     * @inheritdoc
     */
    csrfCookie(): string;
    /**
     * @inheritdoc
     */
    connect(restUri: string, websocketUri: string): void;
    /**
     * @inheritdoc
     */
    disconnect(): void;
    /**
     * @inheritdoc
     */
    isConnected(): Rx.Observable<boolean>;
    /**
     * Notifies isConnected observers.
     *
     * @param isConnected True if connection established
     */
    private _handleIsConnected(isConnected);
    /**
     * Performs a request against the remote server. If the connection has not
     * yet been established, the request is queued.
     *
     * @param request Any function, which returns a promise
     * @return A promise, which is fulfilled when the initial promise is
     */
    private _request(request);
    /**
     * Processes any pending requests.
     */
    private _processRequests();
    /**
     * @inheritdoc
     */
    createUriFromPath(path: string): string;
    /**
     * @inheritdoc
     */
    get(path: string, parameters?: Object): Rx.Observable<Object>;
    /**
     * @inheritdoc
     */
    post(path: string, data: Object, parameters?: Object): Rx.Observable<Object>;
    /**
     * @inheritdoc
     */
    put(path: string, data: Object, parameters?: Object): Rx.Observable<Object>;
    /**
     * @inheritdoc
     */
    patch(path: string, data: Object, parameters?: Object): Rx.Observable<Object>;
    /**
     * @inheritdoc
     */
    delete(path: string, data: Object, parameters?: Object): Rx.Observable<Object>;
    /**
     * Performs a REST API request against the genesis platform backend.
     *
     * @param {string} method Request method
     * @param {string} path Request path
     * @param {Object} data Request body
     * @param {Object} parameters Request parameters
     * @return {Rx.Observable<Object>} An observable that emits the response
     */
    private _update(method, path, data, parameters?);
    /**
     * @inheritdoc
     */
    messages(): Rx.Observable<Message>;
    /**
     * @inheritdoc
     */
    errors(): Rx.Observable<APIError>;
    /**
     * @inheritdoc
     */
    queryObserverManager(): QueryObserverManager;
    /**
     * Checks XHR and notifies error observers.
     */
    private _interceptErrors(xhr);
}
