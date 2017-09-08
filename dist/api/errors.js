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
var error_1 = require("../core/errors/error");
/**
 * Api error.
 */
var APIError = /** @class */ (function (_super) {
    __extends(APIError, _super);
    function APIError(message, associatedObject) {
        var _this = _super.call(this, message) || this;
        _this.name = 'APIError';
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object['setPrototypeOf'](_this, APIError.prototype);
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
var QueryOneError = /** @class */ (function (_super) {
    __extends(QueryOneError, _super);
    function QueryOneError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'QueryOneError';
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object['setPrototypeOf'](_this, QueryOneError.prototype);
        return _this;
    }
    return QueryOneError;
}(APIError));
exports.QueryOneError = QueryOneError;
/**
 * Websocket error.
 */
var WebsocketError = /** @class */ (function (_super) {
    __extends(WebsocketError, _super);
    function WebsocketError(message, associatedObject) {
        var _this = _super.call(this, message, associatedObject) || this;
        _this.name = 'WebsocketError';
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object['setPrototypeOf'](_this, WebsocketError.prototype);
        return _this;
    }
    return WebsocketError;
}(APIError));
exports.WebsocketError = WebsocketError;
/**
 * Query observers error.
 */
var QueryObserversError = /** @class */ (function (_super) {
    __extends(QueryObserversError, _super);
    function QueryObserversError(message, associatedObject) {
        var _this = _super.call(this, message, associatedObject) || this;
        _this.name = 'QueryObserversError';
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object['setPrototypeOf'](_this, QueryObserversError.prototype);
        return _this;
    }
    return QueryObserversError;
}(APIError));
exports.QueryObserversError = QueryObserversError;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvZXJyb3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDhDQUE4QztBQUU5Qzs7R0FFRztBQUNIO0lBQThCLDRCQUFRO0lBSWxDLGtCQUFZLE9BQWUsRUFBRSxnQkFBeUI7UUFBdEQsWUFDSSxrQkFBTSxPQUFPLENBQUMsU0FLakI7UUFUTSxVQUFJLEdBQUcsVUFBVSxDQUFDO1FBS3JCLGdJQUFnSTtRQUNoSSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxLQUFJLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRW5ELEtBQUksQ0FBQyxpQkFBaUIsR0FBRyxnQkFBZ0IsQ0FBQzs7SUFDOUMsQ0FBQztJQUVELHNCQUFXLHNDQUFnQjthQUEzQjtZQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUM7UUFDbEMsQ0FBQzs7O09BQUE7SUFDTCxlQUFDO0FBQUQsQ0FmQSxBQWVDLENBZjZCLGdCQUFRLEdBZXJDO0FBZlksNEJBQVE7QUFpQnJCOztHQUVHO0FBQ0g7SUFBbUMsaUNBQVE7SUFHdkMsdUJBQVksT0FBZTtRQUEzQixZQUNJLGtCQUFNLE9BQU8sQ0FBQyxTQUdqQjtRQU5NLFVBQUksR0FBRyxlQUFlLENBQUM7UUFJMUIsZ0lBQWdJO1FBQ2hJLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEtBQUksRUFBRSxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7O0lBQzVELENBQUM7SUFDTCxvQkFBQztBQUFELENBUkEsQUFRQyxDQVJrQyxRQUFRLEdBUTFDO0FBUlksc0NBQWE7QUFVMUI7O0dBRUc7QUFDSDtJQUFvQyxrQ0FBUTtJQUd4Qyx3QkFBWSxPQUFlLEVBQUUsZ0JBQXlCO1FBQXRELFlBQ0ksa0JBQU0sT0FBTyxFQUFFLGdCQUFnQixDQUFDLFNBR25DO1FBTk0sVUFBSSxHQUFHLGdCQUFnQixDQUFDO1FBSTNCLGdJQUFnSTtRQUNoSSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxLQUFJLEVBQUUsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDOztJQUM3RCxDQUFDO0lBQ0wscUJBQUM7QUFBRCxDQVJBLEFBUUMsQ0FSbUMsUUFBUSxHQVEzQztBQVJZLHdDQUFjO0FBVTNCOztHQUVHO0FBQ0g7SUFBeUMsdUNBQVE7SUFHN0MsNkJBQVksT0FBZSxFQUFFLGdCQUF5QjtRQUF0RCxZQUNJLGtCQUFNLE9BQU8sRUFBRSxnQkFBZ0IsQ0FBQyxTQUduQztRQU5NLFVBQUksR0FBRyxxQkFBcUIsQ0FBQztRQUloQyxnSUFBZ0k7UUFDaEksTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsS0FBSSxFQUFFLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDOztJQUNsRSxDQUFDO0lBQ0wsMEJBQUM7QUFBRCxDQVJBLEFBUUMsQ0FSd0MsUUFBUSxHQVFoRDtBQVJZLGtEQUFtQiIsImZpbGUiOiJhcGkvZXJyb3JzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtHZW5FcnJvcn0gZnJvbSAnLi4vY29yZS9lcnJvcnMvZXJyb3InO1xuXG4vKipcbiAqIEFwaSBlcnJvci5cbiAqL1xuZXhwb3J0IGNsYXNzIEFQSUVycm9yIGV4dGVuZHMgR2VuRXJyb3Ige1xuICAgIHB1YmxpYyBuYW1lID0gJ0FQSUVycm9yJztcbiAgICBwcml2YXRlIF9hc3NvY2lhdGVkT2JqZWN0OiBPYmplY3Q7XG5cbiAgICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcsIGFzc29jaWF0ZWRPYmplY3Q/OiBPYmplY3QpIHtcbiAgICAgICAgc3VwZXIobWVzc2FnZSk7XG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWNyb3NvZnQvVHlwZVNjcmlwdC93aWtpL0JyZWFraW5nLUNoYW5nZXMjZXh0ZW5kaW5nLWJ1aWx0LWlucy1saWtlLWVycm9yLWFycmF5LWFuZC1tYXAtbWF5LW5vLWxvbmdlci13b3JrXG4gICAgICAgIE9iamVjdFsnc2V0UHJvdG90eXBlT2YnXSh0aGlzLCBBUElFcnJvci5wcm90b3R5cGUpO1xuXG4gICAgICAgIHRoaXMuX2Fzc29jaWF0ZWRPYmplY3QgPSBhc3NvY2lhdGVkT2JqZWN0O1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgYXNzb2NpYXRlZE9iamVjdCgpOiBPYmplY3Qge1xuICAgICAgICByZXR1cm4gdGhpcy5fYXNzb2NpYXRlZE9iamVjdDtcbiAgICB9XG59XG5cbi8qKlxuICogUXVlcnlPbmUgZXJyb3IgdGhyb3duIHdoZW4gW1tSZXNvdXJjZV1dJ3MgcXVlcnlPbmUgbWV0aG9kIGZhaWxzLlxuICovXG5leHBvcnQgY2xhc3MgUXVlcnlPbmVFcnJvciBleHRlbmRzIEFQSUVycm9yIHtcbiAgICBwdWJsaWMgbmFtZSA9ICdRdWVyeU9uZUVycm9yJztcblxuICAgIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZykge1xuICAgICAgICBzdXBlcihtZXNzYWdlKTtcbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L3dpa2kvQnJlYWtpbmctQ2hhbmdlcyNleHRlbmRpbmctYnVpbHQtaW5zLWxpa2UtZXJyb3ItYXJyYXktYW5kLW1hcC1tYXktbm8tbG9uZ2VyLXdvcmtcbiAgICAgICAgT2JqZWN0WydzZXRQcm90b3R5cGVPZiddKHRoaXMsIFF1ZXJ5T25lRXJyb3IucHJvdG90eXBlKTtcbiAgICB9XG59XG5cbi8qKlxuICogV2Vic29ja2V0IGVycm9yLlxuICovXG5leHBvcnQgY2xhc3MgV2Vic29ja2V0RXJyb3IgZXh0ZW5kcyBBUElFcnJvciB7XG4gICAgcHVibGljIG5hbWUgPSAnV2Vic29ja2V0RXJyb3InO1xuXG4gICAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBhc3NvY2lhdGVkT2JqZWN0PzogT2JqZWN0KSB7XG4gICAgICAgIHN1cGVyKG1lc3NhZ2UsIGFzc29jaWF0ZWRPYmplY3QpO1xuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vTWljcm9zb2Z0L1R5cGVTY3JpcHQvd2lraS9CcmVha2luZy1DaGFuZ2VzI2V4dGVuZGluZy1idWlsdC1pbnMtbGlrZS1lcnJvci1hcnJheS1hbmQtbWFwLW1heS1uby1sb25nZXItd29ya1xuICAgICAgICBPYmplY3RbJ3NldFByb3RvdHlwZU9mJ10odGhpcywgV2Vic29ja2V0RXJyb3IucHJvdG90eXBlKTtcbiAgICB9XG59XG5cbi8qKlxuICogUXVlcnkgb2JzZXJ2ZXJzIGVycm9yLlxuICovXG5leHBvcnQgY2xhc3MgUXVlcnlPYnNlcnZlcnNFcnJvciBleHRlbmRzIEFQSUVycm9yIHtcbiAgICBwdWJsaWMgbmFtZSA9ICdRdWVyeU9ic2VydmVyc0Vycm9yJztcblxuICAgIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZywgYXNzb2NpYXRlZE9iamVjdD86IE9iamVjdCkge1xuICAgICAgICBzdXBlcihtZXNzYWdlLCBhc3NvY2lhdGVkT2JqZWN0KTtcbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L3dpa2kvQnJlYWtpbmctQ2hhbmdlcyNleHRlbmRpbmctYnVpbHQtaW5zLWxpa2UtZXJyb3ItYXJyYXktYW5kLW1hcC1tYXktbm8tbG9uZ2VyLXdvcmtcbiAgICAgICAgT2JqZWN0WydzZXRQcm90b3R5cGVPZiddKHRoaXMsIFF1ZXJ5T2JzZXJ2ZXJzRXJyb3IucHJvdG90eXBlKTtcbiAgICB9XG59XG4iXX0=
