import * as Rx from 'rx';

import {QueryOptions} from '../../resource';
import {RESTResource} from './rest_resource';
import {Connection} from '../../connection';
import {Permissionable, getPermissions, setPermissions} from '../addons/permissions';
import * as types from '../../types/rest';

/**
 * Collection resource class for dealing with collection endpoint.
 */
export class CollectionResource extends RESTResource<types.Collection> implements Permissionable {
    /**
     * Ordering by relevance constant. Apply this value to `ordering` query parameter to
     * order by relevance.
     * This works by overriding any default ordering on backend, so it keeps order of ES results
     */
    public readonly ORDERING_BY_RELEVANCE = '';

    constructor(connection: Connection) {
        super('collection', connection);
    }

    /**
     * Checks if collection slug already exists.
     *
     * @param Slug to check
     */
    public slugExists(slug: string): Rx.Observable<boolean> {
        return <Rx.Observable<boolean>> this.connection.get(this.getListMethodPath('slug_exists'), { name: slug });
    }

    public query(query: types.QueryObject = {}, options?: QueryOptions): Rx.Observable<types.Collection[]> {
        return super.query(query, options);
    }

    public queryOne(query: types.QueryObject = {}, options?: QueryOptions): Rx.Observable<types.Collection> {
        return super.queryOne(query, options);
    }

    public delete(primaryKey: number | string, deleteContent: boolean = false): Rx.Observable<Object> {
        return super.delete(primaryKey, {}, { delete_content: deleteContent });
    }

    /**
     * Makes a copy of collections.
     *
     * @param collectionIds A list of collection ids to duplicate
     * @return Duplicated collections.
     */
    public duplicate(collectionIds: number[]): Rx.Observable<types.Collection[]> {
        return this.connection.post<types.Collection[]>(this.getListMethodPath('duplicate'), { ids: collectionIds });
    }

    public getPermissions(id: number): Rx.Observable<types.ItemPermissions[]> {
        return getPermissions(this, id);
    }

    public setPermissions(id: number, permissions: types.SetPermissionsRequest): Rx.Observable<types.ItemPermissions[]> {
        return setPermissions(this, id, permissions);
    }
}
