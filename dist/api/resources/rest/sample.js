"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
    SampleResource.prototype.query = function (query) {
        if (query === void 0) { query = {}; }
        return _super.prototype.query.call(this, query);
    };
    SampleResource.prototype.queryOne = function (query) {
        if (query === void 0) { query = {}; }
        return _super.prototype.queryOne.call(this, query);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL3Jlc3Qvc2FtcGxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUNBLGlEQUE2QztBQUU3QyxvREFBb0Q7QUFDcEQscURBQXFGO0FBR3JGOztHQUVHO0FBQ0g7SUFBb0Msa0NBQTBCO0lBRTFELHdCQUFZLFVBQXNCO2VBQzlCLGtCQUFNLFFBQVEsRUFBRSxVQUFVLENBQUM7SUFDL0IsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ksbUNBQVUsR0FBakIsVUFBa0IsSUFBWTtRQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQVUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDL0YsQ0FBQztJQUlNLDhCQUFLLEdBQVosVUFBYSxLQUF1QjtRQUF2QixzQkFBQSxFQUFBLFVBQXVCO1FBQ2hDLE1BQU0sQ0FBQyxpQkFBTSxLQUFLLFlBQUMsS0FBSyxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUlNLGlDQUFRLEdBQWYsVUFBZ0IsS0FBdUI7UUFBdkIsc0JBQUEsRUFBQSxVQUF1QjtRQUNuQyxNQUFNLENBQUMsaUJBQU0sUUFBUSxZQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSSx5Q0FBZ0IsR0FBdkIsVUFBd0IsUUFBZ0IsRUFBRSxhQUF1QjtRQUM3RCxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBTyxRQUFRLEVBQUUsbUJBQW1CLEVBQUUsRUFBRSxHQUFHLEVBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQztJQUN4RixDQUFDO0lBRU0sK0JBQU0sR0FBYixVQUFjLElBQVk7UUFDdEIsTUFBTSxJQUFJLGdCQUFRLENBQUMsNkJBQTZCLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRU0sZ0NBQU8sR0FBZCxVQUFlLFVBQTJCLEVBQUUsSUFBWTtRQUNwRCxNQUFNLElBQUksZ0JBQVEsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFTSx1Q0FBYyxHQUFyQixVQUFzQixFQUFVO1FBQzVCLE1BQU0sQ0FBQyw0QkFBYyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRU0sdUNBQWMsR0FBckIsVUFBc0IsRUFBVSxFQUFFLFdBQXdDO1FBQ3RFLE1BQU0sQ0FBQyw0QkFBYyxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUNMLHFCQUFDO0FBQUQsQ0F0REEsQUFzREMsQ0F0RG1DLDRCQUFZLEdBc0QvQztBQXREWSx3Q0FBYyIsImZpbGUiOiJhcGkvcmVzb3VyY2VzL3Jlc3Qvc2FtcGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUnggZnJvbSAncngnO1xuaW1wb3J0IHtSRVNUUmVzb3VyY2V9IGZyb20gJy4vcmVzdF9yZXNvdXJjZSc7XG5pbXBvcnQge0Nvbm5lY3Rpb259IGZyb20gJy4uLy4uL2Nvbm5lY3Rpb24nO1xuaW1wb3J0IHtHZW5FcnJvcn0gZnJvbSAnLi4vLi4vLi4vY29yZS9lcnJvcnMvZXJyb3InO1xuaW1wb3J0IHtQZXJtaXNzaW9uYWJsZSwgZ2V0UGVybWlzc2lvbnMsIHNldFBlcm1pc3Npb25zfSBmcm9tICcuLi9hZGRvbnMvcGVybWlzc2lvbnMnO1xuaW1wb3J0ICogYXMgdHlwZXMgZnJvbSAnLi4vLi4vdHlwZXMvcmVzdCc7XG5cbi8qKlxuICogU2FtcGxlIHJlc291cmNlIGNsYXNzIGZvciBkZWFsaW5nIHdpdGggc2FtcGxlIGVuZHBvaW50LlxuICovXG5leHBvcnQgY2xhc3MgU2FtcGxlUmVzb3VyY2UgZXh0ZW5kcyBSRVNUUmVzb3VyY2U8dHlwZXMuU2FtcGxlPiBpbXBsZW1lbnRzIFBlcm1pc3Npb25hYmxlIHtcblxuICAgIGNvbnN0cnVjdG9yKGNvbm5lY3Rpb246IENvbm5lY3Rpb24pIHtcbiAgICAgICAgc3VwZXIoJ3NhbXBsZScsIGNvbm5lY3Rpb24pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBzYW1wbGUgc2x1ZyBhbHJlYWR5IGV4aXN0cy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBTbHVnIHRvIGNoZWNrXG4gICAgICogQHJldHVybiBBbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgdGhlIHJlc3BvbnNlXG4gICAgICovXG4gICAgcHVibGljIHNsdWdFeGlzdHMoc2x1Zzogc3RyaW5nKTogUnguT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbm5lY3Rpb24uZ2V0PGJvb2xlYW4+KHRoaXMuZ2V0TGlzdE1ldGhvZFBhdGgoJ3NsdWdfZXhpc3RzJyksIHsgbmFtZTogc2x1ZyB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcXVlcnkocXVlcnk/OiB0eXBlcy5RdWVyeU9iamVjdCk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuU2FtcGxlW10+O1xuICAgIHB1YmxpYyBxdWVyeShxdWVyeTogdHlwZXMuUXVlcnlPYmplY3RIeWRyYXRlRGF0YSk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuU2FtcGxlSHlkcmF0ZURhdGFbXT47XG4gICAgcHVibGljIHF1ZXJ5KHF1ZXJ5OiB0eXBlcy5RdWVyeSA9IHt9KTogUnguT2JzZXJ2YWJsZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIHN1cGVyLnF1ZXJ5KHF1ZXJ5KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcXVlcnlPbmUocXVlcnk/OiB0eXBlcy5RdWVyeU9iamVjdCk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuU2FtcGxlPjtcbiAgICBwdWJsaWMgcXVlcnlPbmUocXVlcnk6IHR5cGVzLlF1ZXJ5T2JqZWN0SHlkcmF0ZURhdGEpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLlNhbXBsZUh5ZHJhdGVEYXRhPjtcbiAgICBwdWJsaWMgcXVlcnlPbmUocXVlcnk6IHR5cGVzLlF1ZXJ5ID0ge30pOiBSeC5PYnNlcnZhYmxlPGFueT4ge1xuICAgICAgICByZXR1cm4gc3VwZXIucXVlcnlPbmUocXVlcnkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgc2FtcGxlIHRvIGNvbGxlY3Rpb25zLlxuICAgICAqXG4gICAgICogQHBhcmFtIHNhbXBsZUlkIFNhbXBsZSBpZFxuICAgICAqIEBwYXJhbSBjb2xsZWN0aW9uSWRzIEFycmF5IG9mIGNvbGxlY3Rpb24gaWRzXG4gICAgICogQHJldHVybnMge1J4Lk9ic2VydmFibGU8dm9pZD59XG4gICAgICovXG4gICAgcHVibGljIGFkZFRvQ29sbGVjdGlvbnMoc2FtcGxlSWQ6IG51bWJlciwgY29sbGVjdGlvbklkczogbnVtYmVyW10pOiBSeC5PYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZDx2b2lkPihzYW1wbGVJZCwgJ2FkZF90b19jb2xsZWN0aW9uJywgeyBpZHM6IGNvbGxlY3Rpb25JZHMgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGNyZWF0ZShkYXRhOiBPYmplY3QpOiBSeC5PYnNlcnZhYmxlPGFueT4ge1xuICAgICAgICB0aHJvdyBuZXcgR2VuRXJyb3IoXCJDcmVhdGUgbWV0aG9kIG5vdCBzdXBwb3J0ZWRcIik7XG4gICAgfVxuXG4gICAgcHVibGljIHJlcGxhY2UocHJpbWFyeUtleTogbnVtYmVyIHwgc3RyaW5nLCBkYXRhOiBPYmplY3QpOiBSeC5PYnNlcnZhYmxlPGFueT4ge1xuICAgICAgICB0aHJvdyBuZXcgR2VuRXJyb3IoXCJSZXBsYWNlIG1ldGhvZCBub3Qgc3VwcG9ydGVkXCIpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRQZXJtaXNzaW9ucyhpZDogbnVtYmVyKTogUnguT2JzZXJ2YWJsZTx0eXBlcy5JdGVtUGVybWlzc2lvbnNbXT4ge1xuICAgICAgICByZXR1cm4gZ2V0UGVybWlzc2lvbnModGhpcywgaWQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXRQZXJtaXNzaW9ucyhpZDogbnVtYmVyLCBwZXJtaXNzaW9uczogdHlwZXMuU2V0UGVybWlzc2lvbnNSZXF1ZXN0KTogUnguT2JzZXJ2YWJsZTx0eXBlcy5JdGVtUGVybWlzc2lvbnNbXT4ge1xuICAgICAgICByZXR1cm4gc2V0UGVybWlzc2lvbnModGhpcywgaWQsIHBlcm1pc3Npb25zKTtcbiAgICB9XG59XG4iXX0=
