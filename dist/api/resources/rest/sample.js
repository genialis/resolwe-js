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
    SampleResource.prototype.query = function (query) {
        if (query['workaroundForQueryOne']) {
            return _super.prototype.query.call(this, _.omit(query, 'workaroundForQueryOne'));
        }
        throw new error_1.GenError("Query method not supported");
    };
    SampleResource.prototype.queryOne = function (query) {
        if (query === void 0) { query = {}; }
        return _super.prototype.queryOne.call(this, __assign({}, query, { workaroundForQueryOne: true }));
    };
    SampleResource.prototype.queryUnannotated = function (query) {
        if (query === void 0) { query = {}; }
        return _super.prototype.query.call(this, __assign({}, query, { descriptor_completed: false }));
    };
    SampleResource.prototype.queryAnnotated = function (query) {
        if (query === void 0) { query = {}; }
        return _super.prototype.query.call(this, __assign({}, query, { descriptor_completed: true }));
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL3Jlc3Qvc2FtcGxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMEJBQTRCO0FBQzVCLGlEQUE2QztBQUU3QyxvREFBb0Q7QUFDcEQscURBQXFGO0FBR3JGOztHQUVHO0FBQ0g7SUFBb0Msa0NBQTRDO0lBRTVFLHdCQUFZLFVBQXNCO2VBQzlCLGtCQUFNLFFBQVEsRUFBRSxVQUFVLENBQUM7SUFDL0IsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ksbUNBQVUsR0FBakIsVUFBa0IsSUFBWTtRQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQVUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDL0YsQ0FBQztJQUVEOztPQUVHO0lBQ0ksOEJBQUssR0FBWixVQUFhLEtBQWtCO1FBQzNCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQyxNQUFNLENBQUMsaUJBQU0sS0FBSyxZQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLHVCQUF1QixDQUFDLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBQ0QsTUFBTSxJQUFJLGdCQUFRLENBQUMsNEJBQTRCLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBSU0saUNBQVEsR0FBZixVQUFnQixLQUF1QjtRQUF2QixzQkFBQSxFQUFBLFVBQXVCO1FBQ25DLE1BQU0sQ0FBQyxpQkFBTSxRQUFRLHlCQUFLLEtBQUssSUFBRSxxQkFBcUIsRUFBRSxJQUFJLElBQUUsQ0FBQztJQUNuRSxDQUFDO0lBSU0seUNBQWdCLEdBQXZCLFVBQXdCLEtBQXVCO1FBQXZCLHNCQUFBLEVBQUEsVUFBdUI7UUFDM0MsTUFBTSxDQUFDLGlCQUFNLEtBQUsseUJBQUssS0FBSyxJQUFFLG9CQUFvQixFQUFFLEtBQUssSUFBRSxDQUFDO0lBQ2hFLENBQUM7SUFJTSx1Q0FBYyxHQUFyQixVQUFzQixLQUF1QjtRQUF2QixzQkFBQSxFQUFBLFVBQXVCO1FBQ3pDLE1BQU0sQ0FBQyxpQkFBTSxLQUFLLHlCQUFLLEtBQUssSUFBRSxvQkFBb0IsRUFBRSxJQUFJLElBQUUsQ0FBQztJQUMvRCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0kseUNBQWdCLEdBQXZCLFVBQXdCLFFBQWdCLEVBQUUsYUFBdUI7UUFDN0QsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQU8sUUFBUSxFQUFFLG1CQUFtQixFQUFFLEVBQUUsR0FBRyxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUM7SUFDeEYsQ0FBQztJQUVNLCtCQUFNLEdBQWIsVUFBYyxJQUFZO1FBQ3RCLE1BQU0sSUFBSSxnQkFBUSxDQUFDLDZCQUE2QixDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUVNLGdDQUFPLEdBQWQsVUFBZSxVQUEyQixFQUFFLElBQVk7UUFDcEQsTUFBTSxJQUFJLGdCQUFRLENBQUMsOEJBQThCLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBRU0sdUNBQWMsR0FBckIsVUFBc0IsRUFBVTtRQUM1QixNQUFNLENBQUMsNEJBQWMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVNLHVDQUFjLEdBQXJCLFVBQXNCLEVBQVUsRUFBRSxXQUF3QztRQUN0RSxNQUFNLENBQUMsNEJBQWMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFDTCxxQkFBQztBQUFELENBdEVBLEFBc0VDLENBdEVtQyw0QkFBWSxHQXNFL0M7QUF0RVksd0NBQWMiLCJmaWxlIjoiYXBpL3Jlc291cmNlcy9yZXN0L3NhbXBsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJ4IGZyb20gJ3J4JztcbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7UkVTVFJlc291cmNlfSBmcm9tICcuL3Jlc3RfcmVzb3VyY2UnO1xuaW1wb3J0IHtDb25uZWN0aW9ufSBmcm9tICcuLi8uLi9jb25uZWN0aW9uJztcbmltcG9ydCB7R2VuRXJyb3J9IGZyb20gJy4uLy4uLy4uL2NvcmUvZXJyb3JzL2Vycm9yJztcbmltcG9ydCB7UGVybWlzc2lvbmFibGUsIGdldFBlcm1pc3Npb25zLCBzZXRQZXJtaXNzaW9uc30gZnJvbSAnLi4vYWRkb25zL3Blcm1pc3Npb25zJztcbmltcG9ydCAqIGFzIHR5cGVzIGZyb20gJy4uLy4uL3R5cGVzL3Jlc3QnO1xuXG4vKipcbiAqIFNhbXBsZSByZXNvdXJjZSBjbGFzcyBmb3IgZGVhbGluZyB3aXRoIHNhbXBsZSBlbmRwb2ludC5cbiAqL1xuZXhwb3J0IGNsYXNzIFNhbXBsZVJlc291cmNlIGV4dGVuZHMgUkVTVFJlc291cmNlPHR5cGVzLlNhbXBsZSB8IHR5cGVzLlByZXNhbXBsZT4gaW1wbGVtZW50cyBQZXJtaXNzaW9uYWJsZSB7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb25uZWN0aW9uOiBDb25uZWN0aW9uKSB7XG4gICAgICAgIHN1cGVyKCdzYW1wbGUnLCBjb25uZWN0aW9uKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgc2FtcGxlIHNsdWcgYWxyZWFkeSBleGlzdHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gU2x1ZyB0byBjaGVja1xuICAgICAqIEByZXR1cm4gQW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHRoZSByZXNwb25zZVxuICAgICAqL1xuICAgIHB1YmxpYyBzbHVnRXhpc3RzKHNsdWc6IHN0cmluZyk6IFJ4Lk9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uLmdldDxib29sZWFuPih0aGlzLmdldExpc3RNZXRob2RQYXRoKCdzbHVnX2V4aXN0cycpLCB7IG5hbWU6IHNsdWcgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuICAgICAqL1xuICAgIHB1YmxpYyBxdWVyeShxdWVyeTogdHlwZXMuUXVlcnkpOiBSeC5PYnNlcnZhYmxlPGFueT4ge1xuICAgICAgICBpZiAocXVlcnlbJ3dvcmthcm91bmRGb3JRdWVyeU9uZSddKSB7XG4gICAgICAgICAgICByZXR1cm4gc3VwZXIucXVlcnkoXy5vbWl0KHF1ZXJ5LCAnd29ya2Fyb3VuZEZvclF1ZXJ5T25lJykpO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihcIlF1ZXJ5IG1ldGhvZCBub3Qgc3VwcG9ydGVkXCIpO1xuICAgIH1cblxuICAgIHB1YmxpYyBxdWVyeU9uZShxdWVyeT86IHR5cGVzLlF1ZXJ5T2JqZWN0KTogUnguT2JzZXJ2YWJsZTx0eXBlcy5TYW1wbGUgfCB0eXBlcy5QcmVzYW1wbGU+O1xuICAgIHB1YmxpYyBxdWVyeU9uZShxdWVyeTogdHlwZXMuUXVlcnlPYmplY3RIeWRyYXRlRGF0YSk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuU2FtcGxlSHlkcmF0ZURhdGEgfCB0eXBlcy5QcmVzYW1wbGVIeWRyYXRlRGF0YT47XG4gICAgcHVibGljIHF1ZXJ5T25lKHF1ZXJ5OiB0eXBlcy5RdWVyeSA9IHt9KTogUnguT2JzZXJ2YWJsZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIHN1cGVyLnF1ZXJ5T25lKHsuLi5xdWVyeSwgd29ya2Fyb3VuZEZvclF1ZXJ5T25lOiB0cnVlfSk7XG4gICAgfVxuXG4gICAgcHVibGljIHF1ZXJ5VW5hbm5vdGF0ZWQocXVlcnk/OiB0eXBlcy5RdWVyeU9iamVjdCk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuUHJlc2FtcGxlW10+O1xuICAgIHB1YmxpYyBxdWVyeVVuYW5ub3RhdGVkKHF1ZXJ5OiB0eXBlcy5RdWVyeU9iamVjdEh5ZHJhdGVEYXRhKTogUnguT2JzZXJ2YWJsZTx0eXBlcy5QcmVzYW1wbGVIeWRyYXRlRGF0YVtdPjtcbiAgICBwdWJsaWMgcXVlcnlVbmFubm90YXRlZChxdWVyeTogdHlwZXMuUXVlcnkgPSB7fSk6IFJ4Lk9ic2VydmFibGU8YW55PiB7XG4gICAgICAgIHJldHVybiBzdXBlci5xdWVyeSh7Li4ucXVlcnksIGRlc2NyaXB0b3JfY29tcGxldGVkOiBmYWxzZX0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBxdWVyeUFubm90YXRlZChxdWVyeT86IHR5cGVzLlF1ZXJ5T2JqZWN0KTogUnguT2JzZXJ2YWJsZTx0eXBlcy5TYW1wbGVbXT47XG4gICAgcHVibGljIHF1ZXJ5QW5ub3RhdGVkKHF1ZXJ5OiB0eXBlcy5RdWVyeU9iamVjdEh5ZHJhdGVEYXRhKTogUnguT2JzZXJ2YWJsZTx0eXBlcy5TYW1wbGVIeWRyYXRlRGF0YVtdPjtcbiAgICBwdWJsaWMgcXVlcnlBbm5vdGF0ZWQocXVlcnk6IHR5cGVzLlF1ZXJ5ID0ge30pOiBSeC5PYnNlcnZhYmxlPGFueT4ge1xuICAgICAgICByZXR1cm4gc3VwZXIucXVlcnkoey4uLnF1ZXJ5LCBkZXNjcmlwdG9yX2NvbXBsZXRlZDogdHJ1ZX0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgc2FtcGxlIHRvIGNvbGxlY3Rpb25zLlxuICAgICAqXG4gICAgICogQHBhcmFtIHNhbXBsZUlkIFNhbXBsZSBpZFxuICAgICAqIEBwYXJhbSBjb2xsZWN0aW9uSWRzIEFycmF5IG9mIGNvbGxlY3Rpb24gaWRzXG4gICAgICogQHJldHVybnMge1J4Lk9ic2VydmFibGU8dm9pZD59XG4gICAgICovXG4gICAgcHVibGljIGFkZFRvQ29sbGVjdGlvbnMoc2FtcGxlSWQ6IG51bWJlciwgY29sbGVjdGlvbklkczogbnVtYmVyW10pOiBSeC5PYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZDx2b2lkPihzYW1wbGVJZCwgJ2FkZF90b19jb2xsZWN0aW9uJywgeyBpZHM6IGNvbGxlY3Rpb25JZHMgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGNyZWF0ZShkYXRhOiBPYmplY3QpOiBSeC5PYnNlcnZhYmxlPGFueT4ge1xuICAgICAgICB0aHJvdyBuZXcgR2VuRXJyb3IoXCJDcmVhdGUgbWV0aG9kIG5vdCBzdXBwb3J0ZWRcIik7XG4gICAgfVxuXG4gICAgcHVibGljIHJlcGxhY2UocHJpbWFyeUtleTogbnVtYmVyIHwgc3RyaW5nLCBkYXRhOiBPYmplY3QpOiBSeC5PYnNlcnZhYmxlPGFueT4ge1xuICAgICAgICB0aHJvdyBuZXcgR2VuRXJyb3IoXCJSZXBsYWNlIG1ldGhvZCBub3Qgc3VwcG9ydGVkXCIpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRQZXJtaXNzaW9ucyhpZDogbnVtYmVyKTogUnguT2JzZXJ2YWJsZTx0eXBlcy5JdGVtUGVybWlzc2lvbnNbXT4ge1xuICAgICAgICByZXR1cm4gZ2V0UGVybWlzc2lvbnModGhpcywgaWQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXRQZXJtaXNzaW9ucyhpZDogbnVtYmVyLCBwZXJtaXNzaW9uczogdHlwZXMuU2V0UGVybWlzc2lvbnNSZXF1ZXN0KTogUnguT2JzZXJ2YWJsZTx0eXBlcy5JdGVtUGVybWlzc2lvbnNbXT4ge1xuICAgICAgICByZXR1cm4gc2V0UGVybWlzc2lvbnModGhpcywgaWQsIHBlcm1pc3Npb25zKTtcbiAgICB9XG59XG4iXX0=
