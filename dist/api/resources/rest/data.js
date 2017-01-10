"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var rest_resource_1 = require("./rest_resource");
var permissions_1 = require("../addons/permissions");
/**
 * Data resource class for dealing with data endpoint.
 */
var DataResource = (function (_super) {
    __extends(DataResource, _super);
    function DataResource(connection) {
        return _super.call(this, 'data', connection) || this;
    }
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL3Jlc3QvZGF0YS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxpREFBNkM7QUFFN0MscURBQXFGO0FBR3JGOztHQUVHO0FBQ0g7SUFBa0MsZ0NBQXdCO0lBRXRELHNCQUFZLFVBQXNCO2VBQzlCLGtCQUFNLE1BQU0sRUFBRSxVQUFVLENBQUM7SUFDN0IsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ksa0NBQVcsR0FBbEIsVUFBbUIsSUFBWTtRQUMzQixNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQWEsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGVBQWUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzNGLENBQUM7SUFFTSxxQ0FBYyxHQUFyQixVQUFzQixFQUFVO1FBQzVCLE1BQU0sQ0FBQyw0QkFBYyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRU0scUNBQWMsR0FBckIsVUFBc0IsRUFBVSxFQUFFLFdBQXdDO1FBQ3RFLE1BQU0sQ0FBQyw0QkFBYyxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUNMLG1CQUFDO0FBQUQsQ0F2QkEsQUF1QkMsQ0F2QmlDLDRCQUFZLEdBdUI3QztBQXZCWSxvQ0FBWSIsImZpbGUiOiJhcGkvcmVzb3VyY2VzL3Jlc3QvZGF0YS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7UkVTVFJlc291cmNlfSBmcm9tICcuL3Jlc3RfcmVzb3VyY2UnO1xuaW1wb3J0IHtDb25uZWN0aW9ufSBmcm9tICcuLi8uLi9jb25uZWN0aW9uJztcbmltcG9ydCB7UGVybWlzc2lvbmFibGUsIGdldFBlcm1pc3Npb25zLCBzZXRQZXJtaXNzaW9uc30gZnJvbSAnLi4vYWRkb25zL3Blcm1pc3Npb25zJztcbmltcG9ydCAqIGFzIHR5cGVzIGZyb20gJy4uLy4uL3R5cGVzL3Jlc3QnO1xuXG4vKipcbiAqIERhdGEgcmVzb3VyY2UgY2xhc3MgZm9yIGRlYWxpbmcgd2l0aCBkYXRhIGVuZHBvaW50LlxuICovXG5leHBvcnQgY2xhc3MgRGF0YVJlc291cmNlIGV4dGVuZHMgUkVTVFJlc291cmNlPHR5cGVzLkRhdGE+IGltcGxlbWVudHMgUGVybWlzc2lvbmFibGUge1xuXG4gICAgY29uc3RydWN0b3IoY29ubmVjdGlvbjogQ29ubmVjdGlvbikge1xuICAgICAgICBzdXBlcignZGF0YScsIGNvbm5lY3Rpb24pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBEYXRhIG9iamVjdCBpZiBzaW1pbGFyIGFscmVhZHkgZXhpc3RzLCBvdGhlcndpc2UgY3JlYXRlIGl0LlxuICAgICAqXG4gICAgICogQHBhcmFtIGRhdGEgT2JqZWN0IGF0dHJpYnV0ZXNcbiAgICAgKiBAcmV0dXJuIEFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB0aGUgcmVzcG9uc2VcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0T3JDcmVhdGUoZGF0YTogT2JqZWN0KTogUnguT2JzZXJ2YWJsZTx0eXBlcy5EYXRhPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbm5lY3Rpb24ucG9zdDx0eXBlcy5EYXRhPih0aGlzLmdldExpc3RNZXRob2RQYXRoKCdnZXRfb3JfY3JlYXRlJyksIGRhdGEpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRQZXJtaXNzaW9ucyhpZDogbnVtYmVyKTogUnguT2JzZXJ2YWJsZTx0eXBlcy5JdGVtUGVybWlzc2lvbnNbXT4ge1xuICAgICAgICByZXR1cm4gZ2V0UGVybWlzc2lvbnModGhpcywgaWQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXRQZXJtaXNzaW9ucyhpZDogbnVtYmVyLCBwZXJtaXNzaW9uczogdHlwZXMuU2V0UGVybWlzc2lvbnNSZXF1ZXN0KTogUnguT2JzZXJ2YWJsZTx0eXBlcy5JdGVtUGVybWlzc2lvbnNbXT4ge1xuICAgICAgICByZXR1cm4gc2V0UGVybWlzc2lvbnModGhpcywgaWQsIHBlcm1pc3Npb25zKTtcbiAgICB9XG59XG4iXX0=
