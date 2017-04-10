"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var _ = require("lodash");
var rest_resource_1 = require("./rest_resource");
var error_log_1 = require("../../../core/utils/error_log");
/**
 * User resource class for dealing with user API endpoint.
 */
var UserResource = (function (_super) {
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
                error_log_1.errorLog('Query should not return more than one user');
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL3Jlc3QvdXNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwwQkFBNEI7QUFHNUIsaURBQTZDO0FBRzdDLDJEQUF1RDtBQUV2RDs7R0FFRztBQUNIO0lBQWtDLGdDQUF3QjtJQUN0RCxzQkFBWSxVQUFzQjtlQUM5QixrQkFBTSxNQUFNLEVBQUUsVUFBVSxDQUFDO0lBQzdCLENBQUM7SUFFRDs7T0FFRztJQUNJLHNDQUFlLEdBQXRCO1FBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBQyxZQUFZLEVBQUUsQ0FBQyxFQUFDLEVBQUUsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQyxLQUFZO1lBQ3BFLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztRQUMxQixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRDs7T0FFRztJQUNJLDhCQUFPLEdBQWQ7UUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFDLFlBQVksRUFBRSxDQUFDLEVBQUMsRUFBRSxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFDLEtBQW1CO1lBQzNFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkIsb0JBQVEsQ0FBQyw0Q0FBNEMsQ0FBQyxDQUFDO1lBQzNELENBQUM7WUFFRCxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxQixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRDs7T0FFRztJQUNJLDZCQUFNLEdBQWIsVUFBYyxJQUFvQztRQUM5QyxNQUFNLENBQUMsaUJBQU0sTUFBTSxZQUFDLElBQUksQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFRDs7OztPQUlHO0lBQ0ksc0NBQWUsR0FBdEIsVUFBdUIsS0FBYTtRQUNoQyxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBZ0Msa0JBQWtCLEVBQUUsRUFBQyxLQUFLLE9BQUEsRUFBQyxDQUFDLENBQUM7SUFDM0YsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0kscUNBQWMsR0FBckIsVUFBc0IsV0FBbUIsRUFBRSxXQUFtQjtRQUE5RCxpQkFPQztRQU5HLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsYUFBYSxDQUFDLFVBQUMsSUFBZ0I7WUFDakQsTUFBTSxDQUFDLEtBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxpQkFBaUIsRUFBRTtnQkFDL0MsaUJBQWlCLEVBQUUsV0FBVztnQkFDOUIsWUFBWSxFQUFFLFdBQVc7YUFDNUIsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSSx5Q0FBa0IsR0FBekIsVUFBMEIsUUFBZ0IsRUFBRSxTQUFrQjtRQUMxRCxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBSyx3QkFBd0IsRUFBRSxFQUFDLFFBQVEsVUFBQSxFQUFFLFNBQVMsV0FBQSxFQUFDLENBQUMsQ0FBQztJQUNwRixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSSxvQ0FBYSxHQUFwQixVQUFxQixLQUFhLEVBQUUsUUFBZ0I7UUFDaEQsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUssZ0JBQWdCLEVBQUUsRUFBQyxLQUFLLE9BQUEsRUFBRSxRQUFRLFVBQUEsRUFBQyxDQUFDLENBQUM7SUFDeEUsQ0FBQztJQUNMLG1CQUFDO0FBQUQsQ0E3RUEsQUE2RUMsQ0E3RWlDLDRCQUFZLEdBNkU3QztBQTdFWSxvQ0FBWSIsImZpbGUiOiJhcGkvcmVzb3VyY2VzL3Jlc3QvdXNlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIFJ4IGZyb20gJ3J4JztcblxuaW1wb3J0IHtSRVNUUmVzb3VyY2V9IGZyb20gJy4vcmVzdF9yZXNvdXJjZSc7XG5pbXBvcnQge0Nvbm5lY3Rpb259IGZyb20gJy4uLy4uL2Nvbm5lY3Rpb24nO1xuaW1wb3J0ICogYXMgdHlwZXMgZnJvbSAnLi4vLi4vdHlwZXMvcmVzdCc7XG5pbXBvcnQge2Vycm9yTG9nfSBmcm9tICcuLi8uLi8uLi9jb3JlL3V0aWxzL2Vycm9yX2xvZyc7XG5cbi8qKlxuICogVXNlciByZXNvdXJjZSBjbGFzcyBmb3IgZGVhbGluZyB3aXRoIHVzZXIgQVBJIGVuZHBvaW50LlxuICovXG5leHBvcnQgY2xhc3MgVXNlclJlc291cmNlIGV4dGVuZHMgUkVTVFJlc291cmNlPHR5cGVzLlVzZXI+IHtcbiAgICBjb25zdHJ1Y3Rvcihjb25uZWN0aW9uOiBDb25uZWN0aW9uKSB7XG4gICAgICAgIHN1cGVyKCd1c2VyJywgY29ubmVjdGlvbik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgY3VycmVudCB1c2VyJ3MgYXV0aGVudGljYXRpb24gc3RhdHVzLlxuICAgICAqL1xuICAgIHB1YmxpYyBpc0F1dGhlbnRpY2F0ZWQoKTogUnguT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5KHtjdXJyZW50X29ubHk6IDF9LCB7cmVhY3RpdmU6IHRydWV9KS5tYXAoKHVzZXJzOiBhbnlbXSk6IGJvb2xlYW4gPT4ge1xuICAgICAgICAgICAgcmV0dXJuICEhdXNlcnMubGVuZ3RoO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IHVzZXIncyBwcm9maWxlLlxuICAgICAqL1xuICAgIHB1YmxpYyBwcm9maWxlKCk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuVXNlcj4ge1xuICAgICAgICByZXR1cm4gdGhpcy5xdWVyeSh7Y3VycmVudF9vbmx5OiAxfSwge3JlYWN0aXZlOiB0cnVlfSkubWFwKCh1c2VyczogdHlwZXMuVXNlcltdKTogdHlwZXMuVXNlciA9PiB7XG4gICAgICAgICAgICBpZiAodXNlcnMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIGVycm9yTG9nKCdRdWVyeSBzaG91bGQgbm90IHJldHVybiBtb3JlIHRoYW4gb25lIHVzZXInKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIF8uZmlyc3QodXNlcnMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgKGluYWN0aXZlKSB1c2VyIGFjY291bnQuXG4gICAgICovXG4gICAgcHVibGljIGNyZWF0ZSh1c2VyOiB0eXBlcy5DcmVhdGVBY2NvdW50SW5mb3JtYXRpb24pOiBSeC5PYnNlcnZhYmxlPHR5cGVzLlVzZXI+IHtcbiAgICAgICAgcmV0dXJuIHN1cGVyLmNyZWF0ZSh1c2VyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBY3RpdmF0ZSBhbiBpbmFjdGl2ZSB1c2VyIGFjY291bnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdG9rZW4gQWN0aXZhdGlvbiB0b2tlblxuICAgICAqL1xuICAgIHB1YmxpYyBhY3RpdmF0ZUFjY291bnQodG9rZW46IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdGhpcy5jYWxsTGlzdE1ldGhvZDx0eXBlcy5BY3RpdmF0ZUFjY291bnRSZXNwb25zZT4oJ2FjdGl2YXRlX2FjY291bnQnLCB7dG9rZW59KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGFuZ2UgY3VycmVudCB1c2VyIHBhc3N3b3JkLlxuICAgICAqXG4gICAgICogQHBhcmFtIG9sZFBhc3N3b3JkIE9sZCBwYXNzd29yZFxuICAgICAqIEBwYXJhbSBuZXdQYXNzd29yZCBOZXcgcGFzc3dvcmRcbiAgICAgKi9cbiAgICBwdWJsaWMgY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQ6IHN0cmluZywgbmV3UGFzc3dvcmQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdGhpcy5wcm9maWxlKCkuZmxhdE1hcExhdGVzdCgodXNlcjogdHlwZXMuVXNlcikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCh1c2VyLmlkLCAnY2hhbmdlX3Bhc3N3b3JkJywge1xuICAgICAgICAgICAgICAgIGV4aXN0aW5nX3Bhc3N3b3JkOiBvbGRQYXNzd29yZCxcbiAgICAgICAgICAgICAgICBuZXdfcGFzc3dvcmQ6IG5ld1Bhc3N3b3JkLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlcXVlc3QgYSBwYXNzd29yZCByZXNldCBlbWFpbC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB1c2VybmFtZSBVc2VybmFtZVxuICAgICAqIEBwYXJhbSBjb21tdW5pdHkgT3B0aW9uYWwgY29tbXVuaXR5IG5hbWVcbiAgICAgKi9cbiAgICBwdWJsaWMgcmVzZXRQYXNzd29yZEVtYWlsKHVzZXJuYW1lOiBzdHJpbmcsIGNvbW11bml0eT86IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdGhpcy5jYWxsTGlzdE1ldGhvZDx7fT4oJ3JlcXVlc3RfcGFzc3dvcmRfcmVzZXQnLCB7dXNlcm5hbWUsIGNvbW11bml0eX0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlc2V0IHVzZXIgcGFzc3dvcmQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdG9rZW4gUGFzc3dvcmQgcmVzZXQgdG9rZW5cbiAgICAgKiBAcGFyYW0gcGFzc3dvcmQgTmV3IHBhc3N3b3JkXG4gICAgICovXG4gICAgcHVibGljIHJlc2V0UGFzc3dvcmQodG9rZW46IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdGhpcy5jYWxsTGlzdE1ldGhvZDx7fT4oJ3Bhc3N3b3JkX3Jlc2V0Jywge3Rva2VuLCBwYXNzd29yZH0pO1xuICAgIH1cbn1cbiJdfQ==
