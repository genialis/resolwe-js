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
     * @param Slug to check
     */
    slugExists(slug: string): Rx.Observable<boolean>;
    /**
     * Adds data objects to collection.
     *
     * @param collectionId Collection id
     * @param dataIds Array of data object ids
     */
    addData(collectionId: number, dataIds: number[]): Rx.Observable<void>;
    /**
     * Removes data objects from collection.
     *
     * @param collectionId Sample id
     * @param dataIds Array of data object ids
     */
    removeData(collectionId: number, dataIds: number[]): Rx.Observable<void>;
    query(query?: types.QueryObject, options?: QueryOptions): Rx.Observable<types.Collection[]>;
    query(query: types.QueryObjectHydrateData, options?: QueryOptions): Rx.Observable<types.CollectionHydrateData[]>;
    queryOne(query?: types.QueryObject, options?: QueryOptions): Rx.Observable<types.Collection>;
    queryOne(query: types.QueryObjectHydrateData, options?: QueryOptions): Rx.Observable<types.CollectionHydrateData>;
    delete(primaryKey: number | string, deleteContent?: boolean): Rx.Observable<Object>;
    getPermissions(id: number): Rx.Observable<types.ItemPermissions[]>;
    setPermissions(id: number, permissions: types.SetPermissionsRequest): Rx.Observable<types.ItemPermissions[]>;
}
