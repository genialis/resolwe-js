"use strict";
require("ng-file-upload");
/**
 * Mock API service.
 */
var MockApiService = (function () {
    function MockApiService() {
        // Mock upload handler.
        this._uploadHandler = function () { return { data: null }; };
    }
    /**
     * Performs a mock data upload.
     */
    MockApiService.prototype.upload = function (data, fileUID) {
        var _this = this;
        if (fileUID === void 0) { fileUID = ''; }
        // TODO: Augment the promise to enable upload-specific functions (or make them noops).
        return new Promise(function (resolve, reject) {
            try {
                resolve(_this._uploadHandler(data, fileUID));
            }
            catch (error) {
                reject(error);
            }
        });
    };
    /**
     * Registers a mock upload request handler.
     *
     * @param handler Upload handler
     */
    MockApiService.prototype.whenUpload = function (handler) {
        this._uploadHandler = handler;
    };
    return MockApiService;
}());
exports.MockApiService = MockApiService;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy90ZXN0cy9tb2NrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQSwwQkFBd0I7QUFjeEI7O0dBRUc7QUFDSDtJQUFBO1FBQ0ksdUJBQXVCO1FBQ2YsbUJBQWMsR0FBMkIsY0FBUSxNQUFNLENBQUMsRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7SUEwQm5GLENBQUM7SUF4Qkc7O09BRUc7SUFDSSwrQkFBTSxHQUFiLFVBQWlCLElBQVMsRUFBRSxPQUFvQjtRQUFoRCxpQkFXQztRQVgyQix3QkFBQSxFQUFBLFlBQW9CO1FBQzVDLHNGQUFzRjtRQUN0RixNQUFNLENBQStDLElBQUksT0FBTyxDQUM1RCxVQUFDLE9BQU8sRUFBRSxNQUFNO1lBQ1osSUFBSSxDQUFDO2dCQUNELE9BQU8sQ0FBQyxLQUFJLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ2hELENBQUM7WUFBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNiLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNsQixDQUFDO1FBQ0wsQ0FBQyxDQUNKLENBQUM7SUFDTixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNJLG1DQUFVLEdBQWpCLFVBQXFCLE9BQTZCO1FBQzlDLElBQUksQ0FBQyxjQUFjLEdBQUcsT0FBTyxDQUFDO0lBQ2xDLENBQUM7SUFDTCxxQkFBQztBQUFELENBNUJBLEFBNEJDLElBQUE7QUE1Qlksd0NBQWMiLCJmaWxlIjoidGVzdHMvbW9jay5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFuZ3VsYXIgZnJvbSAnYW5ndWxhcic7XG5pbXBvcnQgJ25nLWZpbGUtdXBsb2FkJztcblxuXG4vKipcbiAqIE1vY2sgdXBsb2FkIGhhbmRsZXIgZnVuY3Rpb24uIEl0IHJlY2VpdmVzIGFueSBxdWVyeSBhcmd1bWVudHMgYW5kIGRhdGEgdGhhdFxuICogd2FzIHVzZWQgdG8gbWFrZSB0aGUgcmVxdWVzdC5cbiAqXG4gKiBAcGFyYW0gZGF0YSBSZXF1ZXN0IGRhdGFcbiAqIEBwYXJhbSBmaWxlVUlEIFVuaXF1ZSBmaWxlIGlkZW50aWZpZXJcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNb2NrVXBsb2FkSGFuZGxlcjxUPiB7XG4gICAgKGRhdGE6IGFueSwgZmlsZVVJRDogc3RyaW5nKTogYW5ndWxhci5JSHR0cFByb21pc2VDYWxsYmFja0FyZzxUPjtcbn1cblxuLyoqXG4gKiBNb2NrIEFQSSBzZXJ2aWNlLlxuICovXG5leHBvcnQgY2xhc3MgTW9ja0FwaVNlcnZpY2Uge1xuICAgIC8vIE1vY2sgdXBsb2FkIGhhbmRsZXIuXG4gICAgcHJpdmF0ZSBfdXBsb2FkSGFuZGxlcjogTW9ja1VwbG9hZEhhbmRsZXI8YW55PiA9ICgpID0+IHsgcmV0dXJuIHtkYXRhOiBudWxsfTsgfVxuXG4gICAgLyoqXG4gICAgICogUGVyZm9ybXMgYSBtb2NrIGRhdGEgdXBsb2FkLlxuICAgICAqL1xuICAgIHB1YmxpYyB1cGxvYWQ8VD4oZGF0YTogYW55LCBmaWxlVUlEOiBzdHJpbmcgPSAnJyk6IGFuZ3VsYXIuYW5ndWxhckZpbGVVcGxvYWQuSVVwbG9hZFByb21pc2U8VD4ge1xuICAgICAgICAvLyBUT0RPOiBBdWdtZW50IHRoZSBwcm9taXNlIHRvIGVuYWJsZSB1cGxvYWQtc3BlY2lmaWMgZnVuY3Rpb25zIChvciBtYWtlIHRoZW0gbm9vcHMpLlxuICAgICAgICByZXR1cm4gPGFuZ3VsYXIuYW5ndWxhckZpbGVVcGxvYWQuSVVwbG9hZFByb21pc2U8VD4+IG5ldyBQcm9taXNlPGFuZ3VsYXIuSUh0dHBQcm9taXNlQ2FsbGJhY2tBcmc8VD4+KFxuICAgICAgICAgICAgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5fdXBsb2FkSGFuZGxlcihkYXRhLCBmaWxlVUlEKSk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXJzIGEgbW9jayB1cGxvYWQgcmVxdWVzdCBoYW5kbGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGhhbmRsZXIgVXBsb2FkIGhhbmRsZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgd2hlblVwbG9hZDxUPihoYW5kbGVyOiBNb2NrVXBsb2FkSGFuZGxlcjxUPik6IHZvaWQge1xuICAgICAgICB0aGlzLl91cGxvYWRIYW5kbGVyID0gaGFuZGxlcjtcbiAgICB9XG59XG4iXX0=
