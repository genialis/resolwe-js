"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var _ = require("lodash");
var Rx = require("rx");
var queryobserver_1 = require("./queryobserver");
var error_1 = require("../core/errors/error");
var index_1 = require("./index");
var lang_1 = require("../core/utils/lang");
var random = require("../core/utils/random");
var MockQueryObserverManager = (function (_super) {
    __extends(MockQueryObserverManager, _super);
    function MockQueryObserverManager() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @inheritdoc
     */
    MockQueryObserverManager.prototype.remove = function (observerId) {
        this._deleteObserver(observerId);
        // Call the unsubscribe method immediately during tests. The actual query
        // observer manager will defer these calls instead.
        this._unsubscribe(observerId).subscribe(function () {
            // Subscribe to process the (mock) request.
        });
    };
    /**
     * @inheritdoc
     */
    MockQueryObserverManager.prototype.chainAfterUnsubscribe = function (makeObservable) {
        // Do not defer makeObservable during tests.
        return makeObservable();
    };
    return MockQueryObserverManager;
}(queryobserver_1.QueryObserverManager));
var MockConnection = (function () {
    function MockConnection() {
        this._mockItems = {};
        this._mockResponses = {};
        this._simulateDelay = false;
        this._messages = new Rx.Subject();
        this._isConnected = new Rx.BehaviorSubject(false);
        this._errors = new Rx.Subject();
        this._queryObserverManager = new MockQueryObserverManager(this, this._errors);
    }
    /**
     * @inheritdoc
     */
    MockConnection.prototype.connect = function (restUri, websocketUri) {
        this._isConnected.onNext(true);
        this.messages().subscribe(this._queryObserverManager.update.bind(this._queryObserverManager));
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.disconnect = function () {
        this._isConnected.onNext(false);
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.isConnected = function () {
        return this._isConnected;
    };
    MockConnection.prototype._registerMockRequestHandler = function (method, path, handler) {
        if (!this._mockResponses[method])
            this._mockResponses[method] = [];
        var handlers = this._mockResponses[method];
        if (_.any(handlers, function (existingHandler) { return existingHandler.path === path; })) {
            console.error("Method " + method + " for path " + path + " already registered");
        }
        handlers.push({
            path: path,
            handler: handler,
        });
    };
    MockConnection.prototype._handleMockResponse = function (method, responsePath, parameters, data) {
        var matchingHandlers = _.filter(this._mockResponses[method], function (_a) {
            var path = _a.path;
            if (path instanceof RegExp)
                return path.test(responsePath);
            return path === responsePath;
        });
        if (_.isEmpty(matchingHandlers)) {
            return Rx.Observable.just({});
        }
        if (_.size(matchingHandlers) > 1) {
            console.error("Multiple handlers matched for method " + method + " on path " + responsePath);
        }
        // TODO: Support mocking errors as well.
        var _a = matchingHandlers[0], path = _a.path, handler = _a.handler;
        if (path instanceof RegExp) {
            return Rx.Observable.just(handler(parameters, data, path.exec(responsePath)));
        }
        return Rx.Observable.just(handler(parameters, data));
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.simulateDelay = function (value) {
        this._simulateDelay = value;
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.get = function (path, parameters) {
        if (!_.startsWith(path, '/api/'))
            return this._handleMockResponse('get', path, parameters, {});
        var reactive = _.has(parameters, 'observe');
        var atoms = path.split('/');
        var resource = atoms.slice(2).join('/');
        if (!reactive && !_.has(this._mockItems, resource)) {
            return this._handleMockResponse('get', path, parameters, {});
        }
        var items = this._getMockItemsFor(resource);
        if (items.blackhole)
            return Rx.Observable.never();
        var observable;
        if (!reactive) {
            // Non-reactive query.
            observable = Rx.Observable.just(items.queryEvaluator(parameters, items.items));
        }
        else {
            // Reactive query.
            var observer = {
                observerId: random.randomUuid(),
                query: _.omit(parameters, 'observe'),
                items: {},
            };
            items.observers.push(observer);
            observable = Rx.Observable.just({
                observer: observer.observerId,
                items: this._updateMockObserver(observer, items, false),
            });
        }
        return this._simulateDelay ? observable.delay(100) : observable;
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.post = function (path, data, parameters) {
        return this._handleMockResponse('post', path, parameters, data);
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.put = function (path, data, parameters) {
        return this._handleMockResponse('put', path, parameters, data);
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.patch = function (path, data, parameters) {
        return this._handleMockResponse('patch', path, parameters, data);
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.delete = function (path, data, parameters) {
        return this._handleMockResponse('delete', path, parameters, data);
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.createUriFromPath = function (path) {
        return path;
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.csrfCookie = function () {
        return 'cookie';
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.messages = function () {
        return this._messages;
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.errors = function () {
        throw new error_1.GenError('Throwing errors in mocked connection not supported');
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.sessionId = function () {
        return 'session-id';
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.queryObserverManager = function () {
        return this._queryObserverManager;
    };
    MockConnection.prototype._getMockItemsFor = function (resource) {
        var mockItems = this._mockItems[resource];
        if (!mockItems) {
            // If the resource doesn't exist, we always return an empty resource, so that the
            // processing doesn't fail, it just always contains no items.
            console.error("Mock API resource '" + resource + "' referenced, but has not been defined.");
            return {
                primaryKey: 'id',
                items: [],
                observers: [],
                queryEvaluator: function (query, items) { return items; },
                blackhole: false,
            };
        }
        return mockItems;
    };
    MockConnection.prototype._updateMockObserver = function (observer, items, notify) {
        if (notify === void 0) { notify = true; }
        var oldItems = observer.items;
        var newItems = {};
        // Evaluate query on all the new items.
        var newItemsArray = items.queryEvaluator(observer.query, items.items);
        _.each(newItemsArray, function (item, index) {
            item._order = index;
            newItems[item[items.primaryKey]] = item;
        });
        observer.items = newItems;
        if (notify) {
            var removed = _.filter(oldItems, function (item, itemId) { return !newItems[itemId]; });
            var added = _.filter(newItems, function (item, itemId) { return !oldItems[itemId]; });
            var changed = _.filter(newItems, function (newItem, itemId) {
                if (!oldItems[itemId])
                    return false;
                return !_.isEqual(newItem, oldItems[itemId]);
            });
            for (var _i = 0, _a = [[added, queryobserver_1.MESSAGE_ADDED], [removed, queryobserver_1.MESSAGE_REMOVED], [changed, queryobserver_1.MESSAGE_CHANGED]]; _i < _a.length; _i++) {
                var _b = _a[_i], changes = _b[0], type = _b[1];
                for (var _c = 0, changes_1 = changes; _c < changes_1.length; _c++) {
                    var item = changes_1[_c];
                    this._messages.onNext({
                        msg: type,
                        observer: observer.observerId,
                        primary_key: items.primaryKey,
                        order: item._order,
                        item: _.cloneDeep(_.omit(item, '_order')),
                    });
                }
            }
        }
        return _.map(newItemsArray, function (item) { return _.omit(item, '_order'); });
    };
    MockConnection.prototype._notifyMockObservers = function (items) {
        for (var _i = 0, _a = items.observers; _i < _a.length; _i++) {
            var observer = _a[_i];
            this._updateMockObserver(observer, items);
        }
    };
    // Developer-facing API below.
    /**
     * @inheritdoc
     */
    MockConnection.prototype.reset = function () {
        this._mockItems = {};
        this._mockResponses = {};
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.createResource = function (resource, primaryKey, queryEvaluator) {
        if (primaryKey === void 0) { primaryKey = 'id'; }
        if (queryEvaluator === void 0) { queryEvaluator = function (query, items) { return items; }; }
        this._mockItems[resource] = {
            primaryKey: primaryKey,
            items: [],
            observers: [],
            queryEvaluator: queryEvaluator,
            blackhole: false,
        };
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.createBlackholeResource = function (resource) {
        this._mockItems[resource] = {
            primaryKey: null,
            items: [],
            observers: [],
            queryEvaluator: null,
            blackhole: true,
        };
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.addItem = function (resource, item) {
        var items = this._getMockItemsFor(resource);
        items.items.push(_.cloneDeep(item));
        this._notifyMockObservers(items);
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.addItems = function (resource, items) {
        var existingItems = this._getMockItemsFor(resource);
        existingItems.items.push.apply(existingItems.items, _.cloneDeep(items));
        this._notifyMockObservers(existingItems);
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.updateItem = function (resource, item) {
        var items = this._getMockItemsFor(resource);
        var index = _.findIndex(items.items, (_a = {}, _a[items.primaryKey] = item[items.primaryKey], _a));
        items.items[index] = item;
        this._notifyMockObservers(items);
        var _a;
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.removeItem = function (resource, itemId) {
        var items = this._getMockItemsFor(resource);
        var index = _.findIndex(items.items, (_a = {}, _a[items.primaryKey] = itemId, _a));
        _.pullAt(items.items, index);
        this._notifyMockObservers(items);
        var _a;
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.whenGet = function (path, handler) {
        this._registerMockRequestHandler('get', path, handler);
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.whenPost = function (path, handler) {
        this._registerMockRequestHandler('post', path, handler);
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.whenPut = function (path, handler) {
        this._registerMockRequestHandler('put', path, handler);
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.whenPatch = function (path, handler) {
        this._registerMockRequestHandler('patch', path, handler);
    };
    /**
     * @inheritdoc
     */
    MockConnection.prototype.whenDelete = function (path, handler) {
        this._registerMockRequestHandler('delete', path, handler);
    };
    return MockConnection;
}());
exports.MockConnection = MockConnection;
/**
 * Mock API mixin, which may be used in tests to simulate the backend.
 */
var MockApiMixin = (function () {
    function MockApiMixin() {
    }
    /**
     * @inheritdoc
     */
    MockApiMixin.prototype.reset = function () {
        this.connection.reset();
    };
    /**
     * @inheritdoc
     */
    MockApiMixin.prototype.simulateDelay = function (value) {
        this.connection.simulateDelay(value);
    };
    /**
     * @inheritdoc
     */
    MockApiMixin.prototype.createResource = function (resource, primaryKey, query) {
        this.connection.createResource(resource, primaryKey, query);
    };
    /**
     * @inheritdoc
     */
    MockApiMixin.prototype.createBlackholeResource = function (resource) {
        this.connection.createBlackholeResource(resource);
    };
    /**
     * @inheritdoc
     */
    MockApiMixin.prototype.addItem = function (resource, item) {
        this.connection.addItem(resource, item);
    };
    /**
     * @inheritdoc
     */
    MockApiMixin.prototype.addItems = function (resource, items) {
        this.connection.addItems(resource, items);
    };
    /**
     * @inheritdoc
     */
    MockApiMixin.prototype.updateItem = function (resource, item) {
        this.connection.updateItem(resource, item);
    };
    /**
     * @inheritdoc
     */
    MockApiMixin.prototype.removeItem = function (resource, itemId) {
        this.connection.removeItem(resource, itemId);
    };
    /**
     * @inheritdoc
     */
    MockApiMixin.prototype.whenGet = function (path, handler) {
        this.connection.whenGet(path, handler);
    };
    /**
     * @inheritdoc
     */
    MockApiMixin.prototype.whenPost = function (path, handler) {
        this.connection.whenPost(path, handler);
    };
    /**
     * @inheritdoc
     */
    MockApiMixin.prototype.whenPut = function (path, handler) {
        this.connection.whenPut(path, handler);
    };
    /**
     * @inheritdoc
     */
    MockApiMixin.prototype.whenPatch = function (path, handler) {
        this.connection.whenPatch(path, handler);
    };
    /**
     * @inheritdoc
     */
    MockApiMixin.prototype.whenDelete = function (path, handler) {
        this.connection.whenDelete(path, handler);
    };
    return MockApiMixin;
}());
exports.MockApiMixin = MockApiMixin;
exports.MockApiBase = lang_1.compose([index_1.ResolweApi, MockApiMixin]);
var MockApi = (function (_super) {
    __extends(MockApi, _super);
    function MockApi() {
        return _super.call(this, new MockConnection(), null, null) || this;
    }
    return MockApi;
}(exports.MockApiBase));
exports.MockApi = MockApi;
/**
 * Helper function for supporting pagination, which can be used as a [[MockQueryEvaluator]].
 */
function paginateQuery(query, items) {
    var limit = query.limit || 0;
    var offset = query.offset || 0;
    return items.slice(offset, limit > 0 ? offset + limit : undefined);
}
exports.paginateQuery = paginateQuery;
/**
 * Helper function for supporting ordering.
 */
function orderingQuery(query, items) {
    if (!query.ordering)
        return items;
    var ordering = query.ordering.split(',');
    var orderingDirections = _.map(ordering, function (column) { return column[0] === '-' ? 'desc' : 'asc'; });
    var orderingColumns = _.map(ordering, function (column) { return column[0] === '-' ? column.substr(1) : column; });
    return _.sortByOrder(items, orderingColumns, orderingDirections);
}
exports.orderingQuery = orderingQuery;
/**
 * Helper function for supporting filtering by descriptor_completed, which can be used as a [[MockQueryEvaluator]].
 */
function annotatedQuery(query, items) {
    if (_.isUndefined(query.descriptor_completed) || _.isNull(query.descriptor_completed))
        return items;
    return _.filter(items, function (item) { return item.descriptor_completed === query.descriptor_completed; });
}
exports.annotatedQuery = annotatedQuery;
/**
 * Helper function for supporting filtering by slug, which can be used as a [[MockQueryEvaluator]].
 */
function slugQuery(query, items) {
    if (!query.slug)
        return items;
    return _.filter(items, function (item) { return item.slug === query.slug; });
}
exports.slugQuery = slugQuery;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUMsS0FBSyxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLEVBQTdDLENBQTZDLENBQUMsQ0FBQztJQUNuRyxNQUFNLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsZUFBZSxFQUFFLGtCQUFrQixDQUFDLENBQUM7QUFDckUsQ0FBQztBQVBELHNDQU9DO0FBRUQ7O0dBRUc7QUFDSCx3QkFBcUQsS0FBVSxFQUFFLEtBQVU7SUFDdkUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUVwRyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsVUFBQyxJQUFJLElBQUssT0FBQSxJQUFJLENBQUMsb0JBQW9CLEtBQUssS0FBSyxDQUFDLG9CQUFvQixFQUF4RCxDQUF3RCxDQUFDLENBQUM7QUFDL0YsQ0FBQztBQUpELHdDQUlDO0FBRUQ7O0dBRUc7QUFDSCxtQkFBK0QsS0FBVSxFQUFFLEtBQVU7SUFDakYsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO1FBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUU5QixNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsVUFBQyxJQUFJLElBQUssT0FBQSxJQUFJLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxJQUFJLEVBQXhCLENBQXdCLENBQUMsQ0FBQztBQUMvRCxDQUFDO0FBSkQsOEJBSUMiLCJmaWxlIjoiYXBpL21vY2suanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgKiBhcyBSeCBmcm9tICdyeCc7XG5cbmltcG9ydCB7Q29ubmVjdGlvbiwgTWVzc2FnZX0gZnJvbSAnLi9jb25uZWN0aW9uJztcbmltcG9ydCB7UXVlcnlPYnNlcnZlck1hbmFnZXIsIE1FU1NBR0VfQURERUQsIE1FU1NBR0VfQ0hBTkdFRCwgTUVTU0FHRV9SRU1PVkVEfSBmcm9tICcuL3F1ZXJ5b2JzZXJ2ZXInO1xuaW1wb3J0IHtHZW5FcnJvcn0gZnJvbSAnLi4vY29yZS9lcnJvcnMvZXJyb3InO1xuaW1wb3J0IHtBUElFcnJvcn0gZnJvbSAnLi9lcnJvcnMnO1xuaW1wb3J0IHtRdWVyeSwgU2FtcGxlQmFzZSwgQ29sbGVjdGlvbkJhc2UsIERhdGFCYXNlfSBmcm9tICcuL3R5cGVzL3Jlc3QnO1xuaW1wb3J0IHtSZXNvbHdlQXBpfSBmcm9tICcuL2luZGV4JztcbmltcG9ydCB7Y29tcG9zZX0gZnJvbSAnLi4vY29yZS91dGlscy9sYW5nJztcbmltcG9ydCAqIGFzIHJhbmRvbSBmcm9tICcuLi9jb3JlL3V0aWxzL3JhbmRvbSc7XG5cbi8qKlxuICogTW9jayByZXF1ZXN0IGhhbmRsZXIgZnVuY3Rpb24uIEl0IHJlY2VpdmVzIGFueSBxdWVyeSBhcmd1bWVudHMgYW5kIGRhdGEgdGhhdFxuICogd2FzIHVzZWQgdG8gbWFrZSB0aGUgcmVxdWVzdC4gSWYgYSByZWd1bGFyIGV4cHJlc3Npb24gd2FzIHVzZWQgdG8gZGVmaW5lIHRoZVxuICogcGF0aCBtYXRjaCwgdGhlIHJlc3VsdCBvZiBwZXJmb3JtaW5nIGBSZWdFeHAuZXhlY2AgaXMgYWxzbyBnaXZlbiBhcyBhbiBhcmd1bWVudFxuICogYW5kIGNhbiBiZSB1c2VkIHRvIGV4dHJhY3QgcmVnZXhwIG1hdGNoZXMuXG4gKlxuICogQHBhcmFtIHBhcmFtZXRlcnMgUXVlcnkgcGFyYW1ldGVyc1xuICogQHBhcmFtIGRhdGEgUmVxdWVzdCBkYXRhXG4gKiBAcGFyYW0gcGF0aCBSZWd1bGFyIGV4cHJlc3Npb24gbWF0Y2hlc1xuICogQHJldHVybiBWYWx1ZSB0aGF0IHNob3VsZCBiZSByZXR1cm5lZCBhcyBhIHJlc3BvbnNlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTW9ja1JlcXVlc3RIYW5kbGVyPFQ+IHtcbiAgICAocGFyYW1ldGVyczogYW55LCBkYXRhOiBhbnksIHBhdGg/OiBSZWdFeHBFeGVjQXJyYXkpOiBUO1xufVxuXG4vKipcbiAqIEEgZnVuY3Rpb24sIHdoaWNoIG1vY2tzIGV2YWx1YXRpb24gb2YgYSBxdWVyeS4gSXQgcmVjZWl2ZXMgdGhlIG9yaWdpbmFsIHF1ZXJ5XG4gKiBvYmplY3QgYW5kIGEgbGlzdCBvZiBpdGVtcyBjdXJyZW50bHkgaW4gdGhlIG1vY2sgZGF0YWJhc2UuIEl0IG1heSByZXR1cm4gYVxuICogbW9kaWZpZWQgbGlzdCBvZiBpdGVtcywgdHJhbnNmb3JtZWQgYmFzZWQgb24gdGhlIHF1ZXJ5LCBvciB0aGUgaXRlbXMgdW5jaGFuZ2VkLlxuICpcbiAqIEBwYXJhbSBxdWVyeSBUaGUgb3JpZ2luYWwgcXVlcnkgb2JqZWN0XG4gKiBAcGFyYW0gaXRlbXMgQSBsaXN0IG9mIGl0ZW1zXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTW9ja1F1ZXJ5RXZhbHVhdG9yPFQ+IHtcbiAgICAocXVlcnk6IGFueSwgaXRlbXM6IFRbXSk6IFRbXTtcbn1cblxuLyoqXG4gKiBEZXZlbG9wZXItZmFjaW5nIGludGVyZmFjZSBmb3IgY29uZmlndXJpbmcgcmVzcG9uc2VzIHRoYXQgdGhlIG1vY2tlZFxuICogYmFja2VuZCBzaG91bGQgcmV0dXJuLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIE1vY2tCYXNlIHtcbiAgICAvKipcbiAgICAgKiBSZXNldHMgYWxsIHJlZ2lzdGVyZWQgbW9jayBBUEkgcmVzb3VyY2VzIGFuZCBoYW5kbGVycy4gVGhpcyBtZXRob2QgY2FuIGJlIHVzZWRcbiAgICAgKiB0byByZWluaXRpYWxpemUgdGhlIG1vY2sgQVBJIGJldHdlZW4gdGVzdCBjYXNlcy5cbiAgICAgKi9cbiAgICByZXNldCgpOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogRW5hYmxlcyBvciBkaXNhYmxlcyBkZWxheSBzaW11bGF0aW9uLlxuICAgICAqL1xuICAgIHNpbXVsYXRlRGVsYXkodmFsdWU6IGJvb2xlYW4pOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBtb2NrIHJlc291cmNlIHRoYXQgd2lsbCBoYW5kbGUgcmVhY3RpdmUgcXVlcmllcy4gQSByZXNvdXJjZVxuICAgICAqIG11c3QgYmUgY3JlYXRlZCBiZWZvcmUgaXQgY2FuIGJlIHVzZWQgaW4gW1thZGRJdGVtXV0sIFtbdXBkYXRlSXRlbV1dIGFuZFxuICAgICAqIFtbcmVtb3ZlSXRlbV1dLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHJlc291cmNlIE5hbWUgb2YgdGhlIHJlc291cmNlIChlZy4gJ2NvbGxlY3Rpb24nKVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwcmltYXJ5S2V5IE5hbWUgb2YgdGhlIHByb3BlcnR5IHRoYXQgaG9sZHMgdGhlIHByaW1hcnkga2V5XG4gICAgICogQHBhcmFtIHtNb2NrUXVlcnlFdmFsdWF0b3I8VD59IHF1ZXJ5IE1vY2sgcXVlcnkgZXZhbHVhdG9yIGZ1bmN0aW9uXG4gICAgICovXG4gICAgY3JlYXRlUmVzb3VyY2U8VD4ocmVzb3VyY2U6IHN0cmluZywgcHJpbWFyeUtleT86IHN0cmluZywgcXVlcnk/OiBNb2NrUXVlcnlFdmFsdWF0b3I8VD4pOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBtb2NrIHJlc291cmNlIHRoYXQgd2lsbCBibGFja2hvbGUgcmVxdWVzdHMuIEFueSBxdWVyaWVzXG4gICAgICogc3VibWl0dGVkIHRvIHRoaXMgcmVzb3VyY2Ugd2lsbCBuZXZlciBjb21wbGV0ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXNvdXJjZSBOYW1lIG9mIHRoZSByZXNvdXJjZSAoZWcuICdjb2xsZWN0aW9uJylcbiAgICAgKi9cbiAgICBjcmVhdGVCbGFja2hvbGVSZXNvdXJjZShyZXNvdXJjZTogc3RyaW5nKTogdm9pZDtcblxuICAgIC8qKlxuICAgICAqIEFkZHMgYW4gaXRlbSB0byB0aGUgbW9jayBkYXRhYmFzZSBiYWNraW5nIHRoZSBzcGVjaWZpYyByZXNvdXJjZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXNvdXJjZSBOYW1lIG9mIHRoZSByZXNvdXJjZVxuICAgICAqIEBwYXJhbSB7VH0gaXRlbSBJdGVtIHRvIGFkZFxuICAgICAqL1xuICAgIGFkZEl0ZW08VD4ocmVzb3VyY2U6IHN0cmluZywgaXRlbTogVCk6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIG11bHRpcGxlIGl0ZW1zIHRvIHRoZSBtb2NrIGRhdGFiYXNlIGJhY2tpbmcgdGhlIHNwZWNpZmljIHJlc291cmNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHJlc291cmNlIE5hbWUgb2YgdGhlIHJlc291cmNlXG4gICAgICogQHBhcmFtIHtUW119IGl0ZW1zIEl0ZW1zIHRvIGFkZFxuICAgICAqL1xuICAgIGFkZEl0ZW1zPFQ+KHJlc291cmNlOiBzdHJpbmcsIGl0ZW1zOiBUW10pOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyBhbiBleGlzdGluZyBpdGVtIGluIHRoZSBtb2NrIGRhdGFiYXNlIGJhY2tpbmcgdGhlIHNwZWNpZmljXG4gICAgICogcmVzb3VyY2UuIEl0ZW1zIGFyZSBtYXRjaGVkIGJhc2VkIG9uIHRoZSBwcmltYXJ5IGtleSBjb25maWd1cmVkIGZvciB0aGVcbiAgICAgKiByZWZlcmVuY2VkIHJlc291cmNlIGluIFtbY3JlYXRlUmVzb3VyY2VdXS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXNvdXJjZSBOYW1lIG9mIHRoZSByZXNvdXJjZVxuICAgICAqIEBwYXJhbSB7VH0gaXRlbSBJdGVtIHRvIHVwZGF0ZVxuICAgICAqL1xuICAgIHVwZGF0ZUl0ZW08VD4ocmVzb3VyY2U6IHN0cmluZywgaXRlbTogVCk6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGFuIGl0ZW0gZnJvbSB0aGUgbW9jayBkYXRhYmFzZSBiYWNraW5nIHRoZSBzcGVjaWZpYyByZXNvdXJjZS5cbiAgICAgKiBJdGVtcyBhcmUgbWF0Y2hlZCBiYXNlZCBvbiB0aGUgcHJpbWFyeSBrZXkgY29uZmlndXJlZCBmb3IgdGhlIHJlZmVyZW5jZWRcbiAgICAgKiByZXNvdXJjZSBpbiBbW2NyZWF0ZVJlc291cmNlXV0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVzb3VyY2UgTmFtZSBvZiB0aGUgcmVzb3VyY2VcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IGl0ZW1JZCBQcmltYXJ5IGtleSB2YWx1ZSBvZiB0aGUgaXRlbSB0byByZW1vdmVcbiAgICAgKi9cbiAgICByZW1vdmVJdGVtKHJlc291cmNlOiBzdHJpbmcsIGl0ZW1JZDogc3RyaW5nIHwgbnVtYmVyKTogdm9pZDtcblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVyZXMgYSBtb2NrIEdFVCByZXF1ZXN0IGhhbmRsZXIgZm9yIGEgc3BlY2lmaWMgcGF0aC4gVGhlIHBhdGggY2FuXG4gICAgICogZWl0aGVyIGJlIGEgc3RyaW5nIG9yIGEgcmVndWxhciBleHByZXNzaW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfSBwYXRoIFBhdGggdG8gcmVnaXN0ZXIgdGhlIGhhbmRsZXIgZm9yXG4gICAgICogQHBhcmFtIHtNb2NrUmVxdWVzdEhhbmRsZXI8VD59IGhhbmRsZXIgUmVxdWVzdCBoYW5kbGVyXG4gICAgICovXG4gICAgd2hlbkdldDxUPihwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPik6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlcmVzIGEgbW9jayBQT1NUIHJlcXVlc3QgaGFuZGxlciBmb3IgYSBzcGVjaWZpYyBwYXRoLiBUaGUgcGF0aCBjYW5cbiAgICAgKiBlaXRoZXIgYmUgYSBzdHJpbmcgb3IgYSByZWd1bGFyIGV4cHJlc3Npb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB9IHBhdGggUGF0aCB0byByZWdpc3RlciB0aGUgaGFuZGxlciBmb3JcbiAgICAgKiBAcGFyYW0ge01vY2tSZXF1ZXN0SGFuZGxlcjxUPn0gaGFuZGxlciBSZXF1ZXN0IGhhbmRsZXJcbiAgICAgKi9cbiAgICB3aGVuUG9zdDxUPihwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPik6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlcmVzIGEgbW9jayBQVVQgcmVxdWVzdCBoYW5kbGVyIGZvciBhIHNwZWNpZmljIHBhdGguIFRoZSBwYXRoIGNhblxuICAgICAqIGVpdGhlciBiZSBhIHN0cmluZyBvciBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cH0gcGF0aCBQYXRoIHRvIHJlZ2lzdGVyIHRoZSBoYW5kbGVyIGZvclxuICAgICAqIEBwYXJhbSB7TW9ja1JlcXVlc3RIYW5kbGVyPFQ+fSBoYW5kbGVyIFJlcXVlc3QgaGFuZGxlclxuICAgICAqL1xuICAgIHdoZW5QdXQ8VD4ocGF0aDogc3RyaW5nIHwgUmVnRXhwLCBoYW5kbGVyOiBNb2NrUmVxdWVzdEhhbmRsZXI8VD4pOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXJlcyBhIG1vY2sgUEFUQ0ggcmVxdWVzdCBoYW5kbGVyIGZvciBhIHNwZWNpZmljIHBhdGguIFRoZSBwYXRoIGNhblxuICAgICAqIGVpdGhlciBiZSBhIHN0cmluZyBvciBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cH0gcGF0aCBQYXRoIHRvIHJlZ2lzdGVyIHRoZSBoYW5kbGVyIGZvclxuICAgICAqIEBwYXJhbSB7TW9ja1JlcXVlc3RIYW5kbGVyPFQ+fSBoYW5kbGVyIFJlcXVlc3QgaGFuZGxlclxuICAgICAqL1xuICAgIHdoZW5QYXRjaDxUPihwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPik6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlcmVzIGEgbW9jayBERUxFVEUgcmVxdWVzdCBoYW5kbGVyIGZvciBhIHNwZWNpZmljIHBhdGguIFRoZSBwYXRoIGNhblxuICAgICAqIGVpdGhlciBiZSBhIHN0cmluZyBvciBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cH0gcGF0aCBQYXRoIHRvIHJlZ2lzdGVyIHRoZSBoYW5kbGVyIGZvclxuICAgICAqIEBwYXJhbSB7TW9ja1JlcXVlc3RIYW5kbGVyPFQ+fSBoYW5kbGVyIFJlcXVlc3QgaGFuZGxlclxuICAgICAqL1xuICAgIHdoZW5EZWxldGU8VD4ocGF0aDogc3RyaW5nIHwgUmVnRXhwLCBoYW5kbGVyOiBNb2NrUmVxdWVzdEhhbmRsZXI8VD4pOiB2b2lkO1xufVxuXG5pbnRlcmZhY2UgTW9ja09ic2VydmVyIHtcbiAgICBvYnNlcnZlcklkOiBzdHJpbmc7XG4gICAgcXVlcnk6IGFueTtcbiAgICBpdGVtczogXy5EaWN0aW9uYXJ5PGFueT47XG59XG5cbmludGVyZmFjZSBNb2NrSXRlbXMge1xuICAgIHByaW1hcnlLZXk6IHN0cmluZztcbiAgICBvYnNlcnZlcnM6IE1vY2tPYnNlcnZlcltdO1xuICAgIGl0ZW1zOiBhbnlbXTtcbiAgICBxdWVyeUV2YWx1YXRvcjogTW9ja1F1ZXJ5RXZhbHVhdG9yPGFueT47XG4gICAgYmxhY2tob2xlOiBib29sZWFuO1xufVxuXG5pbnRlcmZhY2UgTW9ja0l0ZW1TdG9yZSB7XG4gICAgW2luZGV4OiBzdHJpbmddOiBNb2NrSXRlbXM7XG59XG5cbmludGVyZmFjZSBNb2NrUmVzcG9uc2VEZXNjcmlwdG9yIHtcbiAgICBwYXRoOiBzdHJpbmcgfCBSZWdFeHA7XG4gICAgaGFuZGxlcjogTW9ja1JlcXVlc3RIYW5kbGVyPGFueT47XG59XG5cbmludGVyZmFjZSBNb2NrUmVzcG9uc2VTdG9yZSB7XG4gICAgW21ldGhvZDogc3RyaW5nXTogTW9ja1Jlc3BvbnNlRGVzY3JpcHRvcltdO1xufVxuXG5jbGFzcyBNb2NrUXVlcnlPYnNlcnZlck1hbmFnZXIgZXh0ZW5kcyBRdWVyeU9ic2VydmVyTWFuYWdlciB7XG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgcmVtb3ZlKG9ic2VydmVySWQ6IHN0cmluZykge1xuICAgICAgICB0aGlzLl9kZWxldGVPYnNlcnZlcihvYnNlcnZlcklkKTtcbiAgICAgICAgLy8gQ2FsbCB0aGUgdW5zdWJzY3JpYmUgbWV0aG9kIGltbWVkaWF0ZWx5IGR1cmluZyB0ZXN0cy4gVGhlIGFjdHVhbCBxdWVyeVxuICAgICAgICAvLyBvYnNlcnZlciBtYW5hZ2VyIHdpbGwgZGVmZXIgdGhlc2UgY2FsbHMgaW5zdGVhZC5cbiAgICAgICAgdGhpcy5fdW5zdWJzY3JpYmUob2JzZXJ2ZXJJZCkuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgIC8vIFN1YnNjcmliZSB0byBwcm9jZXNzIHRoZSAobW9jaykgcmVxdWVzdC5cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgY2hhaW5BZnRlclVuc3Vic2NyaWJlPFQ+KG1ha2VPYnNlcnZhYmxlOiAoKSA9PiBSeC5PYnNlcnZhYmxlPFQ+KTogUnguT2JzZXJ2YWJsZTxUPiB7XG4gICAgICAgIC8vIERvIG5vdCBkZWZlciBtYWtlT2JzZXJ2YWJsZSBkdXJpbmcgdGVzdHMuXG4gICAgICAgIHJldHVybiBtYWtlT2JzZXJ2YWJsZSgpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIE1vY2tDb25uZWN0aW9uIGltcGxlbWVudHMgQ29ubmVjdGlvbiwgTW9ja0Jhc2Uge1xuICAgIHByaXZhdGUgX21vY2tJdGVtczogTW9ja0l0ZW1TdG9yZSA9IHt9O1xuICAgIHByaXZhdGUgX21vY2tSZXNwb25zZXM6IE1vY2tSZXNwb25zZVN0b3JlID0ge307XG4gICAgcHJpdmF0ZSBfbWVzc2FnZXM6IFJ4LlN1YmplY3Q8TWVzc2FnZT47XG4gICAgcHJpdmF0ZSBfaXNDb25uZWN0ZWQ6IFJ4LkJlaGF2aW9yU3ViamVjdDxib29sZWFuPjtcbiAgICBwcml2YXRlIF9xdWVyeU9ic2VydmVyTWFuYWdlcjogUXVlcnlPYnNlcnZlck1hbmFnZXI7XG4gICAgcHJpdmF0ZSBfZXJyb3JzOiBSeC5TdWJqZWN0PEFQSUVycm9yPjtcbiAgICBwcml2YXRlIF9zaW11bGF0ZURlbGF5OiBib29sZWFuID0gZmFsc2U7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5fbWVzc2FnZXMgPSBuZXcgUnguU3ViamVjdDxNZXNzYWdlPigpO1xuICAgICAgICB0aGlzLl9pc0Nvbm5lY3RlZCA9IG5ldyBSeC5CZWhhdmlvclN1YmplY3QoZmFsc2UpO1xuICAgICAgICB0aGlzLl9lcnJvcnMgPSBuZXcgUnguU3ViamVjdDxBUElFcnJvcj4oKTtcbiAgICAgICAgdGhpcy5fcXVlcnlPYnNlcnZlck1hbmFnZXIgPSBuZXcgTW9ja1F1ZXJ5T2JzZXJ2ZXJNYW5hZ2VyKHRoaXMsIHRoaXMuX2Vycm9ycyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgY29ubmVjdChyZXN0VXJpOiBzdHJpbmcsIHdlYnNvY2tldFVyaTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuX2lzQ29ubmVjdGVkLm9uTmV4dCh0cnVlKTtcbiAgICAgICAgdGhpcy5tZXNzYWdlcygpLnN1YnNjcmliZSh0aGlzLl9xdWVyeU9ic2VydmVyTWFuYWdlci51cGRhdGUuYmluZCh0aGlzLl9xdWVyeU9ic2VydmVyTWFuYWdlcikpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIGRpc2Nvbm5lY3QoKSB7XG4gICAgICAgIHRoaXMuX2lzQ29ubmVjdGVkLm9uTmV4dChmYWxzZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgaXNDb25uZWN0ZWQoKTogUnguT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pc0Nvbm5lY3RlZDtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZWdpc3Rlck1vY2tSZXF1ZXN0SGFuZGxlcjxUPihtZXRob2Q6IHN0cmluZywgcGF0aDogc3RyaW5nIHwgUmVnRXhwLCBoYW5kbGVyOiBNb2NrUmVxdWVzdEhhbmRsZXI8VD4pIHtcbiAgICAgICAgaWYgKCF0aGlzLl9tb2NrUmVzcG9uc2VzW21ldGhvZF0pIHRoaXMuX21vY2tSZXNwb25zZXNbbWV0aG9kXSA9IFtdO1xuICAgICAgICBjb25zdCBoYW5kbGVycyA9IHRoaXMuX21vY2tSZXNwb25zZXNbbWV0aG9kXTtcblxuICAgICAgICBpZiAoXy5hbnkoaGFuZGxlcnMsIChleGlzdGluZ0hhbmRsZXIpID0+IGV4aXN0aW5nSGFuZGxlci5wYXRoID09PSBwYXRoKSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgTWV0aG9kICR7bWV0aG9kfSBmb3IgcGF0aCAke3BhdGh9IGFscmVhZHkgcmVnaXN0ZXJlZGApO1xuICAgICAgICB9XG5cbiAgICAgICAgaGFuZGxlcnMucHVzaCh7XG4gICAgICAgICAgICBwYXRoOiBwYXRoLFxuICAgICAgICAgICAgaGFuZGxlcjogaGFuZGxlcixcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfaGFuZGxlTW9ja1Jlc3BvbnNlKG1ldGhvZDogc3RyaW5nLCByZXNwb25zZVBhdGg6IHN0cmluZywgcGFyYW1ldGVyczogYW55LCBkYXRhOiBhbnkpOiBSeC5PYnNlcnZhYmxlPGFueT4ge1xuICAgICAgICBjb25zdCBtYXRjaGluZ0hhbmRsZXJzID0gXy5maWx0ZXIodGhpcy5fbW9ja1Jlc3BvbnNlc1ttZXRob2RdLCAoe3BhdGh9KSA9PiB7XG4gICAgICAgICAgICBpZiAocGF0aCBpbnN0YW5jZW9mIFJlZ0V4cCkgcmV0dXJuIHBhdGgudGVzdChyZXNwb25zZVBhdGgpO1xuICAgICAgICAgICAgcmV0dXJuIHBhdGggPT09IHJlc3BvbnNlUGF0aDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKF8uaXNFbXB0eShtYXRjaGluZ0hhbmRsZXJzKSkge1xuICAgICAgICAgICAgcmV0dXJuIFJ4Lk9ic2VydmFibGUuanVzdCh7fSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXy5zaXplKG1hdGNoaW5nSGFuZGxlcnMpID4gMSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgTXVsdGlwbGUgaGFuZGxlcnMgbWF0Y2hlZCBmb3IgbWV0aG9kICR7bWV0aG9kfSBvbiBwYXRoICR7cmVzcG9uc2VQYXRofWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETzogU3VwcG9ydCBtb2NraW5nIGVycm9ycyBhcyB3ZWxsLlxuICAgICAgICBjb25zdCB7cGF0aCwgaGFuZGxlcn0gPSBtYXRjaGluZ0hhbmRsZXJzWzBdO1xuICAgICAgICBpZiAocGF0aCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgcmV0dXJuIFJ4Lk9ic2VydmFibGUuanVzdChoYW5kbGVyKHBhcmFtZXRlcnMsIGRhdGEsIHBhdGguZXhlYyhyZXNwb25zZVBhdGgpKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFJ4Lk9ic2VydmFibGUuanVzdChoYW5kbGVyKHBhcmFtZXRlcnMsIGRhdGEpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBzaW11bGF0ZURlbGF5KHZhbHVlOiBib29sZWFuKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX3NpbXVsYXRlRGVsYXkgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBnZXQ8VD4ocGF0aDogc3RyaW5nLCBwYXJhbWV0ZXJzPzogT2JqZWN0KTogUnguT2JzZXJ2YWJsZTxUPiB7XG4gICAgICAgIGlmICghXy5zdGFydHNXaXRoKHBhdGgsICcvYXBpLycpKSByZXR1cm4gdGhpcy5faGFuZGxlTW9ja1Jlc3BvbnNlKCdnZXQnLCBwYXRoLCBwYXJhbWV0ZXJzLCB7fSk7XG5cbiAgICAgICAgY29uc3QgcmVhY3RpdmUgPSBfLmhhcyhwYXJhbWV0ZXJzLCAnb2JzZXJ2ZScpO1xuICAgICAgICBjb25zdCBhdG9tcyA9IHBhdGguc3BsaXQoJy8nKTtcbiAgICAgICAgY29uc3QgcmVzb3VyY2UgPSBhdG9tcy5zbGljZSgyKS5qb2luKCcvJyk7XG5cbiAgICAgICAgaWYgKCFyZWFjdGl2ZSAmJiAhXy5oYXModGhpcy5fbW9ja0l0ZW1zLCByZXNvdXJjZSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9oYW5kbGVNb2NrUmVzcG9uc2UoJ2dldCcsIHBhdGgsIHBhcmFtZXRlcnMsIHt9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBpdGVtcyA9IHRoaXMuX2dldE1vY2tJdGVtc0ZvcihyZXNvdXJjZSk7XG4gICAgICAgIGlmIChpdGVtcy5ibGFja2hvbGUpIHJldHVybiBSeC5PYnNlcnZhYmxlLm5ldmVyPFQ+KCk7XG5cbiAgICAgICAgbGV0IG9ic2VydmFibGU6IFJ4Lk9ic2VydmFibGU8YW55PjtcbiAgICAgICAgaWYgKCFyZWFjdGl2ZSkge1xuICAgICAgICAgICAgLy8gTm9uLXJlYWN0aXZlIHF1ZXJ5LlxuICAgICAgICAgICAgb2JzZXJ2YWJsZSA9IFJ4Lk9ic2VydmFibGUuanVzdDxhbnk+KGl0ZW1zLnF1ZXJ5RXZhbHVhdG9yKHBhcmFtZXRlcnMsIGl0ZW1zLml0ZW1zKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBSZWFjdGl2ZSBxdWVyeS5cbiAgICAgICAgICAgIGNvbnN0IG9ic2VydmVyID0ge1xuICAgICAgICAgICAgICAgIG9ic2VydmVySWQ6IHJhbmRvbS5yYW5kb21VdWlkKCksXG4gICAgICAgICAgICAgICAgcXVlcnk6IF8ub21pdChwYXJhbWV0ZXJzLCAnb2JzZXJ2ZScpLFxuICAgICAgICAgICAgICAgIGl0ZW1zOiB7fSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpdGVtcy5vYnNlcnZlcnMucHVzaChvYnNlcnZlcik7XG5cbiAgICAgICAgICAgIG9ic2VydmFibGUgPSBSeC5PYnNlcnZhYmxlLmp1c3Q8YW55Pih7XG4gICAgICAgICAgICAgICAgb2JzZXJ2ZXI6IG9ic2VydmVyLm9ic2VydmVySWQsXG4gICAgICAgICAgICAgICAgaXRlbXM6IHRoaXMuX3VwZGF0ZU1vY2tPYnNlcnZlcihvYnNlcnZlciwgaXRlbXMsIGZhbHNlKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3NpbXVsYXRlRGVsYXkgPyBvYnNlcnZhYmxlLmRlbGF5KDEwMCkgOiBvYnNlcnZhYmxlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIHBvc3Q8VD4ocGF0aDogc3RyaW5nLCBkYXRhOiBPYmplY3QsIHBhcmFtZXRlcnM/OiBPYmplY3QpOiBSeC5PYnNlcnZhYmxlPFQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2hhbmRsZU1vY2tSZXNwb25zZSgncG9zdCcsIHBhdGgsIHBhcmFtZXRlcnMsIGRhdGEpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIHB1dDxUPihwYXRoOiBzdHJpbmcsIGRhdGE6IE9iamVjdCwgcGFyYW1ldGVycz86IE9iamVjdCk6IFJ4Lk9ic2VydmFibGU8VD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5faGFuZGxlTW9ja1Jlc3BvbnNlKCdwdXQnLCBwYXRoLCBwYXJhbWV0ZXJzLCBkYXRhKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBwYXRjaDxUPihwYXRoOiBzdHJpbmcsIGRhdGE6IE9iamVjdCwgcGFyYW1ldGVycz86IE9iamVjdCk6IFJ4Lk9ic2VydmFibGU8VD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5faGFuZGxlTW9ja1Jlc3BvbnNlKCdwYXRjaCcsIHBhdGgsIHBhcmFtZXRlcnMsIGRhdGEpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIGRlbGV0ZTxUPihwYXRoOiBzdHJpbmcsIGRhdGE6IE9iamVjdCwgcGFyYW1ldGVycz86IE9iamVjdCk6IFJ4Lk9ic2VydmFibGU8VD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5faGFuZGxlTW9ja1Jlc3BvbnNlKCdkZWxldGUnLCBwYXRoLCBwYXJhbWV0ZXJzLCBkYXRhKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBjcmVhdGVVcmlGcm9tUGF0aChwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gcGF0aDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBjc3JmQ29va2llKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiAnY29va2llJztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBtZXNzYWdlcygpOiBSeC5PYnNlcnZhYmxlPE1lc3NhZ2U+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21lc3NhZ2VzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIGVycm9ycygpOiBSeC5PYnNlcnZhYmxlPEFQSUVycm9yPiB7XG4gICAgICAgIHRocm93IG5ldyBHZW5FcnJvcignVGhyb3dpbmcgZXJyb3JzIGluIG1vY2tlZCBjb25uZWN0aW9uIG5vdCBzdXBwb3J0ZWQnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBzZXNzaW9uSWQoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuICdzZXNzaW9uLWlkJztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBxdWVyeU9ic2VydmVyTWFuYWdlcigpOiBRdWVyeU9ic2VydmVyTWFuYWdlciB7XG4gICAgICAgIHJldHVybiB0aGlzLl9xdWVyeU9ic2VydmVyTWFuYWdlcjtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9nZXRNb2NrSXRlbXNGb3I8VD4ocmVzb3VyY2U6IHN0cmluZyk6IE1vY2tJdGVtcyB7XG4gICAgICAgIGNvbnN0IG1vY2tJdGVtcyA9IHRoaXMuX21vY2tJdGVtc1tyZXNvdXJjZV07XG4gICAgICAgIGlmICghbW9ja0l0ZW1zKSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgcmVzb3VyY2UgZG9lc24ndCBleGlzdCwgd2UgYWx3YXlzIHJldHVybiBhbiBlbXB0eSByZXNvdXJjZSwgc28gdGhhdCB0aGVcbiAgICAgICAgICAgIC8vIHByb2Nlc3NpbmcgZG9lc24ndCBmYWlsLCBpdCBqdXN0IGFsd2F5cyBjb250YWlucyBubyBpdGVtcy5cbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYE1vY2sgQVBJIHJlc291cmNlICcke3Jlc291cmNlfScgcmVmZXJlbmNlZCwgYnV0IGhhcyBub3QgYmVlbiBkZWZpbmVkLmApO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgIHByaW1hcnlLZXk6ICdpZCcsXG4gICAgICAgICAgICAgICBpdGVtczogW10sXG4gICAgICAgICAgICAgICBvYnNlcnZlcnM6IFtdLFxuICAgICAgICAgICAgICAgcXVlcnlFdmFsdWF0b3I6IChxdWVyeSwgaXRlbXMpID0+IGl0ZW1zLFxuICAgICAgICAgICAgICAgYmxhY2tob2xlOiBmYWxzZSxcbiAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBtb2NrSXRlbXM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfdXBkYXRlTW9ja09ic2VydmVyKG9ic2VydmVyOiBNb2NrT2JzZXJ2ZXIsIGl0ZW1zOiBNb2NrSXRlbXMsIG5vdGlmeTogYm9vbGVhbiA9IHRydWUpOiBhbnlbXSB7XG4gICAgICAgIGxldCBvbGRJdGVtcyA9IG9ic2VydmVyLml0ZW1zO1xuICAgICAgICBsZXQgbmV3SXRlbXM6IF8uRGljdGlvbmFyeTxhbnk+ID0ge307XG5cbiAgICAgICAgLy8gRXZhbHVhdGUgcXVlcnkgb24gYWxsIHRoZSBuZXcgaXRlbXMuXG4gICAgICAgIGNvbnN0IG5ld0l0ZW1zQXJyYXkgPSBpdGVtcy5xdWVyeUV2YWx1YXRvcihvYnNlcnZlci5xdWVyeSwgaXRlbXMuaXRlbXMpO1xuICAgICAgICBfLmVhY2gobmV3SXRlbXNBcnJheSwgKGl0ZW0sIGluZGV4KSA9PiB7XG4gICAgICAgICAgICBpdGVtLl9vcmRlciA9IGluZGV4O1xuICAgICAgICAgICAgbmV3SXRlbXNbaXRlbVtpdGVtcy5wcmltYXJ5S2V5XV0gPSBpdGVtO1xuICAgICAgICB9KTtcbiAgICAgICAgb2JzZXJ2ZXIuaXRlbXMgPSBuZXdJdGVtcztcblxuICAgICAgICBpZiAobm90aWZ5KSB7XG4gICAgICAgICAgICBjb25zdCByZW1vdmVkID0gXy5maWx0ZXIob2xkSXRlbXMsIChpdGVtLCBpdGVtSWQpID0+ICFuZXdJdGVtc1tpdGVtSWRdKTtcbiAgICAgICAgICAgIGNvbnN0IGFkZGVkID0gXy5maWx0ZXIobmV3SXRlbXMsIChpdGVtLCBpdGVtSWQpID0+ICFvbGRJdGVtc1tpdGVtSWRdKTtcblxuICAgICAgICAgICAgY29uc3QgY2hhbmdlZCA9IF8uZmlsdGVyKG5ld0l0ZW1zLCAobmV3SXRlbSwgaXRlbUlkKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFvbGRJdGVtc1tpdGVtSWRdKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgcmV0dXJuICFfLmlzRXF1YWwobmV3SXRlbSwgb2xkSXRlbXNbaXRlbUlkXSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZm9yIChjb25zdCBbY2hhbmdlcywgdHlwZV0gb2YgW1thZGRlZCwgTUVTU0FHRV9BRERFRF0sIFtyZW1vdmVkLCBNRVNTQUdFX1JFTU9WRURdLCBbY2hhbmdlZCwgTUVTU0FHRV9DSEFOR0VEXV0pIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpdGVtIG9mIGNoYW5nZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWVzc2FnZXMub25OZXh0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1zZzogPHN0cmluZz4gdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ic2VydmVyOiBvYnNlcnZlci5vYnNlcnZlcklkLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbWFyeV9rZXk6IGl0ZW1zLnByaW1hcnlLZXksXG4gICAgICAgICAgICAgICAgICAgICAgICBvcmRlcjogaXRlbS5fb3JkZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtOiBfLmNsb25lRGVlcChfLm9taXQoaXRlbSwgJ19vcmRlcicpKSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIF8ubWFwKG5ld0l0ZW1zQXJyYXksIChpdGVtKSA9PiBfLm9taXQoaXRlbSwgJ19vcmRlcicpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9ub3RpZnlNb2NrT2JzZXJ2ZXJzPFQ+KGl0ZW1zOiBNb2NrSXRlbXMpIHtcbiAgICAgICAgZm9yIChsZXQgb2JzZXJ2ZXIgb2YgaXRlbXMub2JzZXJ2ZXJzKSB7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVNb2NrT2JzZXJ2ZXIob2JzZXJ2ZXIsIGl0ZW1zKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIERldmVsb3Blci1mYWNpbmcgQVBJIGJlbG93LlxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgcmVzZXQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX21vY2tJdGVtcyA9IHt9O1xuICAgICAgICB0aGlzLl9tb2NrUmVzcG9uc2VzID0ge307XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgY3JlYXRlUmVzb3VyY2U8VD4ocmVzb3VyY2U6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpbWFyeUtleTogc3RyaW5nID0gJ2lkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVlcnlFdmFsdWF0b3I6IE1vY2tRdWVyeUV2YWx1YXRvcjxUPiA9IChxdWVyeSwgaXRlbXMpID0+IGl0ZW1zKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX21vY2tJdGVtc1tyZXNvdXJjZV0gPSB7XG4gICAgICAgICAgICBwcmltYXJ5S2V5OiBwcmltYXJ5S2V5LFxuICAgICAgICAgICAgaXRlbXM6IFtdLFxuICAgICAgICAgICAgb2JzZXJ2ZXJzOiBbXSxcbiAgICAgICAgICAgIHF1ZXJ5RXZhbHVhdG9yOiBxdWVyeUV2YWx1YXRvcixcbiAgICAgICAgICAgIGJsYWNraG9sZTogZmFsc2UsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgY3JlYXRlQmxhY2tob2xlUmVzb3VyY2UocmVzb3VyY2U6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICB0aGlzLl9tb2NrSXRlbXNbcmVzb3VyY2VdID0ge1xuICAgICAgICAgICAgcHJpbWFyeUtleTogbnVsbCxcbiAgICAgICAgICAgIGl0ZW1zOiBbXSxcbiAgICAgICAgICAgIG9ic2VydmVyczogW10sXG4gICAgICAgICAgICBxdWVyeUV2YWx1YXRvcjogbnVsbCxcbiAgICAgICAgICAgIGJsYWNraG9sZTogdHJ1ZSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBhZGRJdGVtPFQ+KHJlc291cmNlOiBzdHJpbmcsIGl0ZW06IFQpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgaXRlbXMgPSB0aGlzLl9nZXRNb2NrSXRlbXNGb3IocmVzb3VyY2UpO1xuICAgICAgICBpdGVtcy5pdGVtcy5wdXNoKF8uY2xvbmVEZWVwKGl0ZW0pKTtcblxuICAgICAgICB0aGlzLl9ub3RpZnlNb2NrT2JzZXJ2ZXJzKGl0ZW1zKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBhZGRJdGVtczxUPihyZXNvdXJjZTogc3RyaW5nLCBpdGVtczogVFtdKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nSXRlbXMgPSB0aGlzLl9nZXRNb2NrSXRlbXNGb3IocmVzb3VyY2UpO1xuICAgICAgICBleGlzdGluZ0l0ZW1zLml0ZW1zLnB1c2guYXBwbHkoZXhpc3RpbmdJdGVtcy5pdGVtcywgXy5jbG9uZURlZXAoaXRlbXMpKTtcblxuICAgICAgICB0aGlzLl9ub3RpZnlNb2NrT2JzZXJ2ZXJzKGV4aXN0aW5nSXRlbXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIHVwZGF0ZUl0ZW08VD4ocmVzb3VyY2U6IHN0cmluZywgaXRlbTogVCk6IHZvaWQge1xuICAgICAgICBjb25zdCBpdGVtcyA9IHRoaXMuX2dldE1vY2tJdGVtc0ZvcihyZXNvdXJjZSk7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gXy5maW5kSW5kZXgoaXRlbXMuaXRlbXMsIHtbaXRlbXMucHJpbWFyeUtleV06IGl0ZW1baXRlbXMucHJpbWFyeUtleV19KTtcbiAgICAgICAgaXRlbXMuaXRlbXNbaW5kZXhdID0gaXRlbTtcblxuICAgICAgICB0aGlzLl9ub3RpZnlNb2NrT2JzZXJ2ZXJzKGl0ZW1zKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyByZW1vdmVJdGVtKHJlc291cmNlOiBzdHJpbmcsIGl0ZW1JZDogc3RyaW5nIHwgbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5fZ2V0TW9ja0l0ZW1zRm9yKHJlc291cmNlKTtcbiAgICAgICAgY29uc3QgaW5kZXggPSBfLmZpbmRJbmRleChpdGVtcy5pdGVtcywge1tpdGVtcy5wcmltYXJ5S2V5XTogaXRlbUlkfSk7XG4gICAgICAgIF8ucHVsbEF0KGl0ZW1zLml0ZW1zLCBpbmRleCk7XG5cbiAgICAgICAgdGhpcy5fbm90aWZ5TW9ja09ic2VydmVycyhpdGVtcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgd2hlbkdldDxUPihwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPik6IHZvaWQge1xuICAgICAgICB0aGlzLl9yZWdpc3Rlck1vY2tSZXF1ZXN0SGFuZGxlcignZ2V0JywgcGF0aCwgaGFuZGxlcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgd2hlblBvc3Q8VD4ocGF0aDogc3RyaW5nIHwgUmVnRXhwLCBoYW5kbGVyOiBNb2NrUmVxdWVzdEhhbmRsZXI8VD4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fcmVnaXN0ZXJNb2NrUmVxdWVzdEhhbmRsZXIoJ3Bvc3QnLCBwYXRoLCBoYW5kbGVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyB3aGVuUHV0PFQ+KHBhdGg6IHN0cmluZyB8IFJlZ0V4cCwgaGFuZGxlcjogTW9ja1JlcXVlc3RIYW5kbGVyPFQ+KTogdm9pZCB7XG4gICAgICAgIHRoaXMuX3JlZ2lzdGVyTW9ja1JlcXVlc3RIYW5kbGVyKCdwdXQnLCBwYXRoLCBoYW5kbGVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyB3aGVuUGF0Y2g8VD4ocGF0aDogc3RyaW5nIHwgUmVnRXhwLCBoYW5kbGVyOiBNb2NrUmVxdWVzdEhhbmRsZXI8VD4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fcmVnaXN0ZXJNb2NrUmVxdWVzdEhhbmRsZXIoJ3BhdGNoJywgcGF0aCwgaGFuZGxlcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgd2hlbkRlbGV0ZTxUPihwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPik6IHZvaWQge1xuICAgICAgICB0aGlzLl9yZWdpc3Rlck1vY2tSZXF1ZXN0SGFuZGxlcignZGVsZXRlJywgcGF0aCwgaGFuZGxlcik7XG4gICAgfVxufVxuXG5cbi8qKlxuICogTW9jayBBUEkgbWl4aW4sIHdoaWNoIG1heSBiZSB1c2VkIGluIHRlc3RzIHRvIHNpbXVsYXRlIHRoZSBiYWNrZW5kLlxuICovXG5leHBvcnQgY2xhc3MgTW9ja0FwaU1peGluIGltcGxlbWVudHMgTW9ja0Jhc2Uge1xuICAgIHB1YmxpYyBjb25uZWN0aW9uOiBNb2NrQ29ubmVjdGlvbjtcblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIHJlc2V0KCk6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb24ucmVzZXQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBzaW11bGF0ZURlbGF5KHZhbHVlOiBib29sZWFuKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi5zaW11bGF0ZURlbGF5KHZhbHVlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBjcmVhdGVSZXNvdXJjZTxUPihyZXNvdXJjZTogc3RyaW5nLCBwcmltYXJ5S2V5Pzogc3RyaW5nLCBxdWVyeT86IE1vY2tRdWVyeUV2YWx1YXRvcjxUPik6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb24uY3JlYXRlUmVzb3VyY2UocmVzb3VyY2UsIHByaW1hcnlLZXksIHF1ZXJ5KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBjcmVhdGVCbGFja2hvbGVSZXNvdXJjZShyZXNvdXJjZTogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi5jcmVhdGVCbGFja2hvbGVSZXNvdXJjZShyZXNvdXJjZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgYWRkSXRlbTxUPihyZXNvdXJjZTogc3RyaW5nLCBpdGVtOiBUKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi5hZGRJdGVtKHJlc291cmNlLCBpdGVtKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBhZGRJdGVtczxUPihyZXNvdXJjZTogc3RyaW5nLCBpdGVtczogVFtdKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi5hZGRJdGVtcyhyZXNvdXJjZSwgaXRlbXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIHVwZGF0ZUl0ZW08VD4ocmVzb3VyY2U6IHN0cmluZywgaXRlbTogVCk6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb24udXBkYXRlSXRlbShyZXNvdXJjZSwgaXRlbSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgcmVtb3ZlSXRlbShyZXNvdXJjZTogc3RyaW5nLCBpdGVtSWQ6IHN0cmluZyB8IG51bWJlcik6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb24ucmVtb3ZlSXRlbShyZXNvdXJjZSwgaXRlbUlkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyB3aGVuR2V0PFQ+KHBhdGg6IHN0cmluZyB8IFJlZ0V4cCwgaGFuZGxlcjogTW9ja1JlcXVlc3RIYW5kbGVyPFQ+KTogdm9pZCB7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi53aGVuR2V0KHBhdGgsIGhhbmRsZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIHdoZW5Qb3N0PFQ+KHBhdGg6IHN0cmluZyB8IFJlZ0V4cCwgaGFuZGxlcjogTW9ja1JlcXVlc3RIYW5kbGVyPFQ+KTogdm9pZCB7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi53aGVuUG9zdChwYXRoLCBoYW5kbGVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyB3aGVuUHV0PFQ+KHBhdGg6IHN0cmluZyB8IFJlZ0V4cCwgaGFuZGxlcjogTW9ja1JlcXVlc3RIYW5kbGVyPFQ+KTogdm9pZCB7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi53aGVuUHV0KHBhdGgsIGhhbmRsZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIHdoZW5QYXRjaDxUPihwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPik6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb24ud2hlblBhdGNoKHBhdGgsIGhhbmRsZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIHdoZW5EZWxldGU8VD4ocGF0aDogc3RyaW5nIHwgUmVnRXhwLCBoYW5kbGVyOiBNb2NrUmVxdWVzdEhhbmRsZXI8VD4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uLndoZW5EZWxldGUocGF0aCwgaGFuZGxlcik7XG4gICAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1vY2tBcGlCYXNlIGV4dGVuZHMgUmVzb2x3ZUFwaSwgTW9ja0FwaU1peGluIHtcbiAgICBjb25uZWN0aW9uOiBNb2NrQ29ubmVjdGlvbjtcblxuICAgIG5ldyAoLi4uYXJnczogYW55W10pOiBNb2NrQXBpQmFzZTtcbiAgICAoLi4uYXJnczogYW55W10pOiB2b2lkO1xufVxuXG5leHBvcnQgbGV0IE1vY2tBcGlCYXNlOiBNb2NrQXBpQmFzZSA9IDxNb2NrQXBpQmFzZT4gY29tcG9zZShbUmVzb2x3ZUFwaSwgTW9ja0FwaU1peGluXSk7XG5cbmV4cG9ydCBjbGFzcyBNb2NrQXBpIGV4dGVuZHMgTW9ja0FwaUJhc2Uge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcihuZXcgTW9ja0Nvbm5lY3Rpb24oKSwgbnVsbCwgbnVsbCk7XG4gICAgfVxufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiBmb3Igc3VwcG9ydGluZyBwYWdpbmF0aW9uLCB3aGljaCBjYW4gYmUgdXNlZCBhcyBhIFtbTW9ja1F1ZXJ5RXZhbHVhdG9yXV0uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYWdpbmF0ZVF1ZXJ5PFQ+KHF1ZXJ5OiBhbnksIGl0ZW1zOiBUW10pOiBUW10ge1xuICAgIGNvbnN0IGxpbWl0ID0gcXVlcnkubGltaXQgfHwgMDtcbiAgICBjb25zdCBvZmZzZXQgPSBxdWVyeS5vZmZzZXQgfHwgMDtcbiAgICByZXR1cm4gaXRlbXMuc2xpY2Uob2Zmc2V0LCBsaW1pdCA+IDAgPyBvZmZzZXQgKyBsaW1pdCA6IHVuZGVmaW5lZCk7XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIGZvciBzdXBwb3J0aW5nIG9yZGVyaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gb3JkZXJpbmdRdWVyeTxUPihxdWVyeTogUXVlcnksIGl0ZW1zOiBUW10pOiBUW10ge1xuICAgIGlmICghcXVlcnkub3JkZXJpbmcpIHJldHVybiBpdGVtcztcbiAgICBjb25zdCBvcmRlcmluZyA9IHF1ZXJ5Lm9yZGVyaW5nLnNwbGl0KCcsJyk7XG5cbiAgICBjb25zdCBvcmRlcmluZ0RpcmVjdGlvbnMgPSBfLm1hcChvcmRlcmluZywgKGNvbHVtbikgPT4gY29sdW1uWzBdID09PSAnLScgPyAnZGVzYycgOiAnYXNjJyk7XG4gICAgY29uc3Qgb3JkZXJpbmdDb2x1bW5zID0gXy5tYXAob3JkZXJpbmcsIChjb2x1bW4pID0+IGNvbHVtblswXSA9PT0gJy0nID8gY29sdW1uLnN1YnN0cigxKSA6IGNvbHVtbik7XG4gICAgcmV0dXJuIF8uc29ydEJ5T3JkZXIoaXRlbXMsIG9yZGVyaW5nQ29sdW1ucywgb3JkZXJpbmdEaXJlY3Rpb25zKTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gZm9yIHN1cHBvcnRpbmcgZmlsdGVyaW5nIGJ5IGRlc2NyaXB0b3JfY29tcGxldGVkLCB3aGljaCBjYW4gYmUgdXNlZCBhcyBhIFtbTW9ja1F1ZXJ5RXZhbHVhdG9yXV0uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbm5vdGF0ZWRRdWVyeTxUIGV4dGVuZHMgU2FtcGxlQmFzZT4ocXVlcnk6IGFueSwgaXRlbXM6IFRbXSk6IFRbXSB7XG4gICAgaWYgKF8uaXNVbmRlZmluZWQocXVlcnkuZGVzY3JpcHRvcl9jb21wbGV0ZWQpIHx8IF8uaXNOdWxsKHF1ZXJ5LmRlc2NyaXB0b3JfY29tcGxldGVkKSkgcmV0dXJuIGl0ZW1zO1xuXG4gICAgcmV0dXJuIF8uZmlsdGVyKGl0ZW1zLCAoaXRlbSkgPT4gaXRlbS5kZXNjcmlwdG9yX2NvbXBsZXRlZCA9PT0gcXVlcnkuZGVzY3JpcHRvcl9jb21wbGV0ZWQpO1xufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiBmb3Igc3VwcG9ydGluZyBmaWx0ZXJpbmcgYnkgc2x1Zywgd2hpY2ggY2FuIGJlIHVzZWQgYXMgYSBbW01vY2tRdWVyeUV2YWx1YXRvcl1dLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2x1Z1F1ZXJ5PFQgZXh0ZW5kcyBDb2xsZWN0aW9uQmFzZSB8IERhdGFCYXNlPihxdWVyeTogYW55LCBpdGVtczogVFtdKTogVFtdIHtcbiAgICBpZiAoIXF1ZXJ5LnNsdWcpIHJldHVybiBpdGVtcztcblxuICAgIHJldHVybiBfLmZpbHRlcihpdGVtcywgKGl0ZW0pID0+IGl0ZW0uc2x1ZyA9PT0gcXVlcnkuc2x1Zyk7XG59XG4iXX0=
