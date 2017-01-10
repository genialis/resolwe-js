import {RESTResource} from './rest_resource';
import {Connection} from '../../connection';
import * as types from '../../types/rest';

/**
 * Storage resource class for dealing with storage endpoint.
 */
export class StorageResource extends RESTResource<types.Storage> {

    constructor(connection: Connection) {
        super('storage', connection);
    }

    public getStorageLink(primaryKey: number | string): string {
        return this.connection.createUriFromPath(`${this.getDetailPath(primaryKey)}?format=json`);
    }

    public query(query: types.Query = {}): Rx.Observable<types.Storage[]> {
        throw new Error('query method not supported');
    }

    public queryOne(query: types.Query = {}): Rx.Observable<types.Storage> {
        throw new Error('queryOne method not supported');
    }

    public create(data: Object): Rx.Observable<types.Storage> {
        throw new Error('create method not supported');
    }

    public update(primaryKey: number | string, data: Object): Rx.Observable<types.Storage> {
        throw new Error('update method not supported');
    }

    public replace(primaryKey: number | string, data: Object): Rx.Observable<types.Storage> {
        throw new Error('replace method not supported');
    }

    public delete(primaryKey: number | string): Rx.Observable<Object> {
        throw new Error('delete method not supported');
    }
}
