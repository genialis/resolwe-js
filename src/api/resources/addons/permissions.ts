import * as types from '../../types/rest';
import {RESTResource} from '../rest/rest_resource';


/**
 * Interface for handling resource permissions.
 */
export interface Permissionable {
    getPermissions(id: number): Rx.Observable<types.ItemPermissions[]>;
    setPermissions(id: number, permissions: types.SetPermissionsRequest): Rx.Observable<types.ItemPermissions[]>;
}

/**
 * Gets resource permissions.
 *
 * @param resource Resource.
 * @param id Resource id.
 * @returns Resource permissions.
 */
export function getPermissions(resource: RESTResource<any>,
                               id: number): Rx.Observable<types.ItemPermissions[]> {
    return <Rx.Observable<types.ItemPermissions[]>> resource.connection.get(resource.getDetailMethodPath(id, 'permissions'));
}

/**
 * Sets resource permissions.
 *
 * @param resource Resource.
 * @param id Resource id.
 * @param permissions New permissions.
 * @returns New resource permissions.
 */
export function setPermissions(resource: RESTResource<any>,
                               id: number,
                               permissions: types.SetPermissionsRequest): Rx.Observable<types.ItemPermissions[]> {
    return <Rx.Observable<types.ItemPermissions[]>> resource.connection.post(resource.getDetailMethodPath(id, 'permissions'), permissions);
}
