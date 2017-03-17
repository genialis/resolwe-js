import * as _ from 'lodash';
import * as Rx from 'rx';

import {Connection} from './connection';
import * as types from './types/rest';

export class Auth {
    private _connection: Connection;

    /**
     * Constructs auth.
     *
     * @param {Connection} connection Connection with the genesis platform server
     */
    constructor(connection: Connection) {
        this._connection = connection;
    }

    /**
     * Performs user login.
     *
     * @param username Username or e-mail address
     * @param password Password
     */
    public login(username: string, password: string): Rx.Observable<types.LoginResponse> {
        const authData = {
            username: username,
            password: password,
        };

        // Allow login with an e-mail address as username.
        if (_.contains(username, '@')) {
            authData['email'] = username;
        }

        const response = this._connection.post<types.LoginResponse>('/rest-auth/login/', authData).publish().refCount();
        response.subscribe(() => {
            // Connection state has changed, reinitialize query observers.
            this._connection.queryObserverManager().reinitialize();
        }, _.noop);  // Do nothing on error.
        return response;
    }

    /**
     * Logs the user out.
     */
    public logout(): Rx.Observable<types.LogoutResponse> {
        const response = this._connection.post<types.LogoutResponse>('/rest-auth/logout/', {}).publish().refCount();
        response.subscribe(() => {
            // Connection state has changed, reinitialize query observers.
            this._connection.queryObserverManager().reinitialize();
        });
        return response;
    }
}
