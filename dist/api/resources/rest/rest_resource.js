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
     * @param options Query options
     */
    RESTResource.prototype.query = function (query, options) {
        if (query === void 0) { query = {}; }
        return _super.prototype.reactiveRequest.call(this, query, this.getQueryPath(query), options);
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
     * @param options Query options
     */
    RESTResource.prototype.queryOne = function (query, options) {
        if (query === void 0) { query = {}; }
        return this.query(query, options).map(function (items) {
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL3Jlc3QvcmVzdF9yZXNvdXJjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFHQSwyQ0FBc0Q7QUFDdEQsdUNBQTJDO0FBRzNDOztHQUVHO0FBQ0g7SUFBcUMsZ0NBQVE7SUFDekM7Ozs7O09BS0c7SUFDSCxzQkFBb0IsS0FBYSxFQUFFLFVBQXNCO1FBQXpELFlBQ0ksa0JBQU0sVUFBVSxDQUFDLFNBQ3BCO1FBRm1CLFdBQUssR0FBTCxLQUFLLENBQVE7O0lBRWpDLENBQUM7SUFLRCxzQkFBVyw4QkFBSTtRQUhmOztXQUVHO2FBQ0g7WUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUN0QixDQUFDOzs7T0FBQTtJQUVPLHVDQUFnQixHQUF4QjtRQUNJLE1BQU0sQ0FBSSxJQUFJLENBQUMsV0FBVyxFQUFFLFNBQUksSUFBSSxDQUFDLEtBQU8sQ0FBQztJQUNqRCxDQUFDO0lBRUQ7O09BRUc7SUFDTyxrQ0FBVyxHQUFyQjtRQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUNuQyxDQUFDO0lBRUQ7O09BRUc7SUFDSSx3Q0FBaUIsR0FBeEIsVUFBeUIsTUFBYztRQUNuQyxNQUFNLENBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxTQUFJLE1BQVEsQ0FBQztJQUM3QyxDQUFDO0lBRUQ7O09BRUc7SUFDTyxvQ0FBYSxHQUF2QixVQUF3QixVQUEyQjtRQUMvQyxNQUFNLENBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFLFNBQUksVUFBWSxDQUFDO0lBQ3RELENBQUM7SUFFRDs7T0FFRztJQUNJLDBDQUFtQixHQUExQixVQUEyQixVQUEyQixFQUFFLE1BQWM7UUFDbEUsTUFBTSxDQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLFNBQUksTUFBUSxDQUFDO0lBQ3pELENBQUM7SUFFRDs7T0FFRztJQUNPLG1DQUFZLEdBQXRCLFVBQXVCLEtBQWtCO1FBQ3JDLE1B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LENBQUM7WUFFRCxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUNMLG1CQUFDO0FBQUQsQ0EzS0EsQUEyS0MsQ0EzS29DLG1CQUFRLEdBMks1QztBQTNLWSxvQ0FBWSIsImZpbGUiOiJhcGkvcmVzb3VyY2VzL3Jlc3QvcmVzdF9yZXNvdXJjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJ4IGZyb20gJ3J4JztcblxuaW1wb3J0IHtDb25uZWN0aW9ufSBmcm9tICcuLi8uLi9jb25uZWN0aW9uJztcbmltcG9ydCB7UmVzb3VyY2UsIFF1ZXJ5T3B0aW9uc30gZnJvbSAnLi4vLi4vcmVzb3VyY2UnO1xuaW1wb3J0IHtRdWVyeU9uZUVycm9yfSBmcm9tICcuLi8uLi9lcnJvcnMnO1xuaW1wb3J0ICogYXMgdHlwZXMgZnJvbSAnLi4vLi4vdHlwZXMvcmVzdCc7XG5cbi8qKlxuICogQSByZXNvdXJjZSBjbGFzcyBiYWNrZWQgYnkgYSBnZW5lc2lzIHBsYXRmb3JtIG1vZGVsLlxuICovXG5leHBvcnQgY2xhc3MgUkVTVFJlc291cmNlPFQ+IGV4dGVuZHMgUmVzb3VyY2Uge1xuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdHMgYSBuZXcgUkVTVCByZXNvdXJjZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBuYW1lIFJlc291cmNlIG5hbWVcbiAgICAgKiBAcGFyYW0gY29ubmVjdGlvbiBDb25uZWN0aW9uIHdpdGggdGhlIGdlbmVzaXMgcGxhdGZvcm0gc2VydmVyXG4gICAgICovXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfbmFtZTogc3RyaW5nLCBjb25uZWN0aW9uOiBDb25uZWN0aW9uKSB7XG4gICAgICAgIHN1cGVyKGNvbm5lY3Rpb24pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgcmVzb3VyY2UgbmFtZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX25hbWU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0UmVzb3VyY2VQYXRoKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLmdldEJhc2VQYXRoKCl9LyR7dGhpcy5fbmFtZX1gO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHBhdGggdXNlZCBmb3IgcmVxdWVzdGluZyBhIGxpc3Qgb2YgcmVzb3VyY2UgaXRlbXMuXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGdldExpc3RQYXRoKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRSZXNvdXJjZVBhdGgoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBwYXRoIHVzZWQgZm9yIGNhbGxpbmcgYSBtZXRob2Qgb24gdGhlIHJlc291cmNlIHR5cGUuXG4gICAgICovXG4gICAgcHVibGljIGdldExpc3RNZXRob2RQYXRoKG1ldGhvZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMuZ2V0TGlzdFBhdGgoKX0vJHttZXRob2R9YDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBwYXRoIHVzZWQgZm9yIHJlcXVlc3RpbmcgYSBzcGVjaWZpYyByZXNvdXJjZSBpdGVtLlxuICAgICAqL1xuICAgIHByb3RlY3RlZCBnZXREZXRhaWxQYXRoKHByaW1hcnlLZXk6IG51bWJlciB8IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLl9nZXRSZXNvdXJjZVBhdGgoKX0vJHtwcmltYXJ5S2V5fWA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgcGF0aCB1c2VkIGZvciBjYWxsaW5nIGEgbWV0aG9kIG9uIGEgc3BlY2lmaWMgcmVzb3VyY2UgaXRlbS5cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0RGV0YWlsTWV0aG9kUGF0aChwcmltYXJ5S2V5OiBudW1iZXIgfCBzdHJpbmcsIG1ldGhvZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMuZ2V0RGV0YWlsUGF0aChwcmltYXJ5S2V5KX0vJHttZXRob2R9YDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBwYXRoIHVzZWQgZm9yIHF1ZXJ5aW5nIHRoZSByZXNvdXJjZS5cbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgZ2V0UXVlcnlQYXRoKHF1ZXJ5OiB0eXBlcy5RdWVyeSk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldExpc3RQYXRoKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsbHMgYSBtZXRob2Qgb24gYW4gaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIHJlc291cmNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHByaW1hcnlLZXkgSW5zdGFuY2UgcHJpbWFyeSBrZXlcbiAgICAgKiBAcGFyYW0gbWV0aG9kIE1ldGhvZCBuYW1lXG4gICAgICogQHBhcmFtIGRhdGEgTWV0aG9kIGRhdGEgb2JqZWN0XG4gICAgICogQHJldHVybiBBbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgdGhlIHJlc3BvbnNlXG4gICAgICovXG4gICAgcHVibGljIGNhbGxNZXRob2Q8VT4ocHJpbWFyeUtleTogbnVtYmVyIHwgc3RyaW5nLCBtZXRob2Q6IHN0cmluZywgZGF0YTogYW55ID0ge30pOiBSeC5PYnNlcnZhYmxlPFU+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29ubmVjdGlvbi5wb3N0PFU+KHRoaXMuZ2V0RGV0YWlsTWV0aG9kUGF0aChwcmltYXJ5S2V5LCBtZXRob2QpLCBkYXRhLCB7fSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsbHMgYSBtZXRob2Qgb24gdGhlIGdpdmVuIHJlc291cmNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIG1ldGhvZCBNZXRob2QgbmFtZVxuICAgICAqIEBwYXJhbSBkYXRhIE1ldGhvZCBkYXRhIG9iamVjdFxuICAgICAqIEByZXR1cm4gQW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHRoZSByZXNwb25zZVxuICAgICAqL1xuICAgIHB1YmxpYyBjYWxsTGlzdE1ldGhvZDxVPihtZXRob2Q6IHN0cmluZywgZGF0YTogYW55ID0ge30pOiBSeC5PYnNlcnZhYmxlPFU+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29ubmVjdGlvbi5wb3N0PFU+KHRoaXMuZ2V0TGlzdE1ldGhvZFBhdGgobWV0aG9kKSwgZGF0YSwge30pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIHJlc291cmNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGRhdGEgT2JqZWN0IGF0dHJpYnV0ZXNcbiAgICAgKiBAcmV0dXJuIEFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB0aGUgcmVzcG9uc2VcbiAgICAgKi9cbiAgICBwdWJsaWMgY3JlYXRlKGRhdGE6IE9iamVjdCk6IFJ4Lk9ic2VydmFibGU8VD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uLnBvc3Q8VD4odGhpcy5nZXRMaXN0UGF0aCgpLCBkYXRhLCB7fSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyBhbiBleGlzdGluZyBpbnN0YW5jZSBvZiB0aGUgZ2l2ZW4gcmVzb3VyY2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcHJpbWFyeUtleSBJbnN0YW5jZSBwcmltYXJ5IGtleVxuICAgICAqIEBwYXJhbSBkYXRhIE9iamVjdCBhdHRyaWJ1dGVzXG4gICAgICogQHJldHVybiBBbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgdGhlIHJlc3BvbnNlXG4gICAgICovXG4gICAgcHVibGljIHVwZGF0ZShwcmltYXJ5S2V5OiBudW1iZXIgfCBzdHJpbmcsIGRhdGE6IE9iamVjdCk6IFJ4Lk9ic2VydmFibGU8VD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uLnBhdGNoPFQ+KHRoaXMuZ2V0RGV0YWlsUGF0aChwcmltYXJ5S2V5KSwgZGF0YSwge30pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlcGxhY2VzIGFuIGV4aXN0aW5nIGluc3RhbmNlIG9mIHRoZSBnaXZlbiByZXNvdXJjZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwcmltYXJ5S2V5IEluc3RhbmNlIHByaW1hcnkga2V5XG4gICAgICogQHBhcmFtIGRhdGEgT2JqZWN0IGF0dHJpYnV0ZXNcbiAgICAgKiBAcmV0dXJuIEFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB0aGUgcmVzcG9uc2VcbiAgICAgKi9cbiAgICBwdWJsaWMgcmVwbGFjZShwcmltYXJ5S2V5OiBudW1iZXIgfCBzdHJpbmcsIGRhdGE6IE9iamVjdCk6IFJ4Lk9ic2VydmFibGU8VD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uLnB1dDxUPih0aGlzLmdldERldGFpbFBhdGgocHJpbWFyeUtleSksIGRhdGEsIHt9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWxldGVzIGFuIGV4aXN0aW5nIGluc3RhbmNlIG9mIHRoZSBnaXZlbiByZXNvdXJjZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwcmltYXJ5S2V5IEluc3RhbmNlIHByaW1hcnkga2V5XG4gICAgICogQHJldHVybiBBbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgdGhlIHJlc3BvbnNlXG4gICAgICovXG4gICAgcHVibGljIGRlbGV0ZShwcmltYXJ5S2V5OiBudW1iZXIgfCBzdHJpbmcpOiBSeC5PYnNlcnZhYmxlPE9iamVjdD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uLmRlbGV0ZSh0aGlzLmdldERldGFpbFBhdGgocHJpbWFyeUtleSksIHt9LCB7fSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0cmlldmVzIGFuIGV4aXN0aW5nIGluc3RhbmNlIG9mIHRoZSBnaXZlbiByZXNvdXJjZS4gRG9lcyBub3Qgc3Vic2NyaWJlXG4gICAgICogdG8gc3Vic2VxdWVudCB1cGRhdGVzLiBGb3IgcmVhY3RpdmUgdXBkYXRlcyB1c2UgcXVlcnkvcXVlcnlPbmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcHJpbWFyeUtleSBJbnN0YW5jZSBwcmltYXJ5IGtleVxuICAgICAqIEByZXR1cm4gQW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHRoZSByZXNwb25zZVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQocHJpbWFyeUtleTogbnVtYmVyIHwgc3RyaW5nKTogUnguT2JzZXJ2YWJsZTxUPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbm5lY3Rpb24uZ2V0PFQ+KHRoaXMuZ2V0RGV0YWlsUGF0aChwcmltYXJ5S2V5KSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGVyZm9ybXMgYSBsaXZlIHF1ZXJ5IGFnYWluc3QgdGhpcyByZXNvdXJjZS4gU3Vic2NyaWJpbmcgdG8gdGhlIHJldHVybmVkXG4gICAgICogb2JzZXJ2YWJsZSB3aWxsIHRyYWNrIGFueSBjaGFuZ2VzIG1hZGUgdG8gdGhlIHJlc291cmNlcyByZXR1cm5lZCBieSB0aGVcbiAgICAgKiBnaXZlbiBxdWVyeS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBxdWVyeSBRdWVyeVxuICAgICAqIEBwYXJhbSBvcHRpb25zIFF1ZXJ5IG9wdGlvbnNcbiAgICAgKi9cbiAgICBwdWJsaWMgcXVlcnkocXVlcnk6IHR5cGVzLlF1ZXJ5ID0ge30sIG9wdGlvbnM/OiBRdWVyeU9wdGlvbnMpOiBSeC5PYnNlcnZhYmxlPFRbXT4ge1xuICAgICAgICByZXR1cm4gc3VwZXIucmVhY3RpdmVSZXF1ZXN0PFQ+KHF1ZXJ5LCB0aGlzLmdldFF1ZXJ5UGF0aChxdWVyeSksIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm1zIGEgbGl2ZSBxdWVyeSBhZ2FpbnN0IHRoaXMgcmVzb3VyY2UuIFN1YnNjcmliaW5nIHRvIHRoZSByZXR1cm5lZFxuICAgICAqIG9ic2VydmFibGUgd2lsbCB0cmFjayBhbnkgY2hhbmdlcyBtYWRlIHRvIHRoZSByZXNvdXJjZXMgcmV0dXJuZWQgYnkgdGhlXG4gICAgICogZ2l2ZW4gcXVlcnkuXG4gICAgICpcbiAgICAgKiBUaGUgcXVlcnkgbXVzdCBtYXRjaCBvbmx5IGEgc2luZ2xlIGl0ZW0uIE90aGVyd2lzZSwgYW4gZXJyb3Igd2lsbCBiZVxuICAgICAqIHByb3BhZ2F0ZWQgYWxvbmcgdGhlIG9ic2VydmFibGUuXG4gICAgICpcbiAgICAgKiBET04nVCBGT1JHRVQgVE8gSEFORExFIFRIRSBFUlJPUlMhXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcXVlcnkgUXVlcnlcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBRdWVyeSBvcHRpb25zXG4gICAgICovXG4gICAgcHVibGljIHF1ZXJ5T25lKHF1ZXJ5OiB0eXBlcy5RdWVyeSA9IHt9LCBvcHRpb25zPzogUXVlcnlPcHRpb25zKTogUnguT2JzZXJ2YWJsZTxUPiB7XG4gICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5KHF1ZXJ5LCBvcHRpb25zKS5tYXAoKGl0ZW1zKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWl0ZW1zLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBRdWVyeU9uZUVycm9yKCdUaGUgcXVlcnkgcmV0dXJuZWQgbm8gaXRlbXMuJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpdGVtcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFF1ZXJ5T25lRXJyb3IoJ1RoZSBxdWVyeSByZXR1cm5lZCBtdWx0aXBsZSBpdGVtcy4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGl0ZW1zWzBdO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=
