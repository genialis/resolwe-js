import * as Rx from 'rx';
import * as _ from 'lodash';

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

    protected transformQuery(query: types.Query): types.Query {
        // Rename `sample` query field to `entity`.
        const transformedQuery = _.mapKeys(query, (value, field) => {
            return field
                .replace(/^sample$/g, 'entity')
                .replace(/^sample__/g, 'entity__');
        });

        // Rename `sample` in limit fields to `entity`.
        if (transformedQuery.fields) {
            transformedQuery.fields = transformedQuery.fields.split(',').map((field) => {
                return field
                    .replace(/^sample$/g, 'entity')
                    .replace(/^sample__/g, 'entity__');
            }).join(',');
        }

        return super.transformQuery(transformedQuery);
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
     * Get Data object with the same inputs if it already exists, otherwise
     * create it.
     *
     * Note: Consider sorting arrays in the inputs, to prevent needlessly
     * creating the same Data objects.
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
