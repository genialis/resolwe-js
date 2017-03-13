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
        return this.query().map(function (users) {
            return !!users.length;
        });
    };
    /**
     * Returns the current user's profile.
     */
    UserResource.prototype.profile = function () {
        return this.query().map(function (users) {
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL3Jlc3QvdXNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwwQkFBNEI7QUFHNUIsaURBQTZDO0FBRzdDLDJEQUF1RDtBQUV2RDs7R0FFRztBQUNIO0lBQWtDLGdDQUF3QjtJQUN0RCxzQkFBWSxVQUFzQjtlQUM5QixrQkFBTSxNQUFNLEVBQUUsVUFBVSxDQUFDO0lBQzdCLENBQUM7SUFFRDs7T0FFRztJQUNJLHNDQUFlLEdBQXRCO1FBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUMsVUFBQyxLQUFZO1lBQ2pDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztRQUMxQixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRDs7T0FFRztJQUNJLDhCQUFPLEdBQWQ7UUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxVQUFDLEtBQW1CO1lBQ3hDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkIsb0JBQVEsQ0FBQyw0Q0FBNEMsQ0FBQyxDQUFDO1lBQzNELENBQUM7WUFFRCxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxQixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRDs7T0FFRztJQUNJLDZCQUFNLEdBQWIsVUFBYyxJQUFvQztRQUM5QyxNQUFNLENBQUMsaUJBQU0sTUFBTSxZQUFDLElBQUksQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFRDs7OztPQUlHO0lBQ0ksc0NBQWUsR0FBdEIsVUFBdUIsS0FBYTtRQUNoQyxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBZ0Msa0JBQWtCLEVBQUUsRUFBQyxLQUFLLE9BQUEsRUFBQyxDQUFDLENBQUM7SUFDM0YsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0kscUNBQWMsR0FBckIsVUFBc0IsV0FBbUIsRUFBRSxXQUFtQjtRQUE5RCxpQkFPQztRQU5HLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsYUFBYSxDQUFDLFVBQUMsSUFBZ0I7WUFDakQsTUFBTSxDQUFDLEtBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxpQkFBaUIsRUFBRTtnQkFDL0MsaUJBQWlCLEVBQUUsV0FBVztnQkFDOUIsWUFBWSxFQUFFLFdBQVc7YUFDNUIsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSSx5Q0FBa0IsR0FBekIsVUFBMEIsUUFBZ0IsRUFBRSxTQUFrQjtRQUMxRCxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBSyx3QkFBd0IsRUFBRSxFQUFDLFFBQVEsVUFBQSxFQUFFLFNBQVMsV0FBQSxFQUFDLENBQUMsQ0FBQztJQUNwRixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSSxvQ0FBYSxHQUFwQixVQUFxQixLQUFhLEVBQUUsUUFBZ0I7UUFDaEQsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUssZ0JBQWdCLEVBQUUsRUFBQyxLQUFLLE9BQUEsRUFBRSxRQUFRLFVBQUEsRUFBQyxDQUFDLENBQUM7SUFDeEUsQ0FBQztJQUNMLG1CQUFDO0FBQUQsQ0E3RUEsQUE2RUMsQ0E3RWlDLDRCQUFZLEdBNkU3QztBQTdFWSxvQ0FBWSIsImZpbGUiOiJhcGkvcmVzb3VyY2VzL3Jlc3QvdXNlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIFJ4IGZyb20gJ3J4JztcblxuaW1wb3J0IHtSRVNUUmVzb3VyY2V9IGZyb20gJy4vcmVzdF9yZXNvdXJjZSc7XG5pbXBvcnQge0Nvbm5lY3Rpb259IGZyb20gJy4uLy4uL2Nvbm5lY3Rpb24nO1xuaW1wb3J0ICogYXMgdHlwZXMgZnJvbSAnLi4vLi4vdHlwZXMvcmVzdCc7XG5pbXBvcnQge2Vycm9yTG9nfSBmcm9tICcuLi8uLi8uLi9jb3JlL3V0aWxzL2Vycm9yX2xvZyc7XG5cbi8qKlxuICogVXNlciByZXNvdXJjZSBjbGFzcyBmb3IgZGVhbGluZyB3aXRoIHVzZXIgQVBJIGVuZHBvaW50LlxuICovXG5leHBvcnQgY2xhc3MgVXNlclJlc291cmNlIGV4dGVuZHMgUkVTVFJlc291cmNlPHR5cGVzLlVzZXI+IHtcbiAgICBjb25zdHJ1Y3Rvcihjb25uZWN0aW9uOiBDb25uZWN0aW9uKSB7XG4gICAgICAgIHN1cGVyKCd1c2VyJywgY29ubmVjdGlvbik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgY3VycmVudCB1c2VyJ3MgYXV0aGVudGljYXRpb24gc3RhdHVzLlxuICAgICAqL1xuICAgIHB1YmxpYyBpc0F1dGhlbnRpY2F0ZWQoKTogUnguT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5KCkubWFwKCh1c2VyczogYW55W10pOiBib29sZWFuID0+IHtcbiAgICAgICAgICAgIHJldHVybiAhIXVzZXJzLmxlbmd0aDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgY3VycmVudCB1c2VyJ3MgcHJvZmlsZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgcHJvZmlsZSgpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLlVzZXI+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMucXVlcnkoKS5tYXAoKHVzZXJzOiB0eXBlcy5Vc2VyW10pOiB0eXBlcy5Vc2VyID0+IHtcbiAgICAgICAgICAgIGlmICh1c2Vycy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JMb2coJ1F1ZXJ5IHNob3VsZCBub3QgcmV0dXJuIG1vcmUgdGhhbiBvbmUgdXNlcicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gXy5maXJzdCh1c2Vycyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyAoaW5hY3RpdmUpIHVzZXIgYWNjb3VudC5cbiAgICAgKi9cbiAgICBwdWJsaWMgY3JlYXRlKHVzZXI6IHR5cGVzLkNyZWF0ZUFjY291bnRJbmZvcm1hdGlvbik6IFJ4Lk9ic2VydmFibGU8dHlwZXMuVXNlcj4ge1xuICAgICAgICByZXR1cm4gc3VwZXIuY3JlYXRlKHVzZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFjdGl2YXRlIGFuIGluYWN0aXZlIHVzZXIgYWNjb3VudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0b2tlbiBBY3RpdmF0aW9uIHRva2VuXG4gICAgICovXG4gICAgcHVibGljIGFjdGl2YXRlQWNjb3VudCh0b2tlbjogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhbGxMaXN0TWV0aG9kPHR5cGVzLkFjdGl2YXRlQWNjb3VudFJlc3BvbnNlPignYWN0aXZhdGVfYWNjb3VudCcsIHt0b2tlbn0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoYW5nZSBjdXJyZW50IHVzZXIgcGFzc3dvcmQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb2xkUGFzc3dvcmQgT2xkIHBhc3N3b3JkXG4gICAgICogQHBhcmFtIG5ld1Bhc3N3b3JkIE5ldyBwYXNzd29yZFxuICAgICAqL1xuICAgIHB1YmxpYyBjaGFuZ2VQYXNzd29yZChvbGRQYXNzd29yZDogc3RyaW5nLCBuZXdQYXNzd29yZDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnByb2ZpbGUoKS5mbGF0TWFwTGF0ZXN0KCh1c2VyOiB0eXBlcy5Vc2VyKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKHVzZXIuaWQsICdjaGFuZ2VfcGFzc3dvcmQnLCB7XG4gICAgICAgICAgICAgICAgZXhpc3RpbmdfcGFzc3dvcmQ6IG9sZFBhc3N3b3JkLFxuICAgICAgICAgICAgICAgIG5ld19wYXNzd29yZDogbmV3UGFzc3dvcmQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVxdWVzdCBhIHBhc3N3b3JkIHJlc2V0IGVtYWlsLlxuICAgICAqXG4gICAgICogQHBhcmFtIHVzZXJuYW1lIFVzZXJuYW1lXG4gICAgICogQHBhcmFtIGNvbW11bml0eSBPcHRpb25hbCBjb21tdW5pdHkgbmFtZVxuICAgICAqL1xuICAgIHB1YmxpYyByZXNldFBhc3N3b3JkRW1haWwodXNlcm5hbWU6IHN0cmluZywgY29tbXVuaXR5Pzogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhbGxMaXN0TWV0aG9kPHt9PigncmVxdWVzdF9wYXNzd29yZF9yZXNldCcsIHt1c2VybmFtZSwgY29tbXVuaXR5fSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVzZXQgdXNlciBwYXNzd29yZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0b2tlbiBQYXNzd29yZCByZXNldCB0b2tlblxuICAgICAqIEBwYXJhbSBwYXNzd29yZCBOZXcgcGFzc3dvcmRcbiAgICAgKi9cbiAgICBwdWJsaWMgcmVzZXRQYXNzd29yZCh0b2tlbjogc3RyaW5nLCBwYXNzd29yZDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhbGxMaXN0TWV0aG9kPHt9PigncGFzc3dvcmRfcmVzZXQnLCB7dG9rZW4sIHBhc3N3b3JkfSk7XG4gICAgfVxufVxuIl19
