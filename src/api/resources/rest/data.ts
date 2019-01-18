import * as Rx from 'rx';
import * as _ from 'lodash';

import {QueryOptions} from '../../resource';
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
     * Explicitly re-defined with return type Data, because this differs from `create` and `get`.
     */
    public query(query: types.Query = {}, options?: QueryOptions): Rx.Observable<types.Data[]> {
        return super.query(query, options);
    }

    /**
     * Explicitly re-defined with return type Data, because this differs from `create` and `get`.
     */
    public queryOne(query: types.Query = {}, options?: QueryOptions): Rx.Observable<types.Data> {
        return super.queryOne(query, options);
    }

    /**
     * Explicitly re-defined with return type SingleDataObject, because this differs from `query`.
     */
    public create(data: Object): Rx.Observable<types.SingleDataObject<{}>> {
        return <Rx.Observable<types.SingleDataObject<{}>>> super.create(data);
    }

    /**
     * Explicitly re-defined with return type SingleDataObject, and extra parameters.
     */
    public get<Q extends types.SingleDataObjectParams>(primaryKey: number | string, opts?: Q): Rx.Observable<types.SingleDataObject<Q>> {
        return this.connection.get(this.getDetailPath(primaryKey), opts);
    }

    /**
     * Get a sample by data id.
     */
    public getSampleFromDataId(id: number): Rx.Observable<types.Sample | types.Presample> {
        return this.get(id, { hydrate_entities: '1' }).map((data) => {
            if (_.size(data.entities) !== 1) console.error('Expected data to belong to exactly one sample', data);

            const sample = _.first(data.entities);
            return sample;
        });
    }

    /**
     * Get Data object with the same inputs if it already exists, otherwise
     * create it.
     *
     * Note: Consider sorting arrays in the inputs, to prevent needlessly
     * creating the same Data objects.
     */
    public getOrCreate(data: Object): Rx.Observable<types.SingleDataObject<{}>> {
        return this.connection.post<types.SingleDataObject<{}>>(this.getListMethodPath('get_or_create'), data);
    }

    /**
     * Makes a copy of data objects.
     *
     * @param dataIds A list of data object ids to duplicate
     * @return Duplicated data objects.
     */
    public duplicate(dataIds: number[]): Rx.Observable<types.Data[]> {
        return this.connection.post<types.Data[]>(this.getListMethodPath('duplicate'), { ids: dataIds });
    }

    public getPermissions(id: number): Rx.Observable<types.ItemPermissions[]> {
        return getPermissions(this, id);
    }

    public setPermissions(id: number, permissions: types.SetPermissionsRequest): Rx.Observable<types.ItemPermissions[]> {
        return setPermissions(this, id, permissions);
    }
}
