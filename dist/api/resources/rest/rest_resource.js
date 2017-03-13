"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var resource_1 = require("../../resource");
var errors_1 = require("../../errors");
/**
 * A resource class backed by a genesis platform model.
 */
var RESTResource = (function (_super) {
    __extends(RESTResource, _super);
    /**
     * Constructs a new REST resource.
     *
     * @param name Resource name
     * @param connection Connection with the genesis platform server
     */
    function RESTResource(_name, connection) {
        var _this = _super.call(this, connection) || this;
        _this._name = _name;
        return _this;
    }
    Object.defineProperty(RESTResource.prototype, "name", {
        /**
         * Returns resource name.
         */
        get: function () {
            return this._name;
        },
        enumerable: true,
        configurable: true
    });
    RESTResource.prototype._getResourcePath = function () {
        return this.getBasePath() + "/" + this._name;
    };
    /**
     * Returns the path used for requesting a list of resource items.
     */
    RESTResource.prototype.getListPath = function () {
        return this._getResourcePath();
    };
    /**
     * Returns the path used for calling a method on the resource type.
     */
    RESTResource.prototype.getListMethodPath = function (method) {
        return this.getListPath() + "/" + method;
    };
    /**
     * Returns the path used for requesting a specific resource item.
     */
    RESTResource.prototype.getDetailPath = function (primaryKey) {
        return this._getResourcePath() + "/" + primaryKey;
    };
    /**
     * Returns the path used for calling a method on a specific resource item.
     */
    RESTResource.prototype.getDetailMethodPath = function (primaryKey, method) {
        return this.getDetailPath(primaryKey) + "/" + method;
    };
    /**
     * Returns the path used for querying the resource.
     */
    RESTResource.prototype.getQueryPath = function (query) {
        return this.getListPath();
    };
    /**
     * Calls a method on an instance of the given resource.
     *
     * @param primaryKey Instance primary key
     * @param method Method name
     * @param data Method data object
     * @return An observable that emits the response
     */
    RESTResource.prototype.callMethod = function (primaryKey, method, data) {
        if (data === void 0) { data = {}; }
        return this.connection.post(this.getDetailMethodPath(primaryKey, method), data, {});
    };
    /**
     * Calls a method on the given resource.
     *
     * @param method Method name
     * @param data Method data object
     * @return An observable that emits the response
     */
    RESTResource.prototype.callListMethod = function (method, data) {
        if (data === void 0) { data = {}; }
        return this.connection.post(this.getListMethodPath(method), data, {});
    };
    /**
     * Creates an instance of the given resource.
     *
     * @param data Object attributes
     * @return An observable that emits the response
     */
    RESTResource.prototype.create = function (data) {
        return this.connection.post(this.getListPath(), data, {});
    };
    /**
     * Updates an existing instance of the given resource.
     *
     * @param primaryKey Instance primary key
     * @param data Object attributes
     * @return An observable that emits the response
     */
    RESTResource.prototype.update = function (primaryKey, data) {
        return this.connection.patch(this.getDetailPath(primaryKey), data, {});
    };
    /**
     * Replaces an existing instance of the given resource.
     *
     * @param primaryKey Instance primary key
     * @param data Object attributes
     * @return An observable that emits the response
     */
    RESTResource.prototype.replace = function (primaryKey, data) {
        return this.connection.put(this.getDetailPath(primaryKey), data, {});
    };
    /**
     * Deletes an existing instance of the given resource.
     *
     * @param primaryKey Instance primary key
     * @return An observable that emits the response
     */
    RESTResource.prototype.delete = function (primaryKey) {
        return this.connection.delete(this.getDetailPath(primaryKey), {}, {});
    };
    /**
     * Retrieves an existing instance of the given resource. Does not subscribe
     * to subsequent updates. For reactive updates use query/queryOne.
     *
     * @param primaryKey Instance primary key
     * @return An observable that emits the response
     */
    RESTResource.prototype.get = function (primaryKey) {
        return this.connection.get(this.getDetailPath(primaryKey));
    };
    /**
     * Performs a live query against this resource. Subscribing to the returned
     * observable will track any changes made to the resources returned by the
     * given query.
     *
     * @param query Query
     */
    RESTResource.prototype.query = function (query) {
        if (query === void 0) { query = {}; }
        return _super.prototype.reactiveRequest.call(this, query, this.getQueryPath(query));
    };
    /**
     * Performs a live query against this resource. Subscribing to the returned
     * observable will track any changes made to the resources returned by the
     * given query.
     *
     * The query must match only a single item. Otherwise, an error will be
     * propagated along the observable.
     *
     * DON'T FORGET TO HANDLE THE ERRORS!
     *
     * @param query Query
     */
    RESTResource.prototype.queryOne = function (query) {
        if (query === void 0) { query = {}; }
        return this.query(query).map(function (items) {
            if (!items.length) {
                throw new errors_1.QueryOneError('The query returned no items.');
            }
            if (items.length > 1) {
                throw new errors_1.QueryOneError('The query returned multiple items.');
            }
            return items[0];
        });
    };
    return RESTResource;
}(resource_1.Resource));
exports.RESTResource = RESTResource;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL3Jlc3QvcmVzdF9yZXNvdXJjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFHQSwyQ0FBd0M7QUFDeEMsdUNBQTJDO0FBRzNDOztHQUVHO0FBQ0g7SUFBcUMsZ0NBQVE7SUFDekM7Ozs7O09BS0c7SUFDSCxzQkFBb0IsS0FBYSxFQUFFLFVBQXNCO1FBQXpELFlBQ0ksa0JBQU0sVUFBVSxDQUFDLFNBQ3BCO1FBRm1CLFdBQUssR0FBTCxLQUFLLENBQVE7O0lBRWpDLENBQUM7SUFLRCxzQkFBVyw4QkFBSTtRQUhmOztXQUVHO2FBQ0g7WUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUN0QixDQUFDOzs7T0FBQTtJQUVPLHVDQUFnQixHQUF4QjtRQUNJLE1BQU0sQ0FBSSxJQUFJLENBQUMsV0FBVyxFQUFFLFNBQUksSUFBSSxDQUFDLEtBQU8sQ0FBQztJQUNqRCxDQUFDO0lBRUQ7O09BRUc7SUFDTyxrQ0FBVyxHQUFyQjtRQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUNuQyxDQUFDO0lBRUQ7O09BRUc7SUFDSSx3Q0FBaUIsR0FBeEIsVUFBeUIsTUFBYztRQUNuQyxNQUFNLENBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxTQUFJLE1BQVEsQ0FBQztJQUM3QyxDQUFDO0lBRUQ7O09BRUc7SUFDTyxvQ0FBYSxHQUF2QixVQUF3QixVQUEyQjtRQUMvQyxNQUFNLENBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFLFNBQUksVUFBWSxDQUFDO0lBQ3RELENBQUM7SUFFRDs7T0FFRztJQUNJLDBDQUFtQixHQUExQixVQUEyQixVQUEyQixFQUFFLE1BQWM7UUFDbEUsTUFBTSxDQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLFNBQUksTUFBUSxDQUFDO0lBQ3pELENBQUM7SUFFRDs7T0FFRztJQUNPLG1DQUFZLEdBQXRCLFVBQXVCLEtBQWtCO1FBQ3JDLE1B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QztRQUNwQixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFDTCxtQkFBQztBQUFELENBektBLEFBeUtDLENBektvQyxtQkFBUSxHQXlLNUM7QUF6S1ksb0NBQVkiLCJmaWxlIjoiYXBpL3Jlc291cmNlcy9yZXN0L3Jlc3RfcmVzb3VyY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSeCBmcm9tICdyeCc7XG5cbmltcG9ydCB7Q29ubmVjdGlvbn0gZnJvbSAnLi4vLi4vY29ubmVjdGlvbic7XG5pbXBvcnQge1Jlc291cmNlfSBmcm9tICcuLi8uLi9yZXNvdXJjZSc7XG5pbXBvcnQge1F1ZXJ5T25lRXJyb3J9IGZyb20gJy4uLy4uL2Vycm9ycyc7XG5pbXBvcnQgKiBhcyB0eXBlcyBmcm9tICcuLi8uLi90eXBlcy9yZXN0JztcblxuLyoqXG4gKiBBIHJlc291cmNlIGNsYXNzIGJhY2tlZCBieSBhIGdlbmVzaXMgcGxhdGZvcm0gbW9kZWwuXG4gKi9cbmV4cG9ydCBjbGFzcyBSRVNUUmVzb3VyY2U8VD4gZXh0ZW5kcyBSZXNvdXJjZSB7XG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0cyBhIG5ldyBSRVNUIHJlc291cmNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIG5hbWUgUmVzb3VyY2UgbmFtZVxuICAgICAqIEBwYXJhbSBjb25uZWN0aW9uIENvbm5lY3Rpb24gd2l0aCB0aGUgZ2VuZXNpcyBwbGF0Zm9ybSBzZXJ2ZXJcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9uYW1lOiBzdHJpbmcsIGNvbm5lY3Rpb246IENvbm5lY3Rpb24pIHtcbiAgICAgICAgc3VwZXIoY29ubmVjdGlvbik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyByZXNvdXJjZSBuYW1lLlxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQgbmFtZSgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5fbmFtZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9nZXRSZXNvdXJjZVBhdGgoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMuZ2V0QmFzZVBhdGgoKX0vJHt0aGlzLl9uYW1lfWA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgcGF0aCB1c2VkIGZvciByZXF1ZXN0aW5nIGEgbGlzdCBvZiByZXNvdXJjZSBpdGVtcy5cbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgZ2V0TGlzdFBhdGgoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dldFJlc291cmNlUGF0aCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHBhdGggdXNlZCBmb3IgY2FsbGluZyBhIG1ldGhvZCBvbiB0aGUgcmVzb3VyY2UgdHlwZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0TGlzdE1ldGhvZFBhdGgobWV0aG9kOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYCR7dGhpcy5nZXRMaXN0UGF0aCgpfS8ke21ldGhvZH1gO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHBhdGggdXNlZCBmb3IgcmVxdWVzdGluZyBhIHNwZWNpZmljIHJlc291cmNlIGl0ZW0uXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGdldERldGFpbFBhdGgocHJpbWFyeUtleTogbnVtYmVyIHwgc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMuX2dldFJlc291cmNlUGF0aCgpfS8ke3ByaW1hcnlLZXl9YDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBwYXRoIHVzZWQgZm9yIGNhbGxpbmcgYSBtZXRob2Qgb24gYSBzcGVjaWZpYyByZXNvdXJjZSBpdGVtLlxuICAgICAqL1xuICAgIHB1YmxpYyBnZXREZXRhaWxNZXRob2RQYXRoKHByaW1hcnlLZXk6IG51bWJlciB8IHN0cmluZywgbWV0aG9kOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYCR7dGhpcy5nZXREZXRhaWxQYXRoKHByaW1hcnlLZXkpfS8ke21ldGhvZH1gO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHBhdGggdXNlZCBmb3IgcXVlcnlpbmcgdGhlIHJlc291cmNlLlxuICAgICAqL1xuICAgIHByb3RlY3RlZCBnZXRRdWVyeVBhdGgocXVlcnk6IHR5cGVzLlF1ZXJ5KTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0TGlzdFBhdGgoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxscyBhIG1ldGhvZCBvbiBhbiBpbnN0YW5jZSBvZiB0aGUgZ2l2ZW4gcmVzb3VyY2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcHJpbWFyeUtleSBJbnN0YW5jZSBwcmltYXJ5IGtleVxuICAgICAqIEBwYXJhbSBtZXRob2QgTWV0aG9kIG5hbWVcbiAgICAgKiBAcGFyYW0gZGF0YSBNZXRob2QgZGF0YSBvYmplY3RcbiAgICAgKiBAcmV0dXJuIEFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB0aGUgcmVzcG9uc2VcbiAgICAgKi9cbiAgICBwdWJsaWMgY2FsbE1ldGhvZDxVPihwcmltYXJ5S2V5OiBudW1iZXIgfCBzdHJpbmcsIG1ldGhvZDogc3RyaW5nLCBkYXRhOiBhbnkgPSB7fSk6IFJ4Lk9ic2VydmFibGU8VT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uLnBvc3Q8VT4odGhpcy5nZXREZXRhaWxNZXRob2RQYXRoKHByaW1hcnlLZXksIG1ldGhvZCksIGRhdGEsIHt9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxscyBhIG1ldGhvZCBvbiB0aGUgZ2l2ZW4gcmVzb3VyY2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbWV0aG9kIE1ldGhvZCBuYW1lXG4gICAgICogQHBhcmFtIGRhdGEgTWV0aG9kIGRhdGEgb2JqZWN0XG4gICAgICogQHJldHVybiBBbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgdGhlIHJlc3BvbnNlXG4gICAgICovXG4gICAgcHVibGljIGNhbGxMaXN0TWV0aG9kPFU+KG1ldGhvZDogc3RyaW5nLCBkYXRhOiBhbnkgPSB7fSk6IFJ4Lk9ic2VydmFibGU8VT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uLnBvc3Q8VT4odGhpcy5nZXRMaXN0TWV0aG9kUGF0aChtZXRob2QpLCBkYXRhLCB7fSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiB0aGUgZ2l2ZW4gcmVzb3VyY2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZGF0YSBPYmplY3QgYXR0cmlidXRlc1xuICAgICAqIEByZXR1cm4gQW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHRoZSByZXNwb25zZVxuICAgICAqL1xuICAgIHB1YmxpYyBjcmVhdGUoZGF0YTogT2JqZWN0KTogUnguT2JzZXJ2YWJsZTxUPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbm5lY3Rpb24ucG9zdDxUPih0aGlzLmdldExpc3RQYXRoKCksIGRhdGEsIHt9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIGFuIGV4aXN0aW5nIGluc3RhbmNlIG9mIHRoZSBnaXZlbiByZXNvdXJjZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwcmltYXJ5S2V5IEluc3RhbmNlIHByaW1hcnkga2V5XG4gICAgICogQHBhcmFtIGRhdGEgT2JqZWN0IGF0dHJpYnV0ZXNcbiAgICAgKiBAcmV0dXJuIEFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB0aGUgcmVzcG9uc2VcbiAgICAgKi9cbiAgICBwdWJsaWMgdXBkYXRlKHByaW1hcnlLZXk6IG51bWJlciB8IHN0cmluZywgZGF0YTogT2JqZWN0KTogUnguT2JzZXJ2YWJsZTxUPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbm5lY3Rpb24ucGF0Y2g8VD4odGhpcy5nZXREZXRhaWxQYXRoKHByaW1hcnlLZXkpLCBkYXRhLCB7fSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVwbGFjZXMgYW4gZXhpc3RpbmcgaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIHJlc291cmNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHByaW1hcnlLZXkgSW5zdGFuY2UgcHJpbWFyeSBrZXlcbiAgICAgKiBAcGFyYW0gZGF0YSBPYmplY3QgYXR0cmlidXRlc1xuICAgICAqIEByZXR1cm4gQW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHRoZSByZXNwb25zZVxuICAgICAqL1xuICAgIHB1YmxpYyByZXBsYWNlKHByaW1hcnlLZXk6IG51bWJlciB8IHN0cmluZywgZGF0YTogT2JqZWN0KTogUnguT2JzZXJ2YWJsZTxUPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbm5lY3Rpb24ucHV0PFQ+KHRoaXMuZ2V0RGV0YWlsUGF0aChwcmltYXJ5S2V5KSwgZGF0YSwge30pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlbGV0ZXMgYW4gZXhpc3RpbmcgaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIHJlc291cmNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHByaW1hcnlLZXkgSW5zdGFuY2UgcHJpbWFyeSBrZXlcbiAgICAgKiBAcmV0dXJuIEFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB0aGUgcmVzcG9uc2VcbiAgICAgKi9cbiAgICBwdWJsaWMgZGVsZXRlKHByaW1hcnlLZXk6IG51bWJlciB8IHN0cmluZyk6IFJ4Lk9ic2VydmFibGU8T2JqZWN0PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbm5lY3Rpb24uZGVsZXRlKHRoaXMuZ2V0RGV0YWlsUGF0aChwcmltYXJ5S2V5KSwge30sIHt9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZXMgYW4gZXhpc3RpbmcgaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIHJlc291cmNlLiBEb2VzIG5vdCBzdWJzY3JpYmVcbiAgICAgKiB0byBzdWJzZXF1ZW50IHVwZGF0ZXMuIEZvciByZWFjdGl2ZSB1cGRhdGVzIHVzZSBxdWVyeS9xdWVyeU9uZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwcmltYXJ5S2V5IEluc3RhbmNlIHByaW1hcnkga2V5XG4gICAgICogQHJldHVybiBBbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgdGhlIHJlc3BvbnNlXG4gICAgICovXG4gICAgcHVibGljIGdldChwcmltYXJ5S2V5OiBudW1iZXIgfCBzdHJpbmcpOiBSeC5PYnNlcnZhYmxlPFQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29ubmVjdGlvbi5nZXQ8VD4odGhpcy5nZXREZXRhaWxQYXRoKHByaW1hcnlLZXkpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtcyBhIGxpdmUgcXVlcnkgYWdhaW5zdCB0aGlzIHJlc291cmNlLiBTdWJzY3JpYmluZyB0byB0aGUgcmV0dXJuZWRcbiAgICAgKiBvYnNlcnZhYmxlIHdpbGwgdHJhY2sgYW55IGNoYW5nZXMgbWFkZSB0byB0aGUgcmVzb3VyY2VzIHJldHVybmVkIGJ5IHRoZVxuICAgICAqIGdpdmVuIHF1ZXJ5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHF1ZXJ5IFF1ZXJ5XG4gICAgICovXG4gICAgcHVibGljIHF1ZXJ5KHF1ZXJ5OiB0eXBlcy5RdWVyeSA9IHt9KTogUnguT2JzZXJ2YWJsZTxUW10+IHtcbiAgICAgICAgcmV0dXJuIHN1cGVyLnJlYWN0aXZlUmVxdWVzdDxUPihxdWVyeSwgdGhpcy5nZXRRdWVyeVBhdGgocXVlcnkpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtcyBhIGxpdmUgcXVlcnkgYWdhaW5zdCB0aGlzIHJlc291cmNlLiBTdWJzY3JpYmluZyB0byB0aGUgcmV0dXJuZWRcbiAgICAgKiBvYnNlcnZhYmxlIHdpbGwgdHJhY2sgYW55IGNoYW5nZXMgbWFkZSB0byB0aGUgcmVzb3VyY2VzIHJldHVybmVkIGJ5IHRoZVxuICAgICAqIGdpdmVuIHF1ZXJ5LlxuICAgICAqXG4gICAgICogVGhlIHF1ZXJ5IG11c3QgbWF0Y2ggb25seSBhIHNpbmdsZSBpdGVtLiBPdGhlcndpc2UsIGFuIGVycm9yIHdpbGwgYmVcbiAgICAgKiBwcm9wYWdhdGVkIGFsb25nIHRoZSBvYnNlcnZhYmxlLlxuICAgICAqXG4gICAgICogRE9OJ1QgRk9SR0VUIFRPIEhBTkRMRSBUSEUgRVJST1JTIVxuICAgICAqXG4gICAgICogQHBhcmFtIHF1ZXJ5IFF1ZXJ5XG4gICAgICovXG4gICAgcHVibGljIHF1ZXJ5T25lKHF1ZXJ5OiB0eXBlcy5RdWVyeSA9IHt9KTogUnguT2JzZXJ2YWJsZTxUPiB7XG4gICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5KHF1ZXJ5KS5tYXAoKGl0ZW1zKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWl0ZW1zLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBRdWVyeU9uZUVycm9yKCdUaGUgcXVlcnkgcmV0dXJuZWQgbm8gaXRlbXMuJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpdGVtcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFF1ZXJ5T25lRXJyb3IoJ1RoZSBxdWVyeSByZXR1cm5lZCBtdWx0aXBsZSBpdGVtcy4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGl0ZW1zWzBdO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=
