"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var rest_resource_1 = require("./rest_resource");
var error_1 = require("../../../core/errors/error");
/**
 * Presample resource class for dealing with sample endpoint.
 */
var PresampleResource = (function (_super) {
    __extends(PresampleResource, _super);
    function PresampleResource(connection) {
        return _super.call(this, 'presample', connection) || this;
    }
    PresampleResource.prototype.query = function (query) {
        if (query === void 0) { query = {}; }
        return _super.prototype.query.call(this, query);
    };
    PresampleResource.prototype.queryOne = function (query) {
        if (query === void 0) { query = {}; }
        return _super.prototype.queryOne.call(this, query);
    };
    PresampleResource.prototype.create = function (data) {
        throw new error_1.GenError("Create method not supported");
    };
    PresampleResource.prototype.replace = function (primaryKey, data) {
        throw new error_1.GenError("Replace method not supported");
    };
    return PresampleResource;
}(rest_resource_1.RESTResource));
exports.PresampleResource = PresampleResource;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL3Jlc3QvcHJlc2FtcGxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUNBLGlEQUE2QztBQUU3QyxvREFBb0Q7QUFHcEQ7O0dBRUc7QUFDSDtJQUF1QyxxQ0FBNkI7SUFFaEUsMkJBQVksVUFBc0I7ZUFDOUIsa0JBQU0sV0FBVyxFQUFFLFVBQVUsQ0FBQztJQUNsQyxDQUFDO0lBSU0saUNBQUssR0FBWixVQUFhLEtBQXVCO1FBQXZCLHNCQUFBLEVBQUEsVUFBdUI7UUFDaEMsTUFBTSxDQUFDLGlCQUFNLEtBQUssWUFBQyxLQUFLLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBSU0sb0NBQVEsR0FBZixVQUFnQixLQUF1QjtRQUF2QixzQkFBQSxFQUFBLFVBQXVCO1FBQ25DLE1BQU0sQ0FBQyxpQkFBTSxRQUFRLFlBQUMsS0FBSyxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUVNLGtDQUFNLEdBQWIsVUFBYyxJQUFZO1FBQ3RCLE1BQU0sSUFBSSxnQkFBUSxDQUFDLDZCQUE2QixDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUVNLG1DQUFPLEdBQWQsVUFBZSxVQUEyQixFQUFFLElBQVk7UUFDcEQsTUFBTSxJQUFJLGdCQUFRLENBQUMsOEJBQThCLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBQ0wsd0JBQUM7QUFBRCxDQXpCQSxBQXlCQyxDQXpCc0MsNEJBQVksR0F5QmxEO0FBekJZLDhDQUFpQiIsImZpbGUiOiJhcGkvcmVzb3VyY2VzL3Jlc3QvcHJlc2FtcGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUnggZnJvbSAncngnO1xuaW1wb3J0IHtSRVNUUmVzb3VyY2V9IGZyb20gJy4vcmVzdF9yZXNvdXJjZSc7XG5pbXBvcnQge0Nvbm5lY3Rpb259IGZyb20gJy4uLy4uL2Nvbm5lY3Rpb24nO1xuaW1wb3J0IHtHZW5FcnJvcn0gZnJvbSAnLi4vLi4vLi4vY29yZS9lcnJvcnMvZXJyb3InO1xuaW1wb3J0ICogYXMgdHlwZXMgZnJvbSAnLi4vLi4vdHlwZXMvcmVzdCc7XG5cbi8qKlxuICogUHJlc2FtcGxlIHJlc291cmNlIGNsYXNzIGZvciBkZWFsaW5nIHdpdGggc2FtcGxlIGVuZHBvaW50LlxuICovXG5leHBvcnQgY2xhc3MgUHJlc2FtcGxlUmVzb3VyY2UgZXh0ZW5kcyBSRVNUUmVzb3VyY2U8dHlwZXMuUHJlc2FtcGxlPiB7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb25uZWN0aW9uOiBDb25uZWN0aW9uKSB7XG4gICAgICAgIHN1cGVyKCdwcmVzYW1wbGUnLCBjb25uZWN0aW9uKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcXVlcnkocXVlcnk/OiB0eXBlcy5RdWVyeU9iamVjdCk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuUHJlc2FtcGxlW10+O1xuICAgIHB1YmxpYyBxdWVyeShxdWVyeTogdHlwZXMuUXVlcnlPYmplY3RIeWRyYXRlRGF0YSk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuUHJlc2FtcGxlSHlkcmF0ZURhdGFbXT47XG4gICAgcHVibGljIHF1ZXJ5KHF1ZXJ5OiB0eXBlcy5RdWVyeSA9IHt9KTogUnguT2JzZXJ2YWJsZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIHN1cGVyLnF1ZXJ5KHF1ZXJ5KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcXVlcnlPbmUocXVlcnk/OiB0eXBlcy5RdWVyeU9iamVjdCk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuUHJlc2FtcGxlPjtcbiAgICBwdWJsaWMgcXVlcnlPbmUocXVlcnk6IHR5cGVzLlF1ZXJ5T2JqZWN0SHlkcmF0ZURhdGEpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLlByZXNhbXBsZUh5ZHJhdGVEYXRhPjtcbiAgICBwdWJsaWMgcXVlcnlPbmUocXVlcnk6IHR5cGVzLlF1ZXJ5ID0ge30pOiBSeC5PYnNlcnZhYmxlPGFueT4ge1xuICAgICAgICByZXR1cm4gc3VwZXIucXVlcnlPbmUocXVlcnkpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjcmVhdGUoZGF0YTogT2JqZWN0KTogUnguT2JzZXJ2YWJsZTxhbnk+IHtcbiAgICAgICAgdGhyb3cgbmV3IEdlbkVycm9yKFwiQ3JlYXRlIG1ldGhvZCBub3Qgc3VwcG9ydGVkXCIpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZXBsYWNlKHByaW1hcnlLZXk6IG51bWJlciB8IHN0cmluZywgZGF0YTogT2JqZWN0KTogUnguT2JzZXJ2YWJsZTxhbnk+IHtcbiAgICAgICAgdGhyb3cgbmV3IEdlbkVycm9yKFwiUmVwbGFjZSBtZXRob2Qgbm90IHN1cHBvcnRlZFwiKTtcbiAgICB9XG59XG4iXX0=
