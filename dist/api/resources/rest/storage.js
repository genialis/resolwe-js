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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL3Jlc3Qvc3RvcmFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxpREFBNkM7QUFJN0M7O0dBRUc7QUFDSDtJQUFxQyxtQ0FBMkI7SUFFNUQseUJBQVksVUFBc0I7ZUFDOUIsa0JBQU0sU0FBUyxFQUFFLFVBQVUsQ0FBQztJQUNoQyxDQUFDO0lBRU0sd0NBQWMsR0FBckIsVUFBc0IsVUFBMkI7UUFDN0MsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsaUJBQWlCLENBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsaUJBQWMsQ0FBQyxDQUFDO0lBQzlGLENBQUM7SUFFTSwrQkFBSyxHQUFaLFVBQWEsS0FBdUI7UUFBdkIsc0JBQUEsRUFBQSxVQUF1QjtRQUNoQyxNQUFNLElBQUksS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUM7SUFDbEQsQ0FBQztJQUVNLGtDQUFRLEdBQWYsVUFBZ0IsS0FBdUI7UUFBdkIsc0JBQUEsRUFBQSxVQUF1QjtRQUNuQyxNQUFNLElBQUksS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVNLGdDQUFNLEdBQWIsVUFBYyxJQUFZO1FBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRU0sZ0NBQU0sR0FBYixVQUFjLFVBQTJCLEVBQUUsSUFBWTtRQUNuRCxNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUVNLGlDQUFPLEdBQWQsVUFBZSxVQUEyQixFQUFFLElBQVk7UUFDcEQsTUFBTSxJQUFJLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFTSxnQ0FBTSxHQUFiLFVBQWMsVUFBMkI7UUFDckMsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFDTCxzQkFBQztBQUFELENBakNBLEFBaUNDLENBakNvQyw0QkFBWSxHQWlDaEQ7QUFqQ1ksMENBQWUiLCJmaWxlIjoiYXBpL3Jlc291cmNlcy9yZXN0L3N0b3JhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1JFU1RSZXNvdXJjZX0gZnJvbSAnLi9yZXN0X3Jlc291cmNlJztcbmltcG9ydCB7Q29ubmVjdGlvbn0gZnJvbSAnLi4vLi4vY29ubmVjdGlvbic7XG5pbXBvcnQgKiBhcyB0eXBlcyBmcm9tICcuLi8uLi90eXBlcy9yZXN0JztcblxuLyoqXG4gKiBTdG9yYWdlIHJlc291cmNlIGNsYXNzIGZvciBkZWFsaW5nIHdpdGggc3RvcmFnZSBlbmRwb2ludC5cbiAqL1xuZXhwb3J0IGNsYXNzIFN0b3JhZ2VSZXNvdXJjZSBleHRlbmRzIFJFU1RSZXNvdXJjZTx0eXBlcy5TdG9yYWdlPiB7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb25uZWN0aW9uOiBDb25uZWN0aW9uKSB7XG4gICAgICAgIHN1cGVyKCdzdG9yYWdlJywgY29ubmVjdGlvbik7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFN0b3JhZ2VMaW5rKHByaW1hcnlLZXk6IG51bWJlciB8IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbm5lY3Rpb24uY3JlYXRlVXJpRnJvbVBhdGgoYCR7dGhpcy5nZXREZXRhaWxQYXRoKHByaW1hcnlLZXkpfT9mb3JtYXQ9anNvbmApO1xuICAgIH1cblxuICAgIHB1YmxpYyBxdWVyeShxdWVyeTogdHlwZXMuUXVlcnkgPSB7fSk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuU3RvcmFnZVtdPiB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcigncXVlcnkgbWV0aG9kIG5vdCBzdXBwb3J0ZWQnKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcXVlcnlPbmUocXVlcnk6IHR5cGVzLlF1ZXJ5ID0ge30pOiBSeC5PYnNlcnZhYmxlPHR5cGVzLlN0b3JhZ2U+IHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdxdWVyeU9uZSBtZXRob2Qgbm90IHN1cHBvcnRlZCcpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjcmVhdGUoZGF0YTogT2JqZWN0KTogUnguT2JzZXJ2YWJsZTx0eXBlcy5TdG9yYWdlPiB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY3JlYXRlIG1ldGhvZCBub3Qgc3VwcG9ydGVkJyk7XG4gICAgfVxuXG4gICAgcHVibGljIHVwZGF0ZShwcmltYXJ5S2V5OiBudW1iZXIgfCBzdHJpbmcsIGRhdGE6IE9iamVjdCk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuU3RvcmFnZT4ge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3VwZGF0ZSBtZXRob2Qgbm90IHN1cHBvcnRlZCcpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZXBsYWNlKHByaW1hcnlLZXk6IG51bWJlciB8IHN0cmluZywgZGF0YTogT2JqZWN0KTogUnguT2JzZXJ2YWJsZTx0eXBlcy5TdG9yYWdlPiB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcigncmVwbGFjZSBtZXRob2Qgbm90IHN1cHBvcnRlZCcpO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZWxldGUocHJpbWFyeUtleTogbnVtYmVyIHwgc3RyaW5nKTogUnguT2JzZXJ2YWJsZTxPYmplY3Q+IHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdkZWxldGUgbWV0aG9kIG5vdCBzdXBwb3J0ZWQnKTtcbiAgICB9XG59XG4iXX0=
