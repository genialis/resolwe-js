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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL3Jlc3QvcmVzdF9yZXNvdXJjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFHQSwyQ0FBd0M7QUFDeEMsdUNBQTJDO0FBRzNDOztHQUVHO0FBQ0g7SUFBcUMsZ0NBQVE7SUFDekM7Ozs7O09BS0c7SUFDSCxzQkFBb0IsS0FBYSxFQUFFLFVBQXNCO1FBQXpELFlBQ0ksa0JBQU0sVUFBVSxDQUFDLFNBQ3BCO1FBRm1CLFdBQUssR0FBTCxLQUFLLENBQVE7O0lBRWpDLENBQUM7SUFLRCxzQkFBVyw4QkFBSTtRQUhmOztXQUVHO2FBQ0g7WUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUN0QixDQUFDOzs7T0FBQTtJQUVPLHVDQUFnQixHQUF4QjtRQUNJLE1BQU0sQ0FBSSxJQUFJLENBQUMsV0FBVyxFQUFFLFNBQUksSUFBSSxDQUFDLEtBQU8sQ0FBQztJQUNqRCxDQUFDO0lBRUQ7O09BRUc7SUFDTyxrQ0FBVyxHQUFyQjtRQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUNuQyxDQUFDO0lBRUQ7O09BRUc7SUFDSSx3Q0FBaUIsR0FBeEIsVUFBeUIsTUFBYztRQUNuQyxNQUFNLENBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxTQUFJLE1BQVEsQ0FBQztJQUM3QyxDQUFDO0lBRUQ7O09BRUc7SUFDTyxvQ0FBYSxHQUF2QixVQUF3QixVQUEyQjtRQUMvQyxNQUFNLENBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFLFNBQUksVUFBWSxDQUFDO0lBQ3RELENBQUM7SUFFRDs7T0FFRztJQUNJLDBDQUFtQixHQUExQixVQUEyQixVQUEyQixFQUFFLE1BQWM7UUFDbEUsTUFBTSxDQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLFNBQUksTUFBUSxDQUFDO0lBQ3pELENBQUM7SUFFRDs7T0FFRztJQUNPLG1DQUFZLEdBQXRCLFVBQXVCLEtBQWtCO1FBQ3JDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDOUIsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSSxpQ0FBVSxHQUFqQixVQUFxQixVQUEyQixFQUFFLE1BQWMsRUFBRSxJQUFjO1FBQWQscUJBQUEsRUFBQSxTQUFjO1FBQzVFLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBSSxJQUFJLENBQUMsbUJBQW1CLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztJQUMzRixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSSw2QkFBTSxHQUFiLFVBQWMsSUFBWTtRQUN0QixNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNqRSxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0ksNkJBQU0sR0FBYixVQUFjLFVBQTJCLEVBQUUsSUFBWTtRQUNuRCxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDOUUsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNJLDhCQUFPLEdBQWQsVUFBZSxVQUEyQixFQUFFLElBQVk7UUFDcEQsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzVFLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNJLDZCQUFNLEdBQWIsVUFBYyxVQUEyQjtRQUNyQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDMUUsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNJLDBCQUFHLEdBQVYsVUFBVyxVQUEyQjtRQUNsQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSSw0QkFBSyxHQUFaLFVBQWEsS0FBdUI7UUFBdkIsc0JBQUEsRUFBQSxVQUF1QjtRQUNoQyxNQUFNLENBQUMsaUJBQU0sZUFBZSxZQUFJLEtBQUssRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDckUsQ0FBQztJQUVEOzs7Ozs7Ozs7OztPQVdHO0lBQ0ksK0JBQVEsR0FBZixVQUFnQixLQUF1QjtRQUF2QixzQkFBQSxFQUFBLFVBQXVCO1FBQ25DLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFDLEtBQUs7WUFDL0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDaEIsTUFBTSxJQUFJLHNCQUFhLENBQUMsOEJBQThCLENBQUMsQ0FBQztZQUM1RCxDQUFDO1lBRUQsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuQixNQUFNLElBQUksc0JBQWEsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO1lBQ2xFLENBQUM7WUFFRCxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUNMLG1CQUFDO0FBQUQsQ0E5SkEsQUE4SkMsQ0E5Sm9DLG1CQUFRLEdBOEo1QztBQTlKWSxvQ0FBWSIsImZpbGUiOiJhcGkvcmVzb3VyY2VzL3Jlc3QvcmVzdF9yZXNvdXJjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJ4IGZyb20gJ3J4JztcblxuaW1wb3J0IHtDb25uZWN0aW9ufSBmcm9tICcuLi8uLi9jb25uZWN0aW9uJztcbmltcG9ydCB7UmVzb3VyY2V9IGZyb20gJy4uLy4uL3Jlc291cmNlJztcbmltcG9ydCB7UXVlcnlPbmVFcnJvcn0gZnJvbSAnLi4vLi4vZXJyb3JzJztcbmltcG9ydCAqIGFzIHR5cGVzIGZyb20gJy4uLy4uL3R5cGVzL3Jlc3QnO1xuXG4vKipcbiAqIEEgcmVzb3VyY2UgY2xhc3MgYmFja2VkIGJ5IGEgZ2VuZXNpcyBwbGF0Zm9ybSBtb2RlbC5cbiAqL1xuZXhwb3J0IGNsYXNzIFJFU1RSZXNvdXJjZTxUPiBleHRlbmRzIFJlc291cmNlIHtcbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RzIGEgbmV3IFJFU1QgcmVzb3VyY2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbmFtZSBSZXNvdXJjZSBuYW1lXG4gICAgICogQHBhcmFtIGNvbm5lY3Rpb24gQ29ubmVjdGlvbiB3aXRoIHRoZSBnZW5lc2lzIHBsYXRmb3JtIHNlcnZlclxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX25hbWU6IHN0cmluZywgY29ubmVjdGlvbjogQ29ubmVjdGlvbikge1xuICAgICAgICBzdXBlcihjb25uZWN0aW9uKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHJlc291cmNlIG5hbWUuXG4gICAgICovXG4gICAgcHVibGljIGdldCBuYW1lKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLl9uYW1lO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldFJlc291cmNlUGF0aCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYCR7dGhpcy5nZXRCYXNlUGF0aCgpfS8ke3RoaXMuX25hbWV9YDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBwYXRoIHVzZWQgZm9yIHJlcXVlc3RpbmcgYSBsaXN0IG9mIHJlc291cmNlIGl0ZW1zLlxuICAgICAqL1xuICAgIHByb3RlY3RlZCBnZXRMaXN0UGF0aCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0UmVzb3VyY2VQYXRoKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgcGF0aCB1c2VkIGZvciBjYWxsaW5nIGEgbWV0aG9kIG9uIHRoZSByZXNvdXJjZSB0eXBlLlxuICAgICAqL1xuICAgIHB1YmxpYyBnZXRMaXN0TWV0aG9kUGF0aChtZXRob2Q6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLmdldExpc3RQYXRoKCl9LyR7bWV0aG9kfWA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgcGF0aCB1c2VkIGZvciByZXF1ZXN0aW5nIGEgc3BlY2lmaWMgcmVzb3VyY2UgaXRlbS5cbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgZ2V0RGV0YWlsUGF0aChwcmltYXJ5S2V5OiBudW1iZXIgfCBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYCR7dGhpcy5fZ2V0UmVzb3VyY2VQYXRoKCl9LyR7cHJpbWFyeUtleX1gO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHBhdGggdXNlZCBmb3IgY2FsbGluZyBhIG1ldGhvZCBvbiBhIHNwZWNpZmljIHJlc291cmNlIGl0ZW0uXG4gICAgICovXG4gICAgcHVibGljIGdldERldGFpbE1ldGhvZFBhdGgocHJpbWFyeUtleTogbnVtYmVyIHwgc3RyaW5nLCBtZXRob2Q6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLmdldERldGFpbFBhdGgocHJpbWFyeUtleSl9LyR7bWV0aG9kfWA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgcGF0aCB1c2VkIGZvciBxdWVyeWluZyB0aGUgcmVzb3VyY2UuXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGdldFF1ZXJ5UGF0aChxdWVyeTogdHlwZXMuUXVlcnkpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRMaXN0UGF0aCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGxzIGEgbWV0aG9kIG9uIGFuIGluc3RhbmNlIG9mIHRoZSBnaXZlbiByZXNvdXJjZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwcmltYXJ5S2V5IEluc3RhbmNlIHByaW1hcnkga2V5XG4gICAgICogQHBhcmFtIG1ldGhvZCBNZXRob2QgbmFtZVxuICAgICAqIEBwYXJhbSBkYXRhIE1ldGhvZCBkYXRhIG9iamVjdFxuICAgICAqIEByZXR1cm4gQW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHRoZSByZXNwb25zZVxuICAgICAqL1xuICAgIHB1YmxpYyBjYWxsTWV0aG9kPFU+KHByaW1hcnlLZXk6IG51bWJlciB8IHN0cmluZywgbWV0aG9kOiBzdHJpbmcsIGRhdGE6IGFueSA9IHt9KTogUnguT2JzZXJ2YWJsZTxVPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbm5lY3Rpb24ucG9zdDxVPih0aGlzLmdldERldGFpbE1ldGhvZFBhdGgocHJpbWFyeUtleSwgbWV0aG9kKSwgZGF0YSwge30pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIHJlc291cmNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGRhdGEgT2JqZWN0IGF0dHJpYnV0ZXNcbiAgICAgKiBAcmV0dXJuIEFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB0aGUgcmVzcG9uc2VcbiAgICAgKi9cbiAgICBwdWJsaWMgY3JlYXRlKGRhdGE6IE9iamVjdCk6IFJ4Lk9ic2VydmFibGU8VD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uLnBvc3Q8VD4odGhpcy5nZXRMaXN0UGF0aCgpLCBkYXRhLCB7fSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyBhbiBleGlzdGluZyBpbnN0YW5jZSBvZiB0aGUgZ2l2ZW4gcmVzb3VyY2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcHJpbWFyeUtleSBJbnN0YW5jZSBwcmltYXJ5IGtleVxuICAgICAqIEBwYXJhbSBkYXRhIE9iamVjdCBhdHRyaWJ1dGVzXG4gICAgICogQHJldHVybiBBbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgdGhlIHJlc3BvbnNlXG4gICAgICovXG4gICAgcHVibGljIHVwZGF0ZShwcmltYXJ5S2V5OiBudW1iZXIgfCBzdHJpbmcsIGRhdGE6IE9iamVjdCk6IFJ4Lk9ic2VydmFibGU8VD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uLnBhdGNoPFQ+KHRoaXMuZ2V0RGV0YWlsUGF0aChwcmltYXJ5S2V5KSwgZGF0YSwge30pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlcGxhY2VzIGFuIGV4aXN0aW5nIGluc3RhbmNlIG9mIHRoZSBnaXZlbiByZXNvdXJjZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwcmltYXJ5S2V5IEluc3RhbmNlIHByaW1hcnkga2V5XG4gICAgICogQHBhcmFtIGRhdGEgT2JqZWN0IGF0dHJpYnV0ZXNcbiAgICAgKiBAcmV0dXJuIEFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB0aGUgcmVzcG9uc2VcbiAgICAgKi9cbiAgICBwdWJsaWMgcmVwbGFjZShwcmltYXJ5S2V5OiBudW1iZXIgfCBzdHJpbmcsIGRhdGE6IE9iamVjdCk6IFJ4Lk9ic2VydmFibGU8VD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uLnB1dDxUPih0aGlzLmdldERldGFpbFBhdGgocHJpbWFyeUtleSksIGRhdGEsIHt9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWxldGVzIGFuIGV4aXN0aW5nIGluc3RhbmNlIG9mIHRoZSBnaXZlbiByZXNvdXJjZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwcmltYXJ5S2V5IEluc3RhbmNlIHByaW1hcnkga2V5XG4gICAgICogQHJldHVybiBBbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgdGhlIHJlc3BvbnNlXG4gICAgICovXG4gICAgcHVibGljIGRlbGV0ZShwcmltYXJ5S2V5OiBudW1iZXIgfCBzdHJpbmcpOiBSeC5PYnNlcnZhYmxlPE9iamVjdD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uLmRlbGV0ZSh0aGlzLmdldERldGFpbFBhdGgocHJpbWFyeUtleSksIHt9LCB7fSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0cmlldmVzIGFuIGV4aXN0aW5nIGluc3RhbmNlIG9mIHRoZSBnaXZlbiByZXNvdXJjZS4gRG9lcyBub3Qgc3Vic2NyaWJlXG4gICAgICogdG8gc3Vic2VxdWVudCB1cGRhdGVzLiBGb3IgcmVhY3RpdmUgdXBkYXRlcyB1c2UgcXVlcnkvcXVlcnlPbmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcHJpbWFyeUtleSBJbnN0YW5jZSBwcmltYXJ5IGtleVxuICAgICAqIEByZXR1cm4gQW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHRoZSByZXNwb25zZVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQocHJpbWFyeUtleTogbnVtYmVyIHwgc3RyaW5nKTogUnguT2JzZXJ2YWJsZTxUPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbm5lY3Rpb24uZ2V0PFQ+KHRoaXMuZ2V0RGV0YWlsUGF0aChwcmltYXJ5S2V5KSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGVyZm9ybXMgYSBsaXZlIHF1ZXJ5IGFnYWluc3QgdGhpcyByZXNvdXJjZS4gU3Vic2NyaWJpbmcgdG8gdGhlIHJldHVybmVkXG4gICAgICogb2JzZXJ2YWJsZSB3aWxsIHRyYWNrIGFueSBjaGFuZ2VzIG1hZGUgdG8gdGhlIHJlc291cmNlcyByZXR1cm5lZCBieSB0aGVcbiAgICAgKiBnaXZlbiBxdWVyeS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBxdWVyeSBRdWVyeVxuICAgICAqL1xuICAgIHB1YmxpYyBxdWVyeShxdWVyeTogdHlwZXMuUXVlcnkgPSB7fSk6IFJ4Lk9ic2VydmFibGU8VFtdPiB7XG4gICAgICAgIHJldHVybiBzdXBlci5yZWFjdGl2ZVJlcXVlc3Q8VD4ocXVlcnksIHRoaXMuZ2V0UXVlcnlQYXRoKHF1ZXJ5KSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGVyZm9ybXMgYSBsaXZlIHF1ZXJ5IGFnYWluc3QgdGhpcyByZXNvdXJjZS4gU3Vic2NyaWJpbmcgdG8gdGhlIHJldHVybmVkXG4gICAgICogb2JzZXJ2YWJsZSB3aWxsIHRyYWNrIGFueSBjaGFuZ2VzIG1hZGUgdG8gdGhlIHJlc291cmNlcyByZXR1cm5lZCBieSB0aGVcbiAgICAgKiBnaXZlbiBxdWVyeS5cbiAgICAgKlxuICAgICAqIFRoZSBxdWVyeSBtdXN0IG1hdGNoIG9ubHkgYSBzaW5nbGUgaXRlbS4gT3RoZXJ3aXNlLCBhbiBlcnJvciB3aWxsIGJlXG4gICAgICogcHJvcGFnYXRlZCBhbG9uZyB0aGUgb2JzZXJ2YWJsZS5cbiAgICAgKlxuICAgICAqIERPTidUIEZPUkdFVCBUTyBIQU5ETEUgVEhFIEVSUk9SUyFcbiAgICAgKlxuICAgICAqIEBwYXJhbSBxdWVyeSBRdWVyeVxuICAgICAqL1xuICAgIHB1YmxpYyBxdWVyeU9uZShxdWVyeTogdHlwZXMuUXVlcnkgPSB7fSk6IFJ4Lk9ic2VydmFibGU8VD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5xdWVyeShxdWVyeSkubWFwKChpdGVtcykgPT4ge1xuICAgICAgICAgICAgaWYgKCFpdGVtcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgUXVlcnlPbmVFcnJvcignVGhlIHF1ZXJ5IHJldHVybmVkIG5vIGl0ZW1zLicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoaXRlbXMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBRdWVyeU9uZUVycm9yKCdUaGUgcXVlcnkgcmV0dXJuZWQgbXVsdGlwbGUgaXRlbXMuJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBpdGVtc1swXTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIl19
