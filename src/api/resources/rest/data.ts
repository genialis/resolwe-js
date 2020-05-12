import * as Rx from 'rx';
import * as _ from 'lodash';

import {RESTResource} from './rest_resource';
import {Connection} from '../../connection';
import {Permissionable, getPermissions, setPermissions} from '../addons/permissions';
import {uniteDeepPicks, deepPickType} from '../../types/utils';
import * as types from '../../types/rest';

/**
 * Data resource class for dealing with data endpoint.
 */
export class DataResource extends RESTResource<types.Data> implements Permissionable {
    /**
     * Ordering by relevance constant. Apply this value to `ordering` query parameter to
     * order by relevance.
     * This works by overriding any default ordering on backend, so it keeps order of ES results
     */
    public readonly ORDERING_BY_RELEVANCE = '';

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

    public getParents(id: number): Rx.Observable<types.Data[]> {
        return this.connection.get(this.getDetailMethodPath(id, 'parents'));
    }

    public getChildren(id: number): Rx.Observable<types.Data[]> {
        return this.connection.get(this.getDetailMethodPath(id, 'children'));
    }

    public addToSample(dataIds: number[], sampleId: number): Rx.Observable<types.Data[]> {
        return Rx.Observable.fromArray(dataIds).concatMap((id) => {
            return this.update(id, { entity: { id: sampleId } });
        }).toArray();
    }

    public addToCollection(dataIds: number[], collectionId: number): Rx.Observable<types.Data[]> {
        return Rx.Observable.fromArray(dataIds).concatMap((id) => {
            return this.update(id, { collection: { id: collectionId } });
        }).toArray();
    }

    /**
     * Get a sample by data id.
     */
    public getSampleFromDataId(id: number): Rx.Observable<Omit<types.Sample, 'current_user_permissions'>> {
        const LimitedData = uniteDeepPicks([
            deepPickType(<types.Data> null, 'id'),
            deepPickType(<types.Data> null, 'entity'),
        ]);
        type LimitedData = typeof LimitedData.type;

        return this.connection.get(this.getDetailPath(id), LimitedData.limitQuery).map((data: LimitedData) => {
            if (!data.entity) {
                console.error('Expected data to belong to a sample', data);
                return null;
            }

            return data.entity;
        });
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

    /**
     * Makes a copy of data objects.
     *
     * @param dataIds A list of data object ids to duplicate
     * @return Duplicated data objects.
     */
    public duplicate(dataIds: number[]): Rx.Observable<types.Data[]> {
        return this.connection.post<types.Data[]>(this.getListMethodPath('duplicate'), { ids: dataIds });
    }

    /**
     * Move data to collection.
     *
     * @param dataIds Data object IDs
     * @param destinationCollectionId Destination collection ID
     */
    public moveToCollection(dataIds: number[], destinationCollectionId: number): Rx.Observable<void> {
        return this.callListMethod<void>('move_to_collection', {
            ids: dataIds,
            destination_collection: destinationCollectionId,
         });
    }

    public getPermissions(id: number): Rx.Observable<types.ItemPermissions[]> {
        return getPermissions(this, id);
    }

    public setPermissions(id: number, permissions: types.SetPermissionsRequest): Rx.Observable<types.ItemPermissions[]> {
        return setPermissions(this, id, permissions);
    }
}
