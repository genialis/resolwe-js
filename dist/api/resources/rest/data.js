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
var rest_resource_1 = require("./rest_resource");
var permissions_1 = require("../addons/permissions");
/**
 * Data resource class for dealing with data endpoint.
 */
var DataResource = /** @class */ (function (_super) {
    __extends(DataResource, _super);
    function DataResource(connection) {
        return _super.call(this, 'data', connection) || this;
    }
    /**
     * Checks if data slug already exists.
     *
     * @param {string} Slug to check
     * @return {Rx.Observable<boolean>} An observable that emits the response
     */
    DataResource.prototype.slugExists = function (slug) {
        return this.connection.get(this.getListMethodPath('slug_exists'), { name: slug });
    };
    /**
     * Get Data object if similar already exists, otherwise create it.
     *
     * @param data Object attributes
     * @return An observable that emits the response
     */
    DataResource.prototype.getOrCreate = function (data) {
        return this.connection.post(this.getListMethodPath('get_or_create'), data);
    };
    DataResource.prototype.getPermissions = function (id) {
        return permissions_1.getPermissions(this, id);
    };
    DataResource.prototype.setPermissions = function (id, permissions) {
        return permissions_1.setPermissions(this, id, permissions);
    };
    return DataResource;
}(rest_resource_1.RESTResource));
exports.DataResource = DataResource;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL3Jlc3QvZGF0YS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFFQSxpREFBNkM7QUFFN0MscURBQXFGO0FBR3JGOztHQUVHO0FBQ0g7SUFBa0MsZ0NBQXdCO0lBRXRELHNCQUFZLFVBQXNCO2VBQzlCLGtCQUFNLE1BQU0sRUFBRSxVQUFVLENBQUM7SUFDN0IsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ksaUNBQVUsR0FBakIsVUFBa0IsSUFBWTtRQUMxQixNQUFNLENBQTBCLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQy9HLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNJLGtDQUFXLEdBQWxCLFVBQW1CLElBQVk7UUFDM0IsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFhLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxlQUFlLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMzRixDQUFDO0lBRU0scUNBQWMsR0FBckIsVUFBc0IsRUFBVTtRQUM1QixNQUFNLENBQUMsNEJBQWMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVNLHFDQUFjLEdBQXJCLFVBQXNCLEVBQVUsRUFBRSxXQUF3QztRQUN0RSxNQUFNLENBQUMsNEJBQWMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFDTCxtQkFBQztBQUFELENBakNBLEFBaUNDLENBakNpQyw0QkFBWSxHQWlDN0M7QUFqQ1ksb0NBQVkiLCJmaWxlIjoiYXBpL3Jlc291cmNlcy9yZXN0L2RhdGEuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSeCBmcm9tICdyeCc7XG5cbmltcG9ydCB7UkVTVFJlc291cmNlfSBmcm9tICcuL3Jlc3RfcmVzb3VyY2UnO1xuaW1wb3J0IHtDb25uZWN0aW9ufSBmcm9tICcuLi8uLi9jb25uZWN0aW9uJztcbmltcG9ydCB7UGVybWlzc2lvbmFibGUsIGdldFBlcm1pc3Npb25zLCBzZXRQZXJtaXNzaW9uc30gZnJvbSAnLi4vYWRkb25zL3Blcm1pc3Npb25zJztcbmltcG9ydCAqIGFzIHR5cGVzIGZyb20gJy4uLy4uL3R5cGVzL3Jlc3QnO1xuXG4vKipcbiAqIERhdGEgcmVzb3VyY2UgY2xhc3MgZm9yIGRlYWxpbmcgd2l0aCBkYXRhIGVuZHBvaW50LlxuICovXG5leHBvcnQgY2xhc3MgRGF0YVJlc291cmNlIGV4dGVuZHMgUkVTVFJlc291cmNlPHR5cGVzLkRhdGE+IGltcGxlbWVudHMgUGVybWlzc2lvbmFibGUge1xuXG4gICAgY29uc3RydWN0b3IoY29ubmVjdGlvbjogQ29ubmVjdGlvbikge1xuICAgICAgICBzdXBlcignZGF0YScsIGNvbm5lY3Rpb24pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBkYXRhIHNsdWcgYWxyZWFkeSBleGlzdHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gU2x1ZyB0byBjaGVja1xuICAgICAqIEByZXR1cm4ge1J4Lk9ic2VydmFibGU8Ym9vbGVhbj59IEFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB0aGUgcmVzcG9uc2VcbiAgICAgKi9cbiAgICBwdWJsaWMgc2x1Z0V4aXN0cyhzbHVnOiBzdHJpbmcpOiBSeC5PYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICAgICAgcmV0dXJuIDxSeC5PYnNlcnZhYmxlPGJvb2xlYW4+PiB0aGlzLmNvbm5lY3Rpb24uZ2V0KHRoaXMuZ2V0TGlzdE1ldGhvZFBhdGgoJ3NsdWdfZXhpc3RzJyksIHsgbmFtZTogc2x1ZyB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgRGF0YSBvYmplY3QgaWYgc2ltaWxhciBhbHJlYWR5IGV4aXN0cywgb3RoZXJ3aXNlIGNyZWF0ZSBpdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBkYXRhIE9iamVjdCBhdHRyaWJ1dGVzXG4gICAgICogQHJldHVybiBBbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgdGhlIHJlc3BvbnNlXG4gICAgICovXG4gICAgcHVibGljIGdldE9yQ3JlYXRlKGRhdGE6IE9iamVjdCk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuRGF0YT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uLnBvc3Q8dHlwZXMuRGF0YT4odGhpcy5nZXRMaXN0TWV0aG9kUGF0aCgnZ2V0X29yX2NyZWF0ZScpLCBkYXRhKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0UGVybWlzc2lvbnMoaWQ6IG51bWJlcik6IFJ4Lk9ic2VydmFibGU8dHlwZXMuSXRlbVBlcm1pc3Npb25zW10+IHtcbiAgICAgICAgcmV0dXJuIGdldFBlcm1pc3Npb25zKHRoaXMsIGlkKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0UGVybWlzc2lvbnMoaWQ6IG51bWJlciwgcGVybWlzc2lvbnM6IHR5cGVzLlNldFBlcm1pc3Npb25zUmVxdWVzdCk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuSXRlbVBlcm1pc3Npb25zW10+IHtcbiAgICAgICAgcmV0dXJuIHNldFBlcm1pc3Npb25zKHRoaXMsIGlkLCBwZXJtaXNzaW9ucyk7XG4gICAgfVxufVxuIl19
