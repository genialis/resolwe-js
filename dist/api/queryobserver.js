"use strict";
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
var QueryObserver = (function () {
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
var QueryObserverManager = (function () {
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcXVlcnlvYnNlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsMEJBQTRCO0FBQzVCLHVCQUF5QjtBQUN6QixxQ0FBdUM7QUFHdkMscURBQXNEO0FBQ3RELG1DQUE2QztBQUU3QywwQkFBMEI7QUFDYixRQUFBLGFBQWEsR0FBRyxPQUFPLENBQUM7QUFDeEIsUUFBQSxlQUFlLEdBQUcsU0FBUyxDQUFDO0FBQzVCLFFBQUEsZUFBZSxHQUFHLFNBQVMsQ0FBQztBQUV6Qzs7R0FFRztBQUNILElBQVksbUJBTVg7QUFORCxXQUFZLG1CQUFtQjtJQUMzQiwyREFBRyxDQUFBO0lBQ0gsNkVBQVksQ0FBQTtJQUNaLDJFQUFXLENBQUE7SUFDWCxpRkFBYyxDQUFBO0lBQ2QsbUVBQU8sQ0FBQTtBQUNYLENBQUMsRUFOVyxtQkFBbUIsR0FBbkIsMkJBQW1CLEtBQW5CLDJCQUFtQixRQU05QjtBQU1EOzs7R0FHRztBQUNIO0lBVUk7Ozs7O09BS0c7SUFDSCx1QkFBbUIsRUFBVSxFQUFVLHFCQUEyQztRQUFsRixpQkFTQztRQVRrQixPQUFFLEdBQUYsRUFBRSxDQUFRO1FBQVUsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUFzQjtRQUM5RSxJQUFJLENBQUMsTUFBTSxHQUFHLG1CQUFtQixDQUFDLEdBQUcsQ0FBQztRQUN0QyxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztRQUNoQixJQUFJLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMvQixJQUFJLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQztRQUN2QixJQUFJLENBQUMsa0JBQWtCLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsVUFBQyxRQUFRO1lBQ3BELEtBQUksQ0FBQyxnQkFBZ0IsR0FBRyxRQUFRLENBQUM7WUFDakMsTUFBTSxDQUFDLEtBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUksQ0FBQyxDQUFDO1FBQ2hDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzVCLENBQUM7SUFFRDs7O09BR0c7SUFDSSw0QkFBSSxHQUFYO1FBQ0ksSUFBSSxDQUFDLE1BQU0sR0FBRyxtQkFBbUIsQ0FBQyxPQUFPLENBQUM7UUFDMUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNJLDhDQUFzQixHQUE3QixVQUE4QixPQUE0QjtRQUN0RCxJQUFJLENBQUMsYUFBYSxHQUFHLE9BQU8sQ0FBQztJQUNqQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNJLG9DQUFZLEdBQW5CO1FBQUEsaUJBc0JDO1FBckJHLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssbUJBQW1CLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUM7UUFDWCxDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUN0QixJQUFNLEtBQUssR0FBRyxJQUFJLDRCQUFtQixDQUFDLDhFQUE4RSxDQUFDLENBQUM7WUFDdEgsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkQsTUFBTSxDQUFDO1FBQ1gsQ0FBQztRQUVELElBQUksQ0FBQyxNQUFNLEdBQUcsbUJBQW1CLENBQUMsY0FBYyxDQUFDO1FBQ2pELElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxTQUFTLENBQUMsVUFBQyxRQUErQjtZQUMzRCx1RUFBdUU7WUFDdkUsSUFBTSxLQUFLLEdBQUcsS0FBSSxDQUFDLEVBQUUsQ0FBQztZQUN0QixLQUFJLENBQUMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUM7WUFDNUIsS0FBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSSxDQUFDLENBQUM7WUFFN0MsNEJBQTRCO1lBQzVCLEtBQUksQ0FBQyxNQUFNLEdBQUcsbUJBQW1CLENBQUMsR0FBRyxDQUFDO1lBQ3RDLEtBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BDLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ksZ0NBQVEsR0FBZixVQUFnQixRQUF1QjtRQUNuQyxJQUFJLENBQUMsWUFBWSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUM7UUFDMUMsUUFBUSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7SUFDakMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSxrQ0FBVSxHQUFqQixVQUFrQixLQUFZO1FBQzFCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssbUJBQW1CLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUMxQyxNQUFNLENBQUM7UUFDWCxDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkIsSUFBTSxLQUFLLEdBQUcsSUFBSSw0QkFBbUIsQ0FBQyxxRUFBcUUsQ0FBQyxDQUFDO1lBQzdHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXZELEtBQUssR0FBRyxFQUFFLENBQUM7UUFDZixDQUFDO1FBRUQsSUFBSSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxNQUFNLEdBQUcsbUJBQW1CLENBQUMsWUFBWSxDQUFDO1FBRS9DLCtCQUErQjtRQUMvQixDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNyRCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztRQUV6QixJQUFJLENBQUMsTUFBTSxHQUFHLG1CQUFtQixDQUFDLFdBQVcsQ0FBQztRQUM5QyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSw4QkFBTSxHQUFiLFVBQWMsT0FBZ0I7UUFDMUIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxtQkFBbUIsQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxtQkFBbUIsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1lBQ3BHLE1BQU0sQ0FBQztRQUNYLENBQUM7UUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2pELHNFQUFzRTtZQUN0RSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUM7UUFDWCxDQUFDO1FBRUQsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUN4QixJQUFJLElBQUksR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNsQixLQUFLLHFCQUFhLEVBQUUsQ0FBQztnQkFDakIsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDMUMsS0FBSyxDQUFDO1lBQ1YsQ0FBQztZQUNELEtBQUssdUJBQWUsRUFBRSxDQUFDO2dCQUNuQixLQUFLLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FDbkIsVUFBQyxLQUFLLElBQUssT0FBQSxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsS0FBSyxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFBaEUsQ0FBZ0UsQ0FDOUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDWCxLQUFLLENBQUM7WUFDVixDQUFDO1lBQ0QsS0FBSyx1QkFBZSxFQUFFLENBQUM7Z0JBQ25CLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQ3ZCLFVBQUMsS0FBSyxJQUFLLE9BQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQUssS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQWhFLENBQWdFLENBQzlFLENBQUM7Z0JBQ0YsRUFBRSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2IsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO3dCQUMxQix5Q0FBeUM7d0JBQ3pDLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUM1RCxDQUFDO29CQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNKLEtBQUssR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDbkMsQ0FBQztnQkFDTCxDQUFDO2dCQUNELEtBQUssQ0FBQztZQUNWLENBQUM7WUFDRCxTQUFTLENBQUM7Z0JBQ04sSUFBTSxLQUFLLEdBQUcsSUFBSSw0QkFBbUIsQ0FBQywwQkFBd0IsT0FBTyxDQUFDLEdBQUssQ0FBQyxDQUFDO2dCQUM3RSxJQUFJLENBQUMscUJBQXFCLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzRCxDQUFDO1FBQ0wsQ0FBQztRQUVELElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1FBRXBCLG1DQUFtQztRQUNuQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDbEQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ25CLENBQUM7SUFDTCxDQUFDO0lBRUQ7O09BRUc7SUFDSywrQkFBTyxHQUFmO1FBQ0ksSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2hDLHlCQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRTFCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFRDs7O09BR0c7SUFDSSxrQ0FBVSxHQUFqQjtRQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUM7SUFDbkMsQ0FBQztJQUNMLG9CQUFDO0FBQUQsQ0EzTEEsQUEyTEMsSUFBQTtBQTNMWSxzQ0FBYTtBQW9NMUI7O0dBRUc7QUFDSDtJQUlJOztPQUVHO0lBQ0gsOEJBQW9CLFdBQXVCLEVBQVUsT0FBeUM7UUFBMUUsZ0JBQVcsR0FBWCxXQUFXLENBQVk7UUFBVSxZQUFPLEdBQVAsT0FBTyxDQUFrQztRQUx0RixzQkFBaUIsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFNLEVBQUUsQ0FBQyxDQUFDO1FBTWpELElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO0lBQ3pCLENBQUM7SUFLRCxzQkFBVywrQ0FBYTtRQUh4Qjs7V0FFRzthQUNIO1lBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDeEIsQ0FBQzs7O09BQUE7SUFFRDs7Ozs7O09BTUc7SUFDSSxrQ0FBRyxHQUFWLFVBQVcsVUFBa0IsRUFBRSxNQUFzQjtRQUF0Qix1QkFBQSxFQUFBLGFBQXNCO1FBQ2pELG1FQUFtRTtRQUNuRSxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzNDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDdEIsUUFBUSxHQUFHLElBQUksYUFBYSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMvQyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxHQUFHLFFBQVEsQ0FBQztRQUMzQyxDQUFDO1FBRUQsTUFBTSxDQUFDLFFBQVEsQ0FBQztJQUNwQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNPLDhDQUFlLEdBQXpCLFVBQTBCLFVBQWtCO1FBQ3hDLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNPLDJDQUFZLEdBQXRCLFVBQTBCLFVBQWtCO1FBQ3hDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBSSxnQ0FBZ0MsRUFBRSxFQUFFLEVBQUU7WUFDbEUsUUFBUSxFQUFFLFVBQVU7WUFDcEIsVUFBVSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFO1NBQzNDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0kscUNBQU0sR0FBYixVQUFjLFVBQWtCO1FBQWhDLGlCQVFDO1FBUEcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUVqQyxnRkFBZ0Y7UUFDaEYscUVBQXFFO1FBQ3JFLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxLQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ3JELENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVEOztPQUVHO0lBQ0ksb0RBQXFCLEdBQTVCLFVBQWdDLGNBQXNDO1FBQ2xFLE1BQU0sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxPQUFPLENBQUM7WUFDN0QsTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ksbUNBQUksR0FBWCxVQUFZLGFBQXFCLEVBQUUsUUFBdUI7UUFDdEQsRUFBRSxDQUFDLENBQUMsYUFBYSxLQUFLLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQztRQUNYLENBQUM7UUFFRCxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBRTNCLGdGQUFnRjtRQUNoRixzRUFBc0U7UUFDdEUsSUFBSSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNwRCxFQUFFLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7WUFDbkIsUUFBUSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7UUFFRCxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUM7SUFDNUMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSxxQ0FBTSxHQUFiLFVBQWMsT0FBZ0I7UUFDMUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNJLHlDQUFVLEdBQWpCLFVBQWtCLFVBQWtCO1FBQ2hDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQzdDLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNJLDJDQUFZLEdBQW5CO1FBQ0ksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFVBQUMsUUFBUTtZQUMvQixRQUFRLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDNUIsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBQ0wsMkJBQUM7QUFBRCxDQXpJQSxBQXlJQyxJQUFBO0FBeklZLG9EQUFvQiIsImZpbGUiOiJhcGkvcXVlcnlvYnNlcnZlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIFJ4IGZyb20gJ3J4JztcbmltcG9ydCAqIGFzIGltbXV0YWJsZSBmcm9tICdpbW11dGFibGUnO1xuXG5pbXBvcnQge01lc3NhZ2UsIENvbm5lY3Rpb24sIFF1ZXJ5T2JzZXJ2ZXJSZXNwb25zZX0gZnJvbSAnLi9jb25uZWN0aW9uJztcbmltcG9ydCB7bWFrZUltbXV0YWJsZX0gZnJvbSAnLi4vY29yZS91dGlscy9pbW11dGFibGUnO1xuaW1wb3J0IHtRdWVyeU9ic2VydmVyc0Vycm9yfSBmcm9tICcuL2Vycm9ycyc7XG5cbi8vIFBvc3NpYmxlIG1lc3NhZ2UgdHlwZXMuXG5leHBvcnQgY29uc3QgTUVTU0FHRV9BRERFRCA9ICdhZGRlZCc7XG5leHBvcnQgY29uc3QgTUVTU0FHRV9DSEFOR0VEID0gJ2NoYW5nZWQnO1xuZXhwb3J0IGNvbnN0IE1FU1NBR0VfUkVNT1ZFRCA9ICdyZW1vdmVkJztcblxuLyoqXG4gKiBWYWxpZCBxdWVyeSBvYnNlcnZlciBzdGF0dXNlcy5cbiAqL1xuZXhwb3J0IGVudW0gUXVlcnlPYnNlcnZlclN0YXR1cyB7XG4gICAgTkVXLFxuICAgIElOSVRJQUxJWklORyxcbiAgICBJTklUSUFMSVpFRCxcbiAgICBSRUlOSVRJQUxJWklORyxcbiAgICBTVE9QUEVEXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVpbml0aWFsaXplSGFuZGxlciB7XG4gICAgKCk6IFJ4Lk9ic2VydmFibGU8T2JqZWN0Pjtcbn1cblxuLyoqXG4gKiBBIGxvY2FsIGNvcHkgb2YgdGhlIHF1ZXJ5IG9ic2VydmVyIHRoYXQgaXMgc3luY2hyb25pemVkIHdpdGggdGhlIHJlbW90ZVxuICogaW5zdGFuY2Ugb24gdGhlIGdlbmVzaXMgcGxhdGZvcm0gc2VydmVyLlxuICovXG5leHBvcnQgY2xhc3MgUXVlcnlPYnNlcnZlciB7XG4gICAgcHVibGljIHN0YXR1czogUXVlcnlPYnNlcnZlclN0YXR1cztcbiAgICBwdWJsaWMgaXRlbXM6IGFueVtdO1xuICAgIHByaXZhdGUgX2l0ZW1zOiBpbW11dGFibGUuTGlzdDxhbnk+O1xuXG4gICAgcHJpdmF0ZSBfdXBkYXRlUXVldWU6IE1lc3NhZ2VbXTtcbiAgICBwcml2YXRlIF91cGRhdGVzT2JzZXJ2YWJsZTogUnguT2JzZXJ2YWJsZTxhbnk+O1xuICAgIHByaXZhdGUgX3VwZGF0ZXNPYnNlcnZlcjogUnguT2JzZXJ2ZXI8YW55PjtcbiAgICBwcml2YXRlIF9yZWluaXRpYWxpemU6IFJlaW5pdGlhbGl6ZUhhbmRsZXI7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RzIGEgbmV3IHF1ZXJ5IG9ic2VydmVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIFVuaXF1ZSBxdWVyeSBvYnNlcnZlciBpZGVudGlmaWVyXG4gICAgICogQHBhcmFtIHtRdWVyeU9ic2VydmVyTWFuYWdlcn0gcXVlcnlPYnNlcnZlck1hbmFnZXIgUXVlcnkgb2JzZXJ2ZXIgbWFuYWdlclxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBpZDogc3RyaW5nLCBwcml2YXRlIF9xdWVyeU9ic2VydmVyTWFuYWdlcjogUXVlcnlPYnNlcnZlck1hbmFnZXIpIHtcbiAgICAgICAgdGhpcy5zdGF0dXMgPSBRdWVyeU9ic2VydmVyU3RhdHVzLk5FVztcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdO1xuICAgICAgICB0aGlzLl9pdGVtcyA9IGltbXV0YWJsZS5MaXN0KCk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVF1ZXVlID0gW107XG4gICAgICAgIHRoaXMuX3VwZGF0ZXNPYnNlcnZhYmxlID0gUnguT2JzZXJ2YWJsZS5jcmVhdGUoKG9ic2VydmVyKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVzT2JzZXJ2ZXIgPSBvYnNlcnZlcjtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN0b3AuYmluZCh0aGlzKTtcbiAgICAgICAgfSkucHVibGlzaCgpLnJlZkNvdW50KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RvcHMgdGhlIHF1ZXJ5IG9ic2VydmVyLiBUaGVyZSBzaG91bGQgYmUgbm8gbmVlZCB0byBjYWxsIHRoaXMgbWV0aG9kXG4gICAgICogbWFudWFsbHkuXG4gICAgICovXG4gICAgcHVibGljIHN0b3AoKSB7XG4gICAgICAgIHRoaXMuc3RhdHVzID0gUXVlcnlPYnNlcnZlclN0YXR1cy5TVE9QUEVEO1xuICAgICAgICB0aGlzLl9xdWVyeU9ic2VydmVyTWFuYWdlci5yZW1vdmUodGhpcy5pZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB1cCBhIHJlaW5pdGlhbGl6YXRpb24gaGFuZGxlciBmb3IgdGhpcyBxdWVyeSBvYnNlcnZlci4gVGhlIGhhbmRsZXIgd2lsbCBiZVxuICAgICAqIGNhbGxlZCB3aGVuIHRoZSBxdWVyeSBvYnNlcnZlciBuZWVkcyB0byBiZSByZWluaXRpYWxpemVkIGFuZCBpdCBzaG91bGQgcmV0dXJuXG4gICAgICogYW4gUnguT2JzZXJ2YWJsZSwgd2hpY2ggcHJvZHVjZXMgdGhlIGluaXRpYWwgUXVlcnlPYnNlcnZlclJlc3BvbnNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtSZWluaXRpYWxpemVIYW5kbGVyfSBoYW5kbGVyIFJlaW5pdGlhbGl6YXRpb24gaGFuZGxlclxuICAgICAqL1xuICAgIHB1YmxpYyBzZXRSZWluaXRpYWxpemVIYW5kbGVyKGhhbmRsZXI6IFJlaW5pdGlhbGl6ZUhhbmRsZXIpIHtcbiAgICAgICAgdGhpcy5fcmVpbml0aWFsaXplID0gaGFuZGxlcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdGFydHMgcXVlcnkgb2JzZXJ2ZXIgcmVpbml0aWFsaXphdGlvbi4gVGhpcyBtZXRob2Qgc2hvdWxkIGJlIGNhbGxlZCB3aGVuIHNvbWVcbiAgICAgKiBpbnRlcm5hbCBjb25uZWN0aW9uIHN0YXRlIGNoYW5nZXMgKGZvciBleGFtcGxlLCB3aGVuIHVzZXIgYXV0aGVudGljYXRpb24gc3RhdGVcbiAgICAgKiBpcyBjaGFuZ2VkKS5cbiAgICAgKi9cbiAgICBwdWJsaWMgcmVpbml0aWFsaXplKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0dXMgIT09IFF1ZXJ5T2JzZXJ2ZXJTdGF0dXMuSU5JVElBTElaRUQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5fcmVpbml0aWFsaXplKSB7XG4gICAgICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBRdWVyeU9ic2VydmVyc0Vycm9yKCdBdHRlbXB0ZWQgdG8gcmVpbml0aWFsaXplIGEgUXVlcnlPYnNlcnZlciB3aXRob3V0IGEgcmVpbml0aWFsaXphdGlvbiBoYW5kbGVyJyk7XG4gICAgICAgICAgICB0aGlzLl9xdWVyeU9ic2VydmVyTWFuYWdlci5lcnJvck9ic2VydmVyLm9uTmV4dChlcnJvcik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN0YXR1cyA9IFF1ZXJ5T2JzZXJ2ZXJTdGF0dXMuUkVJTklUSUFMSVpJTkc7XG4gICAgICAgIHRoaXMuX3JlaW5pdGlhbGl6ZSgpLnN1YnNjcmliZSgocmVzcG9uc2U6IFF1ZXJ5T2JzZXJ2ZXJSZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgLy8gT2JzZXJ2ZXIgaWRlbnRpZmllciBtaWdodCBoYXZlIGNoYW5nZWQsIHVwZGF0ZSBvYnNlcnZlciBhbmQgbWFuYWdlci5cbiAgICAgICAgICAgIGNvbnN0IG9sZElkID0gdGhpcy5pZDtcbiAgICAgICAgICAgIHRoaXMuaWQgPSByZXNwb25zZS5vYnNlcnZlcjtcbiAgICAgICAgICAgIHRoaXMuX3F1ZXJ5T2JzZXJ2ZXJNYW5hZ2VyLm1vdmUob2xkSWQsIHRoaXMpO1xuXG4gICAgICAgICAgICAvLyBQZXJmb3JtIHJlaW5pdGlhbGl6YXRpb24uXG4gICAgICAgICAgICB0aGlzLnN0YXR1cyA9IFF1ZXJ5T2JzZXJ2ZXJTdGF0dXMuTkVXO1xuICAgICAgICAgICAgdGhpcy5pbml0aWFsaXplKHJlc3BvbnNlLml0ZW1zKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTW92ZXMgYW4gZXhpc3RpbmcgcXVlcnkgb2JzZXJ2ZXIgaW50byB0aGlzIHF1ZXJ5IG9ic2VydmVyLiBUaGUgc291cmNlIHF1ZXJ5IG9ic2VydmVyXG4gICAgICogc2hvdWxkIGJlIGNvbnNpZGVyZWQgaW52YWxpZCBhZnRlciB0aGlzIG9wZXJhdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UXVlcnlPYnNlcnZlcn0gb2JzZXJ2ZXIgU291cmNlIHF1ZXJ5IG9ic2VydmVyXG4gICAgICovXG4gICAgcHVibGljIG1vdmVGcm9tKG9ic2VydmVyOiBRdWVyeU9ic2VydmVyKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVF1ZXVlID0gb2JzZXJ2ZXIuX3VwZGF0ZVF1ZXVlO1xuICAgICAgICBvYnNlcnZlci5fdXBkYXRlUXVldWUgPSBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIHRoZSBxdWVyeSBvYnNlcnZlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7YW55W119IGl0ZW1zIEFuIGluaXRpYWwgbGlzdCBvZiBpdGVtc1xuICAgICAqL1xuICAgIHB1YmxpYyBpbml0aWFsaXplKGl0ZW1zOiBhbnlbXSkge1xuICAgICAgICBpZiAodGhpcy5zdGF0dXMgIT09IFF1ZXJ5T2JzZXJ2ZXJTdGF0dXMuTkVXKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXy5pc1VuZGVmaW5lZChpdGVtcykpIHtcbiAgICAgICAgICAgIGNvbnN0IGVycm9yID0gbmV3IFF1ZXJ5T2JzZXJ2ZXJzRXJyb3IoJ0ludmFsaWQgcmVzcG9uc2UgcmVjZWl2ZWQgZnJvbSBiYWNrZW5kLCBpcyB0aGUgcmVzb3VyY2Ugb2JzZXJ2YWJsZT8nKTtcbiAgICAgICAgICAgIHRoaXMuX3F1ZXJ5T2JzZXJ2ZXJNYW5hZ2VyLmVycm9yT2JzZXJ2ZXIub25OZXh0KGVycm9yKTtcblxuICAgICAgICAgICAgaXRlbXMgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2l0ZW1zID0gaW1tdXRhYmxlLmZyb21KUyhpdGVtcyk7XG4gICAgICAgIHRoaXMuc3RhdHVzID0gUXVlcnlPYnNlcnZlclN0YXR1cy5JTklUSUFMSVpJTkc7XG5cbiAgICAgICAgLy8gUHJvY2VzcyBhbGwgcXVldWVkIG1lc3NhZ2VzLlxuICAgICAgICBfLmZvckVhY2godGhpcy5fdXBkYXRlUXVldWUsIHRoaXMudXBkYXRlLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLl91cGRhdGVRdWV1ZSA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5zdGF0dXMgPSBRdWVyeU9ic2VydmVyU3RhdHVzLklOSVRJQUxJWkVEO1xuICAgICAgICB0aGlzLl9ub3RpZnkoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIHRoZSBpdGVtIGNhY2hlIGJhc2VkIG9uIGFuIGluY29taW5nIG1lc3NhZ2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge01lc3NhZ2V9IG1lc3NhZ2UgTWVzc2FnZSBpbnN0YW5jZVxuICAgICAqL1xuICAgIHB1YmxpYyB1cGRhdGUobWVzc2FnZTogTWVzc2FnZSkge1xuICAgICAgICBpZiAodGhpcy5zdGF0dXMgPT09IFF1ZXJ5T2JzZXJ2ZXJTdGF0dXMuU1RPUFBFRCB8fCB0aGlzLnN0YXR1cyA9PT0gUXVlcnlPYnNlcnZlclN0YXR1cy5SRUlOSVRJQUxJWklORykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdHVzID09PSBRdWVyeU9ic2VydmVyU3RhdHVzLk5FVykge1xuICAgICAgICAgICAgLy8gSnVzdCBxdWV1ZSB0aGUgdXBkYXRlIGZvciBsYXRlciBhcyB3ZSBoYXZlbid0IHlldCBiZWVuIGluaXRpYWxpemVkLlxuICAgICAgICAgICAgdGhpcy5fdXBkYXRlUXVldWUucHVzaChtZXNzYWdlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBpdGVtcyA9IHRoaXMuX2l0ZW1zO1xuICAgICAgICBsZXQgaXRlbSA9IGltbXV0YWJsZS5mcm9tSlMobWVzc2FnZS5pdGVtKTtcbiAgICAgICAgc3dpdGNoIChtZXNzYWdlLm1zZykge1xuICAgICAgICAgICAgY2FzZSBNRVNTQUdFX0FEREVEOiB7XG4gICAgICAgICAgICAgICAgaXRlbXMgPSBpdGVtcy5pbnNlcnQobWVzc2FnZS5vcmRlciwgaXRlbSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIE1FU1NBR0VfUkVNT1ZFRDoge1xuICAgICAgICAgICAgICAgIGl0ZW1zID0gaXRlbXMuZmlsdGVyTm90KFxuICAgICAgICAgICAgICAgICAgICAob3RoZXIpID0+IGl0ZW0uZ2V0KG1lc3NhZ2UucHJpbWFyeV9rZXkpID09PSBvdGhlci5nZXQobWVzc2FnZS5wcmltYXJ5X2tleSlcbiAgICAgICAgICAgICAgICApLnRvTGlzdCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBNRVNTQUdFX0NIQU5HRUQ6IHtcbiAgICAgICAgICAgICAgICBsZXQgaW5kZXggPSBpdGVtcy5maW5kSW5kZXgoXG4gICAgICAgICAgICAgICAgICAgIChvdGhlcikgPT4gaXRlbS5nZXQobWVzc2FnZS5wcmltYXJ5X2tleSkgPT09IG90aGVyLmdldChtZXNzYWdlLnByaW1hcnlfa2V5KVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSBtZXNzYWdlLm9yZGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJdGVtIG9yZGVyIGhhcyBjaGFuZ2VkLCBtb3ZlIHRoZSBpdGVtLlxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXMgPSBpdGVtcy5yZW1vdmUoaW5kZXgpLmluc2VydChtZXNzYWdlLm9yZGVyLCBpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zID0gaXRlbXMuc2V0KGluZGV4LCBpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBRdWVyeU9ic2VydmVyc0Vycm9yKGBVbmtub3duIG1lc3NhZ2UgdHlwZSAke21lc3NhZ2UubXNnfWApO1xuICAgICAgICAgICAgICAgIHRoaXMuX3F1ZXJ5T2JzZXJ2ZXJNYW5hZ2VyLmVycm9yT2JzZXJ2ZXIub25OZXh0KGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2l0ZW1zID0gaXRlbXM7XG5cbiAgICAgICAgLy8gUHVzaCB1cGRhdGVzIHRvIGFsbCBzdWJzY3JpYmVycy5cbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzID09PSBRdWVyeU9ic2VydmVyU3RhdHVzLklOSVRJQUxJWkVEKSB7XG4gICAgICAgICAgICB0aGlzLl9ub3RpZnkoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE5vdGlmaWVzIHN1YnNjcmliZXJzIG9mIG5ldyBpdGVtcy5cbiAgICAgKi9cbiAgICBwcml2YXRlIF9ub3RpZnkoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuaXRlbXMgPSB0aGlzLl9pdGVtcy50b0pTKCk7XG4gICAgICAgIG1ha2VJbW11dGFibGUodGhpcy5pdGVtcyk7XG5cbiAgICAgICAgdGhpcy5fdXBkYXRlc09ic2VydmVyLm9uTmV4dCh0aGlzLml0ZW1zKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIG9ic2VydmFibGUgdGhhdCB3aWxsIGVtaXQgYSBsaXN0IG9mIGl0ZW1zIHdoZW4gYW55IGNoYW5nZXNcbiAgICAgKiBoYXBwZW4gdG8gdGhlIG9ic2VydmVkIHF1ZXJ5LlxuICAgICAqL1xuICAgIHB1YmxpYyBvYnNlcnZhYmxlKCk6IFJ4Lk9ic2VydmFibGU8YW55PiB7XG4gICAgICAgIHJldHVybiB0aGlzLl91cGRhdGVzT2JzZXJ2YWJsZTtcbiAgICB9XG59XG5cbi8qKlxuICogQSBkaWN0aW9uYXJ5IGNvbnRhaW5pbmcgdGhlIHF1ZXJ5IG9ic2VydmVycywgaW5kZXhlZCBieSB0aGVpciBpZGVudGlmaWVyLlxuICovXG5pbnRlcmZhY2UgUXVlcnlPYnNlcnZlck1hcCB7XG4gICAgW2luZGV4OiBzdHJpbmddOiBRdWVyeU9ic2VydmVyO1xufVxuXG4vKipcbiAqIE1hbmFnZXMgYWxsIGFjdGl2ZSBxdWVyeSBvYnNlcnZlcnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBRdWVyeU9ic2VydmVyTWFuYWdlciB7XG4gICAgcHJpdmF0ZSBfb2JzZXJ2ZXJzOiBRdWVyeU9ic2VydmVyTWFwO1xuICAgIHByaXZhdGUgX3Vuc3Vic2NyaWJlQ2hhaW4gPSBQcm9taXNlLnJlc29sdmU8YW55Pih7fSk7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RzIGEgbmV3IHF1ZXJ5IG9ic2VydmVyIG1hbmFnZXIuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfY29ubmVjdGlvbjogQ29ubmVjdGlvbiwgcHJpdmF0ZSBfZXJyb3JzOiBSeC5PYnNlcnZlcjxRdWVyeU9ic2VydmVyc0Vycm9yPikge1xuICAgICAgICB0aGlzLl9vYnNlcnZlcnMgPSB7fTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFcnJvciBvYnNlcnZlciBnZXR0ZXIgZm9yIG5vdGlmeWluZyBhYm91dCBxdWVyeSBvYnNlcnZlciBlcnJvcnMuXG4gICAgICovXG4gICAgcHVibGljIGdldCBlcnJvck9ic2VydmVyKCk6IFJ4Lk9ic2VydmVyPFF1ZXJ5T2JzZXJ2ZXJzRXJyb3I+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Vycm9ycztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgcXVlcnkgb2JzZXJ2ZXIgd2l0aCBhIHNwZWNpZmljIGlkZW50aWZpZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gb2JzZXJ2ZXJJZCBRdWVyeSBvYnNlcnZlciBpZGVudGlmaWVyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBjcmVhdGUgU2hvdWxkIGEgbmV3IHF1ZXJ5IG9ic2VydmVyIGJlIGNyZWF0ZWQgaWYgb25lIHdpdGggdGhlIHNwZWNpZmllZCBpZGVudGlmaWVyIGRvZXMgbm90IHlldCBleGlzdFxuICAgICAqIEByZXR1cm4ge1F1ZXJ5T2JzZXJ2ZXJ9IFF1ZXJ5IG9ic2VydmVyIGluc3RhbmNlXG4gICAgICovXG4gICAgcHVibGljIGdldChvYnNlcnZlcklkOiBzdHJpbmcsIGNyZWF0ZTogYm9vbGVhbiA9IHRydWUpOiBRdWVyeU9ic2VydmVyIHtcbiAgICAgICAgLy8gSWYgdGhlIHNwZWNpZmljIG9ic2VydmVyIGRvZXMgbm90IHlldCBleGlzdCwgY3JlYXRlIGEgbmV3IGVudHJ5LlxuICAgICAgICBsZXQgb2JzZXJ2ZXIgPSB0aGlzLl9vYnNlcnZlcnNbb2JzZXJ2ZXJJZF07XG4gICAgICAgIGlmICghb2JzZXJ2ZXIgJiYgY3JlYXRlKSB7XG4gICAgICAgICAgICBvYnNlcnZlciA9IG5ldyBRdWVyeU9ic2VydmVyKG9ic2VydmVySWQsIHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5fb2JzZXJ2ZXJzW29ic2VydmVySWRdID0gb2JzZXJ2ZXI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb2JzZXJ2ZXI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVsZXRlcyBhIHF1ZXJ5IG9ic2VydmVyIHdpdGggdGhlIHNwZWNpZmllZCBpZGVudGlmaWVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIG9ic2VydmVySWQgUXVlcnkgb2JzZXJ2ZXIgaWRlbnRpZmllclxuICAgICAqL1xuICAgIHByb3RlY3RlZCBfZGVsZXRlT2JzZXJ2ZXIob2JzZXJ2ZXJJZDogc3RyaW5nKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLl9vYnNlcnZlcnNbb2JzZXJ2ZXJJZF07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVxdWVzdHMgdGhlIGJhY2tlbmQgdG8gdW5zdWJzY3JpYmUgdXMgZnJvbSB0aGlzIG9ic2VydmVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIG9ic2VydmVySWQgUXVlcnkgb2JzZXJ2ZXIgaWRlbnRpZmllclxuICAgICAqL1xuICAgIHByb3RlY3RlZCBfdW5zdWJzY3JpYmU8VD4ob2JzZXJ2ZXJJZDogc3RyaW5nKTogUnguT2JzZXJ2YWJsZTxUPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb25uZWN0aW9uLnBvc3Q8VD4oJy9hcGkvcXVlcnlvYnNlcnZlci91bnN1YnNjcmliZScsIHt9LCB7XG4gICAgICAgICAgICBvYnNlcnZlcjogb2JzZXJ2ZXJJZCxcbiAgICAgICAgICAgIHN1YnNjcmliZXI6IHRoaXMuX2Nvbm5lY3Rpb24uc2Vzc2lvbklkKCksXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgYSBxdWVyeSBvYnNlcnZlciB3aXRoIGEgc3BlY2lmaWMgaWRlbnRpZmllci5cbiAgICAgKlxuICAgICAqIFJ4IGhhcyBubyB3YXkgb2Ygd2FpdGluZyBmb3IgZGlzcG9zZSB0byBmaW5pc2gsIHRoYXQncyB3aHlcbiAgICAgKiB3ZSBkZWZlciByZWFjdGl2ZSBxdWVyaWVzIGFmdGVyIHVuc3Vic2NyaWJlIGlzIGZpbmlzaGVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG9ic2VydmVySWQgUXVlcnkgb2JzZXJ2ZXIgaWRlbnRpZmllclxuICAgICAqL1xuICAgIHB1YmxpYyByZW1vdmUob2JzZXJ2ZXJJZDogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuX2RlbGV0ZU9ic2VydmVyKG9ic2VydmVySWQpO1xuXG4gICAgICAgIC8vIFVzaW5nIHByb21pc2VzLCBiZWNhdXNlIHdlIGNvdWxkbid0IGdldCBvYnNlcnZhYmxlcyB0byB1bnN1YnNjcmliZSBvbmx5IG9uY2UuXG4gICAgICAgIC8vIEV2ZW4gdXNpbmcgLnRha2UoMSkgZGlkbid0IHNlZW0gdG8gY29ycmVjdGx5IGxpbWl0IG51bWJlciBvZiBlbWl0c1xuICAgICAgICB0aGlzLl91bnN1YnNjcmliZUNoYWluID0gdGhpcy5fdW5zdWJzY3JpYmVDaGFpbi50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl91bnN1YnNjcmliZShvYnNlcnZlcklkKS50b1Byb21pc2UoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsbHMgYSBmdW5jdGlvbiB0aGF0IGNyZWF0ZXMgYW4gb2JzZXJ2YWJsZSwgYWZ0ZXIgcHJldmlvdXMgdW5zdWJzY3JpYmUgcmVxdWVzdCBmaW5pc2hlcy5cbiAgICAgKi9cbiAgICBwdWJsaWMgY2hhaW5BZnRlclVuc3Vic2NyaWJlPFQ+KG1ha2VPYnNlcnZhYmxlOiAoKSA9PiBSeC5PYnNlcnZhYmxlPFQ+KTogUnguT2JzZXJ2YWJsZTxUPiB7XG4gICAgICAgIHJldHVybiBSeC5PYnNlcnZhYmxlLmZyb21Qcm9taXNlKHRoaXMuX3Vuc3Vic2NyaWJlQ2hhaW4pLmZsYXRNYXAoKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG1ha2VPYnNlcnZhYmxlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoYW5nZXMgYSBxdWVyeSBvYnNlcnZlcidzIGlkZW50aWZpZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gb2xkT2JzZXJ2ZXJJZCBPbGQgcXVlcnkgb2JzZXJ2ZXIgaWRlbnRpZmllclxuICAgICAqIEBwYXJhbSB7UXVlcnlPYnNlcnZlcn0gb2JzZXJ2ZXIgTmV3IHF1ZXJ5IG9ic2VydmVyXG4gICAgICovXG4gICAgcHVibGljIG1vdmUob2xkT2JzZXJ2ZXJJZDogc3RyaW5nLCBvYnNlcnZlcjogUXVlcnlPYnNlcnZlcikge1xuICAgICAgICBpZiAob2xkT2JzZXJ2ZXJJZCA9PT0gb2JzZXJ2ZXIuaWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucmVtb3ZlKG9sZE9ic2VydmVySWQpO1xuXG4gICAgICAgIC8vIFRoZSBvYnNlcnZlciB3ZSBhcmUgbW92aW5nIGludG8gbWlnaHQgaGF2ZSBhbHJlYWR5IHJlY2VpdmVkIHNvbWUgbWVzc2FnZXMuIEluXG4gICAgICAgIC8vIHRoaXMgY2FzZSwgd2UgbmVlZCB0byBtb3ZlIHRoZSBxdWV1ZWQgbWVzc2FnZXMgdG8gdGhlIG9sZCBvYnNlcnZlci5cbiAgICAgICAgbGV0IGV4aXN0aW5nT2JzZXJ2ZXIgPSB0aGlzLl9vYnNlcnZlcnNbb2JzZXJ2ZXIuaWRdO1xuICAgICAgICBpZiAoZXhpc3RpbmdPYnNlcnZlcikge1xuICAgICAgICAgICAgb2JzZXJ2ZXIubW92ZUZyb20oZXhpc3RpbmdPYnNlcnZlcik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9vYnNlcnZlcnNbb2JzZXJ2ZXIuaWRdID0gb2JzZXJ2ZXI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0aGUgcXVlcnkgb2JzZXJ2ZXJzIGJhc2VkIG9uIGFuIGluY29taW5nIG1lc3NhZ2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge01lc3NhZ2V9IG1lc3NhZ2UgTWVzc2FnZSBpbnN0YW5jZVxuICAgICAqL1xuICAgIHB1YmxpYyB1cGRhdGUobWVzc2FnZTogTWVzc2FnZSkge1xuICAgICAgICB0aGlzLmdldChtZXNzYWdlLm9ic2VydmVyKS51cGRhdGUobWVzc2FnZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhbiBvYnNlcnZhYmxlIHRoYXQgd2lsbCBlbWl0IGEgbGlzdCBvZiBpdGVtcyB3aGVuIGFueSBjaGFuZ2VzXG4gICAgICogaGFwcGVuIHRvIHRoZSBvYnNlcnZlZCBxdWVyeS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBvYnNlcnZlcklkIFF1ZXJ5IG9ic2VydmVyIGlkZW50aWZpZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgb2JzZXJ2YWJsZShvYnNlcnZlcklkOiBzdHJpbmcpOiBSeC5PYnNlcnZhYmxlPE9iamVjdD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXQob2JzZXJ2ZXJJZCkub2JzZXJ2YWJsZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlcXVlc3RzIGFsbCBxdWVyeSBvYnNlcnZlcnMgdG8gc3RhcnQgcmVpbml0aWFsaXphdGlvbi5cbiAgICAgKlxuICAgICAqIFRoaXMgbWV0aG9kIHNob3VsZCBiZSBjYWxsZWQgd2hlbiBzb21lIGludGVybmFsIGNvbm5lY3Rpb24gc3RhdGUgY2hhbmdlc1xuICAgICAqIChmb3IgZXhhbXBsZSwgd2hlbiB1c2VyIGF1dGhlbnRpY2F0aW9uIHN0YXRlIGlzIGNoYW5nZWQpLlxuICAgICAqL1xuICAgIHB1YmxpYyByZWluaXRpYWxpemUoKSB7XG4gICAgICAgIF8uZm9yT3duKHRoaXMuX29ic2VydmVycywgKG9ic2VydmVyKSA9PiB7XG4gICAgICAgICAgICBvYnNlcnZlci5yZWluaXRpYWxpemUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIl19
