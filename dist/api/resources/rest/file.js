"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var rest_resource_1 = require("./rest_resource");
var error_1 = require("../../../core/errors/error");
var FileResource = (function (_super) {
    __extends(FileResource, _super);
    function FileResource(connection) {
        return _super.call(this, 'file', connection) || this;
    }
    /**
     * Downloads the file from server (it also decompresses gzipped files).
     *
     * @param {string} filename
     * @return {Rx.Observable<{ data: string }>}
     */
    FileResource.prototype.download = function (id, filename) {
        return this.connection.get(this.getUngzippedUrl(id, filename))
            .map(function (data) {
            return {
                data: data,
            };
        });
    };
    FileResource.prototype._getFileUrl = function (id, filename) {
        return '/data/' + id + '/' + filename;
    };
    FileResource.prototype.getForcedDownloadUrl = function (id, filename) {
        return this._getFileUrl(id, filename) + '?' + jQuery.param({ force_download: 1 });
    };
    FileResource.prototype.getViewUrl = function (id, filename) {
        return this._getFileUrl(id, filename);
    };
    FileResource.prototype.getUngzippedUrl = function (id, filename) {
        return this._getFileUrl(id, filename) + '?' + jQuery.param({ gzip_header: 1 });
    };
    FileResource.prototype.create = function (data) {
        throw new error_1.GenError("Create method not supported");
    };
    FileResource.prototype.update = function (primaryKey, data) {
        throw new error_1.GenError("Update method not supported");
    };
    FileResource.prototype.replace = function (primaryKey, data) {
        throw new error_1.GenError("Replace method not supported");
    };
    FileResource.prototype.delete = function (primaryKey) {
        throw new error_1.GenError("Delete method not supported");
    };
    return FileResource;
}(rest_resource_1.RESTResource));
exports.FileResource = FileResource;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL3Jlc3QvZmlsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFFQSxpREFBNkM7QUFFN0Msb0RBQW9EO0FBR3BEO0lBQWtDLGdDQUFvQjtJQUVsRCxzQkFBWSxVQUFzQjtlQUM5QixrQkFBTSxNQUFNLEVBQUUsVUFBVSxDQUFDO0lBQzdCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNJLCtCQUFRLEdBQWYsVUFBZ0IsRUFBVSxFQUFFLFFBQWdCO1FBQ3hDLE1BQU0sQ0FBMEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUU7YUFDbkYsR0FBRyxDQUFDLFVBQUMsSUFBSTtZQUNOLE1BQU0sQ0FBQztnQkFDSCxJQUFJLEVBQUUsSUFBSTthQUNiLENBQUM7UUFDTixDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFTyxrQ0FBVyxHQUFuQixVQUFvQixFQUFVLEVBQUUsUUFBZ0I7UUFDNUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxFQUFFLEdBQUcsR0FBRyxHQUFHLFFBQVEsQ0FBQztJQUMxQyxDQUFDO0lBRU0sMkNBQW9CLEdBQTNCLFVBQTRCLEVBQVUsRUFBRSxRQUFnQjtRQUNwRCxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLEdBQUcsR0FBRyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxjQUFjLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN0RixDQUFDO0lBRU0saUNBQVUsR0FBakIsVUFBa0IsRUFBVSxFQUFFLFFBQWdCO1FBQzFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRU0sc0NBQWUsR0FBdEIsVUFBdUIsRUFBVSxFQUFFLFFBQWdCO1FBQy9DLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsR0FBRyxHQUFHLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ25GLENBQUM7SUFFTSw2QkFBTSxHQUFiLFVBQWMsSUFBWTtRQUN0QixNQUFNLElBQUksZ0JBQVEsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFTSw2QkFBTSxHQUFiLFVBQWMsVUFBMkIsRUFBRSxJQUFZO1FBQ25ELE1BQU0sSUFBSSxnQkFBUSxDQUFDLDZCQUE2QixDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUVNLDhCQUFPLEdBQWQsVUFBZSxVQUEyQixFQUFFLElBQVk7UUFDcEQsTUFBTSxJQUFJLGdCQUFRLENBQUMsOEJBQThCLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBRU0sNkJBQU0sR0FBYixVQUFjLFVBQTJCO1FBQ3JDLE1BQU0sSUFBSSxnQkFBUSxDQUFDLDZCQUE2QixDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUNMLG1CQUFDO0FBQUQsQ0FwREEsQUFvREMsQ0FwRGlDLDRCQUFZLEdBb0Q3QztBQXBEWSxvQ0FBWSIsImZpbGUiOiJhcGkvcmVzb3VyY2VzL3Jlc3QvZmlsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJ4IGZyb20gJ3J4JztcblxuaW1wb3J0IHtSRVNUUmVzb3VyY2V9IGZyb20gJy4vcmVzdF9yZXNvdXJjZSc7XG5pbXBvcnQge0Nvbm5lY3Rpb259IGZyb20gJy4uLy4uL2Nvbm5lY3Rpb24nO1xuaW1wb3J0IHtHZW5FcnJvcn0gZnJvbSAnLi4vLi4vLi4vY29yZS9lcnJvcnMvZXJyb3InO1xuaW1wb3J0ICogYXMgdHlwZXMgZnJvbSAnLi4vLi4vdHlwZXMvcmVzdCc7XG5cbmV4cG9ydCBjbGFzcyBGaWxlUmVzb3VyY2UgZXh0ZW5kcyBSRVNUUmVzb3VyY2U8c3RyaW5nPiB7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb25uZWN0aW9uOiBDb25uZWN0aW9uKSB7XG4gICAgICAgIHN1cGVyKCdmaWxlJywgY29ubmVjdGlvbik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRG93bmxvYWRzIHRoZSBmaWxlIGZyb20gc2VydmVyIChpdCBhbHNvIGRlY29tcHJlc3NlcyBnemlwcGVkIGZpbGVzKS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZVxuICAgICAqIEByZXR1cm4ge1J4Lk9ic2VydmFibGU8eyBkYXRhOiBzdHJpbmcgfT59XG4gICAgICovXG4gICAgcHVibGljIGRvd25sb2FkKGlkOiBudW1iZXIsIGZpbGVuYW1lOiBzdHJpbmcpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLkRvd25sb2FkPiB7XG4gICAgICAgIHJldHVybiAoPFJ4Lk9ic2VydmFibGU8c3RyaW5nPj4gdGhpcy5jb25uZWN0aW9uLmdldCh0aGlzLmdldFVuZ3ppcHBlZFVybChpZCwgZmlsZW5hbWUpKSlcbiAgICAgICAgICAgIC5tYXAoKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9nZXRGaWxlVXJsKGlkOiBudW1iZXIsIGZpbGVuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gJy9kYXRhLycgKyBpZCArICcvJyArIGZpbGVuYW1lO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRGb3JjZWREb3dubG9hZFVybChpZDogbnVtYmVyLCBmaWxlbmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dldEZpbGVVcmwoaWQsIGZpbGVuYW1lKSArICc/JyArIGpRdWVyeS5wYXJhbSh7IGZvcmNlX2Rvd25sb2FkOiAxIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRWaWV3VXJsKGlkOiBudW1iZXIsIGZpbGVuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0RmlsZVVybChpZCwgZmlsZW5hbWUpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRVbmd6aXBwZWRVcmwoaWQ6IG51bWJlciwgZmlsZW5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRGaWxlVXJsKGlkLCBmaWxlbmFtZSkgKyAnPycgKyBqUXVlcnkucGFyYW0oeyBnemlwX2hlYWRlcjogMSB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY3JlYXRlKGRhdGE6IE9iamVjdCk6IFJ4Lk9ic2VydmFibGU8YW55PiB7XG4gICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihcIkNyZWF0ZSBtZXRob2Qgbm90IHN1cHBvcnRlZFwiKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlKHByaW1hcnlLZXk6IG51bWJlciB8IHN0cmluZywgZGF0YTogT2JqZWN0KTogUnguT2JzZXJ2YWJsZTxhbnk+IHtcbiAgICAgICAgdGhyb3cgbmV3IEdlbkVycm9yKFwiVXBkYXRlIG1ldGhvZCBub3Qgc3VwcG9ydGVkXCIpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZXBsYWNlKHByaW1hcnlLZXk6IG51bWJlciB8IHN0cmluZywgZGF0YTogT2JqZWN0KTogUnguT2JzZXJ2YWJsZTxhbnk+IHtcbiAgICAgICAgdGhyb3cgbmV3IEdlbkVycm9yKFwiUmVwbGFjZSBtZXRob2Qgbm90IHN1cHBvcnRlZFwiKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVsZXRlKHByaW1hcnlLZXk6IG51bWJlciB8IHN0cmluZyk6IFJ4Lk9ic2VydmFibGU8YW55PiB7XG4gICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihcIkRlbGV0ZSBtZXRob2Qgbm90IHN1cHBvcnRlZFwiKTtcbiAgICB9XG59XG4iXX0=
