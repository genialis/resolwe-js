import * as Rx from 'rx';
import { Connection } from '../../connection';
import { Resource, QueryOptions } from '../../resource';
import * as types from '../../types/rest';
/**
 * A resource class backed by a genesis platform model.
 */
export declare class RESTResource<T> extends Resource {
    private _name;
    /**
     * Constructs a new REST resource.
     *
     * @param name Resource name
     * @param connection Connection with the genesis platform server
     */
    constructor(_name: string, connection: Connection);
    /**
     * Returns resource name.
     */
    readonly name: string;
    private _getResourcePath();
    /**
     * Returns the path used for requesting a list of resource items.
     */
    protected getListPath(): string;
    /**
     * Returns the path used for calling a method on the resource type.
     */
    getListMethodPath(method: string): string;
    /**
     * Returns the path used for requesting a specific resource item.
     */
    protected getDetailPath(primaryKey: number | string): string;
    /**
     * Returns the path used for calling a method on a specific resource item.
     */
    getDetailMethodPath(primaryKey: number | string, method: string): string;
    /**
     * Returns the path used for querying the resource.
     */
    protected getQueryPath(query: types.Query): string;
    /**
     * Calls a method on an instance of the given resource.
     *
     * @param primaryKey Instance primary key
     * @param method Method name
     * @param data Method data object
     * @return An observable that emits the response
     */
    callMethod<U>(primaryKey: number | string, method: string, data?: any): Rx.Observable<U>;
    /**
     * Calls a method on the given resource.
     *
     * @param method Method name
     * @param data Method data object
     * @return An observable that emits the response
     */
    callListMethod<U>(method: string, data?: any): Rx.Observable<U>;
    /**
     * Creates an instance of the given resource.
     *
     * @param data Object attributes
     * @return An observable that emits the response
     */
    create(data: Object): Rx.Observable<T>;
    /**
     * Updates an existing instance of the given resource.
     *
     * @param primaryKey Instance primary key
     * @param data Object attributes
     * @return An observable that emits the response
     */
    update(primaryKey: number | string, data: Object): Rx.Observable<T>;
    /**
     * Replaces an existing instance of the given resource.
     *
     * @param primaryKey Instance primary key
     * @param data Object attributes
     * @return An observable that emits the response
     */
    replace(primaryKey: number | string, data: Object): Rx.Observable<T>;
    /**
     * Deletes an existing instance of the given resource.
     *
     * @param primaryKey Instance primary key
     * @return An observable that emits the response
     */
    delete(primaryKey: number | string): Rx.Observable<Object>;
    /**
     * Retrieves an existing instance of the given resource. Does not subscribe
     * to subsequent updates. For reactive updates use query/queryOne.
     *
     * @param primaryKey Instance primary key
     * @return An observable that emits the response
     */
    get(primaryKey: number | string): Rx.Observable<T>;
    /**
     * Performs a live query against this resource. Subscribing to the returned
     * observable will track any changes made to the resources returned by the
     * given query.
     *
     * @param query Query
     * @param options Query options
     */
    query(query?: types.Query, options?: QueryOptions): Rx.Observable<T[]>;
    /**
     * Performs a live query against this resource. Subscribing to the returned
     * observable will track any changes made to the resources returned by the
     * given query.
     *
     * The query must match only a single item. Otherwise, an error will be
     * propagated along the observable.
     *
     * DON'T FORGET TO HANDLE THE ERRORS!
     *
     * @param query Query
     * @param options Query options
     */
    queryOne(query?: types.Query, options?: QueryOptions): Rx.Observable<T>;
}
