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
     * Get Data object if similar already exists, otherwise create it.
     *
     * @param data Object attributes
     * @return An observable that emits the response
     */
    getOrCreate(data: Object): Rx.Observable<types.Data>;
    getPermissions(id: number): Rx.Observable<types.ItemPermissions[]>;
    setPermissions(id: number, permissions: types.SetPermissionsRequest): Rx.Observable<types.ItemPermissions[]>;
}
