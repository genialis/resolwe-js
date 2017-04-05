"use strict";
var _ = require("lodash");
var Rx = require("rx");
var queryobserver_1 = require("./queryobserver");
/**
 * An abstract resource class.
 */
var Resource = (function () {
    /**
     * Constructs a new resource.
     *
     * @param connection Connection with the genesis platform server
     */
    function Resource(_connection) {
        this._connection = _connection;
        // Cache query observer identifiers.
        this._queryObserverIdCache = {};
        this._pendingQueries = {};
    }
    Object.defineProperty(Resource.prototype, "connection", {
        /**
         * Connection to the genesis-platform server.
         */
        get: function () {
            return this._connection;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Returns base path that resource path is based upon.
     */
    Resource.prototype.getBasePath = function () {
        return "/api";
    };
    /**
     * Performs any query transformations needed for this resource. The
     * original query object is not modified.
     *
     * @param query Query
     * @return Transformed query
     */
    Resource.prototype.transformQuery = function (query) {
        return _.cloneDeep(query);
    };
    /**
     * Performs a query against this resource and subscribes to subsequent updates.
     */
    Resource.prototype.reactiveRequest = function (query, path) {
        var _this = this;
        // We assume that the same query object on the same resource will always result in the same
        // underlying queryset (and therefore query observer).
        var serializedQuery = JSON.stringify([path, query]);
        return Rx.Observable.create(function (observer) {
            var queryObserverId = _this._queryObserverIdCache[serializedQuery];
            var pendingQueries = _this._pendingQueries[serializedQuery];
            // Perform a REST query to get the observer identifier and to subscribe to new updates.
            var subscriptions = [];
            if (queryObserverId) {
                // This query observer identifier has already been cached. Check if it exists and in this
                // case just subscribe to all items.
                var queryObserver = _this.connection.queryObserverManager().get(queryObserverId, false);
                if (queryObserver) {
                    if (queryObserver.status === queryobserver_1.QueryObserverStatus.INITIALIZED ||
                        queryObserver.status === queryobserver_1.QueryObserverStatus.REINITIALIZING) {
                        subscriptions.push(queryObserver.observable().subscribe(observer));
                    }
                    if (queryObserver.status === queryobserver_1.QueryObserverStatus.INITIALIZED) {
                        observer.onNext(queryObserver.items);
                    }
                }
            }
            if (_.isEmpty(subscriptions)) {
                if (pendingQueries) {
                    // A request for the same query is already in progress.
                    pendingQueries.push(observer);
                }
                else {
                    _this._pendingQueries[serializedQuery] = [observer];
                    query = _.assign(_this.transformQuery(query), { observe: _this.connection.sessionId() });
                    _this.connection.queryObserverManager().chainAfterUnsubscribe(function () { return _this.connection.get(path, query); }).subscribe(function (response) {
                        // Populate messages from this request.
                        var queryObserver = _this.connection.queryObserverManager().get(response.observer);
                        _this._queryObserverIdCache[serializedQuery] = response.observer;
                        // Setup a reinitialization handler for this observer. It may be used in case the parameters
                        // of a connection change and the observer needs to be re-created on the server without losing
                        // any of the client-side subscriptions.
                        queryObserver.setReinitializeHandler(function () {
                            return _this.connection.get(path, query);
                        });
                        for (var _i = 0, _a = _this._pendingQueries[serializedQuery]; _i < _a.length; _i++) {
                            var pendingObserver = _a[_i];
                            subscriptions.push(queryObserver.observable().subscribe(pendingObserver));
                            if (queryObserver.status === queryobserver_1.QueryObserverStatus.INITIALIZED) {
                                // If the query observer is already initialized, emit the current items immediately.
                                pendingObserver.onNext(queryObserver.items);
                            }
                        }
                        delete _this._pendingQueries[serializedQuery];
                        if (queryObserver.status !== queryobserver_1.QueryObserverStatus.INITIALIZED) {
                            queryObserver.initialize(response.items);
                        }
                    }, function (error) {
                        observer.onError(error);
                    });
                }
            }
            return function () {
                // Dispose of the query observer subscription when all subscriptions to this query are stopped.
                for (var _i = 0, subscriptions_1 = subscriptions; _i < subscriptions_1.length; _i++) {
                    var subscription = subscriptions_1[_i];
                    subscription.dispose();
                }
            };
        }).publish().refCount();
    };
    return Resource;
}());
exports.Resource = Resource;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUM7NEJBQ2hELENBQUM7eUJBQ0o7d0JBRUQsT0FBTyxLQUFJLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDO3dCQUU3QyxFQUFFLENBQUMsQ0FBQyxhQUFhLENBQUMsTUFBTSxLQUFLLG1DQUFtQixDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7NEJBQzNELGFBQWEsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUM3QyxDQUFDO29CQUNMLENBQUMsRUFDRCxVQUFDLEtBQUs7d0JBQ0YsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDNUIsQ0FBQyxDQUNKLENBQUM7Z0JBQ04sQ0FBQztZQUNMLENBQUM7WUFFRCxNQUFNLENBQUM7Z0JBQ0gsK0ZBQStGO2dCQUMvRixHQUFHLENBQUMsQ0FBdUIsVUFBYSxFQUFiLCtCQUFhLEVBQWIsMkJBQWEsRUFBYixJQUFhO29CQUFuQyxJQUFNLFlBQVksc0JBQUE7b0JBQ25CLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztpQkFDMUI7WUFDTCxDQUFDLENBQUM7UUFDTixDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBQ0wsZUFBQztBQUFELENBeEhBLEFBd0hDLElBQUE7QUF4SHFCLDRCQUFRIiwiZmlsZSI6ImFwaS9yZXNvdXJjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIFJ4IGZyb20gJ3J4JztcblxuaW1wb3J0IHtDb25uZWN0aW9uLCBRdWVyeU9ic2VydmVyUmVzcG9uc2V9IGZyb20gJy4vY29ubmVjdGlvbic7XG5pbXBvcnQge1F1ZXJ5T2JzZXJ2ZXJTdGF0dXN9IGZyb20gJy4vcXVlcnlvYnNlcnZlcic7XG5pbXBvcnQgKiBhcyB0eXBlcyBmcm9tICcuL3R5cGVzL3Jlc3QnO1xuXG4vKipcbiAqIEEgbWFwcGluZyBvZiBxdWVyaWVzIHRvIHRoZWlyIHF1ZXJ5IG9ic2VydmVyIGlkZW50aWZpZXJzLCBzbyB0aGF0IHdlIGRvbid0XG4gKiBuZWVkIHRvIGhpdCB0aGUgc2VydmVyIGluIGNhc2UgdGhlIGlkZW50aWZpZXIgaXMgYWxyZWFkeSBrbm93bi5cbiAqL1xuaW50ZXJmYWNlIFF1ZXJ5T2JzZXJ2ZXJJZENhY2hlIHtcbiAgICBbaW5kZXg6IHN0cmluZ106IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFBlbmRpbmdRdWVyaWVzIHtcbiAgICBbaW5kZXg6IHN0cmluZ106IFJ4Lk9ic2VydmVyPGFueT5bXTtcbn1cblxuLyoqXG4gKiBBbiBhYnN0cmFjdCByZXNvdXJjZSBjbGFzcy5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFJlc291cmNlIHtcbiAgICAvLyBDYWNoZSBxdWVyeSBvYnNlcnZlciBpZGVudGlmaWVycy5cbiAgICBwcml2YXRlIF9xdWVyeU9ic2VydmVySWRDYWNoZTogUXVlcnlPYnNlcnZlcklkQ2FjaGUgPSB7fTtcbiAgICBwcml2YXRlIF9wZW5kaW5nUXVlcmllczogUGVuZGluZ1F1ZXJpZXMgPSB7fTtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdHMgYSBuZXcgcmVzb3VyY2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29ubmVjdGlvbiBDb25uZWN0aW9uIHdpdGggdGhlIGdlbmVzaXMgcGxhdGZvcm0gc2VydmVyXG4gICAgICovXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfY29ubmVjdGlvbjogQ29ubmVjdGlvbikge1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbm5lY3Rpb24gdG8gdGhlIGdlbmVzaXMtcGxhdGZvcm0gc2VydmVyLlxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQgY29ubmVjdGlvbigpOiBDb25uZWN0aW9uIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Nvbm5lY3Rpb247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBiYXNlIHBhdGggdGhhdCByZXNvdXJjZSBwYXRoIGlzIGJhc2VkIHVwb24uXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGdldEJhc2VQYXRoKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgL2FwaWA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGVyZm9ybXMgYW55IHF1ZXJ5IHRyYW5zZm9ybWF0aW9ucyBuZWVkZWQgZm9yIHRoaXMgcmVzb3VyY2UuIFRoZVxuICAgICAqIG9yaWdpbmFsIHF1ZXJ5IG9iamVjdCBpcyBub3QgbW9kaWZpZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcXVlcnkgUXVlcnlcbiAgICAgKiBAcmV0dXJuIFRyYW5zZm9ybWVkIHF1ZXJ5XG4gICAgICovXG4gICAgcHJvdGVjdGVkIHRyYW5zZm9ybVF1ZXJ5KHF1ZXJ5OiB0eXBlcy5RdWVyeSk6IHR5cGVzLlF1ZXJ5IHtcbiAgICAgICAgcmV0dXJuIF8uY2xvbmVEZWVwKHF1ZXJ5KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtcyBhIHF1ZXJ5IGFnYWluc3QgdGhpcyByZXNvdXJjZSBhbmQgc3Vic2NyaWJlcyB0byBzdWJzZXF1ZW50IHVwZGF0ZXMuXG4gICAgICovXG4gICAgcHJvdGVjdGVkIHJlYWN0aXZlUmVxdWVzdDxUPihxdWVyeTogdHlwZXMuUXVlcnksIHBhdGg6IHN0cmluZyk6IFJ4Lk9ic2VydmFibGU8VFtdPiB7XG4gICAgICAgIC8vIFdlIGFzc3VtZSB0aGF0IHRoZSBzYW1lIHF1ZXJ5IG9iamVjdCBvbiB0aGUgc2FtZSByZXNvdXJjZSB3aWxsIGFsd2F5cyByZXN1bHQgaW4gdGhlIHNhbWVcbiAgICAgICAgLy8gdW5kZXJseWluZyBxdWVyeXNldCAoYW5kIHRoZXJlZm9yZSBxdWVyeSBvYnNlcnZlcikuXG4gICAgICAgIGxldCBzZXJpYWxpemVkUXVlcnkgPSBKU09OLnN0cmluZ2lmeShbcGF0aCwgcXVlcnldKTtcblxuICAgICAgICByZXR1cm4gUnguT2JzZXJ2YWJsZS5jcmVhdGU8VFtdPigob2JzZXJ2ZXIpID0+IHtcbiAgICAgICAgICAgIGxldCBxdWVyeU9ic2VydmVySWQgPSB0aGlzLl9xdWVyeU9ic2VydmVySWRDYWNoZVtzZXJpYWxpemVkUXVlcnldO1xuICAgICAgICAgICAgbGV0IHBlbmRpbmdRdWVyaWVzID0gdGhpcy5fcGVuZGluZ1F1ZXJpZXNbc2VyaWFsaXplZFF1ZXJ5XTtcblxuICAgICAgICAgICAgLy8gUGVyZm9ybSBhIFJFU1QgcXVlcnkgdG8gZ2V0IHRoZSBvYnNlcnZlciBpZGVudGlmaWVyIGFuZCB0byBzdWJzY3JpYmUgdG8gbmV3IHVwZGF0ZXMuXG4gICAgICAgICAgICBsZXQgc3Vic2NyaXB0aW9uczogUnguRGlzcG9zYWJsZVtdID0gW107XG5cbiAgICAgICAgICAgIGlmIChxdWVyeU9ic2VydmVySWQpIHtcbiAgICAgICAgICAgICAgICAvLyBUaGlzIHF1ZXJ5IG9ic2VydmVyIGlkZW50aWZpZXIgaGFzIGFscmVhZHkgYmVlbiBjYWNoZWQuIENoZWNrIGlmIGl0IGV4aXN0cyBhbmQgaW4gdGhpc1xuICAgICAgICAgICAgICAgIC8vIGNhc2UganVzdCBzdWJzY3JpYmUgdG8gYWxsIGl0ZW1zLlxuICAgICAgICAgICAgICAgIGxldCBxdWVyeU9ic2VydmVyID0gdGhpcy5jb25uZWN0aW9uLnF1ZXJ5T2JzZXJ2ZXJNYW5hZ2VyKCkuZ2V0KHF1ZXJ5T2JzZXJ2ZXJJZCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIGlmIChxdWVyeU9ic2VydmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChxdWVyeU9ic2VydmVyLnN0YXR1cyA9PT0gUXVlcnlPYnNlcnZlclN0YXR1cy5JTklUSUFMSVpFRCB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgcXVlcnlPYnNlcnZlci5zdGF0dXMgPT09IFF1ZXJ5T2JzZXJ2ZXJTdGF0dXMuUkVJTklUSUFMSVpJTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbnMucHVzaChxdWVyeU9ic2VydmVyLm9ic2VydmFibGUoKS5zdWJzY3JpYmUob2JzZXJ2ZXIpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChxdWVyeU9ic2VydmVyLnN0YXR1cyA9PT0gUXVlcnlPYnNlcnZlclN0YXR1cy5JTklUSUFMSVpFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2JzZXJ2ZXIub25OZXh0KHF1ZXJ5T2JzZXJ2ZXIuaXRlbXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoXy5pc0VtcHR5KHN1YnNjcmlwdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBlbmRpbmdRdWVyaWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEEgcmVxdWVzdCBmb3IgdGhlIHNhbWUgcXVlcnkgaXMgYWxyZWFkeSBpbiBwcm9ncmVzcy5cbiAgICAgICAgICAgICAgICAgICAgcGVuZGluZ1F1ZXJpZXMucHVzaChvYnNlcnZlcik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGVuZGluZ1F1ZXJpZXNbc2VyaWFsaXplZFF1ZXJ5XSA9IFtvYnNlcnZlcl07XG5cbiAgICAgICAgICAgICAgICAgICAgcXVlcnkgPSBfLmFzc2lnbih0aGlzLnRyYW5zZm9ybVF1ZXJ5KHF1ZXJ5KSwge29ic2VydmU6IHRoaXMuY29ubmVjdGlvbi5zZXNzaW9uSWQoKX0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3Rpb24ucXVlcnlPYnNlcnZlck1hbmFnZXIoKS5jaGFpbkFmdGVyVW5zdWJzY3JpYmUoKCkgPT4gdGhpcy5jb25uZWN0aW9uLmdldChwYXRoLCBxdWVyeSkpLnN1YnNjcmliZShcbiAgICAgICAgICAgICAgICAgICAgICAgIChyZXNwb25zZTogUXVlcnlPYnNlcnZlclJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUG9wdWxhdGUgbWVzc2FnZXMgZnJvbSB0aGlzIHJlcXVlc3QuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHF1ZXJ5T2JzZXJ2ZXIgPSB0aGlzLmNvbm5lY3Rpb24ucXVlcnlPYnNlcnZlck1hbmFnZXIoKS5nZXQocmVzcG9uc2Uub2JzZXJ2ZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3F1ZXJ5T2JzZXJ2ZXJJZENhY2hlW3NlcmlhbGl6ZWRRdWVyeV0gPSByZXNwb25zZS5vYnNlcnZlcjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldHVwIGEgcmVpbml0aWFsaXphdGlvbiBoYW5kbGVyIGZvciB0aGlzIG9ic2VydmVyLiBJdCBtYXkgYmUgdXNlZCBpbiBjYXNlIHRoZSBwYXJhbWV0ZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb2YgYSBjb25uZWN0aW9uIGNoYW5nZSBhbmQgdGhlIG9ic2VydmVyIG5lZWRzIHRvIGJlIHJlLWNyZWF0ZWQgb24gdGhlIHNlcnZlciB3aXRob3V0IGxvc2luZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFueSBvZiB0aGUgY2xpZW50LXNpZGUgc3Vic2NyaXB0aW9ucy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWVyeU9ic2VydmVyLnNldFJlaW5pdGlhbGl6ZUhhbmRsZXIoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uLmdldChwYXRoLCBxdWVyeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHBlbmRpbmdPYnNlcnZlciBvZiB0aGlzLl9wZW5kaW5nUXVlcmllc1tzZXJpYWxpemVkUXVlcnldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbnMucHVzaChxdWVyeU9ic2VydmVyLm9ic2VydmFibGUoKS5zdWJzY3JpYmUocGVuZGluZ09ic2VydmVyKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXJ5T2JzZXJ2ZXIuc3RhdHVzID09PSBRdWVyeU9ic2VydmVyU3RhdHVzLklOSVRJQUxJWkVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgcXVlcnkgb2JzZXJ2ZXIgaXMgYWxyZWFkeSBpbml0aWFsaXplZCwgZW1pdCB0aGUgY3VycmVudCBpdGVtcyBpbW1lZGlhdGVseS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlbmRpbmdPYnNlcnZlci5vbk5leHQocXVlcnlPYnNlcnZlci5pdGVtcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5fcGVuZGluZ1F1ZXJpZXNbc2VyaWFsaXplZFF1ZXJ5XTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChxdWVyeU9ic2VydmVyLnN0YXR1cyAhPT0gUXVlcnlPYnNlcnZlclN0YXR1cy5JTklUSUFMSVpFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWVyeU9ic2VydmVyLmluaXRpYWxpemUocmVzcG9uc2UuaXRlbXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYnNlcnZlci5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gRGlzcG9zZSBvZiB0aGUgcXVlcnkgb2JzZXJ2ZXIgc3Vic2NyaXB0aW9uIHdoZW4gYWxsIHN1YnNjcmlwdGlvbnMgdG8gdGhpcyBxdWVyeSBhcmUgc3RvcHBlZC5cbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHN1YnNjcmlwdGlvbiBvZiBzdWJzY3JpcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSkucHVibGlzaCgpLnJlZkNvdW50KCk7XG4gICAgfVxufVxuIl19
