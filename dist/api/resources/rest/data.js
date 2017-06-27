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
     * Checks if data slug already exists.
     *
     * @param {string} Slug to check
     * @return {Rx.Observable<boolean>} An observable that emits the response
     */
    DataResource.prototype.slugExists = function (slug) {
        return this.connection.get(this.getListMethodPath('slug_exists'), { name: slug });
    };
    /**
     * Get Data object with the same inputs if it already exists, otherwise
     * create it.
     *
     * Note: Consider sorting arrays in the inputs, to prevent needlessly
     * creating the same Data objects.
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL3Jlc3QvZGF0YS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFFQSxpREFBNkM7QUFFN0MscURBQXFGO0FBR3JGOztHQUVHO0FBQ0g7SUFBa0MsZ0NBQXdCO0lBRXRELHNCQUFZLFVBQXNCO2VBQzlCLGtCQUFNLE1BQU0sRUFBRSxVQUFVLENBQUM7SUFDN0IsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ksaUNBQVUsR0FBakIsVUFBa0IsSUFBWTtRQUMxQixNQUFNLENBQTBCLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQy9HLENBQUM7SUFFRDs7Ozs7Ozs7O09BU0c7SUFDSSxrQ0FBVyxHQUFsQixVQUFtQixJQUFZO1FBQzNCLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBYSxJQUFJLENBQUMsaUJBQWlCLENBQUMsZUFBZSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDM0YsQ0FBQztJQUVNLHFDQUFjLEdBQXJCLFVBQXNCLEVBQVU7UUFDNUIsTUFBTSxDQUFDLDRCQUFjLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFTSxxQ0FBYyxHQUFyQixVQUFzQixFQUFVLEVBQUUsV0FBd0M7UUFDdEUsTUFBTSxDQUFDLDRCQUFjLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBQ0wsbUJBQUM7QUFBRCxDQXJDQSxBQXFDQyxDQXJDaUMsNEJBQVksR0FxQzdDO0FBckNZLG9DQUFZIiwiZmlsZSI6ImFwaS9yZXNvdXJjZXMvcmVzdC9kYXRhLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUnggZnJvbSAncngnO1xuXG5pbXBvcnQge1JFU1RSZXNvdXJjZX0gZnJvbSAnLi9yZXN0X3Jlc291cmNlJztcbmltcG9ydCB7Q29ubmVjdGlvbn0gZnJvbSAnLi4vLi4vY29ubmVjdGlvbic7XG5pbXBvcnQge1Blcm1pc3Npb25hYmxlLCBnZXRQZXJtaXNzaW9ucywgc2V0UGVybWlzc2lvbnN9IGZyb20gJy4uL2FkZG9ucy9wZXJtaXNzaW9ucyc7XG5pbXBvcnQgKiBhcyB0eXBlcyBmcm9tICcuLi8uLi90eXBlcy9yZXN0JztcblxuLyoqXG4gKiBEYXRhIHJlc291cmNlIGNsYXNzIGZvciBkZWFsaW5nIHdpdGggZGF0YSBlbmRwb2ludC5cbiAqL1xuZXhwb3J0IGNsYXNzIERhdGFSZXNvdXJjZSBleHRlbmRzIFJFU1RSZXNvdXJjZTx0eXBlcy5EYXRhPiBpbXBsZW1lbnRzIFBlcm1pc3Npb25hYmxlIHtcblxuICAgIGNvbnN0cnVjdG9yKGNvbm5lY3Rpb246IENvbm5lY3Rpb24pIHtcbiAgICAgICAgc3VwZXIoJ2RhdGEnLCBjb25uZWN0aW9uKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgZGF0YSBzbHVnIGFscmVhZHkgZXhpc3RzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFNsdWcgdG8gY2hlY2tcbiAgICAgKiBAcmV0dXJuIHtSeC5PYnNlcnZhYmxlPGJvb2xlYW4+fSBBbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgdGhlIHJlc3BvbnNlXG4gICAgICovXG4gICAgcHVibGljIHNsdWdFeGlzdHMoc2x1Zzogc3RyaW5nKTogUnguT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgICAgIHJldHVybiA8UnguT2JzZXJ2YWJsZTxib29sZWFuPj4gdGhpcy5jb25uZWN0aW9uLmdldCh0aGlzLmdldExpc3RNZXRob2RQYXRoKCdzbHVnX2V4aXN0cycpLCB7IG5hbWU6IHNsdWcgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IERhdGEgb2JqZWN0IHdpdGggdGhlIHNhbWUgaW5wdXRzIGlmIGl0IGFscmVhZHkgZXhpc3RzLCBvdGhlcndpc2VcbiAgICAgKiBjcmVhdGUgaXQuXG4gICAgICpcbiAgICAgKiBOb3RlOiBDb25zaWRlciBzb3J0aW5nIGFycmF5cyBpbiB0aGUgaW5wdXRzLCB0byBwcmV2ZW50IG5lZWRsZXNzbHlcbiAgICAgKiBjcmVhdGluZyB0aGUgc2FtZSBEYXRhIG9iamVjdHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZGF0YSBPYmplY3QgYXR0cmlidXRlc1xuICAgICAqIEByZXR1cm4gQW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHRoZSByZXNwb25zZVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXRPckNyZWF0ZShkYXRhOiBPYmplY3QpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLkRhdGE+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29ubmVjdGlvbi5wb3N0PHR5cGVzLkRhdGE+KHRoaXMuZ2V0TGlzdE1ldGhvZFBhdGgoJ2dldF9vcl9jcmVhdGUnKSwgZGF0YSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFBlcm1pc3Npb25zKGlkOiBudW1iZXIpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLkl0ZW1QZXJtaXNzaW9uc1tdPiB7XG4gICAgICAgIHJldHVybiBnZXRQZXJtaXNzaW9ucyh0aGlzLCBpZCk7XG4gICAgfVxuXG4gICAgcHVibGljIHNldFBlcm1pc3Npb25zKGlkOiBudW1iZXIsIHBlcm1pc3Npb25zOiB0eXBlcy5TZXRQZXJtaXNzaW9uc1JlcXVlc3QpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLkl0ZW1QZXJtaXNzaW9uc1tdPiB7XG4gICAgICAgIHJldHVybiBzZXRQZXJtaXNzaW9ucyh0aGlzLCBpZCwgcGVybWlzc2lvbnMpO1xuICAgIH1cbn1cbiJdfQ==
