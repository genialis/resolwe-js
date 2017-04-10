import * as _ from 'lodash';
import * as Rx from 'rx';

import {Connection, QueryObserverResponse} from './connection';
import {QueryObserverStatus} from './queryobserver';
import * as types from './types/rest';

/**
 * A mapping of queries to their query observer identifiers, so that we don't
 * need to hit the server in case the identifier is already known.
 */
interface QueryObserverIdCache {
    [index: string]: string;
}

interface PendingQueries {
    [index: string]: {
        subscriptions: Rx.Disposable[];
        observer: Rx.Observer<any>;
    }[];
}

/**
 * Per-query configuration options.
 */
export interface QueryOptions {
    reactive?: boolean;
}

/**
 * An abstract resource class.
 */
export abstract class Resource {
    // Cache query observer identifiers.
    private _queryObserverIdCache: QueryObserverIdCache = {};
    private _pendingQueries: PendingQueries = {};

    /**
     * Constructs a new resource.
     *
     * @param connection Connection with the genesis platform server
     */
    constructor(private _connection: Connection) {
    }

    /**
     * Connection to the genesis-platform server.
     */
    public get connection(): Connection {
        return this._connection;
    }

    /**
     * Returns base path that resource path is based upon.
     */
    protected getBasePath(): string {
        return `/api`;
    }

    /**
     * Performs any query transformations needed for this resource. The
     * original query object is not modified.
     *
     * @param query Query
     * @return Transformed query
     */
    protected transformQuery(query: types.Query): types.Query {
        return _.cloneDeep(query);
    }

    /**
     * Performs a query against this resource and subscribes to subsequent updates.
     */
    protected reactiveRequest<T>(query: types.Query, path: string, options?: QueryOptions): Rx.Observable<T[]> {
        // We assume that the same query object on the same resource will always result in the same
        // underlying queryset (and therefore query observer).
        let serializedQuery = JSON.stringify([path, query]);
        options = _.defaults({}, options || {}, {
            reactive: false,
        });

        return Rx.Observable.create<T[]>((observer) => {
            if (!options.reactive) {
                // Reactivity is disabled for this query.
                query = this.transformQuery(query);
                const subscription = this.connection.get(path, query).map((response: any) => {
                    // Correctly handle paginated results.
                    if (_.has(response, 'results')) return response.results;
                    return response;
                }).subscribe(observer);

                return () => subscription.dispose();
            }

            // Reactivity is enabled.
            let queryObserverId = this._queryObserverIdCache[serializedQuery];
            let pendingQueries = this._pendingQueries[serializedQuery];

            // Perform a REST query to get the observer identifier and to subscribe to new updates.
            let subscriptions: Rx.Disposable[] = [];

            if (queryObserverId) {
                // This query observer identifier has already been cached. Check if it exists and in this
                // case just subscribe to all items.
                let queryObserver = this.connection.queryObserverManager().get(queryObserverId, false);
                if (queryObserver) {
                    if (queryObserver.status === QueryObserverStatus.INITIALIZED ||
                        queryObserver.status === QueryObserverStatus.REINITIALIZING) {
                        subscriptions.push(queryObserver.observable().subscribe(observer));
                    }

                    if (queryObserver.status === QueryObserverStatus.INITIALIZED) {
                        observer.onNext(queryObserver.items);
                    }
                }
            }

            if (_.isEmpty(subscriptions)) {
                if (pendingQueries) {
                    // A request for the same query is already in progress.
                    pendingQueries.push({observer, subscriptions});
                } else {
                    this._pendingQueries[serializedQuery] = [{observer, subscriptions}];

                    query = _.assign(this.transformQuery(query), {observe: this.connection.sessionId()});
                    this.connection.queryObserverManager().chainAfterUnsubscribe(() => this.connection.get(path, query)).subscribe(
                        (response: QueryObserverResponse) => {
                            // Populate messages from this request.
                            let queryObserver = this.connection.queryObserverManager().get(response.observer);
                            this._queryObserverIdCache[serializedQuery] = response.observer;

                            // Setup a reinitialization handler for this observer. It may be used in case the parameters
                            // of a connection change and the observer needs to be re-created on the server without losing
                            // any of the client-side subscriptions.
                            queryObserver.setReinitializeHandler(() => {
                                return this.connection.get(path, query);
                            });

                            for (const pending of this._pendingQueries[serializedQuery]) {
                                pending.subscriptions.push(queryObserver.observable().subscribe(pending.observer));

                                if (queryObserver.status === QueryObserverStatus.INITIALIZED) {
                                    // If the query observer is already initialized, emit the current items immediately.
                                    pending.observer.onNext(queryObserver.items);
                                }
                            }

                            delete this._pendingQueries[serializedQuery];

                            if (queryObserver.status !== QueryObserverStatus.INITIALIZED) {
                                queryObserver.initialize(response.items);
                            }
                        },
                        (error) => {
                            observer.onError(error);
                        }
                    );
                }
            }

            return () => {
                // Dispose of the query observer subscription when all subscriptions to this query are stopped.
                for (const subscription of subscriptions) {
                    subscription.dispose();
                }
            };
        }).publish().refCount();
    }
}
