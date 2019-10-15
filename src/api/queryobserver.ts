import * as _ from 'lodash';
import * as Rx from 'rx';
import * as immutable from 'immutable';

import {Message, Connection, QueryObserverResponse} from './connection';
import {makeImmutable} from '../core/utils/immutable';
import {QueryObserversError} from './errors';

// Possible message types.
export const MESSAGE_ADDED = 'added';
export const MESSAGE_CHANGED = 'changed';
export const MESSAGE_REMOVED = 'removed';

/**
 * Valid query observer statuses.
 */
export enum QueryObserverStatus {
    NEW,
    INITIALIZING,
    INITIALIZED,
    REINITIALIZING,
    STOPPED,
}

export interface ReinitializeHandler {
    (): Rx.Observable<Object>;
}

/**
 * A local copy of the query observer that is synchronized with the remote
 * instance on the genesis platform server.
 */
export class QueryObserver {
    public status: QueryObserverStatus;
    public items: any[];
    private _items: immutable.List<any>;

    private _updateQueue: Message[];
    private _updatesObservable: Rx.Observable<any>;
    private _updatesObserver: Rx.Observer<any>;
    private _reinitialize: ReinitializeHandler;

    /**
     * Constructs a new query observer.
     *
     * @param {string} id Unique query observer identifier
     * @param {QueryObserverManager} queryObserverManager Query observer manager
     */
    constructor(public id: string, private _queryObserverManager: QueryObserverManager) {
        this.status = QueryObserverStatus.NEW;
        this.items = [];
        this._items = immutable.List();
        this._updateQueue = [];
        this._updatesObservable = Rx.Observable.create((observer) => {
            this._updatesObserver = observer;
            return this.stop.bind(this);
        }).publish().refCount();
    }

    /**
     * Stops the query observer. There should be no need to call this method
     * manually.
     */
    public stop() {
        this.status = QueryObserverStatus.STOPPED;
        this._queryObserverManager.remove(this.id);
    }

    /**
     * Sets up a reinitialization handler for this query observer. The handler will be
     * called when the query observer needs to be reinitialized and it should return
     * an Rx.Observable, which produces the initial QueryObserverResponse.
     *
     * @param {ReinitializeHandler} handler Reinitialization handler
     */
    public setReinitializeHandler(handler: ReinitializeHandler) {
        this._reinitialize = handler;
    }

    /**
     * Starts query observer reinitialization. This method should be called when some
     * internal connection state changes (for example, when user authentication state
     * is changed).
     */
    public reinitialize() {
        if (this.status !== QueryObserverStatus.INITIALIZED) {
            return;
        }

        if (!this._reinitialize) {
            const error = new QueryObserversError('Attempted to reinitialize a QueryObserver without a reinitialization handler');
            this._queryObserverManager.errorObserver.onNext(error);
            return;
        }

        this.status = QueryObserverStatus.REINITIALIZING;
        this._reinitialize().subscribe((response: QueryObserverResponse) => {
            // Observer identifier might have changed, update observer and manager.
            const oldId = this.id;
            this.id = response.observer;
            this._queryObserverManager.move(oldId, this);

            // Perform reinitialization.
            this.status = QueryObserverStatus.NEW;
            this.initialize(response.items);
        });
    }

    /**
     * Moves an existing query observer into this query observer. The source query observer
     * should be considered invalid after this operation.
     *
     * @param {QueryObserver} observer Source query observer
     */
    public moveFrom(observer: QueryObserver) {
        this._updateQueue = observer._updateQueue;
        observer._updateQueue = null;
    }

    /**
     * Initializes the query observer.
     *
     * @param {any[]} items An initial list of items
     */
    public initialize(items: any[]) {
        if (this.status !== QueryObserverStatus.NEW) {
            return;
        }

        if (_.isUndefined(items)) {
            const error = new QueryObserversError('Invalid response received from backend, is the resource observable?');
            this._queryObserverManager.errorObserver.onNext(error);

            items = [];
        }

        this._items = immutable.fromJS(items);
        this.status = QueryObserverStatus.INITIALIZING;

        // Process all queued messages.
        _.forEach(this._updateQueue, this.update.bind(this));
        this._updateQueue = null;

        this.status = QueryObserverStatus.INITIALIZED;
        this._notify();
    }

    /**
     * Updates the item cache based on an incoming message.
     *
     * @param {Message} message Message instance
     */
    public update(message: Message) {
        if (this.status === QueryObserverStatus.STOPPED || this.status === QueryObserverStatus.REINITIALIZING) {
            return;
        } else if (this.status === QueryObserverStatus.NEW) {
            // Just queue the update for later as we haven't yet been initialized.
            this._updateQueue.push(message);
            return;
        }

        let items = this._items;
        let item = immutable.fromJS(message.item);
        switch (message.msg) {
            case MESSAGE_ADDED: {
                items = items.insert(message.order, item);
                break;
            }
            case MESSAGE_REMOVED: {
                items = items.filterNot(
                    (other) => item.get(message.primary_key) === other.get(message.primary_key)
                ).toList();
                break;
            }
            case MESSAGE_CHANGED: {
                let index = items.findIndex(
                    (other) => item.get(message.primary_key) === other.get(message.primary_key)
                );
                if (index >= 0) {
                    if (index !== message.order) {
                        // Item order has changed, move the item.
                        items = items.remove(index).insert(message.order, item);
                    } else {
                        items = items.set(index, item);
                    }
                }
                break;
            }
            default: {
                const error = new QueryObserversError(`Unknown message type ${message.msg}`);
                this._queryObserverManager.errorObserver.onNext(error);
            }
        }

        this._items = items;

        // Push updates to all subscribers.
        if (this.status === QueryObserverStatus.INITIALIZED) {
            this._notify();
        }
    }

    /**
     * Notifies subscribers of new items.
     */
    private _notify(): void {
        this.items = this._items.toJS();
        makeImmutable(this.items);

        this._updatesObserver.onNext(this.items);
    }

    /**
     * Returns an observable that will emit a list of items when any changes
     * happen to the observed query.
     */
    public observable(): Rx.Observable<any> {
        return this._updatesObservable;
    }
}

/**
 * A dictionary containing the query observers, indexed by their identifier.
 */
interface QueryObserverMap {
    [index: string]: QueryObserver;
}

/**
 * Manages all active query observers.
 */
export class QueryObserverManager {
    private _observers: QueryObserverMap;
    private _unsubscribeChain = Promise.resolve<any>({});

    /**
     * Constructs a new query observer manager.
     */
    constructor(private _connection: Connection, private _errors: Rx.Observer<QueryObserversError>) {
        this._observers = {};
    }

    /**
     * Error observer getter for notifying about query observer errors.
     */
    public get errorObserver(): Rx.Observer<QueryObserversError> {
        return this._errors;
    }

    /**
     * Returns a query observer with a specific identifier.
     *
     * @param {string} observerId Query observer identifier
     * @param {boolean} create Should a new query observer be created if one with the specified identifier does not yet exist
     * @return {QueryObserver} Query observer instance
     */
    public get(observerId: string, create: boolean = true): QueryObserver {
        // If the specific observer does not yet exist, create a new entry.
        let observer = this._observers[observerId];
        if (!observer && create) {
            observer = new QueryObserver(observerId, this);
            this._observers[observerId] = observer;
        }

        return observer;
    }

    /**
     * Deletes a query observer with the specified identifier.
     *
     * @param observerId Query observer identifier
     */
    protected _deleteObserver(observerId: string) {
        delete this._observers[observerId];
    }

    /**
     * Requests the backend to unsubscribe us from this observer.
     *
     * @param observerId Query observer identifier
     */
    protected _unsubscribe<T>(observerId: string): Rx.Observable<T> {
        return this._connection.post<T>('/api/queryobserver/unsubscribe', {}, {
            observer: observerId,
            subscriber: this._connection.sessionId(),
        });
    }

    /**
     * Removes a query observer with a specific identifier.
     *
     * Rx has no way of waiting for dispose to finish, that's why
     * we defer reactive queries after unsubscribe is finished.
     *
     * @param {string} observerId Query observer identifier
     */
    public remove(observerId: string) {
        this._deleteObserver(observerId);

        // Using promises, because we couldn't get observables to unsubscribe only once.
        // Even using .take(1) didn't seem to correctly limit number of emits
        this._unsubscribeChain = this._unsubscribeChain.then(() => {
            return this._unsubscribe(observerId).toPromise();
        });
    }

    /**
     * Calls a function that creates an observable, after previous unsubscribe request finishes.
     */
    public chainAfterUnsubscribe<T>(makeObservable: () => Rx.Observable<T>): Rx.Observable<T> {
        return Rx.Observable.fromPromise(this._unsubscribeChain).flatMap(() => {
            return makeObservable();
        });
    }

    /**
     * Changes a query observer's identifier.
     *
     * @param {string} oldObserverId Old query observer identifier
     * @param {QueryObserver} observer New query observer
     */
    public move(oldObserverId: string, observer: QueryObserver) {
        if (oldObserverId === observer.id) {
            return;
        }

        this.remove(oldObserverId);

        // The observer we are moving into might have already received some messages. In
        // this case, we need to move the queued messages to the old observer.
        let existingObserver = this._observers[observer.id];
        if (existingObserver) {
            observer.moveFrom(existingObserver);
        }

        this._observers[observer.id] = observer;
    }

    /**
     * Updates the query observers based on an incoming message.
     *
     * @param {Message} message Message instance
     */
    public update(message: Message) {
        this.get(message.observer).update(message);
    }

    /**
     * Returns an observable that will emit a list of items when any changes
     * happen to the observed query.
     *
     * @param {string} observerId Query observer identifier
     */
    public observable(observerId: string): Rx.Observable<Object> {
        return this.get(observerId).observable();
    }

    /**
     * Requests all query observers to start reinitialization.
     *
     * This method should be called when some internal connection state changes
     * (for example, when user authentication state is changed).
     */
    public reinitialize() {
        _.forOwn(this._observers, (observer) => {
            observer.reinitialize();
        });
    }
}
