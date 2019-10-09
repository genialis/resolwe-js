import * as Rx from 'rx';
import {RESTResource} from './rest_resource';
import {QueryOptions} from '../../resource';
import {Connection} from '../../connection';
import {GenError} from '../../../core/errors/error';
import {Permissionable, getPermissions, setPermissions} from '../addons/permissions';
import * as types from '../../types/rest';

/**
 * Sample resource class for dealing with sample endpoint.
 */
export class SampleResource extends RESTResource<types.Sample> implements Permissionable {
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

    public query(query: types.QueryObject, options?: QueryOptions): Rx.Observable<types.Sample[]> {
        return super.query(query, options);
    }

    public queryOne(query: types.QueryObject, options?: QueryOptions): Rx.Observable<types.Sample> {
        return super.queryOne(query, options);
    }

    /**
     * Adds sample to collections.
     *
     * @param sampleId Sample id
     * @param collectionIds Array of collection ids
     */
    public addToCollection(sampleId: number, collectionId: number): Rx.Observable<unknown> {
        return this.update(sampleId, {
            collection: {
                id: collectionId,
            },
        });
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

    public create(data: Object): Rx.Observable<any> {
        throw new GenError("Create method not supported");
    }

    public replace(primaryKey: number | string, data: Object): Rx.Observable<any> {
        throw new GenError("Replace method not supported");
    }

    /**
     * Makes a copy of samples.
     *
     * @param sampleIds A list of sample ids to duplicate
     * @return Duplicated samples.
     */
    public duplicate(sampleIds: number[],
                     opts: { inheritCollection: boolean }): Rx.Observable<types.Sample[]> {
        return this.callListMethod<types.Sample[]>('duplicate', {
            ids: sampleIds,
            inherit_collection: opts.inheritCollection,
        });
    }

    public getPermissions(id: number): Rx.Observable<types.ItemPermissions[]> {
        return getPermissions(this, id);
    }

    public setPermissions(id: number, permissions: types.SetPermissionsRequest): Rx.Observable<types.ItemPermissions[]> {
        return setPermissions(this, id, permissions);
    }
}
