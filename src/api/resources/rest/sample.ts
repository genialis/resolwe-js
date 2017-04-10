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
     * This method should not be used.
     */
    public query(query: types.Query, options?: QueryOptions): Rx.Observable<any> {
        if (query['workaroundForQueryOne']) {
            return super.query(_.omit(query, 'workaroundForQueryOne'), options);
        }
        throw new GenError("Query method not supported");
    }

    public queryOne(query?: types.QueryObject, options?: QueryOptions):
        Rx.Observable<types.Sample | types.Presample>;
    public queryOne(query: types.QueryObjectHydrateData, options?: QueryOptions):
        Rx.Observable<types.SampleHydrateData | types.PresampleHydrateData>;
    public queryOne(query: types.Query = {}, options?: QueryOptions): Rx.Observable<any> {
        return super.queryOne({...query, workaroundForQueryOne: true}, options);
    }

    public queryUnannotated(query?: types.QueryObject, options?: QueryOptions):
        Rx.Observable<types.Presample[]>;
    public queryUnannotated(query: types.QueryObjectHydrateData, options?: QueryOptions):
        Rx.Observable<types.PresampleHydrateData[]>;
    public queryUnannotated(query: types.Query = {}, options?: QueryOptions): Rx.Observable<any> {
        return super.query({...query, descriptor_completed: false}, options);
    }

    public queryAnnotated(query?: types.QueryObject, options?: QueryOptions):
        Rx.Observable<types.Sample[]>;
    public queryAnnotated(query: types.QueryObjectHydrateData, options?: QueryOptions):
        Rx.Observable<types.SampleHydrateData[]>;
    public queryAnnotated(query: types.Query = {}, options?: QueryOptions): Rx.Observable<any> {
        return super.query({...query, descriptor_completed: true}, options);
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
