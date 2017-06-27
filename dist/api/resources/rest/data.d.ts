import * as Rx from 'rx';
import { RESTResource } from './rest_resource';
import { Connection } from '../../connection';
import { Permissionable } from '../addons/permissions';
import * as types from '../../types/rest';
/**
 * Data resource class for dealing with data endpoint.
 */
export declare class DataResource extends RESTResource<types.Data> implements Permissionable {
    constructor(connection: Connection);
    /**
     * Checks if data slug already exists.
     *
     * @param {string} Slug to check
     * @return {Rx.Observable<boolean>} An observable that emits the response
     */
    slugExists(slug: string): Rx.Observable<boolean>;
    /**
     * Get Data object with the same inputs if it already exists, otherwise
     * create it.
     *
     * Note: Consider sorting arrays in the inputs, to prevent needlessly
     * creating the same Data objects.
     *
     * @param data Object attributes
     * @return An observable that emits the response
     */
    getOrCreate(data: Object): Rx.Observable<types.Data>;
    getPermissions(id: number): Rx.Observable<types.ItemPermissions[]>;
    setPermissions(id: number, permissions: types.SetPermissionsRequest): Rx.Observable<types.ItemPermissions[]>;
}
