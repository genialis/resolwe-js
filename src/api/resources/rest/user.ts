import * as _ from 'lodash';
import * as Rx from 'rx';

import {RESTResource} from './rest_resource';
import {Connection} from '../../connection';
import * as types from '../../types/rest';

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
    public profile(): Rx.Observable<types.User | void> {
        return this.query({current_only: 1}, {reactive: true}).map((users: types.User[]): types.User | void => {
            if (users.length > 1) {
                console.error('Query should not return more than one user');
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
     * Validate password.
     *
     * @param password Password to be validated against password validation service.
     */
    public validatePassword(password: string): Rx.Observable<{ validationErrors: string[] }> {
        return this.callListMethod<{ password?: string[] }>('validate_password', { password })
            .map((response) => ({ validationErrors: response.password ? response.password : [] }));
    }

    /**
     * Change current user password.
     *
     * @param oldPassword Old password
     * @param newPassword New password
     */
    public changePassword(oldPassword: string, newPassword: string) {
        return this.profile().flatMapLatest((user: types.User | void) => {
            if (!user) throw new Error('Logged out users cant change password');
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
