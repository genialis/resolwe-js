"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var Rx = require("rx");
var queryobserver_1 = require("./queryobserver");
/**
 * An abstract resource class.
 */
var Resource = /** @class */ (function () {
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
    Resource.prototype.reactiveRequest = function (query, path, options) {
        var _this = this;
        // We assume that the same query object on the same resource will always result in the same
        // underlying queryset (and therefore query observer).
        var serializedQuery = JSON.stringify([path, query]);
        options = _.defaults({}, options || {}, {
            reactive: false,
        });
        return Rx.Observable.create(function (observer) {
            if (!options.reactive) {
                // Reactivity is disabled for this query.
                query = _this.transformQuery(query);
                var subscription_1 = _this.connection.get(path, query).map(function (response) {
                    // Correctly handle paginated results.
                    if (_.has(response, 'results'))
                        return response.results;
                    return response;
                }).subscribe(observer);
                return function () { return subscription_1.dispose(); };
            }
            // Reactivity is enabled.
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
                    pendingQueries.push({ observer: observer, subscriptions: subscriptions });
                }
                else {
                    _this._pendingQueries[serializedQuery] = [{ observer: observer, subscriptions: subscriptions }];
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
                            var pending_1 = _a[_i];
                            pending_1.subscriptions.push(queryObserver.observable().subscribe(pending_1.observer));
                            if (queryObserver.status === queryobserver_1.QueryObserverStatus.INITIALIZED) {
                                // If the query observer is already initialized, emit the current items immediately.
                                pending_1.observer.onNext(queryObserver.items);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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LENBQUM7b0JBQ0wsQ0FBQyxFQUNELFVBQUMsS0FBSzt3QkFDRixRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUM1QixDQUFDLENBQ0osQ0FBQztnQkFDTixDQUFDO1lBQ0wsQ0FBQztZQUVELE1BQU0sQ0FBQztnQkFDSCwrRkFBK0Y7Z0JBQy9GLEdBQUcsQ0FBQyxDQUF1QixVQUFhLEVBQWIsK0JBQWEsRUFBYiwyQkFBYSxFQUFiLElBQWE7b0JBQW5DLElBQU0sWUFBWSxzQkFBQTtvQkFDbkIsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO2lCQUMxQjtZQUNMLENBQUMsQ0FBQztRQUNOLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzVCLENBQUM7SUFDTCxlQUFDO0FBQUQsQ0F4SUEsQUF3SUMsSUFBQTtBQXhJcUIsNEJBQVEiLCJmaWxlIjoiYXBpL3Jlc291cmNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgUnggZnJvbSAncngnO1xuXG5pbXBvcnQge0Nvbm5lY3Rpb24sIFF1ZXJ5T2JzZXJ2ZXJSZXNwb25zZX0gZnJvbSAnLi9jb25uZWN0aW9uJztcbmltcG9ydCB7UXVlcnlPYnNlcnZlclN0YXR1c30gZnJvbSAnLi9xdWVyeW9ic2VydmVyJztcbmltcG9ydCAqIGFzIHR5cGVzIGZyb20gJy4vdHlwZXMvcmVzdCc7XG5cbi8qKlxuICogQSBtYXBwaW5nIG9mIHF1ZXJpZXMgdG8gdGhlaXIgcXVlcnkgb2JzZXJ2ZXIgaWRlbnRpZmllcnMsIHNvIHRoYXQgd2UgZG9uJ3RcbiAqIG5lZWQgdG8gaGl0IHRoZSBzZXJ2ZXIgaW4gY2FzZSB0aGUgaWRlbnRpZmllciBpcyBhbHJlYWR5IGtub3duLlxuICovXG5pbnRlcmZhY2UgUXVlcnlPYnNlcnZlcklkQ2FjaGUge1xuICAgIFtpbmRleDogc3RyaW5nXTogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgUGVuZGluZ1F1ZXJpZXMge1xuICAgIFtpbmRleDogc3RyaW5nXToge1xuICAgICAgICBzdWJzY3JpcHRpb25zOiBSeC5EaXNwb3NhYmxlW107XG4gICAgICAgIG9ic2VydmVyOiBSeC5PYnNlcnZlcjxhbnk+O1xuICAgIH1bXTtcbn1cblxuLyoqXG4gKiBQZXItcXVlcnkgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFF1ZXJ5T3B0aW9ucyB7XG4gICAgcmVhY3RpdmU/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIEFuIGFic3RyYWN0IHJlc291cmNlIGNsYXNzLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgUmVzb3VyY2Uge1xuICAgIC8vIENhY2hlIHF1ZXJ5IG9ic2VydmVyIGlkZW50aWZpZXJzLlxuICAgIHByaXZhdGUgX3F1ZXJ5T2JzZXJ2ZXJJZENhY2hlOiBRdWVyeU9ic2VydmVySWRDYWNoZSA9IHt9O1xuICAgIHByaXZhdGUgX3BlbmRpbmdRdWVyaWVzOiBQZW5kaW5nUXVlcmllcyA9IHt9O1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0cyBhIG5ldyByZXNvdXJjZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb25uZWN0aW9uIENvbm5lY3Rpb24gd2l0aCB0aGUgZ2VuZXNpcyBwbGF0Zm9ybSBzZXJ2ZXJcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9jb25uZWN0aW9uOiBDb25uZWN0aW9uKSB7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29ubmVjdGlvbiB0byB0aGUgZ2VuZXNpcy1wbGF0Zm9ybSBzZXJ2ZXIuXG4gICAgICovXG4gICAgcHVibGljIGdldCBjb25uZWN0aW9uKCk6IENvbm5lY3Rpb24ge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29ubmVjdGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGJhc2UgcGF0aCB0aGF0IHJlc291cmNlIHBhdGggaXMgYmFzZWQgdXBvbi5cbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgZ2V0QmFzZVBhdGgoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGAvYXBpYDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtcyBhbnkgcXVlcnkgdHJhbnNmb3JtYXRpb25zIG5lZWRlZCBmb3IgdGhpcyByZXNvdXJjZS4gVGhlXG4gICAgICogb3JpZ2luYWwgcXVlcnkgb2JqZWN0IGlzIG5vdCBtb2RpZmllZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBxdWVyeSBRdWVyeVxuICAgICAqIEByZXR1cm4gVHJhbnNmb3JtZWQgcXVlcnlcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgdHJhbnNmb3JtUXVlcnkocXVlcnk6IHR5cGVzLlF1ZXJ5KTogdHlwZXMuUXVlcnkge1xuICAgICAgICByZXR1cm4gXy5jbG9uZURlZXAocXVlcnkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm1zIGEgcXVlcnkgYWdhaW5zdCB0aGlzIHJlc291cmNlIGFuZCBzdWJzY3JpYmVzIHRvIHN1YnNlcXVlbnQgdXBkYXRlcy5cbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgcmVhY3RpdmVSZXF1ZXN0PFQ+KHF1ZXJ5OiB0eXBlcy5RdWVyeSwgcGF0aDogc3RyaW5nLCBvcHRpb25zPzogUXVlcnlPcHRpb25zKTogUnguT2JzZXJ2YWJsZTxUW10+IHtcbiAgICAgICAgLy8gV2UgYXNzdW1lIHRoYXQgdGhlIHNhbWUgcXVlcnkgb2JqZWN0IG9uIHRoZSBzYW1lIHJlc291cmNlIHdpbGwgYWx3YXlzIHJlc3VsdCBpbiB0aGUgc2FtZVxuICAgICAgICAvLyB1bmRlcmx5aW5nIHF1ZXJ5c2V0IChhbmQgdGhlcmVmb3JlIHF1ZXJ5IG9ic2VydmVyKS5cbiAgICAgICAgbGV0IHNlcmlhbGl6ZWRRdWVyeSA9IEpTT04uc3RyaW5naWZ5KFtwYXRoLCBxdWVyeV0pO1xuICAgICAgICBvcHRpb25zID0gXy5kZWZhdWx0cyh7fSwgb3B0aW9ucyB8fCB7fSwge1xuICAgICAgICAgICAgcmVhY3RpdmU6IGZhbHNlLFxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gUnguT2JzZXJ2YWJsZS5jcmVhdGU8VFtdPigob2JzZXJ2ZXIpID0+IHtcbiAgICAgICAgICAgIGlmICghb3B0aW9ucy5yZWFjdGl2ZSkge1xuICAgICAgICAgICAgICAgIC8vIFJlYWN0aXZpdHkgaXMgZGlzYWJsZWQgZm9yIHRoaXMgcXVlcnkuXG4gICAgICAgICAgICAgICAgcXVlcnkgPSB0aGlzLnRyYW5zZm9ybVF1ZXJ5KHF1ZXJ5KTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSB0aGlzLmNvbm5lY3Rpb24uZ2V0KHBhdGgsIHF1ZXJ5KS5tYXAoKHJlc3BvbnNlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ29ycmVjdGx5IGhhbmRsZSBwYWdpbmF0ZWQgcmVzdWx0cy5cbiAgICAgICAgICAgICAgICAgICAgaWYgKF8uaGFzKHJlc3BvbnNlLCAncmVzdWx0cycpKSByZXR1cm4gcmVzcG9uc2UucmVzdWx0cztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICAgICAgICAgIH0pLnN1YnNjcmliZShvYnNlcnZlcik7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gKCkgPT4gc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gUmVhY3Rpdml0eSBpcyBlbmFibGVkLlxuICAgICAgICAgICAgbGV0IHF1ZXJ5T2JzZXJ2ZXJJZCA9IHRoaXMuX3F1ZXJ5T2JzZXJ2ZXJJZENhY2hlW3NlcmlhbGl6ZWRRdWVyeV07XG4gICAgICAgICAgICBsZXQgcGVuZGluZ1F1ZXJpZXMgPSB0aGlzLl9wZW5kaW5nUXVlcmllc1tzZXJpYWxpemVkUXVlcnldO1xuXG4gICAgICAgICAgICAvLyBQZXJmb3JtIGEgUkVTVCBxdWVyeSB0byBnZXQgdGhlIG9ic2VydmVyIGlkZW50aWZpZXIgYW5kIHRvIHN1YnNjcmliZSB0byBuZXcgdXBkYXRlcy5cbiAgICAgICAgICAgIGxldCBzdWJzY3JpcHRpb25zOiBSeC5EaXNwb3NhYmxlW10gPSBbXTtcblxuICAgICAgICAgICAgaWYgKHF1ZXJ5T2JzZXJ2ZXJJZCkge1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgcXVlcnkgb2JzZXJ2ZXIgaWRlbnRpZmllciBoYXMgYWxyZWFkeSBiZWVuIGNhY2hlZC4gQ2hlY2sgaWYgaXQgZXhpc3RzIGFuZCBpbiB0aGlzXG4gICAgICAgICAgICAgICAgLy8gY2FzZSBqdXN0IHN1YnNjcmliZSB0byBhbGwgaXRlbXMuXG4gICAgICAgICAgICAgICAgbGV0IHF1ZXJ5T2JzZXJ2ZXIgPSB0aGlzLmNvbm5lY3Rpb24ucXVlcnlPYnNlcnZlck1hbmFnZXIoKS5nZXQocXVlcnlPYnNlcnZlcklkLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXJ5T2JzZXJ2ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXJ5T2JzZXJ2ZXIuc3RhdHVzID09PSBRdWVyeU9ic2VydmVyU3RhdHVzLklOSVRJQUxJWkVEIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBxdWVyeU9ic2VydmVyLnN0YXR1cyA9PT0gUXVlcnlPYnNlcnZlclN0YXR1cy5SRUlOSVRJQUxJWklORykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9ucy5wdXNoKHF1ZXJ5T2JzZXJ2ZXIub2JzZXJ2YWJsZSgpLnN1YnNjcmliZShvYnNlcnZlcikpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXJ5T2JzZXJ2ZXIuc3RhdHVzID09PSBRdWVyeU9ic2VydmVyU3RhdHVzLklOSVRJQUxJWkVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvYnNlcnZlci5vbk5leHQocXVlcnlPYnNlcnZlci5pdGVtcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChfLmlzRW1wdHkoc3Vic2NyaXB0aW9ucykpIHtcbiAgICAgICAgICAgICAgICBpZiAocGVuZGluZ1F1ZXJpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQSByZXF1ZXN0IGZvciB0aGUgc2FtZSBxdWVyeSBpcyBhbHJlYWR5IGluIHByb2dyZXNzLlxuICAgICAgICAgICAgICAgICAgICBwZW5kaW5nUXVlcmllcy5wdXNoKHtvYnNlcnZlciwgc3Vic2NyaXB0aW9uc30pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdRdWVyaWVzW3NlcmlhbGl6ZWRRdWVyeV0gPSBbe29ic2VydmVyLCBzdWJzY3JpcHRpb25zfV07XG5cbiAgICAgICAgICAgICAgICAgICAgcXVlcnkgPSBfLmFzc2lnbih0aGlzLnRyYW5zZm9ybVF1ZXJ5KHF1ZXJ5KSwge29ic2VydmU6IHRoaXMuY29ubmVjdGlvbi5zZXNzaW9uSWQoKX0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3Rpb24ucXVlcnlPYnNlcnZlck1hbmFnZXIoKS5jaGFpbkFmdGVyVW5zdWJzY3JpYmUoKCkgPT4gdGhpcy5jb25uZWN0aW9uLmdldChwYXRoLCBxdWVyeSkpLnN1YnNjcmliZShcbiAgICAgICAgICAgICAgICAgICAgICAgIChyZXNwb25zZTogUXVlcnlPYnNlcnZlclJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUG9wdWxhdGUgbWVzc2FnZXMgZnJvbSB0aGlzIHJlcXVlc3QuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHF1ZXJ5T2JzZXJ2ZXIgPSB0aGlzLmNvbm5lY3Rpb24ucXVlcnlPYnNlcnZlck1hbmFnZXIoKS5nZXQocmVzcG9uc2Uub2JzZXJ2ZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3F1ZXJ5T2JzZXJ2ZXJJZENhY2hlW3NlcmlhbGl6ZWRRdWVyeV0gPSByZXNwb25zZS5vYnNlcnZlcjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldHVwIGEgcmVpbml0aWFsaXphdGlvbiBoYW5kbGVyIGZvciB0aGlzIG9ic2VydmVyLiBJdCBtYXkgYmUgdXNlZCBpbiBjYXNlIHRoZSBwYXJhbWV0ZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb2YgYSBjb25uZWN0aW9uIGNoYW5nZSBhbmQgdGhlIG9ic2VydmVyIG5lZWRzIHRvIGJlIHJlLWNyZWF0ZWQgb24gdGhlIHNlcnZlciB3aXRob3V0IGxvc2luZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFueSBvZiB0aGUgY2xpZW50LXNpZGUgc3Vic2NyaXB0aW9ucy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWVyeU9ic2VydmVyLnNldFJlaW5pdGlhbGl6ZUhhbmRsZXIoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uLmdldChwYXRoLCBxdWVyeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHBlbmRpbmcgb2YgdGhpcy5fcGVuZGluZ1F1ZXJpZXNbc2VyaWFsaXplZFF1ZXJ5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZW5kaW5nLnN1YnNjcmlwdGlvbnMucHVzaChxdWVyeU9ic2VydmVyLm9ic2VydmFibGUoKS5zdWJzY3JpYmUocGVuZGluZy5vYnNlcnZlcikpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChxdWVyeU9ic2VydmVyLnN0YXR1cyA9PT0gUXVlcnlPYnNlcnZlclN0YXR1cy5JTklUSUFMSVpFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIHF1ZXJ5IG9ic2VydmVyIGlzIGFscmVhZHkgaW5pdGlhbGl6ZWQsIGVtaXQgdGhlIGN1cnJlbnQgaXRlbXMgaW1tZWRpYXRlbHkuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZW5kaW5nLm9ic2VydmVyLm9uTmV4dChxdWVyeU9ic2VydmVyLml0ZW1zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9wZW5kaW5nUXVlcmllc1tzZXJpYWxpemVkUXVlcnldO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXJ5T2JzZXJ2ZXIuc3RhdHVzICE9PSBRdWVyeU9ic2VydmVyU3RhdHVzLklOSVRJQUxJWkVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5T2JzZXJ2ZXIuaW5pdGlhbGl6ZShyZXNwb25zZS5pdGVtcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ic2VydmVyLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBEaXNwb3NlIG9mIHRoZSBxdWVyeSBvYnNlcnZlciBzdWJzY3JpcHRpb24gd2hlbiBhbGwgc3Vic2NyaXB0aW9ucyB0byB0aGlzIHF1ZXJ5IGFyZSBzdG9wcGVkLlxuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgc3Vic2NyaXB0aW9uIG9mIHN1YnNjcmlwdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KS5wdWJsaXNoKCkucmVmQ291bnQoKTtcbiAgICB9XG59XG4iXX0=
