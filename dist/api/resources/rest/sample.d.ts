import * as Rx from 'rx';
import { RESTResource } from './rest_resource';
import { QueryOptions } from '../../resource';
import { Connection } from '../../connection';
import { Permissionable } from '../addons/permissions';
import * as types from '../../types/rest';
/**
 * Sample resource class for dealing with sample endpoint.
 */
export declare class SampleResource extends RESTResource<types.Sample | types.Presample> implements Permissionable {
    constructor(connection: Connection);
    /**
     * Checks if sample slug already exists.
     *
     * @param Slug to check
     * @return An observable that emits the response
     */
    slugExists(slug: string): Rx.Observable<boolean>;
    /**
     * This method should not be used.
     */
    query(query: types.Query, options?: QueryOptions): Rx.Observable<any>;
    queryOne(query?: types.QueryObject, options?: QueryOptions): Rx.Observable<types.Sample | types.Presample>;
    queryOne(query: types.QueryObjectHydrateData, options?: QueryOptions): Rx.Observable<types.SampleHydrateData | types.PresampleHydrateData>;
    queryUnannotated(query?: types.QueryObject, options?: QueryOptions): Rx.Observable<types.Presample[]>;
    queryUnannotated(query: types.QueryObjectHydrateData, options?: QueryOptions): Rx.Observable<types.PresampleHydrateData[]>;
    queryAnnotated(query?: types.QueryObject, options?: QueryOptions): Rx.Observable<types.Sample[]>;
    queryAnnotated(query: types.QueryObjectHydrateData, options?: QueryOptions): Rx.Observable<types.SampleHydrateData[]>;
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
