import * as Rx from 'rx';
import * as _ from 'lodash';
import {RESTResource} from './rest_resource';
import {QueryOptions} from '../../resource';
import {Connection} from '../../connection';
import {GenError} from '../../../core/errors/error';
import {Permissionable, getPermissions, setPermissions} from '../addons/permissions';
import * as types from '../../types/rest';

/**
 * Sample resource class for dealing with sample endpoint.
 */
export class SampleResource extends RESTResource<types.Sample | types.Presample> implements Permissionable {
    /**
     * Ordering by relevance constant. Apply this value to `ordering` query parameter to
     * order by relevance.
     * This works by overriding any default ordering on backend, so it keeps order of ES results
     */
    public readonly ORDERING_BY_RELEVANCE = '';

    constructor(connection: Connection) {
        super('sample', connection);
    }

    /**
     * Checks if sample slug already exists.
     *
     * @param Slug to check
     * @return An observable that emits the response
     */
    public slugExists(slug: string): Rx.Observable<boolean> {
        return this.connection.get<boolean>(this.getListMethodPath('slug_exists'), { name: slug });
    }

    /**
     * Use this method carefully. Check to make sure you need unannotated and annotated samples.
     */
    public query(query: types.QueryObjectHydrateData & { annotation: 'annotated' }, options?: QueryOptions):
        Rx.Observable<types.SampleHydrateData[]>;
    public query(query: types.QueryObjectHydrateData & { annotation: 'unannotated' }, options?: QueryOptions):
        Rx.Observable<types.PresampleHydrateData[]>;
    public query(query: types.QueryObjectHydrateData & { annotation: 'annotatedAndUnannotated' }, options?: QueryOptions):
        Rx.Observable<(types.SampleHydrateData | types.PresampleHydrateData)[]>;
    public query(query: types.QueryObject & { annotation: 'annotated' }, options?: QueryOptions):
        Rx.Observable<types.Sample[]>;
    public query(query: types.QueryObject & { annotation: 'unannotated' }, options?: QueryOptions):
        Rx.Observable<types.Presample[]>;
    public query(query: types.QueryObject & { annotation: 'annotatedAndUnannotated' }, options?: QueryOptions):
        Rx.Observable<(types.Sample | types.Presample)[]>;
    public query(query: types.Query & { annotation: string }, options?: QueryOptions): Rx.Observable<unknown> {
        const annotationQuery = query.annotation === 'annotated' ? { descriptor_completed: true } :
                              query.annotation === 'unannotated' ? { descriptor_completed: false }
                                                                 : {};

        return super.query({ ..._.omit(query, 'annotation'), ...annotationQuery }, options);
    }

    public queryOne(query: types.QueryObjectHydrateData, options?: QueryOptions):
        Rx.Observable<types.SampleHydrateData | types.PresampleHydrateData>;
    public queryOne(query?: types.QueryObject, options?: QueryOptions):
        Rx.Observable<types.Sample | types.Presample>;
    public queryOne(query: types.Query = {}, options?: QueryOptions): Rx.Observable<any> {
        return super.queryOne(query, options);
    }

    /**
     * Adds sample to collections.
     *
     * @param sampleId Sample id
     * @param collectionIds Array of collection ids
     */
    public addToCollections(sampleId: number, collectionIds: number[]): Rx.Observable<void> {
        return this.callMethod<void>(sampleId, 'add_to_collection', { ids: collectionIds });
    }

    /**
     * Remove sample from collections.
     *
     * @param sampleId Sample id
     * @param collectionIds Array of collection ids
     */
    public removeFromCollections(sampleId: number, collectionIds: number[]): Rx.Observable<void> {
        return this.callMethod<void>(sampleId, 'remove_from_collection', { ids: collectionIds });
    }

    /**
     * Move samples to collection.
     *
     * @param sampleId Sample id
     * @param collectionIds Array of collection ids
     */
    public moveToCollection(sampleIds: number[], sourceCollectionId: number, destinationCollectionId: number): Rx.Observable<void> {
        return this.callListMethod<void>('move_to_collection', {
            ids: sampleIds,
            source_collection: sourceCollectionId,
            destination_collection: destinationCollectionId,
         });
    }

    /**
     * Adds data objects to sample.
     *
     * @param sampleId Sample id
     * @param dataIds Array of data object ids
     */
    public addData(sampleId: number, dataIds: number[]): Rx.Observable<void> {
        return this.callMethod<void>(sampleId, 'add_data', { ids: dataIds });
    }

    /**
     * Removes data objects from sample.
     *
     * @param sampleId Sample id
     * @param dataIds Array of data object ids
     */
    public removeData(sampleId: number, dataIds: number[]): Rx.Observable<void> {
        return this.callMethod<void>(sampleId, 'remove_data', { ids: dataIds });
    }

    public create(data: Object): Rx.Observable<any> {
        throw new GenError("Create method not supported");
    }

    public replace(primaryKey: number | string, data: Object): Rx.Observable<any> {
        throw new GenError("Replace method not supported");
    }

    public delete(primaryKey: number | string, deleteContent: boolean = false): Rx.Observable<Object> {
        return super.delete(primaryKey, {}, { delete_content: deleteContent });
    }

    /**
     * Makes a copy of samples.
     *
     * @param sampleIds A list of sample ids to duplicate
     * @return Duplicated samples.
     */
    public duplicate(sampleIds: number[],
                     opts: { inheritCollections: boolean }): Rx.Observable<(types.Sample | types.Presample)[]> {
        return this.callListMethod<(types.Sample | types.Presample)[]>('duplicate', {
            ids: sampleIds,
            inherit_collections: opts.inheritCollections,
        });
    }

    public getPermissions(id: number): Rx.Observable<types.ItemPermissions[]> {
        return getPermissions(this, id);
    }

    public setPermissions(id: number, permissions: types.SetPermissionsRequest): Rx.Observable<types.ItemPermissions[]> {
        return setPermissions(this, id, permissions);
    }
}
