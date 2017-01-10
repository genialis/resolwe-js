import * as _ from 'lodash';
import * as Rx from 'rx';

import {RESTResource} from './rest_resource';
import {Connection} from '../../connection';
import * as types from '../../types/rest';
import {errorLog} from '../../../core/utils/error_log';

/**
 * User resource class for dealing with user API endpoint.
 */
export class UserResource extends RESTResource<types.User> {
    constructor(connection: Connection) {
        super('user', connection);
    }

    /**
     * Returns the current user's authentication status.
     */
    public isAuthenticated(): Rx.Observable<boolean> {
        return this.query().map((users: any[]): boolean => {
            return !!users.length;
        });
    }

    /**
     * Returns the current user's profile.
     */
    public profile(): Rx.Observable<types.User> {
        return this.query().map((users: types.User[]): types.User => {
            if (users.length > 1) {
                errorLog('Query should not return more than one user');
            }

            return _.first(users);
        });
    }
}
