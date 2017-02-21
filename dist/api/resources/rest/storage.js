"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var rest_resource_1 = require("./rest_resource");
/**
 * Storage resource class for dealing with storage endpoint.
 */
var StorageResource = (function (_super) {
    __extends(StorageResource, _super);
    function StorageResource(connection) {
        return _super.call(this, 'storage', connection) || this;
    }
    StorageResource.prototype.getStorageLink = function (primaryKey) {
        return this.connection.createUriFromPath(this.getDetailPath(primaryKey) + "?format=json");
    };
    StorageResource.prototype.query = function (query) {
        if (query === void 0) { query = {}; }
        throw new Error('query method not supported');
    };
    StorageResource.prototype.queryOne = function (query) {
        if (query === void 0) { query = {}; }
        throw new Error('queryOne method not supported');
    };
    StorageResource.prototype.create = function (data) {
        throw new Error('create method not supported');
    };
    StorageResource.prototype.update = function (primaryKey, data) {
        throw new Error('update method not supported');
    };
    StorageResource.prototype.replace = function (primaryKey, data) {
        throw new Error('replace method not supported');
    };
    StorageResource.prototype.delete = function (primaryKey) {
        throw new Error('delete method not supported');
    };
    return StorageResource;
}(rest_resource_1.RESTResource));
exports.StorageResource = StorageResource;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL3Jlc3Qvc3RvcmFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFFQSxpREFBNkM7QUFJN0M7O0dBRUc7QUFDSDtJQUFxQyxtQ0FBMkI7SUFFNUQseUJBQVksVUFBc0I7ZUFDOUIsa0JBQU0sU0FBUyxFQUFFLFVBQVUsQ0FBQztJQUNoQyxDQUFDO0lBRU0sd0NBQWMsR0FBckIsVUFBc0IsVUFBMkI7UUFDN0MsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsaUJBQWlCLENBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsaUJBQWMsQ0FBQyxDQUFDO0lBQzlGLENBQUM7SUFFTSwrQkFBSyxHQUFaLFVBQWEsS0FBdUI7UUFBdkIsc0JBQUEsRUFBQSxVQUF1QjtRQUNoQyxNQUFNLElBQUksS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUM7SUFDbEQsQ0FBQztJQUVNLGtDQUFRLEdBQWYsVUFBZ0IsS0FBdUI7UUFBdkIsc0JBQUEsRUFBQSxVQUF1QjtRQUNuQyxNQUFNLElBQUksS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVNLGdDQUFNLEdBQWIsVUFBYyxJQUFZO1FBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRU0sZ0NBQU0sR0FBYixVQUFjLFVBQTJCLEVBQUUsSUFBWTtRQUNuRCxNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUVNLGlDQUFPLEdBQWQsVUFBZSxVQUEyQixFQUFFLElBQVk7UUFDcEQsTUFBTSxJQUFJLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFTSxnQ0FBTSxHQUFiLFVBQWMsVUFBMkI7UUFDckMsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFDTCxzQkFBQztBQUFELENBakNBLEFBaUNDLENBakNvQyw0QkFBWSxHQWlDaEQ7QUFqQ1ksMENBQWUiLCJmaWxlIjoiYXBpL3Jlc291cmNlcy9yZXN0L3N0b3JhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSeCBmcm9tICdyeCc7XHJcblxyXG5pbXBvcnQge1JFU1RSZXNvdXJjZX0gZnJvbSAnLi9yZXN0X3Jlc291cmNlJztcclxuaW1wb3J0IHtDb25uZWN0aW9ufSBmcm9tICcuLi8uLi9jb25uZWN0aW9uJztcclxuaW1wb3J0ICogYXMgdHlwZXMgZnJvbSAnLi4vLi4vdHlwZXMvcmVzdCc7XHJcblxyXG4vKipcclxuICogU3RvcmFnZSByZXNvdXJjZSBjbGFzcyBmb3IgZGVhbGluZyB3aXRoIHN0b3JhZ2UgZW5kcG9pbnQuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgU3RvcmFnZVJlc291cmNlIGV4dGVuZHMgUkVTVFJlc291cmNlPHR5cGVzLlN0b3JhZ2U+IHtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihjb25uZWN0aW9uOiBDb25uZWN0aW9uKSB7XHJcbiAgICAgICAgc3VwZXIoJ3N0b3JhZ2UnLCBjb25uZWN0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0U3RvcmFnZUxpbmsocHJpbWFyeUtleTogbnVtYmVyIHwgc3RyaW5nKTogc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uLmNyZWF0ZVVyaUZyb21QYXRoKGAke3RoaXMuZ2V0RGV0YWlsUGF0aChwcmltYXJ5S2V5KX0/Zm9ybWF0PWpzb25gKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcXVlcnkocXVlcnk6IHR5cGVzLlF1ZXJ5ID0ge30pOiBSeC5PYnNlcnZhYmxlPHR5cGVzLlN0b3JhZ2VbXT4ge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcigncXVlcnkgbWV0aG9kIG5vdCBzdXBwb3J0ZWQnKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcXVlcnlPbmUocXVlcnk6IHR5cGVzLlF1ZXJ5ID0ge30pOiBSeC5PYnNlcnZhYmxlPHR5cGVzLlN0b3JhZ2U+IHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3F1ZXJ5T25lIG1ldGhvZCBub3Qgc3VwcG9ydGVkJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZShkYXRhOiBPYmplY3QpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLlN0b3JhZ2U+IHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NyZWF0ZSBtZXRob2Qgbm90IHN1cHBvcnRlZCcpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1cGRhdGUocHJpbWFyeUtleTogbnVtYmVyIHwgc3RyaW5nLCBkYXRhOiBPYmplY3QpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLlN0b3JhZ2U+IHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3VwZGF0ZSBtZXRob2Qgbm90IHN1cHBvcnRlZCcpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXBsYWNlKHByaW1hcnlLZXk6IG51bWJlciB8IHN0cmluZywgZGF0YTogT2JqZWN0KTogUnguT2JzZXJ2YWJsZTx0eXBlcy5TdG9yYWdlPiB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdyZXBsYWNlIG1ldGhvZCBub3Qgc3VwcG9ydGVkJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRlbGV0ZShwcmltYXJ5S2V5OiBudW1iZXIgfCBzdHJpbmcpOiBSeC5PYnNlcnZhYmxlPE9iamVjdD4ge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignZGVsZXRlIG1ldGhvZCBub3Qgc3VwcG9ydGVkJyk7XHJcbiAgICB9XHJcbn1cclxuIl19
