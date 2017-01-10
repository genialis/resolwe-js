import * as Rx from 'rx';
import { Connection } from './connection';
import * as types from './types/rest';
export declare class Auth {
    private _connection;
    /**
     * Constructs auth.
     *
     * @param {Connection} connection Connection with the genesis platform server
     */
    constructor(connection: Connection);
    /**
     * Performs user login.
     *
     * @param username username
     * @param password password
     */
    login(username: string, password: string): Rx.Observable<types.LoginResponse>;
    /**
     * Logs the user out.
     */
    logout(): Rx.Observable<types.LogoutResponse>;
}
