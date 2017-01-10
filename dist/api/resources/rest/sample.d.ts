import * as Rx from 'rx';
import { RESTResource } from './rest_resource';
import { Connection } from '../../connection';
import { Permissionable } from '../addons/permissions';
import * as types from '../../types/rest';
/**
 * Sample resource class for dealing with sample endpoint.
 */
export declare class SampleResource extends RESTResource<types.Sample> implements Permissionable {
    constructor(connection: Connection);
    /**
     * Checks if sample slug already exists.
     *
     * @param Slug to check
     * @return An observable that emits the response
     */
    slugExists(slug: string): Rx.Observable<boolean>;
    query(query?: types.QueryObject): Rx.Observable<types.Sample[]>;
    query(query: types.QueryObjectHydrateData): Rx.Observable<types.SampleHydrateData[]>;
    queryOne(query?: types.QueryObject): Rx.Observable<types.Sample>;
    queryOne(query: types.QueryObjectHydrateData): Rx.Observable<types.SampleHydrateData>;
    /**
     * Adds sample to collections.
     *
     * @param sampleId Sample id
     * @param collectionIds Array of collection ids
     * @returns {Rx.Observable<void>}
     */
    addToCollections(sampleId: number, collectionIds: number[]): Rx.Observable<void>;
    create(data: Object): Rx.Observable<any>;
    replace(primaryKey: number | string, data: Object): Rx.Observable<any>;
    getPermissions(id: number): Rx.Observable<types.ItemPermissions[]>;
    setPermissions(id: number, permissions: types.SetPermissionsRequest): Rx.Observable<types.ItemPermissions[]>;
}
