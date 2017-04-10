import * as Rx from 'rx';

import {QueryOptions} from '../../resource';
import {RESTResource} from './rest_resource';
import {Connection} from '../../connection';
import {Permissionable, getPermissions, setPermissions} from '../addons/permissions';
import * as types from '../../types/rest';

/**
 * Collection resource class for dealing with collection endpoint.
 */
export class CollectionResource extends RESTResource<types.Collection> implements Permissionable {

    constructor(connection: Connection) {
        super('collection', connection);
    }

    /**
     * Checks if collection slug already exists.
     *
     * @param {string} Slug to check
     * @return {Rx.Observable<boolean>} An observable that emits the response
     */
    public slugExists(slug: string): Rx.Observable<boolean> {
        return <Rx.Observable<boolean>> this.connection.get('/api/' + this.name + '/slug_exists', { name: slug });
    }

    /**
     * Adds data objects to collection.
     *
     * @param collectionId Collection id
     * @param dataIds Array of data object ids
     * @returns {Rx.Observable<void>}
     */
    public addData(collectionId: number, dataIds: number[]): Rx.Observable<void> {
        return this.connection.post<void>('/api/' + this.name + '/' + collectionId + '/add_data', { ids: dataIds });
    }

    public query(query?: types.QueryObject, options?: QueryOptions): Rx.Observable<types.Collection[]>;
    public query(query: types.QueryObjectHydrateData, options?: QueryOptions): Rx.Observable<types.CollectionHydrateData[]>;
    public query(query: types.Query = {}, options?: QueryOptions): Rx.Observable<any> {
        return super.query(query, options);
    }

    public queryOne(query?: types.QueryObject, options?: QueryOptions): Rx.Observable<types.Collection>;
    public queryOne(query: types.QueryObjectHydrateData, options?: QueryOptions): Rx.Observable<types.CollectionHydrateData>;
    public queryOne(query: types.Query = {}, options?: QueryOptions): Rx.Observable<any> {
        return super.queryOne(query, options);
    }

    public getPermissions(id: number): Rx.Observable<types.ItemPermissions[]> {
        return getPermissions(this, id);
    }

    public setPermissions(id: number, permissions: types.SetPermissionsRequest): Rx.Observable<types.ItemPermissions[]> {
        return setPermissions(this, id, permissions);
    }
}
