import * as Rx from 'rx';
import { QueryOptions } from '../../resource';
import { RESTResource } from './rest_resource';
import { Connection } from '../../connection';
import { Permissionable } from '../addons/permissions';
import * as types from '../../types/rest';
/**
 * Collection resource class for dealing with collection endpoint.
 */
export declare class CollectionResource extends RESTResource<types.Collection> implements Permissionable {
    constructor(connection: Connection);
    /**
     * Checks if collection slug already exists.
     *
     * @param {string} Slug to check
     * @return {Rx.Observable<boolean>} An observable that emits the response
     */
    slugExists(slug: string): Rx.Observable<boolean>;
    /**
     * Adds data objects to collection.
     *
     * @param collectionId Collection id
     * @param dataIds Array of data object ids
     * @returns {Rx.Observable<void>}
     */
    addData(collectionId: number, dataIds: number[]): Rx.Observable<void>;
    query(query?: types.QueryObject, options?: QueryOptions): Rx.Observable<types.Collection[]>;
    query(query: types.QueryObjectHydrateData, options?: QueryOptions): Rx.Observable<types.CollectionHydrateData[]>;
    queryOne(query?: types.QueryObject, options?: QueryOptions): Rx.Observable<types.Collection>;
    queryOne(query: types.QueryObjectHydrateData, options?: QueryOptions): Rx.Observable<types.CollectionHydrateData>;
    getPermissions(id: number): Rx.Observable<types.ItemPermissions[]>;
    setPermissions(id: number, permissions: types.SetPermissionsRequest): Rx.Observable<types.ItemPermissions[]>;
}
