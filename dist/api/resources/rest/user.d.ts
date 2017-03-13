import * as Rx from 'rx';
import { RESTResource } from './rest_resource';
import { Connection } from '../../connection';
import * as types from '../../types/rest';
/**
 * User resource class for dealing with user API endpoint.
 */
export declare class UserResource extends RESTResource<types.User> {
    constructor(connection: Connection);
    /**
     * Returns the current user's authentication status.
     */
    isAuthenticated(): Rx.Observable<boolean>;
    /**
     * Returns the current user's profile.
     */
    profile(): Rx.Observable<types.User>;
    /**
     * Create a new (inactive) user account.
     */
    create(user: types.CreateAccountInformation): Rx.Observable<types.User>;
    /**
     * Activate an inactive user account.
     *
     * @param token Activation token
     */
    activateAccount(token: string): Rx.Observable<types.ActivateAccountResponse>;
    /**
     * Change current user password.
     *
     * @param oldPassword Old password
     * @param newPassword New password
     */
    changePassword(oldPassword: string, newPassword: string): Rx.Observable<{}>;
    /**
     * Request a password reset email.
     *
     * @param username Username
     * @param community Optional community name
     */
    resetPasswordEmail(username: string, community?: string): Rx.Observable<{}>;
    /**
     * Reset user password.
     *
     * @param token Password reset token
     * @param password New password
     */
    resetPassword(token: string, password: string): Rx.Observable<{}>;
}
