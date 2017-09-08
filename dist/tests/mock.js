"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("ng-file-upload");
/**
 * Mock API service.
 */
var MockApiService = /** @class */ (function () {
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy90ZXN0cy9tb2NrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsMEJBQXdCO0FBY3hCOztHQUVHO0FBQ0g7SUFBQTtRQUNJLHVCQUF1QjtRQUNmLG1CQUFjLEdBQTJCLGNBQVEsTUFBTSxDQUFpQyxFQUFDLElBQUksRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQTBCbkgsQ0FBQztJQXhCRzs7T0FFRztJQUNJLCtCQUFNLEdBQWIsVUFBaUIsSUFBUyxFQUFFLE9BQW9CO1FBQWhELGlCQVdDO1FBWDJCLHdCQUFBLEVBQUEsWUFBb0I7UUFDNUMsc0ZBQXNGO1FBQ3RGLE1BQU0sQ0FBK0MsSUFBSSxPQUFPLENBQzVELFVBQUMsT0FBTyxFQUFFLE1BQU07WUFDWixJQUFJLENBQUM7Z0JBQ0QsT0FBTyxDQUFDLEtBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDaEQsQ0FBQztZQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ2IsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2xCLENBQUM7UUFDTCxDQUFDLENBQ0osQ0FBQztJQUNOLENBQUM7SUFFRDs7OztPQUlHO0lBQ0ksbUNBQVUsR0FBakIsVUFBcUIsT0FBNkI7UUFDOUMsSUFBSSxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUM7SUFDbEMsQ0FBQztJQUNMLHFCQUFDO0FBQUQsQ0E1QkEsQUE0QkMsSUFBQTtBQTVCWSx3Q0FBYyIsImZpbGUiOiJ0ZXN0cy9tb2NrLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYW5ndWxhciBmcm9tICdhbmd1bGFyJztcbmltcG9ydCAnbmctZmlsZS11cGxvYWQnO1xuXG5cbi8qKlxuICogTW9jayB1cGxvYWQgaGFuZGxlciBmdW5jdGlvbi4gSXQgcmVjZWl2ZXMgYW55IHF1ZXJ5IGFyZ3VtZW50cyBhbmQgZGF0YSB0aGF0XG4gKiB3YXMgdXNlZCB0byBtYWtlIHRoZSByZXF1ZXN0LlxuICpcbiAqIEBwYXJhbSBkYXRhIFJlcXVlc3QgZGF0YVxuICogQHBhcmFtIGZpbGVVSUQgVW5pcXVlIGZpbGUgaWRlbnRpZmllclxuICovXG5leHBvcnQgaW50ZXJmYWNlIE1vY2tVcGxvYWRIYW5kbGVyPFQ+IHtcbiAgICAoZGF0YTogYW55LCBmaWxlVUlEOiBzdHJpbmcpOiBhbmd1bGFyLklIdHRwUHJvbWlzZUNhbGxiYWNrQXJnPFQ+O1xufVxuXG4vKipcbiAqIE1vY2sgQVBJIHNlcnZpY2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBNb2NrQXBpU2VydmljZSB7XG4gICAgLy8gTW9jayB1cGxvYWQgaGFuZGxlci5cbiAgICBwcml2YXRlIF91cGxvYWRIYW5kbGVyOiBNb2NrVXBsb2FkSGFuZGxlcjxhbnk+ID0gKCkgPT4geyByZXR1cm4gPGFuZ3VsYXIuSUh0dHBSZXNwb25zZTxzdHJpbmc+PiB7ZGF0YTogbnVsbH07IH1cblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm1zIGEgbW9jayBkYXRhIHVwbG9hZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgdXBsb2FkPFQ+KGRhdGE6IGFueSwgZmlsZVVJRDogc3RyaW5nID0gJycpOiBhbmd1bGFyLmFuZ3VsYXJGaWxlVXBsb2FkLklVcGxvYWRQcm9taXNlPFQ+IHtcbiAgICAgICAgLy8gVE9ETzogQXVnbWVudCB0aGUgcHJvbWlzZSB0byBlbmFibGUgdXBsb2FkLXNwZWNpZmljIGZ1bmN0aW9ucyAob3IgbWFrZSB0aGVtIG5vb3BzKS5cbiAgICAgICAgcmV0dXJuIDxhbmd1bGFyLmFuZ3VsYXJGaWxlVXBsb2FkLklVcGxvYWRQcm9taXNlPFQ+PiBuZXcgUHJvbWlzZTxhbmd1bGFyLklIdHRwUHJvbWlzZUNhbGxiYWNrQXJnPFQ+PihcbiAgICAgICAgICAgIChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRoaXMuX3VwbG9hZEhhbmRsZXIoZGF0YSwgZmlsZVVJRCkpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVycyBhIG1vY2sgdXBsb2FkIHJlcXVlc3QgaGFuZGxlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBoYW5kbGVyIFVwbG9hZCBoYW5kbGVyXG4gICAgICovXG4gICAgcHVibGljIHdoZW5VcGxvYWQ8VD4oaGFuZGxlcjogTW9ja1VwbG9hZEhhbmRsZXI8VD4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fdXBsb2FkSGFuZGxlciA9IGhhbmRsZXI7XG4gICAgfVxufVxuIl19
