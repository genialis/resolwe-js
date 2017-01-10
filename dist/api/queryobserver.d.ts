import * as Rx from 'rx';
import { Message, Connection } from './connection';
import { QueryObserversError } from './errors';
export declare const MESSAGE_ADDED = "added";
export declare const MESSAGE_CHANGED = "changed";
export declare const MESSAGE_REMOVED = "removed";
/**
 * Valid query observer statuses.
 */
export declare enum QueryObserverStatus {
    NEW = 0,
    INITIALIZING = 1,
    INITIALIZED = 2,
    REINITIALIZING = 3,
    STOPPED = 4,
}
export interface ReinitializeHandler {
    (): Rx.Observable<Object>;
}
/**
 * A local copy of the query observer that is synchronized with the remote
 * instance on the genesis platform server.
 */
export declare class QueryObserver {
    id: string;
    private _queryObserverManager;
    status: QueryObserverStatus;
    items: any[];
    private _items;
    private _updateQueue;
    private _updatesObservable;
    private _updatesObserver;
    private _reinitialize;
    /**
     * Constructs a new query observer.
     *
     * @param {string} id Unique query observer identifier
     * @param {QueryObserverManager} queryObserverManager Query observer manager
     */
    constructor(id: string, _queryObserverManager: QueryObserverManager);
    /**
     * Stops the query observer. There should be no need to call this method
     * manually.
     */
    stop(): void;
    /**
     * Sets up a reinitialization handler for this query observer. The handler will be
     * called when the query observer needs to be reinitialized and it should return
     * an Rx.Observable, which produces the initial QueryObserverResponse.
     *
     * @param {ReinitializeHandler} handler Reinitialization handler
     */
    setReinitializeHandler(handler: ReinitializeHandler): void;
    /**
     * Starts query observer reinitialization. This method should be called when some
     * internal connection state changes (for example, when user authentication state
     * is changed).
     */
    reinitialize(): void;
    /**
     * Moves an existing query observer into this query observer. The source query observer
     * should be considered invalid after this operation.
     *
     * @param {QueryObserver} observer Source query observer
     */
    moveFrom(observer: QueryObserver): void;
    /**
     * Initializes the query observer.
     *
     * @param {any[]} items An initial list of items
     */
    initialize(items: any[]): void;
    /**
     * Updates the item cache based on an incoming message.
     *
     * @param {Message} message Message instance
     */
    update(message: Message): void;
    /**
     * Notifies subscribers of new items.
     */
    private _notify();
    /**
     * Returns an observable that will emit a list of items when any changes
     * happen to the observed query.
     */
    observable(): Rx.Observable<any>;
}
/**
 * Manages all active query observers.
 */
export declare class QueryObserverManager {
    private _connection;
    private _errors;
    private _observers;
    private _unsubscribeChain;
    /**
     * Constructs a new query observer manager.
     */
    constructor(_connection: Connection, _errors: Rx.Observer<QueryObserversError>);
    /**
     * Error observer getter for notifying about query observer errors.
     */
    readonly errorObserver: Rx.Observer<QueryObserversError>;
    /**
     * Returns a query observer with a specific identifier.
     *
     * @param {string} observerId Query observer identifier
     * @param {boolean} create Should a new query observer be created if one with the specified identifier does not yet exist
     * @return {QueryObserver} Query observer instance
     */
    get(observerId: string, create?: boolean): QueryObserver;
    /**
     * Deletes a query observer with the specified identifier.
     *
     * @param observerId Query observer identifier
     */
    protected _deleteObserver(observerId: string): void;
    /**
     * Requests the backend to unsubscribe us from this observer.
     *
     * @param observerId Query observer identifier
     */
    protected _unsubscribe<T>(observerId: string): Rx.Observable<T>;
    /**
     * Removes a query observer with a specific identifier.
     *
     * Rx has no way of waiting for dispose to finish, that's why
     * we defer reactive queries after unsubscribe is finished.
     *
     * @param {string} observerId Query observer identifier
     */
    remove(observerId: string): void;
    /**
     * Calls a function that creates an observable, after previous unsubscribe request finishes.
     */
    chainAfterUnsubscribe<T>(makeObservable: () => Rx.Observable<T>): Rx.Observable<T>;
    /**
     * Changes a query observer's identifier.
     *
     * @param {string} oldObserverId Old query observer identifier
     * @param {QueryObserver} observer New query observer
     */
    move(oldObserverId: string, observer: QueryObserver): void;
    /**
     * Updates the query observers based on an incoming message.
     *
     * @param {Message} message Message instance
     */
    update(message: Message): void;
    /**
     * Returns an observable that will emit a list of items when any changes
     * happen to the observed query.
     *
     * @param {string} observerId Query observer identifier
     */
    observable(observerId: string): Rx.Observable<Object>;
    /**
     * Requests all query observers to start reinitialization.
     *
     * This method should be called when some internal connection state changes
     * (for example, when user authentication state is changed).
     */
    reinitialize(): void;
}
