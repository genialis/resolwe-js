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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDBCQUE0QjtBQUM1Qix1QkFBeUI7QUFHekIsaURBQW9EO0FBeUJwRDs7R0FFRztBQUNIO0lBS0k7Ozs7T0FJRztJQUNILGtCQUFvQixXQUF1QjtRQUF2QixnQkFBVyxHQUFYLFdBQVcsQ0FBWTtRQVQzQyxvQ0FBb0M7UUFDNUIsMEJBQXFCLEdBQXlCLEVBQUUsQ0FBQztRQUNqRCxvQkFBZSxHQUFtQixFQUFFLENBQUM7SUFRN0MsQ0FBQztJQUtELHNCQUFXLGdDQUFVO1FBSHJCOztXQUVHO2FBQ0g7WUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUM1QixDQUFDOzs7T0FBQTtJQUVEOztPQUVHO0lBQ08sOEJBQVcsR0FBckI7UUFDSSxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDTyxpQ0FBYyxHQUF4QixVQUF5QixLQUFrQjtRQUN2QyxNQUFNLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBRUQ7O09BRUc7SUFDTyxrQ0FBZSxHQUF6QixVQUE2QixLQUFrQixFQUFFLElBQVksRUFBRSxPQUFzQjtRQUFyRixpQkE4RkM7UUE3RkcsMkZBQTJGO1FBQzNGLHNEQUFzRDtRQUN0RCxJQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDcEQsT0FBTyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLE9BQU8sSUFBSSxFQUFFLEVBQUU7WUFDcEMsUUFBUSxFQUFFLEtBQUs7U0FDbEIsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFNLFVBQUMsUUFBUTtZQUN0QyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUNwQix5Q0FBeUM7Z0JBQ3pDLEtBQUssR0FBRyxLQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNuQyxJQUFNLGNBQVksR0FBRyxLQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUMsUUFBYTtvQkFDcEUsc0NBQXNDO29CQUN0QyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQzt3QkFBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQztvQkFDeEQsTUFBTSxDQUFDLFFBQVEsQ0FBQztnQkFDcEIsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUV2QixNQUFNLENBQUMsY0FBTSxPQUFBLGNBQVksQ0FBQyxPQUFPLEVBQUUsRUFBdEIsQ0FBc0IsQ0FBQztZQUN4QyxDQUFDO1lBRUQseUJBQXlCO1lBQ3pCLElBQUksZUFBZSxHQUFHLEtBQUksQ0FBQyxxQkFBcUIsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNsRSxJQUFJLGNBQWMsR0FBRyxLQUFJLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBRTNELHVGQUF1RjtZQUN2RixJQUFJLGFBQWEsR0FBb0IsRUFBRSxDQUFDO1lBRXhDLEVBQUUsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xCLHlGQUF5RjtnQkFDekYsb0NBQW9DO2dCQUNwQyxJQUFJLGFBQWEsR0FBRyxLQUFJLENBQUMsVUFBVSxDQUFDLG9CQUFvQixFQUFFLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDdkYsRUFBRSxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztvQkFDaEIsRUFBRSxDQUFDLENBQUMsYUFBYSxDQUFDLE1BQU0sS0FBSyxtQ0FBbUIsQ0FBQyxXQUFXO3dCQUN4RCxhQUFhLENBQUMsTUFBTSxLQUFLLG1DQUFtQixDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7d0JBQzlELGFBQWEsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO29CQUN2RSxDQUFDO29CQUVELEVBQUUsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEtBQUssbUNBQW1CLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQzt3QkFDM0QsUUFBUSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3pDLENBQUM7Z0JBQ0wsQ0FBQztZQUNMLENBQUM7WUFFRCxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0IsRUFBRSxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztvQkFDakIsdURBQXVEO29CQUN2RCxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUMsUUFBUSxVQUFBLEVBQUUsYUFBYSxlQUFBLEVBQUMsQ0FBQyxDQUFDO2dCQUNuRCxDQUFDO2dCQUFDLElBQUksQ0FBQyxDQUFDO29CQUNKLEtBQUksQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxFQUFDLFFBQVEsVUFBQSxFQUFFLGFBQWEsZUFBQSxFQUFDLENBQUMsQ0FBQztvQkFFcEUsS0FBSyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFDLE9BQU8sRUFBRSxLQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxFQUFDLENBQUMsQ0FBQztvQkFDckYsS0FBSSxDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLHFCQUFxQixDQUFDLGNBQU0sT0FBQSxLQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQWhDLENBQWdDLENBQUMsQ0FBQyxTQUFTLENBQzFHLFVBQUMsUUFBK0I7d0JBQzVCLHVDQUF1Qzt3QkFDdkMsSUFBSSxhQUFhLEdBQUcsS0FBSSxDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7d0JBQ2xGLEtBQUksQ0FBQyxxQkFBcUIsQ0FBQyxlQUFlLENBQUMsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDO3dCQUVoRSw0RkFBNEY7d0JBQzVGLDhGQUE4Rjt3QkFDOUYsd0NBQXdDO3dCQUN4QyxhQUFhLENBQUMsc0JBQXNCLENBQUM7NEJBQ2pDLE1BQU0sQ0FBQyxLQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7d0JBQzVDLENBQUMsQ0FBQyxDQUFDO3dCQUVILEdBQUcsQ0FBQyxDQUFrQixVQUFxQyxFQUFyQyxLQUFBLEtBQUksQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLEVBQXJDLGNBQXFDLEVBQXJDLElBQXFDOzRCQUF0RCxJQUFNLFNBQU8sU0FBQTs0QkFDZCxTQUFPLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLENBQUMsU0FBUyxDQUFDLFNBQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDOzRCQUVuRixFQUFFLENBQUMsQ0FBQyxhQUFhLENBQUMsTUFBTSxLQUFLLG1DQUFtQixDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0NBQzNELG9GQUFvRjtnQ0FDcEYsU0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDOzRCQUNqRCxDQUFDO3lCQUNKO3dCQUVELE9BQU8sS0FBSSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQzt3QkFFN0MsRUFBRSxDQUFDLENBQUMsYUFBYSxDQUFDLE1BQU0sS0FBSyxtQ0FBbUIsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDOzRCQUMzRCxhQUFhLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDN0MsQ0FBQztvQkFDTCxDQUFDLEVBQ0QsVUFBQyxLQUFLO3dCQUNGLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzVCLENBQUMsQ0FDSixDQUFDO2dCQUNOLENBQUM7WUFDTCxDQUFDO1lBRUQsTUFBTSxDQUFDO2dCQUNILCtGQUErRjtnQkFDL0YsR0FBRyxDQUFDLENBQXVCLFVBQWEsRUFBYiwrQkFBYSxFQUFiLDJCQUFhLEVBQWIsSUFBYTtvQkFBbkMsSUFBTSxZQUFZLHNCQUFBO29CQUNuQixZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7aUJBQzFCO1lBQ0wsQ0FBQyxDQUFDO1FBQ04sQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUNMLGVBQUM7QUFBRCxDQXhJQSxBQXdJQyxJQUFBO0FBeElxQiw0QkFBUSIsImZpbGUiOiJhcGkvcmVzb3VyY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgKiBhcyBSeCBmcm9tICdyeCc7XG5cbmltcG9ydCB7Q29ubmVjdGlvbiwgUXVlcnlPYnNlcnZlclJlc3BvbnNlfSBmcm9tICcuL2Nvbm5lY3Rpb24nO1xuaW1wb3J0IHtRdWVyeU9ic2VydmVyU3RhdHVzfSBmcm9tICcuL3F1ZXJ5b2JzZXJ2ZXInO1xuaW1wb3J0ICogYXMgdHlwZXMgZnJvbSAnLi90eXBlcy9yZXN0JztcblxuLyoqXG4gKiBBIG1hcHBpbmcgb2YgcXVlcmllcyB0byB0aGVpciBxdWVyeSBvYnNlcnZlciBpZGVudGlmaWVycywgc28gdGhhdCB3ZSBkb24ndFxuICogbmVlZCB0byBoaXQgdGhlIHNlcnZlciBpbiBjYXNlIHRoZSBpZGVudGlmaWVyIGlzIGFscmVhZHkga25vd24uXG4gKi9cbmludGVyZmFjZSBRdWVyeU9ic2VydmVySWRDYWNoZSB7XG4gICAgW2luZGV4OiBzdHJpbmddOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBQZW5kaW5nUXVlcmllcyB7XG4gICAgW2luZGV4OiBzdHJpbmddOiB7XG4gICAgICAgIHN1YnNjcmlwdGlvbnM6IFJ4LkRpc3Bvc2FibGVbXTtcbiAgICAgICAgb2JzZXJ2ZXI6IFJ4Lk9ic2VydmVyPGFueT47XG4gICAgfVtdO1xufVxuXG4vKipcbiAqIFBlci1xdWVyeSBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUXVlcnlPcHRpb25zIHtcbiAgICByZWFjdGl2ZT86IGJvb2xlYW47XG59XG5cbi8qKlxuICogQW4gYWJzdHJhY3QgcmVzb3VyY2UgY2xhc3MuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBSZXNvdXJjZSB7XG4gICAgLy8gQ2FjaGUgcXVlcnkgb2JzZXJ2ZXIgaWRlbnRpZmllcnMuXG4gICAgcHJpdmF0ZSBfcXVlcnlPYnNlcnZlcklkQ2FjaGU6IFF1ZXJ5T2JzZXJ2ZXJJZENhY2hlID0ge307XG4gICAgcHJpdmF0ZSBfcGVuZGluZ1F1ZXJpZXM6IFBlbmRpbmdRdWVyaWVzID0ge307XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RzIGEgbmV3IHJlc291cmNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbm5lY3Rpb24gQ29ubmVjdGlvbiB3aXRoIHRoZSBnZW5lc2lzIHBsYXRmb3JtIHNlcnZlclxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX2Nvbm5lY3Rpb246IENvbm5lY3Rpb24pIHtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb25uZWN0aW9uIHRvIHRoZSBnZW5lc2lzLXBsYXRmb3JtIHNlcnZlci5cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IGNvbm5lY3Rpb24oKTogQ29ubmVjdGlvbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb25uZWN0aW9uO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYmFzZSBwYXRoIHRoYXQgcmVzb3VyY2UgcGF0aCBpcyBiYXNlZCB1cG9uLlxuICAgICAqL1xuICAgIHByb3RlY3RlZCBnZXRCYXNlUGF0aCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYC9hcGlgO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm1zIGFueSBxdWVyeSB0cmFuc2Zvcm1hdGlvbnMgbmVlZGVkIGZvciB0aGlzIHJlc291cmNlLiBUaGVcbiAgICAgKiBvcmlnaW5hbCBxdWVyeSBvYmplY3QgaXMgbm90IG1vZGlmaWVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHF1ZXJ5IFF1ZXJ5XG4gICAgICogQHJldHVybiBUcmFuc2Zvcm1lZCBxdWVyeVxuICAgICAqL1xuICAgIHByb3RlY3RlZCB0cmFuc2Zvcm1RdWVyeShxdWVyeTogdHlwZXMuUXVlcnkpOiB0eXBlcy5RdWVyeSB7XG4gICAgICAgIHJldHVybiBfLmNsb25lRGVlcChxdWVyeSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGVyZm9ybXMgYSBxdWVyeSBhZ2FpbnN0IHRoaXMgcmVzb3VyY2UgYW5kIHN1YnNjcmliZXMgdG8gc3Vic2VxdWVudCB1cGRhdGVzLlxuICAgICAqL1xuICAgIHByb3RlY3RlZCByZWFjdGl2ZVJlcXVlc3Q8VD4ocXVlcnk6IHR5cGVzLlF1ZXJ5LCBwYXRoOiBzdHJpbmcsIG9wdGlvbnM/OiBRdWVyeU9wdGlvbnMpOiBSeC5PYnNlcnZhYmxlPFRbXT4ge1xuICAgICAgICAvLyBXZSBhc3N1bWUgdGhhdCB0aGUgc2FtZSBxdWVyeSBvYmplY3Qgb24gdGhlIHNhbWUgcmVzb3VyY2Ugd2lsbCBhbHdheXMgcmVzdWx0IGluIHRoZSBzYW1lXG4gICAgICAgIC8vIHVuZGVybHlpbmcgcXVlcnlzZXQgKGFuZCB0aGVyZWZvcmUgcXVlcnkgb2JzZXJ2ZXIpLlxuICAgICAgICBsZXQgc2VyaWFsaXplZFF1ZXJ5ID0gSlNPTi5zdHJpbmdpZnkoW3BhdGgsIHF1ZXJ5XSk7XG4gICAgICAgIG9wdGlvbnMgPSBfLmRlZmF1bHRzKHt9LCBvcHRpb25zIHx8IHt9LCB7XG4gICAgICAgICAgICByZWFjdGl2ZTogZmFsc2UsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBSeC5PYnNlcnZhYmxlLmNyZWF0ZTxUW10+KChvYnNlcnZlcikgPT4ge1xuICAgICAgICAgICAgaWYgKCFvcHRpb25zLnJlYWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgLy8gUmVhY3Rpdml0eSBpcyBkaXNhYmxlZCBmb3IgdGhpcyBxdWVyeS5cbiAgICAgICAgICAgICAgICBxdWVyeSA9IHRoaXMudHJhbnNmb3JtUXVlcnkocXVlcnkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IHRoaXMuY29ubmVjdGlvbi5nZXQocGF0aCwgcXVlcnkpLm1hcCgocmVzcG9uc2U6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBDb3JyZWN0bHkgaGFuZGxlIHBhZ2luYXRlZCByZXN1bHRzLlxuICAgICAgICAgICAgICAgICAgICBpZiAoXy5oYXMocmVzcG9uc2UsICdyZXN1bHRzJykpIHJldHVybiByZXNwb25zZS5yZXN1bHRzO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgICAgICAgICAgfSkuc3Vic2NyaWJlKG9ic2VydmVyKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiAoKSA9PiBzdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBSZWFjdGl2aXR5IGlzIGVuYWJsZWQuXG4gICAgICAgICAgICBsZXQgcXVlcnlPYnNlcnZlcklkID0gdGhpcy5fcXVlcnlPYnNlcnZlcklkQ2FjaGVbc2VyaWFsaXplZFF1ZXJ5XTtcbiAgICAgICAgICAgIGxldCBwZW5kaW5nUXVlcmllcyA9IHRoaXMuX3BlbmRpbmdRdWVyaWVzW3NlcmlhbGl6ZWRRdWVyeV07XG5cbiAgICAgICAgICAgIC8vIFBlcmZvcm0gYSBSRVNUIHF1ZXJ5IHRvIGdldCB0aGUgb2JzZXJ2ZXIgaWRlbnRpZmllciBhbmQgdG8gc3Vic2NyaWJlIHRvIG5ldyB1cGRhdGVzLlxuICAgICAgICAgICAgbGV0IHN1YnNjcmlwdGlvbnM6IFJ4LkRpc3Bvc2FibGVbXSA9IFtdO1xuXG4gICAgICAgICAgICBpZiAocXVlcnlPYnNlcnZlcklkKSB7XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBxdWVyeSBvYnNlcnZlciBpZGVudGlmaWVyIGhhcyBhbHJlYWR5IGJlZW4gY2FjaGVkLiBDaGVjayBpZiBpdCBleGlzdHMgYW5kIGluIHRoaXNcbiAgICAgICAgICAgICAgICAvLyBjYXNlIGp1c3Qgc3Vic2NyaWJlIHRvIGFsbCBpdGVtcy5cbiAgICAgICAgICAgICAgICBsZXQgcXVlcnlPYnNlcnZlciA9IHRoaXMuY29ubmVjdGlvbi5xdWVyeU9ic2VydmVyTWFuYWdlcigpLmdldChxdWVyeU9ic2VydmVySWQsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBpZiAocXVlcnlPYnNlcnZlcikge1xuICAgICAgICAgICAgICAgICAgICBpZiAocXVlcnlPYnNlcnZlci5zdGF0dXMgPT09IFF1ZXJ5T2JzZXJ2ZXJTdGF0dXMuSU5JVElBTElaRUQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5T2JzZXJ2ZXIuc3RhdHVzID09PSBRdWVyeU9ic2VydmVyU3RhdHVzLlJFSU5JVElBTElaSU5HKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25zLnB1c2gocXVlcnlPYnNlcnZlci5vYnNlcnZhYmxlKCkuc3Vic2NyaWJlKG9ic2VydmVyKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAocXVlcnlPYnNlcnZlci5zdGF0dXMgPT09IFF1ZXJ5T2JzZXJ2ZXJTdGF0dXMuSU5JVElBTElaRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ic2VydmVyLm9uTmV4dChxdWVyeU9ic2VydmVyLml0ZW1zKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKF8uaXNFbXB0eShzdWJzY3JpcHRpb25zKSkge1xuICAgICAgICAgICAgICAgIGlmIChwZW5kaW5nUXVlcmllcykge1xuICAgICAgICAgICAgICAgICAgICAvLyBBIHJlcXVlc3QgZm9yIHRoZSBzYW1lIHF1ZXJ5IGlzIGFscmVhZHkgaW4gcHJvZ3Jlc3MuXG4gICAgICAgICAgICAgICAgICAgIHBlbmRpbmdRdWVyaWVzLnB1c2goe29ic2VydmVyLCBzdWJzY3JpcHRpb25zfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGVuZGluZ1F1ZXJpZXNbc2VyaWFsaXplZFF1ZXJ5XSA9IFt7b2JzZXJ2ZXIsIHN1YnNjcmlwdGlvbnN9XTtcblxuICAgICAgICAgICAgICAgICAgICBxdWVyeSA9IF8uYXNzaWduKHRoaXMudHJhbnNmb3JtUXVlcnkocXVlcnkpLCB7b2JzZXJ2ZTogdGhpcy5jb25uZWN0aW9uLnNlc3Npb25JZCgpfSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29ubmVjdGlvbi5xdWVyeU9ic2VydmVyTWFuYWdlcigpLmNoYWluQWZ0ZXJVbnN1YnNjcmliZSgoKSA9PiB0aGlzLmNvbm5lY3Rpb24uZ2V0KHBhdGgsIHF1ZXJ5KSkuc3Vic2NyaWJlKFxuICAgICAgICAgICAgICAgICAgICAgICAgKHJlc3BvbnNlOiBRdWVyeU9ic2VydmVyUmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQb3B1bGF0ZSBtZXNzYWdlcyBmcm9tIHRoaXMgcmVxdWVzdC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcXVlcnlPYnNlcnZlciA9IHRoaXMuY29ubmVjdGlvbi5xdWVyeU9ic2VydmVyTWFuYWdlcigpLmdldChyZXNwb25zZS5vYnNlcnZlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcXVlcnlPYnNlcnZlcklkQ2FjaGVbc2VyaWFsaXplZFF1ZXJ5XSA9IHJlc3BvbnNlLm9ic2VydmVyO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2V0dXAgYSByZWluaXRpYWxpemF0aW9uIGhhbmRsZXIgZm9yIHRoaXMgb2JzZXJ2ZXIuIEl0IG1heSBiZSB1c2VkIGluIGNhc2UgdGhlIHBhcmFtZXRlcnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvZiBhIGNvbm5lY3Rpb24gY2hhbmdlIGFuZCB0aGUgb2JzZXJ2ZXIgbmVlZHMgdG8gYmUgcmUtY3JlYXRlZCBvbiB0aGUgc2VydmVyIHdpdGhvdXQgbG9zaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYW55IG9mIHRoZSBjbGllbnQtc2lkZSBzdWJzY3JpcHRpb25zLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5T2JzZXJ2ZXIuc2V0UmVpbml0aWFsaXplSGFuZGxlcigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbm5lY3Rpb24uZ2V0KHBhdGgsIHF1ZXJ5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcGVuZGluZyBvZiB0aGlzLl9wZW5kaW5nUXVlcmllc1tzZXJpYWxpemVkUXVlcnldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlbmRpbmcuc3Vic2NyaXB0aW9ucy5wdXNoKHF1ZXJ5T2JzZXJ2ZXIub2JzZXJ2YWJsZSgpLnN1YnNjcmliZShwZW5kaW5nLm9ic2VydmVyKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXJ5T2JzZXJ2ZXIuc3RhdHVzID09PSBRdWVyeU9ic2VydmVyU3RhdHVzLklOSVRJQUxJWkVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgcXVlcnkgb2JzZXJ2ZXIgaXMgYWxyZWFkeSBpbml0aWFsaXplZCwgZW1pdCB0aGUgY3VycmVudCBpdGVtcyBpbW1lZGlhdGVseS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlbmRpbmcub2JzZXJ2ZXIub25OZXh0KHF1ZXJ5T2JzZXJ2ZXIuaXRlbXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3BlbmRpbmdRdWVyaWVzW3NlcmlhbGl6ZWRRdWVyeV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocXVlcnlPYnNlcnZlci5zdGF0dXMgIT09IFF1ZXJ5T2JzZXJ2ZXJTdGF0dXMuSU5JVElBTElaRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVlcnlPYnNlcnZlci5pbml0aWFsaXplKHJlc3BvbnNlLml0ZW1zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JzZXJ2ZXIub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIERpc3Bvc2Ugb2YgdGhlIHF1ZXJ5IG9ic2VydmVyIHN1YnNjcmlwdGlvbiB3aGVuIGFsbCBzdWJzY3JpcHRpb25zIHRvIHRoaXMgcXVlcnkgYXJlIHN0b3BwZWQuXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBzdWJzY3JpcHRpb24gb2Ygc3Vic2NyaXB0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pLnB1Ymxpc2goKS5yZWZDb3VudCgpO1xuICAgIH1cbn1cbiJdfQ==
