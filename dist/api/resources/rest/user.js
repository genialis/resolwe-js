"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var rest_resource_1 = require("./rest_resource");
/**
 * User resource class for dealing with user API endpoint.
 */
var UserResource = /** @class */ (function (_super) {
    __extends(UserResource, _super);
    function UserResource(connection) {
        return _super.call(this, 'user', connection) || this;
    }
    /**
     * Returns the current user's authentication status.
     */
    UserResource.prototype.isAuthenticated = function () {
        return this.query({ current_only: 1 }, { reactive: true }).map(function (users) {
            return !!users.length;
        });
    };
    /**
     * Returns the current user's profile.
     */
    UserResource.prototype.profile = function () {
        return this.query({ current_only: 1 }, { reactive: true }).map(function (users) {
            if (users.length > 1) {
                console.error('Query should not return more than one user');
            }
            return _.first(users);
        });
    };
    /**
     * Create a new (inactive) user account.
     */
    UserResource.prototype.create = function (user) {
        return _super.prototype.create.call(this, user);
    };
    /**
     * Activate an inactive user account.
     *
     * @param token Activation token
     */
    UserResource.prototype.activateAccount = function (token) {
        return this.callListMethod('activate_account', { token: token });
    };
    /**
     * Change current user password.
     *
     * @param oldPassword Old password
     * @param newPassword New password
     */
    UserResource.prototype.changePassword = function (oldPassword, newPassword) {
        var _this = this;
        return this.profile().flatMapLatest(function (user) {
            return _this.callMethod(user.id, 'change_password', {
                existing_password: oldPassword,
                new_password: newPassword,
            });
        });
    };
    /**
     * Request a password reset email.
     *
     * @param username Username
     * @param community Optional community name
     */
    UserResource.prototype.resetPasswordEmail = function (username, community) {
        return this.callListMethod('request_password_reset', { username: username, community: community });
    };
    /**
     * Reset user password.
     *
     * @param token Password reset token
     * @param password New password
     */
    UserResource.prototype.resetPassword = function (token, password) {
        return this.callListMethod('password_reset', { token: token, password: password });
    };
    return UserResource;
}(rest_resource_1.RESTResource));
exports.UserResource = UserResource;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL3Jlc3QvdXNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwwQkFBNEI7QUFHNUIsaURBQTZDO0FBSTdDOztHQUVHO0FBQ0g7SUFBa0MsZ0NBQXdCO0lBQ3RELHNCQUFZLFVBQXNCO2VBQzlCLGtCQUFNLE1BQU0sRUFBRSxVQUFVLENBQUM7SUFDN0IsQ0FBQztJQUVEOztPQUVHO0lBQ0ksc0NBQWUsR0FBdEI7UUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFDLFlBQVksRUFBRSxDQUFDLEVBQUMsRUFBRSxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFDLEtBQVk7WUFDcEUsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO1FBQzFCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVEOztPQUVHO0lBQ0ksOEJBQU8sR0FBZDtRQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUMsWUFBWSxFQUFFLENBQUMsRUFBQyxFQUFFLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUMsS0FBbUI7WUFDM0UsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuQixPQUFPLENBQUMsS0FBSyxDQUFDLDRDQUE0QyxDQUFDLENBQUM7WUFDaEUsQ0FBQztZQUVELE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzFCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVEOztPQUVHO0lBQ0ksNkJBQU0sR0FBYixVQUFjLElBQW9DO1FBQzlDLE1BQU0sQ0FBQyxpQkFBTSxNQUFNLFlBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSxzQ0FBZSxHQUF0QixVQUF1QixLQUFhO1FBQ2hDLE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFnQyxrQkFBa0IsRUFBRSxFQUFDLEtBQUssT0FBQSxFQUFDLENBQUMsQ0FBQztJQUMzRixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSSxxQ0FBYyxHQUFyQixVQUFzQixXQUFtQixFQUFFLFdBQW1CO1FBQTlELGlCQU9DO1FBTkcsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxhQUFhLENBQUMsVUFBQyxJQUFnQjtZQUNqRCxNQUFNLENBQUMsS0FBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLGlCQUFpQixFQUFFO2dCQUMvQyxpQkFBaUIsRUFBRSxXQUFXO2dCQUM5QixZQUFZLEVBQUUsV0FBVzthQUM1QixDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNJLHlDQUFrQixHQUF6QixVQUEwQixRQUFnQixFQUFFLFNBQWtCO1FBQzFELE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFLLHdCQUF3QixFQUFFLEVBQUMsUUFBUSxVQUFBLEVBQUUsU0FBUyxXQUFBLEVBQUMsQ0FBQyxDQUFDO0lBQ3BGLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNJLG9DQUFhLEdBQXBCLFVBQXFCLEtBQWEsRUFBRSxRQUFnQjtRQUNoRCxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBSyxnQkFBZ0IsRUFBRSxFQUFDLEtBQUssT0FBQSxFQUFFLFFBQVEsVUFBQSxFQUFDLENBQUMsQ0FBQztJQUN4RSxDQUFDO0lBQ0wsbUJBQUM7QUFBRCxDQTdFQSxBQTZFQyxDQTdFaUMsNEJBQVksR0E2RTdDO0FBN0VZLG9DQUFZIiwiZmlsZSI6ImFwaS9yZXNvdXJjZXMvcmVzdC91c2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgUnggZnJvbSAncngnO1xuXG5pbXBvcnQge1JFU1RSZXNvdXJjZX0gZnJvbSAnLi9yZXN0X3Jlc291cmNlJztcbmltcG9ydCB7Q29ubmVjdGlvbn0gZnJvbSAnLi4vLi4vY29ubmVjdGlvbic7XG5pbXBvcnQgKiBhcyB0eXBlcyBmcm9tICcuLi8uLi90eXBlcy9yZXN0JztcblxuLyoqXG4gKiBVc2VyIHJlc291cmNlIGNsYXNzIGZvciBkZWFsaW5nIHdpdGggdXNlciBBUEkgZW5kcG9pbnQuXG4gKi9cbmV4cG9ydCBjbGFzcyBVc2VyUmVzb3VyY2UgZXh0ZW5kcyBSRVNUUmVzb3VyY2U8dHlwZXMuVXNlcj4ge1xuICAgIGNvbnN0cnVjdG9yKGNvbm5lY3Rpb246IENvbm5lY3Rpb24pIHtcbiAgICAgICAgc3VwZXIoJ3VzZXInLCBjb25uZWN0aW9uKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IHVzZXIncyBhdXRoZW50aWNhdGlvbiBzdGF0dXMuXG4gICAgICovXG4gICAgcHVibGljIGlzQXV0aGVudGljYXRlZCgpOiBSeC5PYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMucXVlcnkoe2N1cnJlbnRfb25seTogMX0sIHtyZWFjdGl2ZTogdHJ1ZX0pLm1hcCgodXNlcnM6IGFueVtdKTogYm9vbGVhbiA9PiB7XG4gICAgICAgICAgICByZXR1cm4gISF1c2Vycy5sZW5ndGg7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgdXNlcidzIHByb2ZpbGUuXG4gICAgICovXG4gICAgcHVibGljIHByb2ZpbGUoKTogUnguT2JzZXJ2YWJsZTx0eXBlcy5Vc2VyPiB7XG4gICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5KHtjdXJyZW50X29ubHk6IDF9LCB7cmVhY3RpdmU6IHRydWV9KS5tYXAoKHVzZXJzOiB0eXBlcy5Vc2VyW10pOiB0eXBlcy5Vc2VyID0+IHtcbiAgICAgICAgICAgIGlmICh1c2Vycy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignUXVlcnkgc2hvdWxkIG5vdCByZXR1cm4gbW9yZSB0aGFuIG9uZSB1c2VyJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBfLmZpcnN0KHVzZXJzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IChpbmFjdGl2ZSkgdXNlciBhY2NvdW50LlxuICAgICAqL1xuICAgIHB1YmxpYyBjcmVhdGUodXNlcjogdHlwZXMuQ3JlYXRlQWNjb3VudEluZm9ybWF0aW9uKTogUnguT2JzZXJ2YWJsZTx0eXBlcy5Vc2VyPiB7XG4gICAgICAgIHJldHVybiBzdXBlci5jcmVhdGUodXNlcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWN0aXZhdGUgYW4gaW5hY3RpdmUgdXNlciBhY2NvdW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIHRva2VuIEFjdGl2YXRpb24gdG9rZW5cbiAgICAgKi9cbiAgICBwdWJsaWMgYWN0aXZhdGVBY2NvdW50KHRva2VuOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FsbExpc3RNZXRob2Q8dHlwZXMuQWN0aXZhdGVBY2NvdW50UmVzcG9uc2U+KCdhY3RpdmF0ZV9hY2NvdW50Jywge3Rva2VufSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hhbmdlIGN1cnJlbnQgdXNlciBwYXNzd29yZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvbGRQYXNzd29yZCBPbGQgcGFzc3dvcmRcbiAgICAgKiBAcGFyYW0gbmV3UGFzc3dvcmQgTmV3IHBhc3N3b3JkXG4gICAgICovXG4gICAgcHVibGljIGNoYW5nZVBhc3N3b3JkKG9sZFBhc3N3b3JkOiBzdHJpbmcsIG5ld1Bhc3N3b3JkOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvZmlsZSgpLmZsYXRNYXBMYXRlc3QoKHVzZXI6IHR5cGVzLlVzZXIpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QodXNlci5pZCwgJ2NoYW5nZV9wYXNzd29yZCcsIHtcbiAgICAgICAgICAgICAgICBleGlzdGluZ19wYXNzd29yZDogb2xkUGFzc3dvcmQsXG4gICAgICAgICAgICAgICAgbmV3X3Bhc3N3b3JkOiBuZXdQYXNzd29yZCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGEgcGFzc3dvcmQgcmVzZXQgZW1haWwuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdXNlcm5hbWUgVXNlcm5hbWVcbiAgICAgKiBAcGFyYW0gY29tbXVuaXR5IE9wdGlvbmFsIGNvbW11bml0eSBuYW1lXG4gICAgICovXG4gICAgcHVibGljIHJlc2V0UGFzc3dvcmRFbWFpbCh1c2VybmFtZTogc3RyaW5nLCBjb21tdW5pdHk/OiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FsbExpc3RNZXRob2Q8e30+KCdyZXF1ZXN0X3Bhc3N3b3JkX3Jlc2V0Jywge3VzZXJuYW1lLCBjb21tdW5pdHl9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXNldCB1c2VyIHBhc3N3b3JkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRva2VuIFBhc3N3b3JkIHJlc2V0IHRva2VuXG4gICAgICogQHBhcmFtIHBhc3N3b3JkIE5ldyBwYXNzd29yZFxuICAgICAqL1xuICAgIHB1YmxpYyByZXNldFBhc3N3b3JkKHRva2VuOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FsbExpc3RNZXRob2Q8e30+KCdwYXNzd29yZF9yZXNldCcsIHt0b2tlbiwgcGFzc3dvcmR9KTtcbiAgICB9XG59XG4iXX0=
