import * as Rx from 'rx';

import {RESTResource} from './rest_resource';
import {Connection} from '../../connection';
import {Permissionable, getPermissions, setPermissions} from '../addons/permissions';
import * as types from '../../types/rest';

/**
 * Data resource class for dealing with data endpoint.
 */
export class DataResource extends RESTResource<types.Data> implements Permissionable {

    constructor(connection: Connection) {
        super('data', connection);
    }

    /**
     * Checks if data slug already exists.
     *
     * @param {string} Slug to check
     * @return {Rx.Observable<boolean>} An observable that emits the response
     */
    public slugExists(slug: string): Rx.Observable<boolean> {
        return <Rx.Observable<boolean>> this.connection.get(this.getListMethodPath('slug_exists'), { name: slug });
    }

    /**
     * Get Data object if similar already exists, otherwise create it.
     *
     * @param data Object attributes
     * @return An observable that emits the response
     */
    public getOrCreate(data: Object): Rx.Observable<types.Data> {
        return this.connection.post<types.Data>(this.getListMethodPath('get_or_create'), data);
    }

    public getPermissions(id: number): Rx.Observable<types.ItemPermissions[]> {
        return getPermissions(this, id);
    }

    public setPermissions(id: number, permissions: types.SetPermissionsRequest): Rx.Observable<types.ItemPermissions[]> {
        return setPermissions(this, id, permissions);
    }
}
