import { RESTResource } from './rest_resource';
import { Connection } from '../../connection';
import { Permissionable } from '../addons/permissions';
import * as types from '../../types/rest';
/**
 * Data resource class for dealing with descriptor schema endpoint.
 */
export declare class DescriptorSchemaResource extends RESTResource<types.DescriptorSchema> implements Permissionable {
    constructor(connection: Connection);
    getPermissions(id: number): Rx.Observable<types.ItemPermissions[]>;
    setPermissions(id: number, permissions: types.SetPermissionsRequest): Rx.Observable<types.ItemPermissions[]>;
}
