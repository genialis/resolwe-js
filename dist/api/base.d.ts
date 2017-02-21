import * as Rx from 'rx';
import { Connection } from "./connection";
export declare class Base {
    private _connection;
    /**
     * Constructs base.
     *
     * @param {Connection} connection Connection with the genesis platform server
     */
    constructor(connection: Connection);
    /**
     * Gets CSRF cookie.
     *
     * @param {Connection} connection Connection with the genesis platform server
     */
    getCSRFCookie(): Rx.Observable<void>;
}
