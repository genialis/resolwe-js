import * as Rx from 'rx';
import {Connection} from "./connection";

export class Base {
    private _connection: Connection;

    /**
     * Constructs base.
     *
     * @param {Connection} connection Connection with the genesis platform server
     */
    constructor(connection: Connection) {
        this._connection = connection;
    }

    /**
     * Gets CSRF cookie.
     *
     * @param {Connection} connection Connection with the genesis platform server
     */
    public getCSRFCookie(): Rx.Observable<void> {
        return this._connection.get<void>('/api/base/csrf');
    }
}
