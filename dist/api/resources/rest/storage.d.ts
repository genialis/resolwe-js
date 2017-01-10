import { RESTResource } from './rest_resource';
import { Connection } from '../../connection';
import * as types from '../../types/rest';
/**
 * Storage resource class for dealing with storage endpoint.
 */
export declare class StorageResource extends RESTResource<types.Storage> {
    constructor(connection: Connection);
    getStorageLink(primaryKey: number | string): string;
    query(query?: types.Query): Rx.Observable<types.Storage[]>;
    queryOne(query?: types.Query): Rx.Observable<types.Storage>;
    create(data: Object): Rx.Observable<types.Storage>;
    update(primaryKey: number | string, data: Object): Rx.Observable<types.Storage>;
    replace(primaryKey: number | string, data: Object): Rx.Observable<types.Storage>;
    delete(primaryKey: number | string): Rx.Observable<Object>;
}
