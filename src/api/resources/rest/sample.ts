import * as Rx from 'rx';
import {RESTResource} from './rest_resource';
import {Connection} from '../../connection';
import {GenError} from '../../../core/errors/error';
import {Permissionable, getPermissions, setPermissions} from '../addons/permissions';
import * as types from '../../types/rest';

/**
 * Sample resource class for dealing with sample endpoint.
 */
export class SampleResource extends RESTResource<types.Sample> implements Permissionable {

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

    public query(query?: types.QueryObject): Rx.Observable<types.Sample[]>;
    public query(query: types.QueryObjectHydrateData): Rx.Observable<types.SampleHydrateData[]>;
    public query(query: types.Query = {}): Rx.Observable<any> {
        return super.query(query);
    }

    public queryOne(query?: types.QueryObject): Rx.Observable<types.Sample>;
    public queryOne(query: types.QueryObjectHydrateData): Rx.Observable<types.SampleHydrateData>;
    public queryOne(query: types.Query = {}): Rx.Observable<any> {
        return super.queryOne(query);
    }

    /**
     * Adds sample to collections.
     *
     * @param sampleId Sample id
     * @param collectionIds Array of collection ids
     * @returns {Rx.Observable<void>}
     */
    public addToCollections(sampleId: number, collectionIds: number[]): Rx.Observable<void> {
        return this.callMethod<void>(sampleId, 'add_to_collection', { ids: collectionIds });
    }

    public create(data: Object): Rx.Observable<any> {
        throw new GenError("Create method not supported");
    }

    public replace(primaryKey: number | string, data: Object): Rx.Observable<any> {
        throw new GenError("Replace method not supported");
    }

    public getPermissions(id: number): Rx.Observable<types.ItemPermissions[]> {
        return getPermissions(this, id);
    }

    public setPermissions(id: number, permissions: types.SetPermissionsRequest): Rx.Observable<types.ItemPermissions[]> {
        return setPermissions(this, id, permissions);
    }
}
