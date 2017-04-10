import * as Rx from 'rx';

import {Connection} from '../../connection';
import {Resource, QueryOptions} from '../../resource';
import {QueryOneError} from '../../errors';
import * as types from '../../types/rest';

/**
 * A resource class backed by a genesis platform model.
 */
export class RESTResource<T> extends Resource {
    /**
     * Constructs a new REST resource.
     *
     * @param name Resource name
     * @param connection Connection with the genesis platform server
     */
    constructor(private _name: string, connection: Connection) {
        super(connection);
    }

    /**
     * Returns resource name.
     */
    public get name(): string {
        return this._name;
    }

    private _getResourcePath(): string {
        return `${this.getBasePath()}/${this._name}`;
    }

    /**
     * Returns the path used for requesting a list of resource items.
     */
    protected getListPath(): string {
        return this._getResourcePath();
    }

    /**
     * Returns the path used for calling a method on the resource type.
     */
    public getListMethodPath(method: string): string {
        return `${this.getListPath()}/${method}`;
    }

    /**
     * Returns the path used for requesting a specific resource item.
     */
    protected getDetailPath(primaryKey: number | string): string {
        return `${this._getResourcePath()}/${primaryKey}`;
    }

    /**
     * Returns the path used for calling a method on a specific resource item.
     */
    public getDetailMethodPath(primaryKey: number | string, method: string): string {
        return `${this.getDetailPath(primaryKey)}/${method}`;
    }

    /**
     * Returns the path used for querying the resource.
     */
    protected getQueryPath(query: types.Query): string {
        return this.getListPath();
    }

    /**
     * Calls a method on an instance of the given resource.
     *
     * @param primaryKey Instance primary key
     * @param method Method name
     * @param data Method data object
     * @return An observable that emits the response
     */
    public callMethod<U>(primaryKey: number | string, method: string, data: any = {}): Rx.Observable<U> {
        return this.connection.post<U>(this.getDetailMethodPath(primaryKey, method), data, {});
    }

    /**
     * Calls a method on the given resource.
     *
     * @param method Method name
     * @param data Method data object
     * @return An observable that emits the response
     */
    public callListMethod<U>(method: string, data: any = {}): Rx.Observable<U> {
        return this.connection.post<U>(this.getListMethodPath(method), data, {});
    }

    /**
     * Creates an instance of the given resource.
     *
     * @param data Object attributes
     * @return An observable that emits the response
     */
    public create(data: Object): Rx.Observable<T> {
        return this.connection.post<T>(this.getListPath(), data, {});
    }

    /**
     * Updates an existing instance of the given resource.
     *
     * @param primaryKey Instance primary key
     * @param data Object attributes
     * @return An observable that emits the response
     */
    public update(primaryKey: number | string, data: Object): Rx.Observable<T> {
        return this.connection.patch<T>(this.getDetailPath(primaryKey), data, {});
    }

    /**
     * Replaces an existing instance of the given resource.
     *
     * @param primaryKey Instance primary key
     * @param data Object attributes
     * @return An observable that emits the response
     */
    public replace(primaryKey: number | string, data: Object): Rx.Observable<T> {
        return this.connection.put<T>(this.getDetailPath(primaryKey), data, {});
    }

    /**
     * Deletes an existing instance of the given resource.
     *
     * @param primaryKey Instance primary key
     * @return An observable that emits the response
     */
    public delete(primaryKey: number | string): Rx.Observable<Object> {
        return this.connection.delete(this.getDetailPath(primaryKey), {}, {});
    }

    /**
     * Retrieves an existing instance of the given resource. Does not subscribe
     * to subsequent updates. For reactive updates use query/queryOne.
     *
     * @param primaryKey Instance primary key
     * @return An observable that emits the response
     */
    public get(primaryKey: number | string): Rx.Observable<T> {
        return this.connection.get<T>(this.getDetailPath(primaryKey));
    }

    /**
     * Performs a live query against this resource. Subscribing to the returned
     * observable will track any changes made to the resources returned by the
     * given query.
     *
     * @param query Query
     * @param options Query options
     */
    public query(query: types.Query = {}, options?: QueryOptions): Rx.Observable<T[]> {
        return super.reactiveRequest<T>(query, this.getQueryPath(query), options);
    }

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
    public queryOne(query: types.Query = {}, options?: QueryOptions): Rx.Observable<T> {
        return this.query(query, options).map((items) => {
            if (!items.length) {
                throw new QueryOneError('The query returned no items.');
            }

            if (items.length > 1) {
                throw new QueryOneError('The query returned multiple items.');
            }

            return items[0];
        });
    }
}
