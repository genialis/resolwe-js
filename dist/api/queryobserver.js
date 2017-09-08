"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var Rx = require("rx");
var immutable = require("immutable");
var immutable_1 = require("../core/utils/immutable");
var errors_1 = require("./errors");
// Possible message types.
exports.MESSAGE_ADDED = 'added';
exports.MESSAGE_CHANGED = 'changed';
exports.MESSAGE_REMOVED = 'removed';
/**
 * Valid query observer statuses.
 */
var QueryObserverStatus;
(function (QueryObserverStatus) {
    QueryObserverStatus[QueryObserverStatus["NEW"] = 0] = "NEW";
    QueryObserverStatus[QueryObserverStatus["INITIALIZING"] = 1] = "INITIALIZING";
    QueryObserverStatus[QueryObserverStatus["INITIALIZED"] = 2] = "INITIALIZED";
    QueryObserverStatus[QueryObserverStatus["REINITIALIZING"] = 3] = "REINITIALIZING";
    QueryObserverStatus[QueryObserverStatus["STOPPED"] = 4] = "STOPPED";
})(QueryObserverStatus = exports.QueryObserverStatus || (exports.QueryObserverStatus = {}));
/**
 * A local copy of the query observer that is synchronized with the remote
 * instance on the genesis platform server.
 */
var QueryObserver = /** @class */ (function () {
    /**
     * Constructs a new query observer.
     *
     * @param {string} id Unique query observer identifier
     * @param {QueryObserverManager} queryObserverManager Query observer manager
     */
    function QueryObserver(id, _queryObserverManager) {
        var _this = this;
        this.id = id;
        this._queryObserverManager = _queryObserverManager;
        this.status = QueryObserverStatus.NEW;
        this.items = [];
        this._items = immutable.List();
        this._updateQueue = [];
        this._updatesObservable = Rx.Observable.create(function (observer) {
            _this._updatesObserver = observer;
            return _this.stop.bind(_this);
        }).publish().refCount();
    }
    /**
     * Stops the query observer. There should be no need to call this method
     * manually.
     */
    QueryObserver.prototype.stop = function () {
        this.status = QueryObserverStatus.STOPPED;
        this._queryObserverManager.remove(this.id);
    };
    /**
     * Sets up a reinitialization handler for this query observer. The handler will be
     * called when the query observer needs to be reinitialized and it should return
     * an Rx.Observable, which produces the initial QueryObserverResponse.
     *
     * @param {ReinitializeHandler} handler Reinitialization handler
     */
    QueryObserver.prototype.setReinitializeHandler = function (handler) {
        this._reinitialize = handler;
    };
    /**
     * Starts query observer reinitialization. This method should be called when some
     * internal connection state changes (for example, when user authentication state
     * is changed).
     */
    QueryObserver.prototype.reinitialize = function () {
        var _this = this;
        if (this.status !== QueryObserverStatus.INITIALIZED) {
            return;
        }
        if (!this._reinitialize) {
            var error = new errors_1.QueryObserversError('Attempted to reinitialize a QueryObserver without a reinitialization handler');
            this._queryObserverManager.errorObserver.onNext(error);
            return;
        }
        this.status = QueryObserverStatus.REINITIALIZING;
        this._reinitialize().subscribe(function (response) {
            // Observer identifier might have changed, update observer and manager.
            var oldId = _this.id;
            _this.id = response.observer;
            _this._queryObserverManager.move(oldId, _this);
            // Perform reinitialization.
            _this.status = QueryObserverStatus.NEW;
            _this.initialize(response.items);
        });
    };
    /**
     * Moves an existing query observer into this query observer. The source query observer
     * should be considered invalid after this operation.
     *
     * @param {QueryObserver} observer Source query observer
     */
    QueryObserver.prototype.moveFrom = function (observer) {
        this._updateQueue = observer._updateQueue;
        observer._updateQueue = null;
    };
    /**
     * Initializes the query observer.
     *
     * @param {any[]} items An initial list of items
     */
    QueryObserver.prototype.initialize = function (items) {
        if (this.status !== QueryObserverStatus.NEW) {
            return;
        }
        if (_.isUndefined(items)) {
            var error = new errors_1.QueryObserversError('Invalid response received from backend, is the resource observable?');
            this._queryObserverManager.errorObserver.onNext(error);
            items = [];
        }
        this._items = immutable.fromJS(items);
        this.status = QueryObserverStatus.INITIALIZING;
        // Process all queued messages.
        _.forEach(this._updateQueue, this.update.bind(this));
        this._updateQueue = null;
        this.status = QueryObserverStatus.INITIALIZED;
        this._notify();
    };
    /**
     * Updates the item cache based on an incoming message.
     *
     * @param {Message} message Message instance
     */
    QueryObserver.prototype.update = function (message) {
        if (this.status === QueryObserverStatus.STOPPED || this.status === QueryObserverStatus.REINITIALIZING) {
            return;
        }
        else if (this.status === QueryObserverStatus.NEW) {
            // Just queue the update for later as we haven't yet been initialized.
            this._updateQueue.push(message);
            return;
        }
        var items = this._items;
        var item = immutable.fromJS(message.item);
        switch (message.msg) {
            case exports.MESSAGE_ADDED: {
                items = items.insert(message.order, item);
                break;
            }
            case exports.MESSAGE_REMOVED: {
                items = items.filterNot(function (other) { return item.get(message.primary_key) === other.get(message.primary_key); }).toList();
                break;
            }
            case exports.MESSAGE_CHANGED: {
                var index = items.findIndex(function (other) { return item.get(message.primary_key) === other.get(message.primary_key); });
                if (index >= 0) {
                    if (index !== message.order) {
                        // Item order has changed, move the item.
                        items = items.remove(index).insert(message.order, item);
                    }
                    else {
                        items = items.set(index, item);
                    }
                }
                break;
            }
            default: {
                var error = new errors_1.QueryObserversError("Unknown message type " + message.msg);
                this._queryObserverManager.errorObserver.onNext(error);
            }
        }
        this._items = items;
        // Push updates to all subscribers.
        if (this.status === QueryObserverStatus.INITIALIZED) {
            this._notify();
        }
    };
    /**
     * Notifies subscribers of new items.
     */
    QueryObserver.prototype._notify = function () {
        this.items = this._items.toJS();
        immutable_1.makeImmutable(this.items);
        this._updatesObserver.onNext(this.items);
    };
    /**
     * Returns an observable that will emit a list of items when any changes
     * happen to the observed query.
     */
    QueryObserver.prototype.observable = function () {
        return this._updatesObservable;
    };
    return QueryObserver;
}());
exports.QueryObserver = QueryObserver;
/**
 * Manages all active query observers.
 */
var QueryObserverManager = /** @class */ (function () {
    /**
     * Constructs a new query observer manager.
     */
    function QueryObserverManager(_connection, _errors) {
        this._connection = _connection;
        this._errors = _errors;
        this._unsubscribeChain = Promise.resolve({});
        this._observers = {};
    }
    Object.defineProperty(QueryObserverManager.prototype, "errorObserver", {
        /**
         * Error observer getter for notifying about query observer errors.
         */
        get: function () {
            return this._errors;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Returns a query observer with a specific identifier.
     *
     * @param {string} observerId Query observer identifier
     * @param {boolean} create Should a new query observer be created if one with the specified identifier does not yet exist
     * @return {QueryObserver} Query observer instance
     */
    QueryObserverManager.prototype.get = function (observerId, create) {
        if (create === void 0) { create = true; }
        // If the specific observer does not yet exist, create a new entry.
        var observer = this._observers[observerId];
        if (!observer && create) {
            observer = new QueryObserver(observerId, this);
            this._observers[observerId] = observer;
        }
        return observer;
    };
    /**
     * Deletes a query observer with the specified identifier.
     *
     * @param observerId Query observer identifier
     */
    QueryObserverManager.prototype._deleteObserver = function (observerId) {
        delete this._observers[observerId];
    };
    /**
     * Requests the backend to unsubscribe us from this observer.
     *
     * @param observerId Query observer identifier
     */
    QueryObserverManager.prototype._unsubscribe = function (observerId) {
        return this._connection.post('/api/queryobserver/unsubscribe', {}, {
            observer: observerId,
            subscriber: this._connection.sessionId(),
        });
    };
    /**
     * Removes a query observer with a specific identifier.
     *
     * Rx has no way of waiting for dispose to finish, that's why
     * we defer reactive queries after unsubscribe is finished.
     *
     * @param {string} observerId Query observer identifier
     */
    QueryObserverManager.prototype.remove = function (observerId) {
        var _this = this;
        this._deleteObserver(observerId);
        // Using promises, because we couldn't get observables to unsubscribe only once.
        // Even using .take(1) didn't seem to correctly limit number of emits
        this._unsubscribeChain = this._unsubscribeChain.then(function () {
            return _this._unsubscribe(observerId).toPromise();
        });
    };
    /**
     * Calls a function that creates an observable, after previous unsubscribe request finishes.
     */
    QueryObserverManager.prototype.chainAfterUnsubscribe = function (makeObservable) {
        return Rx.Observable.fromPromise(this._unsubscribeChain).flatMap(function () {
            return makeObservable();
        });
    };
    /**
     * Changes a query observer's identifier.
     *
     * @param {string} oldObserverId Old query observer identifier
     * @param {QueryObserver} observer New query observer
     */
    QueryObserverManager.prototype.move = function (oldObserverId, observer) {
        if (oldObserverId === observer.id) {
            return;
        }
        this.remove(oldObserverId);
        // The observer we are moving into might have already received some messages. In
        // this case, we need to move the queued messages to the old observer.
        var existingObserver = this._observers[observer.id];
        if (existingObserver) {
            observer.moveFrom(existingObserver);
        }
        this._observers[observer.id] = observer;
    };
    /**
     * Updates the query observers based on an incoming message.
     *
     * @param {Message} message Message instance
     */
    QueryObserverManager.prototype.update = function (message) {
        this.get(message.observer).update(message);
    };
    /**
     * Returns an observable that will emit a list of items when any changes
     * happen to the observed query.
     *
     * @param {string} observerId Query observer identifier
     */
    QueryObserverManager.prototype.observable = function (observerId) {
        return this.get(observerId).observable();
    };
    /**
     * Requests all query observers to start reinitialization.
     *
     * This method should be called when some internal connection state changes
     * (for example, when user authentication state is changed).
     */
    QueryObserverManager.prototype.reinitialize = function () {
        _.forOwn(this._observers, function (observer) {
            observer.reinitialize();
        });
    };
    return QueryObserverManager;
}());
exports.QueryObserverManager = QueryObserverManager;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcXVlcnlvYnNlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDBCQUE0QjtBQUM1Qix1QkFBeUI7QUFDekIscUNBQXVDO0FBR3ZDLHFEQUFzRDtBQUN0RCxtQ0FBNkM7QUFFN0MsMEJBQTBCO0FBQ2IsUUFBQSxhQUFhLEdBQUcsT0FBTyxDQUFDO0FBQ3hCLFFBQUEsZUFBZSxHQUFHLFNBQVMsQ0FBQztBQUM1QixRQUFBLGVBQWUsR0FBRyxTQUFTLENBQUM7QUFFekM7O0dBRUc7QUFDSCxJQUFZLG1CQU1YO0FBTkQsV0FBWSxtQkFBbUI7SUFDM0IsMkRBQUcsQ0FBQTtJQUNILDZFQUFZLENBQUE7SUFDWiwyRUFBVyxDQUFBO0lBQ1gsaUZBQWMsQ0FBQTtJQUNkLG1FQUFPLENBQUE7QUFDWCxDQUFDLEVBTlcsbUJBQW1CLEdBQW5CLDJCQUFtQixLQUFuQiwyQkFBbUIsUUFNOUI7QUFNRDs7O0dBR0c7QUFDSDtJQVVJOzs7OztPQUtHO0lBQ0gsdUJBQW1CLEVBQVUsRUFBVSxxQkFBMkM7UUFBbEYsaUJBU0M7UUFUa0IsT0FBRSxHQUFGLEVBQUUsQ0FBUTtRQUFVLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBc0I7UUFDOUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxtQkFBbUIsQ0FBQyxHQUFHLENBQUM7UUFDdEMsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7UUFDaEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDL0IsSUFBSSxDQUFDLFlBQVksR0FBRyxFQUFFLENBQUM7UUFDdkIsSUFBSSxDQUFDLGtCQUFrQixHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLFVBQUMsUUFBUTtZQUNwRCxLQUFJLENBQUMsZ0JBQWdCLEdBQUcsUUFBUSxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxLQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFJLENBQUMsQ0FBQztRQUNo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b2JzZXJ2ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgKiBhcyBSeCBmcm9tICdyeCc7XG5pbXBvcnQgKiBhcyBpbW11dGFibGUgZnJvbSAnaW1tdXRhYmxlJztcblxuaW1wb3J0IHtNZXNzYWdlLCBDb25uZWN0aW9uLCBRdWVyeU9ic2VydmVyUmVzcG9uc2V9IGZyb20gJy4vY29ubmVjdGlvbic7XG5pbXBvcnQge21ha2VJbW11dGFibGV9IGZyb20gJy4uL2NvcmUvdXRpbHMvaW1tdXRhYmxlJztcbmltcG9ydCB7UXVlcnlPYnNlcnZlcnNFcnJvcn0gZnJvbSAnLi9lcnJvcnMnO1xuXG4vLyBQb3NzaWJsZSBtZXNzYWdlIHR5cGVzLlxuZXhwb3J0IGNvbnN0IE1FU1NBR0VfQURERUQgPSAnYWRkZWQnO1xuZXhwb3J0IGNvbnN0IE1FU1NBR0VfQ0hBTkdFRCA9ICdjaGFuZ2VkJztcbmV4cG9ydCBjb25zdCBNRVNTQUdFX1JFTU9WRUQgPSAncmVtb3ZlZCc7XG5cbi8qKlxuICogVmFsaWQgcXVlcnkgb2JzZXJ2ZXIgc3RhdHVzZXMuXG4gKi9cbmV4cG9ydCBlbnVtIFF1ZXJ5T2JzZXJ2ZXJTdGF0dXMge1xuICAgIE5FVyxcbiAgICBJTklUSUFMSVpJTkcsXG4gICAgSU5JVElBTElaRUQsXG4gICAgUkVJTklUSUFMSVpJTkcsXG4gICAgU1RPUFBFRFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlaW5pdGlhbGl6ZUhhbmRsZXIge1xuICAgICgpOiBSeC5PYnNlcnZhYmxlPE9iamVjdD47XG59XG5cbi8qKlxuICogQSBsb2NhbCBjb3B5IG9mIHRoZSBxdWVyeSBvYnNlcnZlciB0aGF0IGlzIHN5bmNocm9uaXplZCB3aXRoIHRoZSByZW1vdGVcbiAqIGluc3RhbmNlIG9uIHRoZSBnZW5lc2lzIHBsYXRmb3JtIHNlcnZlci5cbiAqL1xuZXhwb3J0IGNsYXNzIFF1ZXJ5T2JzZXJ2ZXIge1xuICAgIHB1YmxpYyBzdGF0dXM6IFF1ZXJ5T2JzZXJ2ZXJTdGF0dXM7XG4gICAgcHVibGljIGl0ZW1zOiBhbnlbXTtcbiAgICBwcml2YXRlIF9pdGVtczogaW1tdXRhYmxlLkxpc3Q8YW55PjtcblxuICAgIHByaXZhdGUgX3VwZGF0ZVF1ZXVlOiBNZXNzYWdlW107XG4gICAgcHJpdmF0ZSBfdXBkYXRlc09ic2VydmFibGU6IFJ4Lk9ic2VydmFibGU8YW55PjtcbiAgICBwcml2YXRlIF91cGRhdGVzT2JzZXJ2ZXI6IFJ4Lk9ic2VydmVyPGFueT47XG4gICAgcHJpdmF0ZSBfcmVpbml0aWFsaXplOiBSZWluaXRpYWxpemVIYW5kbGVyO1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0cyBhIG5ldyBxdWVyeSBvYnNlcnZlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCBVbmlxdWUgcXVlcnkgb2JzZXJ2ZXIgaWRlbnRpZmllclxuICAgICAqIEBwYXJhbSB7UXVlcnlPYnNlcnZlck1hbmFnZXJ9IHF1ZXJ5T2JzZXJ2ZXJNYW5hZ2VyIFF1ZXJ5IG9ic2VydmVyIG1hbmFnZXJcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgaWQ6IHN0cmluZywgcHJpdmF0ZSBfcXVlcnlPYnNlcnZlck1hbmFnZXI6IFF1ZXJ5T2JzZXJ2ZXJNYW5hZ2VyKSB7XG4gICAgICAgIHRoaXMuc3RhdHVzID0gUXVlcnlPYnNlcnZlclN0YXR1cy5ORVc7XG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTtcbiAgICAgICAgdGhpcy5faXRlbXMgPSBpbW11dGFibGUuTGlzdCgpO1xuICAgICAgICB0aGlzLl91cGRhdGVRdWV1ZSA9IFtdO1xuICAgICAgICB0aGlzLl91cGRhdGVzT2JzZXJ2YWJsZSA9IFJ4Lk9ic2VydmFibGUuY3JlYXRlKChvYnNlcnZlcikgPT4ge1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlc09ic2VydmVyID0gb2JzZXJ2ZXI7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdG9wLmJpbmQodGhpcyk7XG4gICAgICAgIH0pLnB1Ymxpc2goKS5yZWZDb3VudCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0b3BzIHRoZSBxdWVyeSBvYnNlcnZlci4gVGhlcmUgc2hvdWxkIGJlIG5vIG5lZWQgdG8gY2FsbCB0aGlzIG1ldGhvZFxuICAgICAqIG1hbnVhbGx5LlxuICAgICAqL1xuICAgIHB1YmxpYyBzdG9wKCkge1xuICAgICAgICB0aGlzLnN0YXR1cyA9IFF1ZXJ5T2JzZXJ2ZXJTdGF0dXMuU1RPUFBFRDtcbiAgICAgICAgdGhpcy5fcXVlcnlPYnNlcnZlck1hbmFnZXIucmVtb3ZlKHRoaXMuaWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgdXAgYSByZWluaXRpYWxpemF0aW9uIGhhbmRsZXIgZm9yIHRoaXMgcXVlcnkgb2JzZXJ2ZXIuIFRoZSBoYW5kbGVyIHdpbGwgYmVcbiAgICAgKiBjYWxsZWQgd2hlbiB0aGUgcXVlcnkgb2JzZXJ2ZXIgbmVlZHMgdG8gYmUgcmVpbml0aWFsaXplZCBhbmQgaXQgc2hvdWxkIHJldHVyblxuICAgICAqIGFuIFJ4Lk9ic2VydmFibGUsIHdoaWNoIHByb2R1Y2VzIHRoZSBpbml0aWFsIFF1ZXJ5T2JzZXJ2ZXJSZXNwb25zZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UmVpbml0aWFsaXplSGFuZGxlcn0gaGFuZGxlciBSZWluaXRpYWxpemF0aW9uIGhhbmRsZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgc2V0UmVpbml0aWFsaXplSGFuZGxlcihoYW5kbGVyOiBSZWluaXRpYWxpemVIYW5kbGVyKSB7XG4gICAgICAgIHRoaXMuX3JlaW5pdGlhbGl6ZSA9IGhhbmRsZXI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RhcnRzIHF1ZXJ5IG9ic2VydmVyIHJlaW5pdGlhbGl6YXRpb24uIFRoaXMgbWV0aG9kIHNob3VsZCBiZSBjYWxsZWQgd2hlbiBzb21lXG4gICAgICogaW50ZXJuYWwgY29ubmVjdGlvbiBzdGF0ZSBjaGFuZ2VzIChmb3IgZXhhbXBsZSwgd2hlbiB1c2VyIGF1dGhlbnRpY2F0aW9uIHN0YXRlXG4gICAgICogaXMgY2hhbmdlZCkuXG4gICAgICovXG4gICAgcHVibGljIHJlaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzICE9PSBRdWVyeU9ic2VydmVyU3RhdHVzLklOSVRJQUxJWkVEKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuX3JlaW5pdGlhbGl6ZSkge1xuICAgICAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgUXVlcnlPYnNlcnZlcnNFcnJvcignQXR0ZW1wdGVkIHRvIHJlaW5pdGlhbGl6ZSBhIFF1ZXJ5T2JzZXJ2ZXIgd2l0aG91dCBhIHJlaW5pdGlhbGl6YXRpb24gaGFuZGxlcicpO1xuICAgICAgICAgICAgdGhpcy5fcXVlcnlPYnNlcnZlck1hbmFnZXIuZXJyb3JPYnNlcnZlci5vbk5leHQoZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zdGF0dXMgPSBRdWVyeU9ic2VydmVyU3RhdHVzLlJFSU5JVElBTElaSU5HO1xuICAgICAgICB0aGlzLl9yZWluaXRpYWxpemUoKS5zdWJzY3JpYmUoKHJlc3BvbnNlOiBRdWVyeU9ic2VydmVyUmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgIC8vIE9ic2VydmVyIGlkZW50aWZpZXIgbWlnaHQgaGF2ZSBjaGFuZ2VkLCB1cGRhdGUgb2JzZXJ2ZXIgYW5kIG1hbmFnZXIuXG4gICAgICAgICAgICBjb25zdCBvbGRJZCA9IHRoaXMuaWQ7XG4gICAgICAgICAgICB0aGlzLmlkID0gcmVzcG9uc2Uub2JzZXJ2ZXI7XG4gICAgICAgICAgICB0aGlzLl9xdWVyeU9ic2VydmVyTWFuYWdlci5tb3ZlKG9sZElkLCB0aGlzKTtcblxuICAgICAgICAgICAgLy8gUGVyZm9ybSByZWluaXRpYWxpemF0aW9uLlxuICAgICAgICAgICAgdGhpcy5zdGF0dXMgPSBRdWVyeU9ic2VydmVyU3RhdHVzLk5FVztcbiAgICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZShyZXNwb25zZS5pdGVtcyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1vdmVzIGFuIGV4aXN0aW5nIHF1ZXJ5IG9ic2VydmVyIGludG8gdGhpcyBxdWVyeSBvYnNlcnZlci4gVGhlIHNvdXJjZSBxdWVyeSBvYnNlcnZlclxuICAgICAqIHNob3VsZCBiZSBjb25zaWRlcmVkIGludmFsaWQgYWZ0ZXIgdGhpcyBvcGVyYXRpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1F1ZXJ5T2JzZXJ2ZXJ9IG9ic2VydmVyIFNvdXJjZSBxdWVyeSBvYnNlcnZlclxuICAgICAqL1xuICAgIHB1YmxpYyBtb3ZlRnJvbShvYnNlcnZlcjogUXVlcnlPYnNlcnZlcikge1xuICAgICAgICB0aGlzLl91cGRhdGVRdWV1ZSA9IG9ic2VydmVyLl91cGRhdGVRdWV1ZTtcbiAgICAgICAgb2JzZXJ2ZXIuX3VwZGF0ZVF1ZXVlID0gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgcXVlcnkgb2JzZXJ2ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2FueVtdfSBpdGVtcyBBbiBpbml0aWFsIGxpc3Qgb2YgaXRlbXNcbiAgICAgKi9cbiAgICBwdWJsaWMgaW5pdGlhbGl6ZShpdGVtczogYW55W10pIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzICE9PSBRdWVyeU9ic2VydmVyU3RhdHVzLk5FVykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKF8uaXNVbmRlZmluZWQoaXRlbXMpKSB7XG4gICAgICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBRdWVyeU9ic2VydmVyc0Vycm9yKCdJbnZhbGlkIHJlc3BvbnNlIHJlY2VpdmVkIGZyb20gYmFja2VuZCwgaXMgdGhlIHJlc291cmNlIG9ic2VydmFibGU/Jyk7XG4gICAgICAgICAgICB0aGlzLl9xdWVyeU9ic2VydmVyTWFuYWdlci5lcnJvck9ic2VydmVyLm9uTmV4dChlcnJvcik7XG5cbiAgICAgICAgICAgIGl0ZW1zID0gW107XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9pdGVtcyA9IGltbXV0YWJsZS5mcm9tSlMoaXRlbXMpO1xuICAgICAgICB0aGlzLnN0YXR1cyA9IFF1ZXJ5T2JzZXJ2ZXJTdGF0dXMuSU5JVElBTElaSU5HO1xuXG4gICAgICAgIC8vIFByb2Nlc3MgYWxsIHF1ZXVlZCBtZXNzYWdlcy5cbiAgICAgICAgXy5mb3JFYWNoKHRoaXMuX3VwZGF0ZVF1ZXVlLCB0aGlzLnVwZGF0ZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5fdXBkYXRlUXVldWUgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuc3RhdHVzID0gUXVlcnlPYnNlcnZlclN0YXR1cy5JTklUSUFMSVpFRDtcbiAgICAgICAgdGhpcy5fbm90aWZ5KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0aGUgaXRlbSBjYWNoZSBiYXNlZCBvbiBhbiBpbmNvbWluZyBtZXNzYWdlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtNZXNzYWdlfSBtZXNzYWdlIE1lc3NhZ2UgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgdXBkYXRlKG1lc3NhZ2U6IE1lc3NhZ2UpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzID09PSBRdWVyeU9ic2VydmVyU3RhdHVzLlNUT1BQRUQgfHwgdGhpcy5zdGF0dXMgPT09IFF1ZXJ5T2JzZXJ2ZXJTdGF0dXMuUkVJTklUSUFMSVpJTkcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXR1cyA9PT0gUXVlcnlPYnNlcnZlclN0YXR1cy5ORVcpIHtcbiAgICAgICAgICAgIC8vIEp1c3QgcXVldWUgdGhlIHVwZGF0ZSBmb3IgbGF0ZXIgYXMgd2UgaGF2ZW4ndCB5ZXQgYmVlbiBpbml0aWFsaXplZC5cbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVF1ZXVlLnB1c2gobWVzc2FnZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgaXRlbXMgPSB0aGlzLl9pdGVtcztcbiAgICAgICAgbGV0IGl0ZW0gPSBpbW11dGFibGUuZnJvbUpTKG1lc3NhZ2UuaXRlbSk7XG4gICAgICAgIHN3aXRjaCAobWVzc2FnZS5tc2cpIHtcbiAgICAgICAgICAgIGNhc2UgTUVTU0FHRV9BRERFRDoge1xuICAgICAgICAgICAgICAgIGl0ZW1zID0gaXRlbXMuaW5zZXJ0KG1lc3NhZ2Uub3JkZXIsIGl0ZW0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBNRVNTQUdFX1JFTU9WRUQ6IHtcbiAgICAgICAgICAgICAgICBpdGVtcyA9IGl0ZW1zLmZpbHRlck5vdChcbiAgICAgICAgICAgICAgICAgICAgKG90aGVyKSA9PiBpdGVtLmdldChtZXNzYWdlLnByaW1hcnlfa2V5KSA9PT0gb3RoZXIuZ2V0KG1lc3NhZ2UucHJpbWFyeV9rZXkpXG4gICAgICAgICAgICAgICAgKS50b0xpc3QoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgTUVTU0FHRV9DSEFOR0VEOiB7XG4gICAgICAgICAgICAgICAgbGV0IGluZGV4ID0gaXRlbXMuZmluZEluZGV4KFxuICAgICAgICAgICAgICAgICAgICAob3RoZXIpID0+IGl0ZW0uZ2V0KG1lc3NhZ2UucHJpbWFyeV9rZXkpID09PSBvdGhlci5nZXQobWVzc2FnZS5wcmltYXJ5X2tleSlcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gbWVzc2FnZS5vcmRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSXRlbSBvcmRlciBoYXMgY2hhbmdlZCwgbW92ZSB0aGUgaXRlbS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zID0gaXRlbXMucmVtb3ZlKGluZGV4KS5pbnNlcnQobWVzc2FnZS5vcmRlciwgaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtcyA9IGl0ZW1zLnNldChpbmRleCwgaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgUXVlcnlPYnNlcnZlcnNFcnJvcihgVW5rbm93biBtZXNzYWdlIHR5cGUgJHttZXNzYWdlLm1zZ31gKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9xdWVyeU9ic2VydmVyTWFuYWdlci5lcnJvck9ic2VydmVyLm9uTmV4dChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9pdGVtcyA9IGl0ZW1zO1xuXG4gICAgICAgIC8vIFB1c2ggdXBkYXRlcyB0byBhbGwgc3Vic2NyaWJlcnMuXG4gICAgICAgIGlmICh0aGlzLnN0YXR1cyA9PT0gUXVlcnlPYnNlcnZlclN0YXR1cy5JTklUSUFMSVpFRCkge1xuICAgICAgICAgICAgdGhpcy5fbm90aWZ5KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBOb3RpZmllcyBzdWJzY3JpYmVycyBvZiBuZXcgaXRlbXMuXG4gICAgICovXG4gICAgcHJpdmF0ZSBfbm90aWZ5KCk6IHZvaWQge1xuICAgICAgICB0aGlzLml0ZW1zID0gdGhpcy5faXRlbXMudG9KUygpO1xuICAgICAgICBtYWtlSW1tdXRhYmxlKHRoaXMuaXRlbXMpO1xuXG4gICAgICAgIHRoaXMuX3VwZGF0ZXNPYnNlcnZlci5vbk5leHQodGhpcy5pdGVtcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhbiBvYnNlcnZhYmxlIHRoYXQgd2lsbCBlbWl0IGEgbGlzdCBvZiBpdGVtcyB3aGVuIGFueSBjaGFuZ2VzXG4gICAgICogaGFwcGVuIHRvIHRoZSBvYnNlcnZlZCBxdWVyeS5cbiAgICAgKi9cbiAgICBwdWJsaWMgb2JzZXJ2YWJsZSgpOiBSeC5PYnNlcnZhYmxlPGFueT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fdXBkYXRlc09ic2VydmFibGU7XG4gICAgfVxufVxuXG4vKipcbiAqIEEgZGljdGlvbmFyeSBjb250YWluaW5nIHRoZSBxdWVyeSBvYnNlcnZlcnMsIGluZGV4ZWQgYnkgdGhlaXIgaWRlbnRpZmllci5cbiAqL1xuaW50ZXJmYWNlIFF1ZXJ5T2JzZXJ2ZXJNYXAge1xuICAgIFtpbmRleDogc3RyaW5nXTogUXVlcnlPYnNlcnZlcjtcbn1cblxuLyoqXG4gKiBNYW5hZ2VzIGFsbCBhY3RpdmUgcXVlcnkgb2JzZXJ2ZXJzLlxuICovXG5leHBvcnQgY2xhc3MgUXVlcnlPYnNlcnZlck1hbmFnZXIge1xuICAgIHByaXZhdGUgX29ic2VydmVyczogUXVlcnlPYnNlcnZlck1hcDtcbiAgICBwcml2YXRlIF91bnN1YnNjcmliZUNoYWluID0gUHJvbWlzZS5yZXNvbHZlPGFueT4oe30pO1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0cyBhIG5ldyBxdWVyeSBvYnNlcnZlciBtYW5hZ2VyLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX2Nvbm5lY3Rpb246IENvbm5lY3Rpb24sIHByaXZhdGUgX2Vycm9yczogUnguT2JzZXJ2ZXI8UXVlcnlPYnNlcnZlcnNFcnJvcj4pIHtcbiAgICAgICAgdGhpcy5fb2JzZXJ2ZXJzID0ge307XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXJyb3Igb2JzZXJ2ZXIgZ2V0dGVyIGZvciBub3RpZnlpbmcgYWJvdXQgcXVlcnkgb2JzZXJ2ZXIgZXJyb3JzLlxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQgZXJyb3JPYnNlcnZlcigpOiBSeC5PYnNlcnZlcjxRdWVyeU9ic2VydmVyc0Vycm9yPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lcnJvcnM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIHF1ZXJ5IG9ic2VydmVyIHdpdGggYSBzcGVjaWZpYyBpZGVudGlmaWVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG9ic2VydmVySWQgUXVlcnkgb2JzZXJ2ZXIgaWRlbnRpZmllclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gY3JlYXRlIFNob3VsZCBhIG5ldyBxdWVyeSBvYnNlcnZlciBiZSBjcmVhdGVkIGlmIG9uZSB3aXRoIHRoZSBzcGVjaWZpZWQgaWRlbnRpZmllciBkb2VzIG5vdCB5ZXQgZXhpc3RcbiAgICAgKiBAcmV0dXJuIHtRdWVyeU9ic2VydmVyfSBRdWVyeSBvYnNlcnZlciBpbnN0YW5jZVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQob2JzZXJ2ZXJJZDogc3RyaW5nLCBjcmVhdGU6IGJvb2xlYW4gPSB0cnVlKTogUXVlcnlPYnNlcnZlciB7XG4gICAgICAgIC8vIElmIHRoZSBzcGVjaWZpYyBvYnNlcnZlciBkb2VzIG5vdCB5ZXQgZXhpc3QsIGNyZWF0ZSBhIG5ldyBlbnRyeS5cbiAgICAgICAgbGV0IG9ic2VydmVyID0gdGhpcy5fb2JzZXJ2ZXJzW29ic2VydmVySWRdO1xuICAgICAgICBpZiAoIW9ic2VydmVyICYmIGNyZWF0ZSkge1xuICAgICAgICAgICAgb2JzZXJ2ZXIgPSBuZXcgUXVlcnlPYnNlcnZlcihvYnNlcnZlcklkLCB0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuX29ic2VydmVyc1tvYnNlcnZlcklkXSA9IG9ic2VydmVyO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG9ic2VydmVyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlbGV0ZXMgYSBxdWVyeSBvYnNlcnZlciB3aXRoIHRoZSBzcGVjaWZpZWQgaWRlbnRpZmllci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvYnNlcnZlcklkIFF1ZXJ5IG9ic2VydmVyIGlkZW50aWZpZXJcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX2RlbGV0ZU9ic2VydmVyKG9ic2VydmVySWQ6IHN0cmluZykge1xuICAgICAgICBkZWxldGUgdGhpcy5fb2JzZXJ2ZXJzW29ic2VydmVySWRdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlcXVlc3RzIHRoZSBiYWNrZW5kIHRvIHVuc3Vic2NyaWJlIHVzIGZyb20gdGhpcyBvYnNlcnZlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvYnNlcnZlcklkIFF1ZXJ5IG9ic2VydmVyIGlkZW50aWZpZXJcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX3Vuc3Vic2NyaWJlPFQ+KG9ic2VydmVySWQ6IHN0cmluZyk6IFJ4Lk9ic2VydmFibGU8VD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29ubmVjdGlvbi5wb3N0PFQ+KCcvYXBpL3F1ZXJ5b2JzZXJ2ZXIvdW5zdWJzY3JpYmUnLCB7fSwge1xuICAgICAgICAgICAgb2JzZXJ2ZXI6IG9ic2VydmVySWQsXG4gICAgICAgICAgICBzdWJzY3JpYmVyOiB0aGlzLl9jb25uZWN0aW9uLnNlc3Npb25JZCgpLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGEgcXVlcnkgb2JzZXJ2ZXIgd2l0aCBhIHNwZWNpZmljIGlkZW50aWZpZXIuXG4gICAgICpcbiAgICAgKiBSeCBoYXMgbm8gd2F5IG9mIHdhaXRpbmcgZm9yIGRpc3Bvc2UgdG8gZmluaXNoLCB0aGF0J3Mgd2h5XG4gICAgICogd2UgZGVmZXIgcmVhY3RpdmUgcXVlcmllcyBhZnRlciB1bnN1YnNjcmliZSBpcyBmaW5pc2hlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBvYnNlcnZlcklkIFF1ZXJ5IG9ic2VydmVyIGlkZW50aWZpZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgcmVtb3ZlKG9ic2VydmVySWQ6IHN0cmluZykge1xuICAgICAgICB0aGlzLl9kZWxldGVPYnNlcnZlcihvYnNlcnZlcklkKTtcblxuICAgICAgICAvLyBVc2luZyBwcm9taXNlcywgYmVjYXVzZSB3ZSBjb3VsZG4ndCBnZXQgb2JzZXJ2YWJsZXMgdG8gdW5zdWJzY3JpYmUgb25seSBvbmNlLlxuICAgICAgICAvLyBFdmVuIHVzaW5nIC50YWtlKDEpIGRpZG4ndCBzZWVtIHRvIGNvcnJlY3RseSBsaW1pdCBudW1iZXIgb2YgZW1pdHNcbiAgICAgICAgdGhpcy5fdW5zdWJzY3JpYmVDaGFpbiA9IHRoaXMuX3Vuc3Vic2NyaWJlQ2hhaW4udGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdW5zdWJzY3JpYmUob2JzZXJ2ZXJJZCkudG9Qcm9taXNlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGxzIGEgZnVuY3Rpb24gdGhhdCBjcmVhdGVzIGFuIG9ic2VydmFibGUsIGFmdGVyIHByZXZpb3VzIHVuc3Vic2NyaWJlIHJlcXVlc3QgZmluaXNoZXMuXG4gICAgICovXG4gICAgcHVibGljIGNoYWluQWZ0ZXJVbnN1YnNjcmliZTxUPihtYWtlT2JzZXJ2YWJsZTogKCkgPT4gUnguT2JzZXJ2YWJsZTxUPik6IFJ4Lk9ic2VydmFibGU8VD4ge1xuICAgICAgICByZXR1cm4gUnguT2JzZXJ2YWJsZS5mcm9tUHJvbWlzZSh0aGlzLl91bnN1YnNjcmliZUNoYWluKS5mbGF0TWFwKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBtYWtlT2JzZXJ2YWJsZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGFuZ2VzIGEgcXVlcnkgb2JzZXJ2ZXIncyBpZGVudGlmaWVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG9sZE9ic2VydmVySWQgT2xkIHF1ZXJ5IG9ic2VydmVyIGlkZW50aWZpZXJcbiAgICAgKiBAcGFyYW0ge1F1ZXJ5T2JzZXJ2ZXJ9IG9ic2VydmVyIE5ldyBxdWVyeSBvYnNlcnZlclxuICAgICAqL1xuICAgIHB1YmxpYyBtb3ZlKG9sZE9ic2VydmVySWQ6IHN0cmluZywgb2JzZXJ2ZXI6IFF1ZXJ5T2JzZXJ2ZXIpIHtcbiAgICAgICAgaWYgKG9sZE9ic2VydmVySWQgPT09IG9ic2VydmVyLmlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJlbW92ZShvbGRPYnNlcnZlcklkKTtcblxuICAgICAgICAvLyBUaGUgb2JzZXJ2ZXIgd2UgYXJlIG1vdmluZyBpbnRvIG1pZ2h0IGhhdmUgYWxyZWFkeSByZWNlaXZlZCBzb21lIG1lc3NhZ2VzLiBJblxuICAgICAgICAvLyB0aGlzIGNhc2UsIHdlIG5lZWQgdG8gbW92ZSB0aGUgcXVldWVkIG1lc3NhZ2VzIHRvIHRoZSBvbGQgb2JzZXJ2ZXIuXG4gICAgICAgIGxldCBleGlzdGluZ09ic2VydmVyID0gdGhpcy5fb2JzZXJ2ZXJzW29ic2VydmVyLmlkXTtcbiAgICAgICAgaWYgKGV4aXN0aW5nT2JzZXJ2ZXIpIHtcbiAgICAgICAgICAgIG9ic2VydmVyLm1vdmVGcm9tKGV4aXN0aW5nT2JzZXJ2ZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fb2JzZXJ2ZXJzW29ic2VydmVyLmlkXSA9IG9ic2VydmVyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIHF1ZXJ5IG9ic2VydmVycyBiYXNlZCBvbiBhbiBpbmNvbWluZyBtZXNzYWdlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtNZXNzYWdlfSBtZXNzYWdlIE1lc3NhZ2UgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgdXBkYXRlKG1lc3NhZ2U6IE1lc3NhZ2UpIHtcbiAgICAgICAgdGhpcy5nZXQobWVzc2FnZS5vYnNlcnZlcikudXBkYXRlKG1lc3NhZ2UpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYW4gb2JzZXJ2YWJsZSB0aGF0IHdpbGwgZW1pdCBhIGxpc3Qgb2YgaXRlbXMgd2hlbiBhbnkgY2hhbmdlc1xuICAgICAqIGhhcHBlbiB0byB0aGUgb2JzZXJ2ZWQgcXVlcnkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gb2JzZXJ2ZXJJZCBRdWVyeSBvYnNlcnZlciBpZGVudGlmaWVyXG4gICAgICovXG4gICAgcHVibGljIG9ic2VydmFibGUob2JzZXJ2ZXJJZDogc3RyaW5nKTogUnguT2JzZXJ2YWJsZTxPYmplY3Q+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0KG9ic2VydmVySWQpLm9ic2VydmFibGUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0cyBhbGwgcXVlcnkgb2JzZXJ2ZXJzIHRvIHN0YXJ0IHJlaW5pdGlhbGl6YXRpb24uXG4gICAgICpcbiAgICAgKiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgY2FsbGVkIHdoZW4gc29tZSBpbnRlcm5hbCBjb25uZWN0aW9uIHN0YXRlIGNoYW5nZXNcbiAgICAgKiAoZm9yIGV4YW1wbGUsIHdoZW4gdXNlciBhdXRoZW50aWNhdGlvbiBzdGF0ZSBpcyBjaGFuZ2VkKS5cbiAgICAgKi9cbiAgICBwdWJsaWMgcmVpbml0aWFsaXplKCkge1xuICAgICAgICBfLmZvck93bih0aGlzLl9vYnNlcnZlcnMsIChvYnNlcnZlcikgPT4ge1xuICAgICAgICAgICAgb2JzZXJ2ZXIucmVpbml0aWFsaXplKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiJdfQ==
