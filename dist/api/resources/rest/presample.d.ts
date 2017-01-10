import * as Rx from 'rx';
import { RESTResource } from './rest_resource';
import { Connection } from '../../connection';
import * as types from '../../types/rest';
/**
 * Presample resource class for dealing with sample endpoint.
 */
export declare class PresampleResource extends RESTResource<types.Presample> {
    constructor(connection: Connection);
    query(query?: types.QueryObject): Rx.Observable<types.Presample[]>;
    query(query: types.QueryObjectHydrateData): Rx.Observable<types.PresampleHydrateData[]>;
    queryOne(query?: types.QueryObject): Rx.Observable<types.Presample>;
    queryOne(query: types.QueryObjectHydrateData): Rx.Observable<types.PresampleHydrateData>;
    create(data: Object): Rx.Observable<any>;
    replace(primaryKey: number | string, data: Object): Rx.Observable<any>;
}
