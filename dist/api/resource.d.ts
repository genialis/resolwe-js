import * as Rx from 'rx';
import { Connection } from './connection';
import * as types from './types/rest';
/**
 * Per-query configuration options.
 */
export interface QueryOptions {
    reactive?: boolean;
}
/**
 * An abstract resource class.
 */
export declare abstract class Resource {
    private _connection;
    private _queryObserverIdCache;
    private _pendingQueries;
    /**
     * Constructs a new resource.
     *
     * @param connection Connection with the genesis platform server
     */
    constructor(_connection: Connection);
    /**
     * Connection to the genesis-platform server.
     */
    readonly connection: Connection;
    /**
     * Returns base path that resource path is based upon.
     */
    protected getBasePath(): string;
    /**
     * Performs any query transformations needed for this resource. The
     * original query object is not modified.
     *
     * @param query Query
     * @return Transformed query
     */
    protected transformQuery(query: types.Query): types.Query;
    /**
     * Performs a query against this resource and subscribes to subsequent updates.
     */
    protected reactiveRequest<T>(query: types.Query, path: string, options?: QueryOptions): Rx.Observable<T[]>;
}
