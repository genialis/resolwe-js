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
        return this.query({current_only: 1}, {reactive: true}).map((users: any[]): boolean => {
            return !!users.length;
        });
    }

    /**
     * Returns the current user's profile.
     */
    public profile(): Rx.Observable<types.User> {
        return this.query({current_only: 1}, {reactive: true}).map((users: types.User[]): types.User => {
            if (users.length > 1) {
                errorLog('Query should not return more than one user');
            }

            return _.first(users);
        });
    }

    /**
     * Create a new (inactive) user account.
     */
    public create(user: types.CreateAccountInformation): Rx.Observable<types.User> {
        return super.create(user);
    }

    /**
     * Activate an inactive user account.
     *
     * @param token Activation token
     */
    public activateAccount(token: string) {
        return this.callListMethod<types.ActivateAccountResponse>('activate_account', {token});
    }

    /**
     * Change current user password.
     *
     * @param oldPassword Old password
     * @param newPassword New password
     */
    public changePassword(oldPassword: string, newPassword: string) {
        return this.profile().flatMapLatest((user: types.User) => {
            return this.callMethod(user.id, 'change_password', {
                existing_password: oldPassword,
                new_password: newPassword,
            });
        });
    }

    /**
     * Request a password reset email.
     *
     * @param username Username
     * @param community Optional community name
     */
    public resetPasswordEmail(username: string, community?: string) {
        return this.callListMethod<{}>('request_password_reset', {username, community});
    }

    /**
     * Reset user password.
     *
     * @param token Password reset token
     * @param password New password
     */
    public resetPassword(token: string, password: string) {
        return this.callListMethod<{}>('password_reset', {token, password});
    }
}
