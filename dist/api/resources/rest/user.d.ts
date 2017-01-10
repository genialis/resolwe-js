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
}
