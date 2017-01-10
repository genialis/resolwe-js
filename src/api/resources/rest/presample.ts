import * as Rx from 'rx';
import {RESTResource} from './rest_resource';
import {Connection} from '../../connection';
import {GenError} from '../../../core/errors/error';
import * as types from '../../types/rest';

/**
 * Presample resource class for dealing with sample endpoint.
 */
export class PresampleResource extends RESTResource<types.Presample> {

    constructor(connection: Connection) {
        super('presample', connection);
    }

    public query(query?: types.QueryObject): Rx.Observable<types.Presample[]>;
    public query(query: types.QueryObjectHydrateData): Rx.Observable<types.PresampleHydrateData[]>;
    public query(query: types.Query = {}): Rx.Observable<any> {
        return super.query(query);
    }

    public queryOne(query?: types.QueryObject): Rx.Observable<types.Presample>;
    public queryOne(query: types.QueryObjectHydrateData): Rx.Observable<types.PresampleHydrateData>;
    public queryOne(query: types.Query = {}): Rx.Observable<any> {
        return super.queryOne(query);
    }

    public create(data: Object): Rx.Observable<any> {
        throw new GenError("Create method not supported");
    }

    public replace(primaryKey: number | string, data: Object): Rx.Observable<any> {
        throw new GenError("Replace method not supported");
    }
}
