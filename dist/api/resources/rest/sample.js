"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var _ = require("lodash");
var rest_resource_1 = require("./rest_resource");
var error_1 = require("../../../core/errors/error");
var permissions_1 = require("../addons/permissions");
/**
 * Sample resource class for dealing with sample endpoint.
 */
var SampleResource = (function (_super) {
    __extends(SampleResource, _super);
    function SampleResource(connection) {
        return _super.call(this, 'sample', connection) || this;
    }
    /**
     * Checks if sample slug already exists.
     *
     * @param Slug to check
     * @return An observable that emits the response
     */
    SampleResource.prototype.slugExists = function (slug) {
        return this.connection.get(this.getListMethodPath('slug_exists'), { name: slug });
    };
    /**
     * This method should not be used.
     */
    SampleResource.prototype.query = function (query, options) {
        if (query['workaroundForQueryOne']) {
            return _super.prototype.query.call(this, _.omit(query, 'workaroundForQueryOne'), options);
        }
        throw new error_1.GenError("Query method not supported");
    };
    SampleResource.prototype.queryOne = function (query, options) {
        if (query === void 0) { query = {}; }
        return _super.prototype.queryOne.call(this, __assign({}, query, { workaroundForQueryOne: true }), options);
    };
    SampleResource.prototype.queryUnannotated = function (query, options) {
        if (query === void 0) { query = {}; }
        return _super.prototype.query.call(this, __assign({}, query, { descriptor_completed: false }), options);
    };
    SampleResource.prototype.queryAnnotated = function (query, options) {
        if (query === void 0) { query = {}; }
        return _super.prototype.query.call(this, __assign({}, query, { descriptor_completed: true }), options);
    };
    /**
     * Adds sample to collections.
     *
     * @param sampleId Sample id
     * @param collectionIds Array of collection ids
     * @returns {Rx.Observable<void>}
     */
    SampleResource.prototype.addToCollections = function (sampleId, collectionIds) {
        return this.callMethod(sampleId, 'add_to_collection', { ids: collectionIds });
    };
    SampleResource.prototype.create = function (data) {
        throw new error_1.GenError("Create method not supported");
    };
    SampleResource.prototype.replace = function (primaryKey, data) {
        throw new error_1.GenError("Replace method not supported");
    };
    SampleResource.prototype.getPermissions = function (id) {
        return permissions_1.getPermissions(this, id);
    };
    SampleResource.prototype.setPermissions = function (id, permissions) {
        return permissions_1.setPermissions(this, id, permissions);
    };
    return SampleResource;
}(rest_resource_1.RESTResource));
exports.SampleResource = SampleResource;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL3Jlc3Qvc2FtcGxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMEJBQTRCO0FBQzVCLGlEQUE2QztBQUc3QyxvREFBb0Q7QUFDcEQscURBQXFGO0FBR3JGOztHQUVHO0FBQ0g7SUFBb0Msa0NBQTRDO0lBRTVFLHdCQUFZLFVBQXNCO2VBQzlCLGtCQUFNLFFBQVEsRUFBRSxVQUFVLENBQUM7SUFDL0IsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ksbUNBQVUsR0FBakIsVUFBa0IsSUFBWTtRQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQVUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDL0YsQ0FBQztJQUVEOztPQUVHO0lBQ0ksOEJBQUssR0FBWixVQUFhLEtBQWtCLEVBQUUsT0FBc0I7UUFDbkQsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxpQkFBTSxLQUFLLFlBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsdUJBQXVCLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN4RSxDQUFDO1FBQ0QsTUFBTSxJQUFJLGdCQUFRLENBQUMsNEJBQTRCLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBTU0saUNBQVEsR0FBZixVQUFnQixLQUF1QixFQUFFLE9BQXNCO1FBQS9DLHNCQUFBLEVBQUEsVUFBdUI7UUFDbkMsTUFBTSxDQUFDLGlCQUFNLFFBQVEseUJBQUssS0FBSyxJQUFFLHFCQUFxQixFQUFFLElBQUksS0FBRyxPQUFPLENBQUMsQ0FBQztJQUM1RSxDQUFDO0lBTU0seUNBQWdCLEdBQXZCLFVBQXdCLEtBQXVCLEVBQUUsT0FBc0I7UUFBL0Msc0JBQUEsRUFBQSxVQUF1QjtRQUMzQyxNQUFNLENBQUMsaUJBQU0sS0FBSyx5QkFBSyxLQUFLLElBQUUsb0JBQW9CLEVBQUUsS0FBSyxLQUFHLE9BQU8sQ0FBQyxDQUFDO0lBQ3pFLENBQUM7SUFNTSx1Q0FBYyxHQUFyQixVQUFzQixLQUF1QixFQUFFLE9BQXNCO1FBQS9DLHNCQUFBLEVBQUEsVUFBdUI7UUFDekMsTUFBTSxDQUFDLGlCQUFNLEtBQUsseUJBQUssS0FBSyxJQUFFLG9CQUFvQixFQUFFLElBQUksS0FBRyxPQUFPLENBQUMsQ0FBQztJQUN4RSxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0kseUNBQWdCLEdBQXZCLFVBQXdCLFFBQWdCLEVBQUUsYUFBdUI7UUFDN0QsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQU8sUUFBUSxFQUFFLG1CQUFtQixFQUFFLEVBQUUsR0FBRyxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUM7SUFDeEYsQ0FBQztJQUVNLCtCQUFNLEdBQWIsVUFBYyxJQUFZO1FBQ3RCLE1BQU0sSUFBSSxnQkFBUSxDQUFDLDZCQUE2QixDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUVNLGdDQUFPLEdBQWQsVUFBZSxVQUEyQixFQUFFLElBQVk7UUFDcEQsTUFBTSxJQUFJLGdCQUFRLENBQUMsOEJBQThCLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBRU0sdUNBQWMsR0FBckIsVUFBc0IsRUFBVTtRQUM1QixNQUFNLENBQUMsNEJBQWMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVNLHVDQUFjLEdBQXJCLFVBQXNCLEVBQVUsRUFBRSxXQUF3QztRQUN0RSxNQUFNLENBQUMsNEJBQWMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFDTCxxQkFBQztBQUFELENBNUVBLEFBNEVDLENBNUVtQyw0QkFBWSxHQTRFL0M7QUE1RVksd0NBQWMiLCJmaWxlIjoiYXBpL3Jlc291cmNlcy9yZXN0L3NhbXBsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJ4IGZyb20gJ3J4JztcbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7UkVTVFJlc291cmNlfSBmcm9tICcuL3Jlc3RfcmVzb3VyY2UnO1xuaW1wb3J0IHtRdWVyeU9wdGlvbnN9IGZyb20gJy4uLy4uL3Jlc291cmNlJztcbmltcG9ydCB7Q29ubmVjdGlvbn0gZnJvbSAnLi4vLi4vY29ubmVjdGlvbic7XG5pbXBvcnQge0dlbkVycm9yfSBmcm9tICcuLi8uLi8uLi9jb3JlL2Vycm9ycy9lcnJvcic7XG5pbXBvcnQge1Blcm1pc3Npb25hYmxlLCBnZXRQZXJtaXNzaW9ucywgc2V0UGVybWlzc2lvbnN9IGZyb20gJy4uL2FkZG9ucy9wZXJtaXNzaW9ucyc7XG5pbXBvcnQgKiBhcyB0eXBlcyBmcm9tICcuLi8uLi90eXBlcy9yZXN0JztcblxuLyoqXG4gKiBTYW1wbGUgcmVzb3VyY2UgY2xhc3MgZm9yIGRlYWxpbmcgd2l0aCBzYW1wbGUgZW5kcG9pbnQuXG4gKi9cbmV4cG9ydCBjbGFzcyBTYW1wbGVSZXNvdXJjZSBleHRlbmRzIFJFU1RSZXNvdXJjZTx0eXBlcy5TYW1wbGUgfCB0eXBlcy5QcmVzYW1wbGU+IGltcGxlbWVudHMgUGVybWlzc2lvbmFibGUge1xuXG4gICAgY29uc3RydWN0b3IoY29ubmVjdGlvbjogQ29ubmVjdGlvbikge1xuICAgICAgICBzdXBlcignc2FtcGxlJywgY29ubmVjdGlvbik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIHNhbXBsZSBzbHVnIGFscmVhZHkgZXhpc3RzLlxuICAgICAqXG4gICAgICogQHBhcmFtIFNsdWcgdG8gY2hlY2tcbiAgICAgKiBAcmV0dXJuIEFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB0aGUgcmVzcG9uc2VcbiAgICAgKi9cbiAgICBwdWJsaWMgc2x1Z0V4aXN0cyhzbHVnOiBzdHJpbmcpOiBSeC5PYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29ubmVjdGlvbi5nZXQ8Ym9vbGVhbj4odGhpcy5nZXRMaXN0TWV0aG9kUGF0aCgnc2x1Z19leGlzdHMnKSwgeyBuYW1lOiBzbHVnIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgcXVlcnkocXVlcnk6IHR5cGVzLlF1ZXJ5LCBvcHRpb25zPzogUXVlcnlPcHRpb25zKTogUnguT2JzZXJ2YWJsZTxhbnk+IHtcbiAgICAgICAgaWYgKHF1ZXJ5Wyd3b3JrYXJvdW5kRm9yUXVlcnlPbmUnXSkge1xuICAgICAgICAgICAgcmV0dXJuIHN1cGVyLnF1ZXJ5KF8ub21pdChxdWVyeSwgJ3dvcmthcm91bmRGb3JRdWVyeU9uZScpLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgR2VuRXJyb3IoXCJRdWVyeSBtZXRob2Qgbm90IHN1cHBvcnRlZFwiKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcXVlcnlPbmUocXVlcnk/OiB0eXBlcy5RdWVyeU9iamVjdCwgb3B0aW9ucz86IFF1ZXJ5T3B0aW9ucyk6XG4gICAgICAgIFJ4Lk9ic2VydmFibGU8dHlwZXMuU2FtcGxlIHwgdHlwZXMuUHJlc2FtcGxlPjtcbiAgICBwdWJsaWMgcXVlcnlPbmUocXVlcnk6IHR5cGVzLlF1ZXJ5T2JqZWN0SHlkcmF0ZURhdGEsIG9wdGlvbnM/OiBRdWVyeU9wdGlvbnMpOlxuICAgICAgICBSeC5PYnNlcnZhYmxlPHR5cGVzLlNhbXBsZUh5ZHJhdGVEYXRhIHwgdHlwZXMuUHJlc2FtcGxlSHlkcmF0ZURhdGE+O1xuICAgIHB1YmxpYyBxdWVyeU9uZShxdWVyeTogdHlwZXMuUXVlcnkgPSB7fSwgb3B0aW9ucz86IFF1ZXJ5T3B0aW9ucyk6IFJ4Lk9ic2VydmFibGU8YW55PiB7XG4gICAgICAgIHJldHVybiBzdXBlci5xdWVyeU9uZSh7Li4ucXVlcnksIHdvcmthcm91bmRGb3JRdWVyeU9uZTogdHJ1ZX0sIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIHB1YmxpYyBxdWVyeVVuYW5ub3RhdGVkKHF1ZXJ5PzogdHlwZXMuUXVlcnlPYmplY3QsIG9wdGlvbnM/OiBRdWVyeU9wdGlvbnMpOlxuICAgICAgICBSeC5PYnNlcnZhYmxlPHR5cGVzLlByZXNhbXBsZVtdPjtcbiAgICBwdWJsaWMgcXVlcnlVbmFubm90YXRlZChxdWVyeTogdHlwZXMuUXVlcnlPYmplY3RIeWRyYXRlRGF0YSwgb3B0aW9ucz86IFF1ZXJ5T3B0aW9ucyk6XG4gICAgICAgIFJ4Lk9ic2VydmFibGU8dHlwZXMuUHJlc2FtcGxlSHlkcmF0ZURhdGFbXT47XG4gICAgcHVibGljIHF1ZXJ5VW5hbm5vdGF0ZWQocXVlcnk6IHR5cGVzLlF1ZXJ5ID0ge30sIG9wdGlvbnM/OiBRdWVyeU9wdGlvbnMpOiBSeC5PYnNlcnZhYmxlPGFueT4ge1xuICAgICAgICByZXR1cm4gc3VwZXIucXVlcnkoey4uLnF1ZXJ5LCBkZXNjcmlwdG9yX2NvbXBsZXRlZDogZmFsc2V9LCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcXVlcnlBbm5vdGF0ZWQocXVlcnk/OiB0eXBlcy5RdWVyeU9iamVjdCwgb3B0aW9ucz86IFF1ZXJ5T3B0aW9ucyk6XG4gICAgICAgIFJ4Lk9ic2VydmFibGU8dHlwZXMuU2FtcGxlW10+O1xuICAgIHB1YmxpYyBxdWVyeUFubm90YXRlZChxdWVyeTogdHlwZXMuUXVlcnlPYmplY3RIeWRyYXRlRGF0YSwgb3B0aW9ucz86IFF1ZXJ5T3B0aW9ucyk6XG4gICAgICAgIFJ4Lk9ic2VydmFibGU8dHlwZXMuU2FtcGxlSHlkcmF0ZURhdGFbXT47XG4gICAgcHVibGljIHF1ZXJ5QW5ub3RhdGVkKHF1ZXJ5OiB0eXBlcy5RdWVyeSA9IHt9LCBvcHRpb25zPzogUXVlcnlPcHRpb25zKTogUnguT2JzZXJ2YWJsZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIHN1cGVyLnF1ZXJ5KHsuLi5xdWVyeSwgZGVzY3JpcHRvcl9jb21wbGV0ZWQ6IHRydWV9LCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIHNhbXBsZSB0byBjb2xsZWN0aW9ucy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzYW1wbGVJZCBTYW1wbGUgaWRcbiAgICAgKiBAcGFyYW0gY29sbGVjdGlvbklkcyBBcnJheSBvZiBjb2xsZWN0aW9uIGlkc1xuICAgICAqIEByZXR1cm5zIHtSeC5PYnNlcnZhYmxlPHZvaWQ+fVxuICAgICAqL1xuICAgIHB1YmxpYyBhZGRUb0NvbGxlY3Rpb25zKHNhbXBsZUlkOiBudW1iZXIsIGNvbGxlY3Rpb25JZHM6IG51bWJlcltdKTogUnguT2JzZXJ2YWJsZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2Q8dm9pZD4oc2FtcGxlSWQsICdhZGRfdG9fY29sbGVjdGlvbicsIHsgaWRzOiBjb2xsZWN0aW9uSWRzIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBjcmVhdGUoZGF0YTogT2JqZWN0KTogUnguT2JzZXJ2YWJsZTxhbnk+IHtcbiAgICAgICAgdGhyb3cgbmV3IEdlbkVycm9yKFwiQ3JlYXRlIG1ldGhvZCBub3Qgc3VwcG9ydGVkXCIpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZXBsYWNlKHByaW1hcnlLZXk6IG51bWJlciB8IHN0cmluZywgZGF0YTogT2JqZWN0KTogUnguT2JzZXJ2YWJsZTxhbnk+IHtcbiAgICAgICAgdGhyb3cgbmV3IEdlbkVycm9yKFwiUmVwbGFjZSBtZXRob2Qgbm90IHN1cHBvcnRlZFwiKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0UGVybWlzc2lvbnMoaWQ6IG51bWJlcik6IFJ4Lk9ic2VydmFibGU8dHlwZXMuSXRlbVBlcm1pc3Npb25zW10+IHtcbiAgICAgICAgcmV0dXJuIGdldFBlcm1pc3Npb25zKHRoaXMsIGlkKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0UGVybWlzc2lvbnMoaWQ6IG51bWJlciwgcGVybWlzc2lvbnM6IHR5cGVzLlNldFBlcm1pc3Npb25zUmVxdWVzdCk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuSXRlbVBlcm1pc3Npb25zW10+IHtcbiAgICAgICAgcmV0dXJuIHNldFBlcm1pc3Npb25zKHRoaXMsIGlkLCBwZXJtaXNzaW9ucyk7XG4gICAgfVxufVxuIl19
