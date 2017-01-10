"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var error_1 = require("../core/errors/error");
/**
 * Api error.
 */
var APIError = (function (_super) {
    __extends(APIError, _super);
    function APIError(message, associatedObject) {
        var _this = _super.call(this, message) || this;
        _this.name = 'APIError';
        _this._associatedObject = associatedObject;
        return _this;
    }
    Object.defineProperty(APIError.prototype, "associatedObject", {
        get: function () {
            return this._associatedObject;
        },
        enumerable: true,
        configurable: true
    });
    return APIError;
}(error_1.GenError));
exports.APIError = APIError;
/**
 * QueryOne error thrown when [[Resource]]'s queryOne method fails.
 */
var QueryOneError = (function (_super) {
    __extends(QueryOneError, _super);
    function QueryOneError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'QueryOneError';
        return _this;
    }
    return QueryOneError;
}(APIError));
exports.QueryOneError = QueryOneError;
/**
 * Websocket error.
 */
var WebsocketError = (function (_super) {
    __extends(WebsocketError, _super);
    function WebsocketError(message, associatedObject) {
        var _this = _super.call(this, message, associatedObject) || this;
        _this.name = 'WebsocketError';
        return _this;
    }
    return WebsocketError;
}(APIError));
exports.WebsocketError = WebsocketError;
/**
 * Query observers error.
 */
var QueryObserversError = (function (_super) {
    __extends(QueryObserversError, _super);
    function QueryObserversError(message, associatedObject) {
        var _this = _super.call(this, message, associatedObject) || this;
        _this.name = 'QueryObserversError';
        return _this;
    }
    return QueryObserversError;
}(APIError));
exports.QueryObserversError = QueryObserversError;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvZXJyb3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDhDQUE4QztBQUU5Qzs7R0FFRztBQUNIO0lBQThCLDRCQUFRO0lBSWxDLGtCQUFZLE9BQWUsRUFBRSxnQkFBeUI7UUFBdEQsWUFDSSxrQkFBTSxPQUFPLENBQUMsU0FHakI7UUFQTSxVQUFJLEdBQUcsVUFBVSxDQUFDO1FBTXJCLEtBQUksQ0FBQyxpQkFBaUIsR0FBRyxnQkFBZ0IsQ0FBQzs7SUFDOUMsQ0FBQztJQUVELHNCQUFXLHNDQUFnQjthQUEzQjtZQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUM7UUFDbEMsQ0FBQzs7O09BQUE7SUFDTCxlQUFDO0FBQUQsQ0FiQSxBQWFDLENBYjZCLGdCQUFRLEdBYXJDO0FBYlksNEJBQVE7QUFlckI7O0dBRUc7QUFDSDtJQUFtQyxpQ0FBUTtJQUd2Qyx1QkFBWSxPQUFlO1FBQTNCLFlBQ0ksa0JBQU0sT0FBTyxDQUFDLFNBQ2pCO1FBSk0sVUFBSSxHQUFHLGVBQWUsQ0FBQzs7SUFJOUIsQ0FBQztJQUNMLG9CQUFDO0FBQUQsQ0FOQSxBQU1DLENBTmtDLFFBQVEsR0FNMUM7QUFOWSxzQ0FBYTtBQVExQjs7R0FFRztBQUNIO0lBQW9DLGtDQUFRO0lBR3hDLHdCQUFZLE9BQWUsRUFBRSxnQkFBeUI7UUFBdEQsWUFDSSxrQkFBTSxPQUFPLEVBQUUsZ0JBQWdCLENBQUMsU0FDbkM7UUFKTSxVQUFJLEdBQUcsZ0JBQWdCLENBQUM7O0lBSS9CLENBQUM7SUFDTCxxQkFBQztBQUFELENBTkEsQUFNQyxDQU5tQyxRQUFRLEdBTTNDO0FBTlksd0NBQWM7QUFRM0I7O0dBRUc7QUFDSDtJQUF5Qyx1Q0FBUTtJQUc3Qyw2QkFBWSxPQUFlLEVBQUUsZ0JBQXlCO1FBQXRELFlBQ0ksa0JBQU0sT0FBTyxFQUFFLGdCQUFnQixDQUFDLFNBQ25DO1FBSk0sVUFBSSxHQUFHLHFCQUFxQixDQUFDOztJQUlwQyxDQUFDO0lBQ0wsMEJBQUM7QUFBRCxDQU5BLEFBTUMsQ0FOd0MsUUFBUSxHQU1oRDtBQU5ZLGtEQUFtQiIsImZpbGUiOiJhcGkvZXJyb3JzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtHZW5FcnJvcn0gZnJvbSAnLi4vY29yZS9lcnJvcnMvZXJyb3InO1xuXG4vKipcbiAqIEFwaSBlcnJvci5cbiAqL1xuZXhwb3J0IGNsYXNzIEFQSUVycm9yIGV4dGVuZHMgR2VuRXJyb3Ige1xuICAgIHB1YmxpYyBuYW1lID0gJ0FQSUVycm9yJztcbiAgICBwcml2YXRlIF9hc3NvY2lhdGVkT2JqZWN0OiBPYmplY3Q7XG5cbiAgICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcsIGFzc29jaWF0ZWRPYmplY3Q/OiBPYmplY3QpIHtcbiAgICAgICAgc3VwZXIobWVzc2FnZSk7XG5cbiAgICAgICAgdGhpcy5fYXNzb2NpYXRlZE9iamVjdCA9IGFzc29jaWF0ZWRPYmplY3Q7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBhc3NvY2lhdGVkT2JqZWN0KCk6IE9iamVjdCB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hc3NvY2lhdGVkT2JqZWN0O1xuICAgIH1cbn1cblxuLyoqXG4gKiBRdWVyeU9uZSBlcnJvciB0aHJvd24gd2hlbiBbW1Jlc291cmNlXV0ncyBxdWVyeU9uZSBtZXRob2QgZmFpbHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBRdWVyeU9uZUVycm9yIGV4dGVuZHMgQVBJRXJyb3Ige1xuICAgIHB1YmxpYyBuYW1lID0gJ1F1ZXJ5T25lRXJyb3InO1xuXG4gICAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBXZWJzb2NrZXQgZXJyb3IuXG4gKi9cbmV4cG9ydCBjbGFzcyBXZWJzb2NrZXRFcnJvciBleHRlbmRzIEFQSUVycm9yIHtcbiAgICBwdWJsaWMgbmFtZSA9ICdXZWJzb2NrZXRFcnJvcic7XG5cbiAgICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcsIGFzc29jaWF0ZWRPYmplY3Q/OiBPYmplY3QpIHtcbiAgICAgICAgc3VwZXIobWVzc2FnZSwgYXNzb2NpYXRlZE9iamVjdCk7XG4gICAgfVxufVxuXG4vKipcbiAqIFF1ZXJ5IG9ic2VydmVycyBlcnJvci5cbiAqL1xuZXhwb3J0IGNsYXNzIFF1ZXJ5T2JzZXJ2ZXJzRXJyb3IgZXh0ZW5kcyBBUElFcnJvciB7XG4gICAgcHVibGljIG5hbWUgPSAnUXVlcnlPYnNlcnZlcnNFcnJvcic7XG5cbiAgICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcsIGFzc29jaWF0ZWRPYmplY3Q/OiBPYmplY3QpIHtcbiAgICAgICAgc3VwZXIobWVzc2FnZSwgYXNzb2NpYXRlZE9iamVjdCk7XG4gICAgfVxufVxuIl19
