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
    return UserResource;
}(rest_resource_1.RESTResource));
exports.UserResource = UserResource;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL3Jlc3QvdXNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwwQkFBNEI7QUFHNUIsaURBQTZDO0FBRzdDLDJEQUF1RDtBQUV2RDs7R0FFRztBQUNIO0lBQWtDLGdDQUF3QjtJQUN0RCxzQkFBWSxVQUFzQjtlQUM5QixrQkFBTSxNQUFNLEVBQUUsVUFBVSxDQUFDO0lBQzdCLENBQUM7SUFFRDs7T0FFRztJQUNJLHNDQUFlLEdBQXRCO1FBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUMsVUFBQyxLQUFZO1lBQ2pDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztRQUMxQixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRDs7T0FFRztJQUNJLDhCQUFPLEdBQWQ7UUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxVQUFDLEtBQW1CO1lBQ3hDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkIsb0JBQVEsQ0FBQyw0Q0FBNEMsQ0FBQyxDQUFDO1lBQzNELENBQUM7WUFFRCxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxQixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFDTCxtQkFBQztBQUFELENBMUJBLEFBMEJDLENBMUJpQyw0QkFBWSxHQTBCN0M7QUExQlksb0NBQVkiLCJmaWxlIjoiYXBpL3Jlc291cmNlcy9yZXN0L3VzZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgKiBhcyBSeCBmcm9tICdyeCc7XG5cbmltcG9ydCB7UkVTVFJlc291cmNlfSBmcm9tICcuL3Jlc3RfcmVzb3VyY2UnO1xuaW1wb3J0IHtDb25uZWN0aW9ufSBmcm9tICcuLi8uLi9jb25uZWN0aW9uJztcbmltcG9ydCAqIGFzIHR5cGVzIGZyb20gJy4uLy4uL3R5cGVzL3Jlc3QnO1xuaW1wb3J0IHtlcnJvckxvZ30gZnJvbSAnLi4vLi4vLi4vY29yZS91dGlscy9lcnJvcl9sb2cnO1xuXG4vKipcbiAqIFVzZXIgcmVzb3VyY2UgY2xhc3MgZm9yIGRlYWxpbmcgd2l0aCB1c2VyIEFQSSBlbmRwb2ludC5cbiAqL1xuZXhwb3J0IGNsYXNzIFVzZXJSZXNvdXJjZSBleHRlbmRzIFJFU1RSZXNvdXJjZTx0eXBlcy5Vc2VyPiB7XG4gICAgY29uc3RydWN0b3IoY29ubmVjdGlvbjogQ29ubmVjdGlvbikge1xuICAgICAgICBzdXBlcigndXNlcicsIGNvbm5lY3Rpb24pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgdXNlcidzIGF1dGhlbnRpY2F0aW9uIHN0YXR1cy5cbiAgICAgKi9cbiAgICBwdWJsaWMgaXNBdXRoZW50aWNhdGVkKCk6IFJ4Lk9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICAgICAgICByZXR1cm4gdGhpcy5xdWVyeSgpLm1hcCgodXNlcnM6IGFueVtdKTogYm9vbGVhbiA9PiB7XG4gICAgICAgICAgICByZXR1cm4gISF1c2Vycy5sZW5ndGg7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgdXNlcidzIHByb2ZpbGUuXG4gICAgICovXG4gICAgcHVibGljIHByb2ZpbGUoKTogUnguT2JzZXJ2YWJsZTx0eXBlcy5Vc2VyPiB7XG4gICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5KCkubWFwKCh1c2VyczogdHlwZXMuVXNlcltdKTogdHlwZXMuVXNlciA9PiB7XG4gICAgICAgICAgICBpZiAodXNlcnMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIGVycm9yTG9nKCdRdWVyeSBzaG91bGQgbm90IHJldHVybiBtb3JlIHRoYW4gb25lIHVzZXInKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIF8uZmlyc3QodXNlcnMpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=
