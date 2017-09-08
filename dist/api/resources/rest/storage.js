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
/**
 * Storage resource class for dealing with storage endpoint.
 */
var StorageResource = /** @class */ (function (_super) {
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL3Jlc3Qvc3RvcmFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFFQSxpREFBNkM7QUFJN0M7O0dBRUc7QUFDSDtJQUFxQyxtQ0FBMkI7SUFFNUQseUJBQVksVUFBc0I7ZUFDOUIsa0JBQU0sU0FBUyxFQUFFLFVBQVUsQ0FBQztJQUNoQyxDQUFDO0lBRU0sd0NBQWMsR0FBckIsVUFBc0IsVUFBMkI7UUFDN0MsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsaUJBQWlCLENBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsaUJBQWMsQ0FBQyxDQUFDO0lBQzlGLENBQUM7SUFFTSwrQkFBSyxHQUFaLFVBQWEsS0FBdUI7UUFBdkIsc0JBQUEsRUFBQSxVQUF1QjtRQUNoQyxNQUFNLElBQUksS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUM7SUFDbEQsQ0FBQztJQUVNLGtDQUFRLEdBQWYsVUFBZ0IsS0FBdUI7UUFBdkIsc0JBQUEsRUFBQSxVQUF1QjtRQUNuQyxNQUFNLElBQUksS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVNLGdDQUFNLEdBQWIsVUFBYyxJQUFZO1FBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRU0sZ0NBQU0sR0FBYixVQUFjLFVBQTJCLEVBQUUsSUFBWTtRQUNuRCxNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUVNLGlDQUFPLEdBQWQsVUFBZSxVQUEyQixFQUFFLElBQVk7UUFDcEQsTUFBTSxJQUFJLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFTSxnQ0FBTSxHQUFiLFVBQWMsVUFBMkI7UUFDckMsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFDTCxzQkFBQztBQUFELENBakNBLEFBaUNDLENBakNvQyw0QkFBWSxHQWlDaEQ7QUFqQ1ksMENBQWUiLCJmaWxlIjoiYXBpL3Jlc291cmNlcy9yZXN0L3N0b3JhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSeCBmcm9tICdyeCc7XG5cbmltcG9ydCB7UkVTVFJlc291cmNlfSBmcm9tICcuL3Jlc3RfcmVzb3VyY2UnO1xuaW1wb3J0IHtDb25uZWN0aW9ufSBmcm9tICcuLi8uLi9jb25uZWN0aW9uJztcbmltcG9ydCAqIGFzIHR5cGVzIGZyb20gJy4uLy4uL3R5cGVzL3Jlc3QnO1xuXG4vKipcbiAqIFN0b3JhZ2UgcmVzb3VyY2UgY2xhc3MgZm9yIGRlYWxpbmcgd2l0aCBzdG9yYWdlIGVuZHBvaW50LlxuICovXG5leHBvcnQgY2xhc3MgU3RvcmFnZVJlc291cmNlIGV4dGVuZHMgUkVTVFJlc291cmNlPHR5cGVzLlN0b3JhZ2U+IHtcblxuICAgIGNvbnN0cnVjdG9yKGNvbm5lY3Rpb246IENvbm5lY3Rpb24pIHtcbiAgICAgICAgc3VwZXIoJ3N0b3JhZ2UnLCBjb25uZWN0aW9uKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0U3RvcmFnZUxpbmsocHJpbWFyeUtleTogbnVtYmVyIHwgc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29ubmVjdGlvbi5jcmVhdGVVcmlGcm9tUGF0aChgJHt0aGlzLmdldERldGFpbFBhdGgocHJpbWFyeUtleSl9P2Zvcm1hdD1qc29uYCk7XG4gICAgfVxuXG4gICAgcHVibGljIHF1ZXJ5KHF1ZXJ5OiB0eXBlcy5RdWVyeSA9IHt9KTogUnguT2JzZXJ2YWJsZTx0eXBlcy5TdG9yYWdlW10+IHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdxdWVyeSBtZXRob2Qgbm90IHN1cHBvcnRlZCcpO1xuICAgIH1cblxuICAgIHB1YmxpYyBxdWVyeU9uZShxdWVyeTogdHlwZXMuUXVlcnkgPSB7fSk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuU3RvcmFnZT4ge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3F1ZXJ5T25lIG1ldGhvZCBub3Qgc3VwcG9ydGVkJyk7XG4gICAgfVxuXG4gICAgcHVibGljIGNyZWF0ZShkYXRhOiBPYmplY3QpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLlN0b3JhZ2U+IHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjcmVhdGUgbWV0aG9kIG5vdCBzdXBwb3J0ZWQnKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlKHByaW1hcnlLZXk6IG51bWJlciB8IHN0cmluZywgZGF0YTogT2JqZWN0KTogUnguT2JzZXJ2YWJsZTx0eXBlcy5TdG9yYWdlPiB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcigndXBkYXRlIG1ldGhvZCBub3Qgc3VwcG9ydGVkJyk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlcGxhY2UocHJpbWFyeUtleTogbnVtYmVyIHwgc3RyaW5nLCBkYXRhOiBPYmplY3QpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLlN0b3JhZ2U+IHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdyZXBsYWNlIG1ldGhvZCBub3Qgc3VwcG9ydGVkJyk7XG4gICAgfVxuXG4gICAgcHVibGljIGRlbGV0ZShwcmltYXJ5S2V5OiBudW1iZXIgfCBzdHJpbmcpOiBSeC5PYnNlcnZhYmxlPE9iamVjdD4ge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2RlbGV0ZSBtZXRob2Qgbm90IHN1cHBvcnRlZCcpO1xuICAgIH1cbn1cbiJdfQ==
