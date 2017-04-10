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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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VyxDQUFDLENBQUMsQ0FBQztnQ0FDM0Qsb0ZBQW9GO2dDQUNwRixTQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7NEJBQ2pELENBQUM7eUJBQ0o7d0JBRUQsT0FBTyxLQUFJLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDO3dCQUU3QyxFQUFFLENBQUMsQ0FBQyxhQUFhLENBQUMsTUFBTSxLQUFLLG1DQUFtQixDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7NEJBQzNELGFBQWEsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUM3QyxDQUFDO29CQUNMLENBQUMsRUFDRCxVQUFDLEtBQUs7d0JBQ0YsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDNUIsQ0FBQyxDQUNKLENBQUM7Z0JBQ04sQ0FBQztZQUNMLENBQUM7WUFFRCxNQUFNLENBQUM7Z0JBQ0gsK0ZBQStGO2dCQUMvRixHQUFHLENBQUMsQ0FBdUIsVUFBYSxFQUFiLCtCQUFhLEVBQWIsMkJBQWEsRUFBYixJQUFhO29CQUFuQyxJQUFNLFlBQVksc0JBQUE7b0JBQ25CLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztpQkFDMUI7WUFDTCxDQUFDLENBQUM7UUFDTixDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBQ0wsZUFBQztBQUFELENBeEhBLEFBd0hDLElBQUE7QUF4SHFCLDRCQUFRIiwiZmlsZSI6ImFwaS9yZXNvdXJjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIFJ4IGZyb20gJ3J4JztcblxuaW1wb3J0IHtDb25uZWN0aW9uLCBRdWVyeU9ic2VydmVyUmVzcG9uc2V9IGZyb20gJy4vY29ubmVjdGlvbic7XG5pbXBvcnQge1F1ZXJ5T2JzZXJ2ZXJTdGF0dXN9IGZyb20gJy4vcXVlcnlvYnNlcnZlcic7XG5pbXBvcnQgKiBhcyB0eXBlcyBmcm9tICcuL3R5cGVzL3Jlc3QnO1xuXG4vKipcbiAqIEEgbWFwcGluZyBvZiBxdWVyaWVzIHRvIHRoZWlyIHF1ZXJ5IG9ic2VydmVyIGlkZW50aWZpZXJzLCBzbyB0aGF0IHdlIGRvbid0XG4gKiBuZWVkIHRvIGhpdCB0aGUgc2VydmVyIGluIGNhc2UgdGhlIGlkZW50aWZpZXIgaXMgYWxyZWFkeSBrbm93bi5cbiAqL1xuaW50ZXJmYWNlIFF1ZXJ5T2JzZXJ2ZXJJZENhY2hlIHtcbiAgICBbaW5kZXg6IHN0cmluZ106IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFBlbmRpbmdRdWVyaWVzIHtcbiAgICBbaW5kZXg6IHN0cmluZ106IHtcbiAgICAgICAgc3Vic2NyaXB0aW9uczogUnguRGlzcG9zYWJsZVtdO1xuICAgICAgICBvYnNlcnZlcjogUnguT2JzZXJ2ZXI8YW55PjtcbiAgICB9W107XG59XG5cbi8qKlxuICogQW4gYWJzdHJhY3QgcmVzb3VyY2UgY2xhc3MuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBSZXNvdXJjZSB7XG4gICAgLy8gQ2FjaGUgcXVlcnkgb2JzZXJ2ZXIgaWRlbnRpZmllcnMuXG4gICAgcHJpdmF0ZSBfcXVlcnlPYnNlcnZlcklkQ2FjaGU6IFF1ZXJ5T2JzZXJ2ZXJJZENhY2hlID0ge307XG4gICAgcHJpdmF0ZSBfcGVuZGluZ1F1ZXJpZXM6IFBlbmRpbmdRdWVyaWVzID0ge307XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RzIGEgbmV3IHJlc291cmNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbm5lY3Rpb24gQ29ubmVjdGlvbiB3aXRoIHRoZSBnZW5lc2lzIHBsYXRmb3JtIHNlcnZlclxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX2Nvbm5lY3Rpb246IENvbm5lY3Rpb24pIHtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb25uZWN0aW9uIHRvIHRoZSBnZW5lc2lzLXBsYXRmb3JtIHNlcnZlci5cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IGNvbm5lY3Rpb24oKTogQ29ubmVjdGlvbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb25uZWN0aW9uO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYmFzZSBwYXRoIHRoYXQgcmVzb3VyY2UgcGF0aCBpcyBiYXNlZCB1cG9uLlxuICAgICAqL1xuICAgIHByb3RlY3RlZCBnZXRCYXNlUGF0aCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYC9hcGlgO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm1zIGFueSBxdWVyeSB0cmFuc2Zvcm1hdGlvbnMgbmVlZGVkIGZvciB0aGlzIHJlc291cmNlLiBUaGVcbiAgICAgKiBvcmlnaW5hbCBxdWVyeSBvYmplY3QgaXMgbm90IG1vZGlmaWVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHF1ZXJ5IFF1ZXJ5XG4gICAgICogQHJldHVybiBUcmFuc2Zvcm1lZCBxdWVyeVxuICAgICAqL1xuICAgIHByb3RlY3RlZCB0cmFuc2Zvcm1RdWVyeShxdWVyeTogdHlwZXMuUXVlcnkpOiB0eXBlcy5RdWVyeSB7XG4gICAgICAgIHJldHVybiBfLmNsb25lRGVlcChxdWVyeSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGVyZm9ybXMgYSBxdWVyeSBhZ2FpbnN0IHRoaXMgcmVzb3VyY2UgYW5kIHN1YnNjcmliZXMgdG8gc3Vic2VxdWVudCB1cGRhdGVzLlxuICAgICAqL1xuICAgIHByb3RlY3RlZCByZWFjdGl2ZVJlcXVlc3Q8VD4ocXVlcnk6IHR5cGVzLlF1ZXJ5LCBwYXRoOiBzdHJpbmcpOiBSeC5PYnNlcnZhYmxlPFRbXT4ge1xuICAgICAgICAvLyBXZSBhc3N1bWUgdGhhdCB0aGUgc2FtZSBxdWVyeSBvYmplY3Qgb24gdGhlIHNhbWUgcmVzb3VyY2Ugd2lsbCBhbHdheXMgcmVzdWx0IGluIHRoZSBzYW1lXG4gICAgICAgIC8vIHVuZGVybHlpbmcgcXVlcnlzZXQgKGFuZCB0aGVyZWZvcmUgcXVlcnkgb2JzZXJ2ZXIpLlxuICAgICAgICBsZXQgc2VyaWFsaXplZFF1ZXJ5ID0gSlNPTi5zdHJpbmdpZnkoW3BhdGgsIHF1ZXJ5XSk7XG5cbiAgICAgICAgcmV0dXJuIFJ4Lk9ic2VydmFibGUuY3JlYXRlPFRbXT4oKG9ic2VydmVyKSA9PiB7XG4gICAgICAgICAgICBsZXQgcXVlcnlPYnNlcnZlcklkID0gdGhpcy5fcXVlcnlPYnNlcnZlcklkQ2FjaGVbc2VyaWFsaXplZFF1ZXJ5XTtcbiAgICAgICAgICAgIGxldCBwZW5kaW5nUXVlcmllcyA9IHRoaXMuX3BlbmRpbmdRdWVyaWVzW3NlcmlhbGl6ZWRRdWVyeV07XG5cbiAgICAgICAgICAgIC8vIFBlcmZvcm0gYSBSRVNUIHF1ZXJ5IHRvIGdldCB0aGUgb2JzZXJ2ZXIgaWRlbnRpZmllciBhbmQgdG8gc3Vic2NyaWJlIHRvIG5ldyB1cGRhdGVzLlxuICAgICAgICAgICAgbGV0IHN1YnNjcmlwdGlvbnM6IFJ4LkRpc3Bvc2FibGVbXSA9IFtdO1xuXG4gICAgICAgICAgICBpZiAocXVlcnlPYnNlcnZlcklkKSB7XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBxdWVyeSBvYnNlcnZlciBpZGVudGlmaWVyIGhhcyBhbHJlYWR5IGJlZW4gY2FjaGVkLiBDaGVjayBpZiBpdCBleGlzdHMgYW5kIGluIHRoaXNcbiAgICAgICAgICAgICAgICAvLyBjYXNlIGp1c3Qgc3Vic2NyaWJlIHRvIGFsbCBpdGVtcy5cbiAgICAgICAgICAgICAgICBsZXQgcXVlcnlPYnNlcnZlciA9IHRoaXMuY29ubmVjdGlvbi5xdWVyeU9ic2VydmVyTWFuYWdlcigpLmdldChxdWVyeU9ic2VydmVySWQsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBpZiAocXVlcnlPYnNlcnZlcikge1xuICAgICAgICAgICAgICAgICAgICBpZiAocXVlcnlPYnNlcnZlci5zdGF0dXMgPT09IFF1ZXJ5T2JzZXJ2ZXJTdGF0dXMuSU5JVElBTElaRUQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5T2JzZXJ2ZXIuc3RhdHVzID09PSBRdWVyeU9ic2VydmVyU3RhdHVzLlJFSU5JVElBTElaSU5HKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25zLnB1c2gocXVlcnlPYnNlcnZlci5vYnNlcnZhYmxlKCkuc3Vic2NyaWJlKG9ic2VydmVyKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAocXVlcnlPYnNlcnZlci5zdGF0dXMgPT09IFF1ZXJ5T2JzZXJ2ZXJTdGF0dXMuSU5JVElBTElaRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ic2VydmVyLm9uTmV4dChxdWVyeU9ic2VydmVyLml0ZW1zKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKF8uaXNFbXB0eShzdWJzY3JpcHRpb25zKSkge1xuICAgICAgICAgICAgICAgIGlmIChwZW5kaW5nUXVlcmllcykge1xuICAgICAgICAgICAgICAgICAgICAvLyBBIHJlcXVlc3QgZm9yIHRoZSBzYW1lIHF1ZXJ5IGlzIGFscmVhZHkgaW4gcHJvZ3Jlc3MuXG4gICAgICAgICAgICAgICAgICAgIHBlbmRpbmdRdWVyaWVzLnB1c2goe29ic2VydmVyLCBzdWJzY3JpcHRpb25zfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGVuZGluZ1F1ZXJpZXNbc2VyaWFsaXplZFF1ZXJ5XSA9IFt7b2JzZXJ2ZXIsIHN1YnNjcmlwdGlvbnN9XTtcblxuICAgICAgICAgICAgICAgICAgICBxdWVyeSA9IF8uYXNzaWduKHRoaXMudHJhbnNmb3JtUXVlcnkocXVlcnkpLCB7b2JzZXJ2ZTogdGhpcy5jb25uZWN0aW9uLnNlc3Npb25JZCgpfSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29ubmVjdGlvbi5xdWVyeU9ic2VydmVyTWFuYWdlcigpLmNoYWluQWZ0ZXJVbnN1YnNjcmliZSgoKSA9PiB0aGlzLmNvbm5lY3Rpb24uZ2V0KHBhdGgsIHF1ZXJ5KSkuc3Vic2NyaWJlKFxuICAgICAgICAgICAgICAgICAgICAgICAgKHJlc3BvbnNlOiBRdWVyeU9ic2VydmVyUmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQb3B1bGF0ZSBtZXNzYWdlcyBmcm9tIHRoaXMgcmVxdWVzdC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcXVlcnlPYnNlcnZlciA9IHRoaXMuY29ubmVjdGlvbi5xdWVyeU9ic2VydmVyTWFuYWdlcigpLmdldChyZXNwb25zZS5vYnNlcnZlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcXVlcnlPYnNlcnZlcklkQ2FjaGVbc2VyaWFsaXplZFF1ZXJ5XSA9IHJlc3BvbnNlLm9ic2VydmVyO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2V0dXAgYSByZWluaXRpYWxpemF0aW9uIGhhbmRsZXIgZm9yIHRoaXMgb2JzZXJ2ZXIuIEl0IG1heSBiZSB1c2VkIGluIGNhc2UgdGhlIHBhcmFtZXRlcnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvZiBhIGNvbm5lY3Rpb24gY2hhbmdlIGFuZCB0aGUgb2JzZXJ2ZXIgbmVlZHMgdG8gYmUgcmUtY3JlYXRlZCBvbiB0aGUgc2VydmVyIHdpdGhvdXQgbG9zaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYW55IG9mIHRoZSBjbGllbnQtc2lkZSBzdWJzY3JpcHRpb25zLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5T2JzZXJ2ZXIuc2V0UmVpbml0aWFsaXplSGFuZGxlcigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbm5lY3Rpb24uZ2V0KHBhdGgsIHF1ZXJ5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcGVuZGluZyBvZiB0aGlzLl9wZW5kaW5nUXVlcmllc1tzZXJpYWxpemVkUXVlcnldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlbmRpbmcuc3Vic2NyaXB0aW9ucy5wdXNoKHF1ZXJ5T2JzZXJ2ZXIub2JzZXJ2YWJsZSgpLnN1YnNjcmliZShwZW5kaW5nLm9ic2VydmVyKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXJ5T2JzZXJ2ZXIuc3RhdHVzID09PSBRdWVyeU9ic2VydmVyU3RhdHVzLklOSVRJQUxJWkVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgcXVlcnkgb2JzZXJ2ZXIgaXMgYWxyZWFkeSBpbml0aWFsaXplZCwgZW1pdCB0aGUgY3VycmVudCBpdGVtcyBpbW1lZGlhdGVseS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlbmRpbmcub2JzZXJ2ZXIub25OZXh0KHF1ZXJ5T2JzZXJ2ZXIuaXRlbXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3BlbmRpbmdRdWVyaWVzW3NlcmlhbGl6ZWRRdWVyeV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocXVlcnlPYnNlcnZlci5zdGF0dXMgIT09IFF1ZXJ5T2JzZXJ2ZXJTdGF0dXMuSU5JVElBTElaRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVlcnlPYnNlcnZlci5pbml0aWFsaXplKHJlc3BvbnNlLml0ZW1zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JzZXJ2ZXIub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIERpc3Bvc2Ugb2YgdGhlIHF1ZXJ5IG9ic2VydmVyIHN1YnNjcmlwdGlvbiB3aGVuIGFsbCBzdWJzY3JpcHRpb25zIHRvIHRoaXMgcXVlcnkgYXJlIHN0b3BwZWQuXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBzdWJzY3JpcHRpb24gb2Ygc3Vic2NyaXB0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pLnB1Ymxpc2goKS5yZWZDb3VudCgpO1xuICAgIH1cbn1cbiJdfQ==
