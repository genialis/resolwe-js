import {RESTResource} from './rest_resource';
import {Connection} from '../../connection';
import {Permissionable, getPermissions, setPermissions} from '../addons/permissions';
import * as types from '../../types/rest';

/**
 * Data resource class for dealing with descriptor schema endpoint.
 */
export class DescriptorSchemaResource extends RESTResource<types.DescriptorSchema> implements Permissionable {

    constructor(connection: Connection) {
        super('descriptorschema', connection);
    }

    public getPermissions(id: number): Rx.Observable<types.ItemPermissions[]> {
        return getPermissions(this, id);
    }

    public setPermissions(id: number, permissions: types.SetPermissionsRequest): Rx.Observable<types.ItemPermissions[]> {
        return setPermissions(this, id, permissions);
    }
}
