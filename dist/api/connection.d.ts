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
    connect(restUri: string, websocketUri: string): any;
    /**
     * Closes the connection.
     */
    disconnect(): any;
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
     * @return Absolute URI
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
    get(path: string, parameters?: {}): Rx.Observable<any>;
    /**
     * @inheritdoc
     */
    post(path: string, data: {}, parameters?: {}): Rx.Observable<any>;
    /**
     * @inheritdoc
     */
    put(path: string, data: {}, parameters?: {}): Rx.Observable<any>;
    /**
     * @inheritdoc
     */
    patch(path: string, data: {}, parameters?: {}): Rx.Observable<any>;
    /**
     * @inheritdoc
     */
    delete(path: string, data: {}, parameters?: {}): Rx.Observable<any>;
    /**
     * Performs a REST API request against the genesis platform backend.
     *
     * @param method Request method
     * @param path Request path
     * @param data Request body
     * @param parameters Request parameters
     * @return An observable that emits the response
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
