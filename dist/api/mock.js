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
    MockConnection.prototype.get = function (path, parameters) {
        if (!_.startsWith(path, '/api/'))
            return this._handleMockResponse('get', path, parameters, {});
        if (!_.has(parameters, 'observe'))
            return this._handleMockResponse('get', path, parameters, {});
        var atoms = path.split('/');
        var resource = atoms.slice(2).join('/');
        var items = this._getMockItemsFor(resource);
        if (items.blackhole)
            return Rx.Observable.never();
        var observer = {
            observerId: random.randomUuid(),
            query: _.omit(parameters, 'observe'),
            items: {},
        };
        items.observers.push(observer);
        return Rx.Observable.just({
            observer: observer.observerId,
            items: this._updateMockObserver(observer, items, false),
        });
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvbW9jay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwwQkFBNEI7QUFDNUIsdUJBQXlCO0FBR3pCLGlEQUFzRztBQUN0Ryw4Q0FBOEM7QUFHOUMsaUNBQW1DO0FBQ25DLDJDQUEyQztBQUMzQyw2Q0FBK0M7QUF3Sy9DO0lBQXVDLDRDQUFvQjtJQUEzRDs7SUFvQkEsQ0FBQztJQW5CRzs7T0FFRztJQUNJLHlDQUFNLEdBQWIsVUFBYyxVQUFrQjtRQUM1QixJQUFJLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ2pDLHlFQUF5RTtRQUN6RSxtREFBbUQ7UUFDbkQsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxTQUFTLENBQUM7WUFDcEMsMkNBQTJDO1FBQy9DLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVEOztPQUVHO0lBQ0ksd0RBQXFCLEdBQTVCLFVBQWdDLGNBQXNDO1FBQ2xFLDRDQUE0QztRQUM1QyxNQUFNLENBQUMsY0FBYyxFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUNMLCtCQUFDO0FBQUQsQ0FwQkEsQUFvQkMsQ0FwQnNDLG9DQUFvQixHQW9CMUQ7QUFFRDtJQVFJO1FBUFEsZUFBVSxHQUFrQixFQUFFLENBQUM7UUFDL0IsbUJBQWMsR0FBc0IsRUFBRSxDQUFDO1FBTzNDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFXLENBQUM7UUFDM0MsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbEQsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQVksQ0FBQztRQUMxQyxJQUFJLENBQUMscUJBQXFCLEdBQUcsSUFBSSx3QkFBd0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2xGLENBQUM7SUFFRDs7T0FFRztJQUNJLGdDQUFPLEdBQWQsVUFBZSxPQUFlLEVBQUUsWUFBb0I7UUFDaEQsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0IsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO0lBQ2xHLENBQUM7SUFFRDs7T0FFRztJQUNJLG1DQUFVLEdBQWpCO1FBQ0ksSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVEOztPQUVHO0lBQ0ksb0NBQVcsR0FBbEI7UUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQztJQUM3QixDQUFDO0lBRU8sb0RBQTJCLEdBQW5DLFVBQXVDLE1BQWMsRUFBRSxJQUFxQixFQUFFLE9BQThCO1FBQ3hHLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ25FLElBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFN0MsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsVUFBQyxlQUFlLElBQUssT0FBQSxlQUFlLENBQUMsSUFBSSxLQUFLLElBQUksRUFBN0IsQ0FBNkIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RSxPQUFPLENBQUMsS0FBSyxDQUFDLFlBQVUsTUFBTSxrQkFBYSxJQUFJLHdCQUFxQixDQUFDLENBQUM7UUFDMUUsQ0FBQztRQUVELFFBQVEsQ0FBQyxJQUFJLENBQUM7WUFDVixJQUFJLEVBQUUsSUFBSTtZQUNWLE9BQU8sRUFBRSxPQUFPO1NBQ25CLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTyw0Q0FBbUIsR0FBM0IsVUFBNEIsTUFBYyxFQUFFLFlBQW9CLEVBQUUsVUFBZSxFQUFFLElBQVM7UUFDeEYsSUFBTSxnQkFBZ0IsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEVBQUUsVUFBQyxFQUFNO2dCQUFMLGNBQUk7WUFDakUsRUFBRSxDQUFDLENBQUMsSUFBSSxZQUFZLE1BQU0sQ0FBQztnQkFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMzRCxNQUFNLENBQUMsSUFBSSxLQUFLLFlBQVksQ0FBQztRQUNqQyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFFRCxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvQixPQUFPLENBQUMsS0FBSyxDQUFDLDBDQUF3QyxNQUFNLGlCQUFZLFlBQWMsQ0FBQyxDQUFDO1FBQzVGLENBQUM7UUFFRCx3Q0FBd0M7UUFDbEMsSUFBQSx3QkFBcUMsRUFBcEMsY0FBSSxFQUFFLG9CQUFPLENBQXdCO1FBQzVDLEVBQUUsQ0FBQyxDQUFDLElBQUksWUFBWSxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLE1BQU0sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsRixDQUFDO1FBQ0QsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN6RCxDQUFDO0lBRUQ7O09BRUc7SUFDSSw0QkFBRyxHQUFWLFVBQWMsSUFBWSxFQUFFLFVBQW1CO1FBQzNDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQy9GLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWhHLElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDOUIsSUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFMUMsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzVDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUM7WUFBQyxNQUFNLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUssQ0FBQztRQUVyRCxJQUFNLFFBQVEsR0FBRztZQUNiLFVBQVUsRUFBRSxNQUFNLENBQUMsVUFBVSxFQUFFO1lBQy9CLEtBQUssRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUM7WUFDcEMsS0FBSyxFQUFFLEVBQUU7U0FDWixDQUFDO1FBQ0YsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFL0IsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFNO1lBQzNCLFFBQVEsRUFBRSxRQUFRLENBQUMsVUFBVTtZQUM3QixLQUFLLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDO1NBQzFELENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRDs7T0FFRztJQUNJLDZCQUFJLEdBQVgsVUFBZSxJQUFZLEVBQUUsSUFBWSxFQUFFLFVBQW1CO1FBQzFELE1BQU0sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDcEUsQ0FBQztJQUVEOztPQUVHO0lBQ0ksNEJBQUcsR0FBVixVQUFjLElBQVksRUFBRSxJQUFZLEVBQUUsVUFBbUI7UUFDekQsTUFBTSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNuRSxDQUFDO0lBRUQ7O09BRUc7SUFDSSw4QkFBSyxHQUFaLFVBQWdCLElBQVksRUFBRSxJQUFZLEVBQUUsVUFBbUI7UUFDM0QsTUFBTSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNyRSxDQUFDO0lBRUQ7O09BRUc7SUFDSSwrQkFBTSxHQUFiLFVBQWlCLElBQVksRUFBRSxJQUFZLEVBQUUsVUFBbUI7UUFDNUQsTUFBTSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN0RSxDQUFDO0lBRUQ7O09BRUc7SUFDSSwwQ0FBaUIsR0FBeEIsVUFBeUIsSUFBWTtRQUNqQyxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRDs7T0FFRztJQUNJLG1DQUFVLEdBQWpCO1FBQ0ksTUFBTSxDQUFDLFFBQVEsQ0FBQztJQUNwQixDQUFDO0lBRUQ7O09BRUc7SUFDSSxpQ0FBUSxHQUFmO1FBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDMUIsQ0FBQztJQUVEOztPQUVHO0lBQ0ksK0JBQU0sR0FBYjtRQUNJLE1BQU0sSUFBSSxnQkFBUSxDQUFDLG9EQUFvRCxDQUFDLENBQUM7SUFDN0UsQ0FBQztJQUVEOztPQUVHO0lBQ0ksa0NBQVMsR0FBaEI7UUFDSSxNQUFNLENBQUMsWUFBWSxDQUFDO0lBQ3hCLENBQUM7SUFFRDs7T0FFRztJQUNJLDZDQUFvQixHQUEzQjtRQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUM7SUFDdEMsQ0FBQztJQUVPLHlDQUFnQixHQUF4QixVQUE0QixRQUFnQjtRQUN4QyxJQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzVDLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUNiLGlGQUFpRjtZQUNqRiw2REFBNkQ7WUFDN0QsT0FBTyxDQUFDLEtBQUssQ0FBQyx3QkFBc0IsUUFBUSw0Q0FBeUMsQ0FBQyxDQUFDO1lBQ3ZGLE1BQU0sQ0FBQztnQkFDSixVQUFVLEVBQUUsSUFBSTtnQkFDaEIsS0FBSyxFQUFFLEVBQUU7Z0JBQ1QsU0FBUyxFQUFFLEVBQUU7Z0JBQ2IsY0FBYyxFQUFFLFVBQUMsS0FBSyxFQUFFLEtBQUssSUFBSyxPQUFBLEtBQUssRUFBTCxDQUFLO2dCQUN2QyxTQUFTLEVBQUUsS0FBSzthQUNuQixDQUFDO1FBQ0wsQ0FBQztRQUVELE1BQU0sQ0FBQyxTQUFTLENBQUM7SUFDckIsQ0FBQztJQUVPLDRDQUFtQixHQUEzQixVQUE0QixRQUFzQixFQUFFLEtBQWdCLEVBQUUsTUFBc0I7UUFBdEIsdUJBQUEsRUFBQSxhQUFzQjtRQUN4RixJQUFJLFFBQVEsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO1FBQzlCLElBQUksUUFBUSxHQUFzQixFQUFFLENBQUM7UUFFckMsdUNBQXVDO1FBQ3ZDLElBQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEUsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsVUFBQyxJQUFJLEVBQUUsS0FBSztZQUM5QixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUNwQixRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztRQUM1QyxDQUFDLENBQUMsQ0FBQztRQUNILFFBQVEsQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDO1FBRTFCLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDVCxJQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxVQUFDLElBQUksRUFBRSxNQUFNLElBQUssT0FBQSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBakIsQ0FBaUIsQ0FBQyxDQUFDO1lBQ3hFLElBQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLFVBQUMsSUFBSSxFQUFFLE1BQU0sSUFBSyxPQUFBLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFqQixDQUFpQixDQUFDLENBQUM7WUFFdEUsSUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsVUFBQyxPQUFPLEVBQUUsTUFBTTtnQkFDL0MsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztnQkFDcEMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDakQsQ0FBQyxDQUFDLENBQUM7WUFFSCxHQUFHLENBQUMsQ0FBMEIsVUFBZ0YsRUFBaEYsTUFBQyxDQUFDLEtBQUssRUFBRSw2QkFBYSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsK0JBQWUsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLCtCQUFlLENBQUMsQ0FBQyxFQUFoRixjQUFnRixFQUFoRixJQUFnRjtnQkFBbkcsSUFBQSxXQUFlLEVBQWQsZUFBTyxFQUFFLFlBQUk7Z0JBQ3JCLEdBQUcsQ0FBQyxDQUFhLFVBQU8sRUFBUCxtQkFBTyxFQUFQLHFCQUFPLEVBQVAsSUFBTztvQkFBbkIsSUFBSSxJQUFJLGdCQUFBO29CQUNULElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDO3dCQUNsQixHQUFHLEVBQVcsSUFBSTt3QkFDbEIsUUFBUSxFQUFFLFFBQVEsQ0FBQyxVQUFVO3dCQUM3QixXQUFXLEVBQUUsS0FBSyxDQUFDLFVBQVU7d0JBQzdCLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTTt3QkFDbEIsSUFBSSxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7cUJBQzVDLENBQUMsQ0FBQztpQkFDTjthQUNKO1FBQ0wsQ0FBQztRQUVELE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxVQUFDLElBQUksSUFBSyxPQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxFQUF0QixDQUFzQixDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUVPLDZDQUFvQixHQUE1QixVQUFnQyxLQUFnQjtRQUM1QyxHQUFHLENBQUMsQ0FBaUIsVUFBZSxFQUFmLEtBQUEsS0FBSyxDQUFDLFNBQVMsRUFBZixjQUFlLEVBQWYsSUFBZTtZQUEvQixJQUFJLFFBQVEsU0FBQTtZQUNiLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDN0M7SUFDTCxDQUFDO0lBRUQsOEJBQThCO0lBRTlCOztPQUVHO0lBQ0ksOEJBQUssR0FBWjtRQUNJLElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO0lBQzdCLENBQUM7SUFFRDs7T0FFRztJQUNJLHVDQUFjLEdBQXJCLFVBQXlCLFFBQWdCLEVBQ2hCLFVBQXlCLEVBQ3pCLGNBQStEO1FBRC9ELDJCQUFBLEVBQUEsaUJBQXlCO1FBQ3pCLCtCQUFBLEVBQUEsMkJBQXlDLEtBQUssRUFBRSxLQUFLLElBQUssT0FBQSxLQUFLLEVBQUwsQ0FBSztRQUNwRixJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxHQUFHO1lBQ3hCLFVBQVUsRUFBRSxVQUFVO1lBQ3RCLEtBQUssRUFBRSxFQUFFO1lBQ1QsU0FBUyxFQUFFLEVBQUU7WUFDYixjQUFjLEVBQUUsY0FBYztZQUM5QixTQUFTLEVBQUUsS0FBSztTQUNuQixDQUFDO0lBQ04sQ0FBQztJQUVEOztPQUVHO0lBQ0ksZ0RBQXVCLEdBQTlCLFVBQStCLFFBQWdCO1FBQzNDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEdBQUc7WUFDeEIsVUFBVSxFQUFFLElBQUk7WUFDaEIsS0FBSyxFQUFFLEVBQUU7WUFDVCxTQUFTLEVBQUUsRUFBRTtZQUNiLGNBQWMsRUFBRSxJQUFJO1lBQ3BCLFNBQVMsRUFBRSxJQUFJO1NBQ2xCLENBQUM7SUFDTixDQUFDO0lBRUQ7O09BRUc7SUFDSSxnQ0FBTyxHQUFkLFVBQWtCLFFBQWdCLEVBQUUsSUFBTztRQUN2QyxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDOUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBRXBDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBRUQ7O09BRUc7SUFDSSxpQ0FBUSxHQUFmLFVBQW1CLFFBQWdCLEVBQUUsS0FBVTtRQUMzQyxJQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdEQsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRXhFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBRUQ7O09BRUc7SUFDSSxtQ0FBVSxHQUFqQixVQUFxQixRQUFnQixFQUFFLElBQU87UUFDMUMsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlDLElBQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEtBQUssWUFBRyxHQUFDLEtBQUssQ0FBQyxVQUFVLElBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBRSxDQUFDO1FBQ3JGLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBRTFCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQzs7SUFDckMsQ0FBQztJQUVEOztPQUVHO0lBQ0ksbUNBQVUsR0FBakIsVUFBa0IsUUFBZ0IsRUFBRSxNQUF1QjtRQUN2RCxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDOUMsSUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxZQUFHLEdBQUMsS0FBSyxDQUFDLFVBQVUsSUFBRyxNQUFNLE1BQUUsQ0FBQztRQUNyRSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFN0IsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDOztJQUNyQyxDQUFDO0lBRUQ7O09BRUc7SUFDSSxnQ0FBTyxHQUFkLFVBQWtCLElBQXFCLEVBQUUsT0FBOEI7UUFDbkUsSUFBSSxDQUFDLDJCQUEyQixDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVEOztPQUVHO0lBQ0ksaUNBQVEsR0FBZixVQUFtQixJQUFxQixFQUFFLE9BQThCO1FBQ3BFLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFFRDs7T0FFRztJQUNJLGdDQUFPLEdBQWQsVUFBa0IsSUFBcUIsRUFBRSxPQUE4QjtRQUNuRSxJQUFJLENBQUMsMkJBQTJCLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRUQ7O09BRUc7SUFDSSxrQ0FBUyxHQUFoQixVQUFvQixJQUFxQixFQUFFLE9BQThCO1FBQ3JFLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQzdELENBQUM7SUFFRDs7T0FFRztJQUNJLG1DQUFVLEdBQWpCLFVBQXFCLElBQXFCLEVBQUUsT0FBOEI7UUFDdEUsSUFBSSxDQUFDLDJCQUEyQixDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDOUQsQ0FBQztJQUNMLHFCQUFDO0FBQUQsQ0F4VkEsQUF3VkMsSUFBQTtBQXhWWSx3Q0FBYztBQTJWM0I7O0dBRUc7QUFDSDtJQUFBO0lBc0ZBLENBQUM7SUFuRkc7O09BRUc7SUFDSSw0QkFBSyxHQUFaO1FBQ0ksSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRUQ7O09BRUc7SUFDSSxxQ0FBYyxHQUFyQixVQUF5QixRQUFnQixFQUFFLFVBQW1CLEVBQUUsS0FBNkI7UUFDekYsSUFBSSxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNoRSxDQUFDO0lBRUQ7O09BRUc7SUFDSSw4Q0FBdUIsR0FBOUIsVUFBK0IsUUFBZ0I7UUFDM0MsSUFBSSxDQUFDLFVBQVUsQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQ7O09BRUc7SUFDSSw4QkFBTyxHQUFkLFVBQWtCLFFBQWdCLEVBQUUsSUFBTztRQUN2QyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVEOztPQUVHO0lBQ0ksK0JBQVEsR0FBZixVQUFtQixRQUFnQixFQUFFLEtBQVU7UUFDM0MsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzlDLENBQUM7SUFFRDs7T0FFRztJQUNJLGlDQUFVLEdBQWpCLFVBQXFCLFFBQWdCLEVBQUUsSUFBTztRQUMxQyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVEOztPQUVHO0lBQ0ksaUNBQVUsR0FBakIsVUFBa0IsUUFBZ0IsRUFBRSxNQUF1QjtRQUN2RCxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVEOztPQUVHO0lBQ0ksOEJBQU8sR0FBZCxVQUFrQixJQUFxQixFQUFFLE9BQThCO1FBQ25FLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRUQ7O09BRUc7SUFDSSwrQkFBUSxHQUFmLFVBQW1CLElBQXFCLEVBQUUsT0FBOEI7UUFDcEUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFRDs7T0FFRztJQUNJLDhCQUFPLEdBQWQsVUFBa0IsSUFBcUIsRUFBRSxPQUE4QjtRQUNuRSxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVEOztPQUVHO0lBQ0ksZ0NBQVMsR0FBaEIsVUFBb0IsSUFBcUIsRUFBRSxPQUE4QjtRQUNyRSxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUVEOztPQUVHO0lBQ0ksaUNBQVUsR0FBakIsVUFBcUIsSUFBcUIsRUFBRSxPQUE4QjtRQUN0RSxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUNMLG1CQUFDO0FBQUQsQ0F0RkEsQUFzRkMsSUFBQTtBQXRGWSxvQ0FBWTtBQStGZCxRQUFBLFdBQVcsR0FBOEIsY0FBTyxDQUFDLENBQUMsa0JBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO0FBRXhGO0lBQTZCLDJCQUFXO0lBQ3BDO2VBQ0ksa0JBQU0sSUFBSSxjQUFjLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDO0lBQzNDLENBQUM7SUFDTCxjQUFDO0FBQUQsQ0FKQSxBQUlDLENBSjRCLG1CQUFXLEdBSXZDO0FBSlksMEJBQU87QUFNcEI7O0dBRUc7QUFDSCx1QkFBaUMsS0FBVSxFQUFFLEtBQVU7SUFDbkQsSUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUM7SUFDL0IsSUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUM7SUFDakMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEtBQUssR0FBRyxDQUFDLEdBQUcsTUFBTSxHQUFHLEtBQUssR0FBRyxTQUFTLENBQUMsQ0FBQztBQUN2RSxDQUFDO0FBSkQsc0NBSUM7QUFFRDs7R0FFRztBQUNILHVCQUFpQyxLQUFZLEVBQUUsS0FBVTtJQUNyRCxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUM7UUFBQyxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ2xDLElBQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBRTNDLElBQU0sa0JBQWtCLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsVUFBQyxNQUFNLElBQUssT0FBQSxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxHQUFHLE1BQU0sR0FBRyxLQUFLLEVBQWxDLENBQWtDLENBQUMsQ0FBQztJQUMzRixJQUFNLGVBQWUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxVQUFDLE1BQU0sSUFBSyxPQUFBLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLEVBQTdDLENBQTZDLENBQUMsQ0FBQztJQUNuRyxNQUFNLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsZUFBZSxFQUFFLGtCQUFrQixDQUFDLENBQUM7QUFDckUsQ0FBQztBQVBELHNDQU9DIiwiZmlsZSI6ImFwaS9tb2NrLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgUnggZnJvbSAncngnO1xuXG5pbXBvcnQge0Nvbm5lY3Rpb24sIE1lc3NhZ2V9IGZyb20gJy4vY29ubmVjdGlvbic7XG5pbXBvcnQge1F1ZXJ5T2JzZXJ2ZXJNYW5hZ2VyLCBNRVNTQUdFX0FEREVELCBNRVNTQUdFX0NIQU5HRUQsIE1FU1NBR0VfUkVNT1ZFRH0gZnJvbSAnLi9xdWVyeW9ic2VydmVyJztcbmltcG9ydCB7R2VuRXJyb3J9IGZyb20gJy4uL2NvcmUvZXJyb3JzL2Vycm9yJztcbmltcG9ydCB7QVBJRXJyb3J9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7UXVlcnl9IGZyb20gJy4vdHlwZXMvcmVzdCc7XG5pbXBvcnQge1Jlc29sd2VBcGl9IGZyb20gJy4vaW5kZXgnO1xuaW1wb3J0IHtjb21wb3NlfSBmcm9tICcuLi9jb3JlL3V0aWxzL2xhbmcnO1xuaW1wb3J0ICogYXMgcmFuZG9tIGZyb20gJy4uL2NvcmUvdXRpbHMvcmFuZG9tJztcblxuLyoqXG4gKiBNb2NrIHJlcXVlc3QgaGFuZGxlciBmdW5jdGlvbi4gSXQgcmVjZWl2ZXMgYW55IHF1ZXJ5IGFyZ3VtZW50cyBhbmQgZGF0YSB0aGF0XG4gKiB3YXMgdXNlZCB0byBtYWtlIHRoZSByZXF1ZXN0LiBJZiBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB3YXMgdXNlZCB0byBkZWZpbmUgdGhlXG4gKiBwYXRoIG1hdGNoLCB0aGUgcmVzdWx0IG9mIHBlcmZvcm1pbmcgYFJlZ0V4cC5leGVjYCBpcyBhbHNvIGdpdmVuIGFzIGFuIGFyZ3VtZW50XG4gKiBhbmQgY2FuIGJlIHVzZWQgdG8gZXh0cmFjdCByZWdleHAgbWF0Y2hlcy5cbiAqXG4gKiBAcGFyYW0gcGFyYW1ldGVycyBRdWVyeSBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0gZGF0YSBSZXF1ZXN0IGRhdGFcbiAqIEBwYXJhbSBwYXRoIFJlZ3VsYXIgZXhwcmVzc2lvbiBtYXRjaGVzXG4gKiBAcmV0dXJuIFZhbHVlIHRoYXQgc2hvdWxkIGJlIHJldHVybmVkIGFzIGEgcmVzcG9uc2VcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNb2NrUmVxdWVzdEhhbmRsZXI8VD4ge1xuICAgIChwYXJhbWV0ZXJzOiBhbnksIGRhdGE6IGFueSwgcGF0aD86IFJlZ0V4cEV4ZWNBcnJheSk6IFQ7XG59XG5cbi8qKlxuICogQSBmdW5jdGlvbiwgd2hpY2ggbW9ja3MgZXZhbHVhdGlvbiBvZiBhIHF1ZXJ5LiBJdCByZWNlaXZlcyB0aGUgb3JpZ2luYWwgcXVlcnlcbiAqIG9iamVjdCBhbmQgYSBsaXN0IG9mIGl0ZW1zIGN1cnJlbnRseSBpbiB0aGUgbW9jayBkYXRhYmFzZS4gSXQgbWF5IHJldHVybiBhXG4gKiBtb2RpZmllZCBsaXN0IG9mIGl0ZW1zLCB0cmFuc2Zvcm1lZCBiYXNlZCBvbiB0aGUgcXVlcnksIG9yIHRoZSBpdGVtcyB1bmNoYW5nZWQuXG4gKlxuICogQHBhcmFtIHF1ZXJ5IFRoZSBvcmlnaW5hbCBxdWVyeSBvYmplY3RcbiAqIEBwYXJhbSBpdGVtcyBBIGxpc3Qgb2YgaXRlbXNcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNb2NrUXVlcnlFdmFsdWF0b3I8VD4ge1xuICAgIChxdWVyeTogYW55LCBpdGVtczogVFtdKTogVFtdO1xufVxuXG4vKipcbiAqIERldmVsb3Blci1mYWNpbmcgaW50ZXJmYWNlIGZvciBjb25maWd1cmluZyByZXNwb25zZXMgdGhhdCB0aGUgbW9ja2VkXG4gKiBiYWNrZW5kIHNob3VsZCByZXR1cm4uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTW9ja0Jhc2Uge1xuICAgIC8qKlxuICAgICAqIFJlc2V0cyBhbGwgcmVnaXN0ZXJlZCBtb2NrIEFQSSByZXNvdXJjZXMgYW5kIGhhbmRsZXJzLiBUaGlzIG1ldGhvZCBjYW4gYmUgdXNlZFxuICAgICAqIHRvIHJlaW5pdGlhbGl6ZSB0aGUgbW9jayBBUEkgYmV0d2VlbiB0ZXN0IGNhc2VzLlxuICAgICAqL1xuICAgIHJlc2V0KCk6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IG1vY2sgcmVzb3VyY2UgdGhhdCB3aWxsIGhhbmRsZSByZWFjdGl2ZSBxdWVyaWVzLiBBIHJlc291cmNlXG4gICAgICogbXVzdCBiZSBjcmVhdGVkIGJlZm9yZSBpdCBjYW4gYmUgdXNlZCBpbiBbW2FkZEl0ZW1dXSwgW1t1cGRhdGVJdGVtXV0gYW5kXG4gICAgICogW1tyZW1vdmVJdGVtXV0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVzb3VyY2UgTmFtZSBvZiB0aGUgcmVzb3VyY2UgKGVnLiAnY29sbGVjdGlvbicpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHByaW1hcnlLZXkgTmFtZSBvZiB0aGUgcHJvcGVydHkgdGhhdCBob2xkcyB0aGUgcHJpbWFyeSBrZXlcbiAgICAgKiBAcGFyYW0ge01vY2tRdWVyeUV2YWx1YXRvcjxUPn0gcXVlcnkgTW9jayBxdWVyeSBldmFsdWF0b3IgZnVuY3Rpb25cbiAgICAgKi9cbiAgICBjcmVhdGVSZXNvdXJjZTxUPihyZXNvdXJjZTogc3RyaW5nLCBwcmltYXJ5S2V5Pzogc3RyaW5nLCBxdWVyeT86IE1vY2tRdWVyeUV2YWx1YXRvcjxUPik6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IG1vY2sgcmVzb3VyY2UgdGhhdCB3aWxsIGJsYWNraG9sZSByZXF1ZXN0cy4gQW55IHF1ZXJpZXNcbiAgICAgKiBzdWJtaXR0ZWQgdG8gdGhpcyByZXNvdXJjZSB3aWxsIG5ldmVyIGNvbXBsZXRlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHJlc291cmNlIE5hbWUgb2YgdGhlIHJlc291cmNlIChlZy4gJ2NvbGxlY3Rpb24nKVxuICAgICAqL1xuICAgIGNyZWF0ZUJsYWNraG9sZVJlc291cmNlKHJlc291cmNlOiBzdHJpbmcpOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogQWRkcyBhbiBpdGVtIHRvIHRoZSBtb2NrIGRhdGFiYXNlIGJhY2tpbmcgdGhlIHNwZWNpZmljIHJlc291cmNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHJlc291cmNlIE5hbWUgb2YgdGhlIHJlc291cmNlXG4gICAgICogQHBhcmFtIHtUfSBpdGVtIEl0ZW0gdG8gYWRkXG4gICAgICovXG4gICAgYWRkSXRlbTxUPihyZXNvdXJjZTogc3RyaW5nLCBpdGVtOiBUKTogdm9pZDtcblxuICAgIC8qKlxuICAgICAqIEFkZHMgbXVsdGlwbGUgaXRlbXMgdG8gdGhlIG1vY2sgZGF0YWJhc2UgYmFja2luZyB0aGUgc3BlY2lmaWMgcmVzb3VyY2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVzb3VyY2UgTmFtZSBvZiB0aGUgcmVzb3VyY2VcbiAgICAgKiBAcGFyYW0ge1RbXX0gaXRlbXMgSXRlbXMgdG8gYWRkXG4gICAgICovXG4gICAgYWRkSXRlbXM8VD4ocmVzb3VyY2U6IHN0cmluZywgaXRlbXM6IFRbXSk6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIGFuIGV4aXN0aW5nIGl0ZW0gaW4gdGhlIG1vY2sgZGF0YWJhc2UgYmFja2luZyB0aGUgc3BlY2lmaWNcbiAgICAgKiByZXNvdXJjZS4gSXRlbXMgYXJlIG1hdGNoZWQgYmFzZWQgb24gdGhlIHByaW1hcnkga2V5IGNvbmZpZ3VyZWQgZm9yIHRoZVxuICAgICAqIHJlZmVyZW5jZWQgcmVzb3VyY2UgaW4gW1tjcmVhdGVSZXNvdXJjZV1dLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHJlc291cmNlIE5hbWUgb2YgdGhlIHJlc291cmNlXG4gICAgICogQHBhcmFtIHtUfSBpdGVtIEl0ZW0gdG8gdXBkYXRlXG4gICAgICovXG4gICAgdXBkYXRlSXRlbTxUPihyZXNvdXJjZTogc3RyaW5nLCBpdGVtOiBUKTogdm9pZDtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgYW4gaXRlbSBmcm9tIHRoZSBtb2NrIGRhdGFiYXNlIGJhY2tpbmcgdGhlIHNwZWNpZmljIHJlc291cmNlLlxuICAgICAqIEl0ZW1zIGFyZSBtYXRjaGVkIGJhc2VkIG9uIHRoZSBwcmltYXJ5IGtleSBjb25maWd1cmVkIGZvciB0aGUgcmVmZXJlbmNlZFxuICAgICAqIHJlc291cmNlIGluIFtbY3JlYXRlUmVzb3VyY2VdXS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXNvdXJjZSBOYW1lIG9mIHRoZSByZXNvdXJjZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gaXRlbUlkIFByaW1hcnkga2V5IHZhbHVlIG9mIHRoZSBpdGVtIHRvIHJlbW92ZVxuICAgICAqL1xuICAgIHJlbW92ZUl0ZW0ocmVzb3VyY2U6IHN0cmluZywgaXRlbUlkOiBzdHJpbmcgfCBudW1iZXIpOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXJlcyBhIG1vY2sgR0VUIHJlcXVlc3QgaGFuZGxlciBmb3IgYSBzcGVjaWZpYyBwYXRoLiBUaGUgcGF0aCBjYW5cbiAgICAgKiBlaXRoZXIgYmUgYSBzdHJpbmcgb3IgYSByZWd1bGFyIGV4cHJlc3Npb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB9IHBhdGggUGF0aCB0byByZWdpc3RlciB0aGUgaGFuZGxlciBmb3JcbiAgICAgKiBAcGFyYW0ge01vY2tSZXF1ZXN0SGFuZGxlcjxUPn0gaGFuZGxlciBSZXF1ZXN0IGhhbmRsZXJcbiAgICAgKi9cbiAgICB3aGVuR2V0PFQ+KHBhdGg6IHN0cmluZyB8IFJlZ0V4cCwgaGFuZGxlcjogTW9ja1JlcXVlc3RIYW5kbGVyPFQ+KTogdm9pZDtcblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVyZXMgYSBtb2NrIFBPU1QgcmVxdWVzdCBoYW5kbGVyIGZvciBhIHNwZWNpZmljIHBhdGguIFRoZSBwYXRoIGNhblxuICAgICAqIGVpdGhlciBiZSBhIHN0cmluZyBvciBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cH0gcGF0aCBQYXRoIHRvIHJlZ2lzdGVyIHRoZSBoYW5kbGVyIGZvclxuICAgICAqIEBwYXJhbSB7TW9ja1JlcXVlc3RIYW5kbGVyPFQ+fSBoYW5kbGVyIFJlcXVlc3QgaGFuZGxlclxuICAgICAqL1xuICAgIHdoZW5Qb3N0PFQ+KHBhdGg6IHN0cmluZyB8IFJlZ0V4cCwgaGFuZGxlcjogTW9ja1JlcXVlc3RIYW5kbGVyPFQ+KTogdm9pZDtcblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVyZXMgYSBtb2NrIFBVVCByZXF1ZXN0IGhhbmRsZXIgZm9yIGEgc3BlY2lmaWMgcGF0aC4gVGhlIHBhdGggY2FuXG4gICAgICogZWl0aGVyIGJlIGEgc3RyaW5nIG9yIGEgcmVndWxhciBleHByZXNzaW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfSBwYXRoIFBhdGggdG8gcmVnaXN0ZXIgdGhlIGhhbmRsZXIgZm9yXG4gICAgICogQHBhcmFtIHtNb2NrUmVxdWVzdEhhbmRsZXI8VD59IGhhbmRsZXIgUmVxdWVzdCBoYW5kbGVyXG4gICAgICovXG4gICAgd2hlblB1dDxUPihwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPik6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlcmVzIGEgbW9jayBQQVRDSCByZXF1ZXN0IGhhbmRsZXIgZm9yIGEgc3BlY2lmaWMgcGF0aC4gVGhlIHBhdGggY2FuXG4gICAgICogZWl0aGVyIGJlIGEgc3RyaW5nIG9yIGEgcmVndWxhciBleHByZXNzaW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfSBwYXRoIFBhdGggdG8gcmVnaXN0ZXIgdGhlIGhhbmRsZXIgZm9yXG4gICAgICogQHBhcmFtIHtNb2NrUmVxdWVzdEhhbmRsZXI8VD59IGhhbmRsZXIgUmVxdWVzdCBoYW5kbGVyXG4gICAgICovXG4gICAgd2hlblBhdGNoPFQ+KHBhdGg6IHN0cmluZyB8IFJlZ0V4cCwgaGFuZGxlcjogTW9ja1JlcXVlc3RIYW5kbGVyPFQ+KTogdm9pZDtcblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVyZXMgYSBtb2NrIERFTEVURSByZXF1ZXN0IGhhbmRsZXIgZm9yIGEgc3BlY2lmaWMgcGF0aC4gVGhlIHBhdGggY2FuXG4gICAgICogZWl0aGVyIGJlIGEgc3RyaW5nIG9yIGEgcmVndWxhciBleHByZXNzaW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfSBwYXRoIFBhdGggdG8gcmVnaXN0ZXIgdGhlIGhhbmRsZXIgZm9yXG4gICAgICogQHBhcmFtIHtNb2NrUmVxdWVzdEhhbmRsZXI8VD59IGhhbmRsZXIgUmVxdWVzdCBoYW5kbGVyXG4gICAgICovXG4gICAgd2hlbkRlbGV0ZTxUPihwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPik6IHZvaWQ7XG59XG5cbmludGVyZmFjZSBNb2NrT2JzZXJ2ZXIge1xuICAgIG9ic2VydmVySWQ6IHN0cmluZztcbiAgICBxdWVyeTogYW55O1xuICAgIGl0ZW1zOiBfLkRpY3Rpb25hcnk8YW55Pjtcbn1cblxuaW50ZXJmYWNlIE1vY2tJdGVtcyB7XG4gICAgcHJpbWFyeUtleTogc3RyaW5nO1xuICAgIG9ic2VydmVyczogTW9ja09ic2VydmVyW107XG4gICAgaXRlbXM6IGFueVtdO1xuICAgIHF1ZXJ5RXZhbHVhdG9yOiBNb2NrUXVlcnlFdmFsdWF0b3I8YW55PjtcbiAgICBibGFja2hvbGU6IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBNb2NrSXRlbVN0b3JlIHtcbiAgICBbaW5kZXg6IHN0cmluZ106IE1vY2tJdGVtcztcbn1cblxuaW50ZXJmYWNlIE1vY2tSZXNwb25zZURlc2NyaXB0b3Ige1xuICAgIHBhdGg6IHN0cmluZyB8IFJlZ0V4cDtcbiAgICBoYW5kbGVyOiBNb2NrUmVxdWVzdEhhbmRsZXI8YW55Pjtcbn1cblxuaW50ZXJmYWNlIE1vY2tSZXNwb25zZVN0b3JlIHtcbiAgICBbbWV0aG9kOiBzdHJpbmddOiBNb2NrUmVzcG9uc2VEZXNjcmlwdG9yW107XG59XG5cbmNsYXNzIE1vY2tRdWVyeU9ic2VydmVyTWFuYWdlciBleHRlbmRzIFF1ZXJ5T2JzZXJ2ZXJNYW5hZ2VyIHtcbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyByZW1vdmUob2JzZXJ2ZXJJZDogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuX2RlbGV0ZU9ic2VydmVyKG9ic2VydmVySWQpO1xuICAgICAgICAvLyBDYWxsIHRoZSB1bnN1YnNjcmliZSBtZXRob2QgaW1tZWRpYXRlbHkgZHVyaW5nIHRlc3RzLiBUaGUgYWN0dWFsIHF1ZXJ5XG4gICAgICAgIC8vIG9ic2VydmVyIG1hbmFnZXIgd2lsbCBkZWZlciB0aGVzZSBjYWxscyBpbnN0ZWFkLlxuICAgICAgICB0aGlzLl91bnN1YnNjcmliZShvYnNlcnZlcklkKS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgLy8gU3Vic2NyaWJlIHRvIHByb2Nlc3MgdGhlIChtb2NrKSByZXF1ZXN0LlxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBjaGFpbkFmdGVyVW5zdWJzY3JpYmU8VD4obWFrZU9ic2VydmFibGU6ICgpID0+IFJ4Lk9ic2VydmFibGU8VD4pOiBSeC5PYnNlcnZhYmxlPFQ+IHtcbiAgICAgICAgLy8gRG8gbm90IGRlZmVyIG1ha2VPYnNlcnZhYmxlIGR1cmluZyB0ZXN0cy5cbiAgICAgICAgcmV0dXJuIG1ha2VPYnNlcnZhYmxlKCk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgTW9ja0Nvbm5lY3Rpb24gaW1wbGVtZW50cyBDb25uZWN0aW9uLCBNb2NrQmFzZSB7XG4gICAgcHJpdmF0ZSBfbW9ja0l0ZW1zOiBNb2NrSXRlbVN0b3JlID0ge307XG4gICAgcHJpdmF0ZSBfbW9ja1Jlc3BvbnNlczogTW9ja1Jlc3BvbnNlU3RvcmUgPSB7fTtcbiAgICBwcml2YXRlIF9tZXNzYWdlczogUnguU3ViamVjdDxNZXNzYWdlPjtcbiAgICBwcml2YXRlIF9pc0Nvbm5lY3RlZDogUnguQmVoYXZpb3JTdWJqZWN0PGJvb2xlYW4+O1xuICAgIHByaXZhdGUgX3F1ZXJ5T2JzZXJ2ZXJNYW5hZ2VyOiBRdWVyeU9ic2VydmVyTWFuYWdlcjtcbiAgICBwcml2YXRlIF9lcnJvcnM6IFJ4LlN1YmplY3Q8QVBJRXJyb3I+O1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuX21lc3NhZ2VzID0gbmV3IFJ4LlN1YmplY3Q8TWVzc2FnZT4oKTtcbiAgICAgICAgdGhpcy5faXNDb25uZWN0ZWQgPSBuZXcgUnguQmVoYXZpb3JTdWJqZWN0KGZhbHNlKTtcbiAgICAgICAgdGhpcy5fZXJyb3JzID0gbmV3IFJ4LlN1YmplY3Q8QVBJRXJyb3I+KCk7XG4gICAgICAgIHRoaXMuX3F1ZXJ5T2JzZXJ2ZXJNYW5hZ2VyID0gbmV3IE1vY2tRdWVyeU9ic2VydmVyTWFuYWdlcih0aGlzLCB0aGlzLl9lcnJvcnMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIGNvbm5lY3QocmVzdFVyaTogc3RyaW5nLCB3ZWJzb2NrZXRVcmk6IHN0cmluZykge1xuICAgICAgICB0aGlzLl9pc0Nvbm5lY3RlZC5vbk5leHQodHJ1ZSk7XG4gICAgICAgIHRoaXMubWVzc2FnZXMoKS5zdWJzY3JpYmUodGhpcy5fcXVlcnlPYnNlcnZlck1hbmFnZXIudXBkYXRlLmJpbmQodGhpcy5fcXVlcnlPYnNlcnZlck1hbmFnZXIpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBkaXNjb25uZWN0KCkge1xuICAgICAgICB0aGlzLl9pc0Nvbm5lY3RlZC5vbk5leHQoZmFsc2UpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIGlzQ29ubmVjdGVkKCk6IFJ4Lk9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICAgICAgICByZXR1cm4gdGhpcy5faXNDb25uZWN0ZWQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfcmVnaXN0ZXJNb2NrUmVxdWVzdEhhbmRsZXI8VD4obWV0aG9kOiBzdHJpbmcsIHBhdGg6IHN0cmluZyB8IFJlZ0V4cCwgaGFuZGxlcjogTW9ja1JlcXVlc3RIYW5kbGVyPFQ+KSB7XG4gICAgICAgIGlmICghdGhpcy5fbW9ja1Jlc3BvbnNlc1ttZXRob2RdKSB0aGlzLl9tb2NrUmVzcG9uc2VzW21ldGhvZF0gPSBbXTtcbiAgICAgICAgY29uc3QgaGFuZGxlcnMgPSB0aGlzLl9tb2NrUmVzcG9uc2VzW21ldGhvZF07XG5cbiAgICAgICAgaWYgKF8uYW55KGhhbmRsZXJzLCAoZXhpc3RpbmdIYW5kbGVyKSA9PiBleGlzdGluZ0hhbmRsZXIucGF0aCA9PT0gcGF0aCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYE1ldGhvZCAke21ldGhvZH0gZm9yIHBhdGggJHtwYXRofSBhbHJlYWR5IHJlZ2lzdGVyZWRgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhhbmRsZXJzLnB1c2goe1xuICAgICAgICAgICAgcGF0aDogcGF0aCxcbiAgICAgICAgICAgIGhhbmRsZXI6IGhhbmRsZXIsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2hhbmRsZU1vY2tSZXNwb25zZShtZXRob2Q6IHN0cmluZywgcmVzcG9uc2VQYXRoOiBzdHJpbmcsIHBhcmFtZXRlcnM6IGFueSwgZGF0YTogYW55KTogUnguT2JzZXJ2YWJsZTxhbnk+IHtcbiAgICAgICAgY29uc3QgbWF0Y2hpbmdIYW5kbGVycyA9IF8uZmlsdGVyKHRoaXMuX21vY2tSZXNwb25zZXNbbWV0aG9kXSwgKHtwYXRofSkgPT4ge1xuICAgICAgICAgICAgaWYgKHBhdGggaW5zdGFuY2VvZiBSZWdFeHApIHJldHVybiBwYXRoLnRlc3QocmVzcG9uc2VQYXRoKTtcbiAgICAgICAgICAgIHJldHVybiBwYXRoID09PSByZXNwb25zZVBhdGg7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChfLmlzRW1wdHkobWF0Y2hpbmdIYW5kbGVycykpIHtcbiAgICAgICAgICAgIHJldHVybiBSeC5PYnNlcnZhYmxlLmp1c3Qoe30pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKF8uc2l6ZShtYXRjaGluZ0hhbmRsZXJzKSA+IDEpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYE11bHRpcGxlIGhhbmRsZXJzIG1hdGNoZWQgZm9yIG1ldGhvZCAke21ldGhvZH0gb24gcGF0aCAke3Jlc3BvbnNlUGF0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRPRE86IFN1cHBvcnQgbW9ja2luZyBlcnJvcnMgYXMgd2VsbC5cbiAgICAgICAgY29uc3Qge3BhdGgsIGhhbmRsZXJ9ID0gbWF0Y2hpbmdIYW5kbGVyc1swXTtcbiAgICAgICAgaWYgKHBhdGggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgIHJldHVybiBSeC5PYnNlcnZhYmxlLmp1c3QoaGFuZGxlcihwYXJhbWV0ZXJzLCBkYXRhLCBwYXRoLmV4ZWMocmVzcG9uc2VQYXRoKSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBSeC5PYnNlcnZhYmxlLmp1c3QoaGFuZGxlcihwYXJhbWV0ZXJzLCBkYXRhKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0PFQ+KHBhdGg6IHN0cmluZywgcGFyYW1ldGVycz86IE9iamVjdCk6IFJ4Lk9ic2VydmFibGU8VD4ge1xuICAgICAgICBpZiAoIV8uc3RhcnRzV2l0aChwYXRoLCAnL2FwaS8nKSkgcmV0dXJuIHRoaXMuX2hhbmRsZU1vY2tSZXNwb25zZSgnZ2V0JywgcGF0aCwgcGFyYW1ldGVycywge30pO1xuICAgICAgICBpZiAoIV8uaGFzKHBhcmFtZXRlcnMsICdvYnNlcnZlJykpIHJldHVybiB0aGlzLl9oYW5kbGVNb2NrUmVzcG9uc2UoJ2dldCcsIHBhdGgsIHBhcmFtZXRlcnMsIHt9KTtcblxuICAgICAgICBjb25zdCBhdG9tcyA9IHBhdGguc3BsaXQoJy8nKTtcbiAgICAgICAgY29uc3QgcmVzb3VyY2UgPSBhdG9tcy5zbGljZSgyKS5qb2luKCcvJyk7XG5cbiAgICAgICAgbGV0IGl0ZW1zID0gdGhpcy5fZ2V0TW9ja0l0ZW1zRm9yKHJlc291cmNlKTtcbiAgICAgICAgaWYgKGl0ZW1zLmJsYWNraG9sZSkgcmV0dXJuIFJ4Lk9ic2VydmFibGUubmV2ZXI8VD4oKTtcblxuICAgICAgICBjb25zdCBvYnNlcnZlciA9IHtcbiAgICAgICAgICAgIG9ic2VydmVySWQ6IHJhbmRvbS5yYW5kb21VdWlkKCksXG4gICAgICAgICAgICBxdWVyeTogXy5vbWl0KHBhcmFtZXRlcnMsICdvYnNlcnZlJyksXG4gICAgICAgICAgICBpdGVtczoge30sXG4gICAgICAgIH07XG4gICAgICAgIGl0ZW1zLm9ic2VydmVycy5wdXNoKG9ic2VydmVyKTtcblxuICAgICAgICByZXR1cm4gUnguT2JzZXJ2YWJsZS5qdXN0PGFueT4oe1xuICAgICAgICAgICAgb2JzZXJ2ZXI6IG9ic2VydmVyLm9ic2VydmVySWQsXG4gICAgICAgICAgICBpdGVtczogdGhpcy5fdXBkYXRlTW9ja09ic2VydmVyKG9ic2VydmVyLCBpdGVtcywgZmFsc2UpLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBwb3N0PFQ+KHBhdGg6IHN0cmluZywgZGF0YTogT2JqZWN0LCBwYXJhbWV0ZXJzPzogT2JqZWN0KTogUnguT2JzZXJ2YWJsZTxUPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9oYW5kbGVNb2NrUmVzcG9uc2UoJ3Bvc3QnLCBwYXRoLCBwYXJhbWV0ZXJzLCBkYXRhKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBwdXQ8VD4ocGF0aDogc3RyaW5nLCBkYXRhOiBPYmplY3QsIHBhcmFtZXRlcnM/OiBPYmplY3QpOiBSeC5PYnNlcnZhYmxlPFQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2hhbmRsZU1vY2tSZXNwb25zZSgncHV0JywgcGF0aCwgcGFyYW1ldGVycywgZGF0YSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgcGF0Y2g8VD4ocGF0aDogc3RyaW5nLCBkYXRhOiBPYmplY3QsIHBhcmFtZXRlcnM/OiBPYmplY3QpOiBSeC5PYnNlcnZhYmxlPFQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2hhbmRsZU1vY2tSZXNwb25zZSgncGF0Y2gnLCBwYXRoLCBwYXJhbWV0ZXJzLCBkYXRhKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBkZWxldGU8VD4ocGF0aDogc3RyaW5nLCBkYXRhOiBPYmplY3QsIHBhcmFtZXRlcnM/OiBPYmplY3QpOiBSeC5PYnNlcnZhYmxlPFQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2hhbmRsZU1vY2tSZXNwb25zZSgnZGVsZXRlJywgcGF0aCwgcGFyYW1ldGVycywgZGF0YSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgY3JlYXRlVXJpRnJvbVBhdGgocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgY3NyZkNvb2tpZSgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gJ2Nvb2tpZSc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgbWVzc2FnZXMoKTogUnguT2JzZXJ2YWJsZTxNZXNzYWdlPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tZXNzYWdlcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBlcnJvcnMoKTogUnguT2JzZXJ2YWJsZTxBUElFcnJvcj4ge1xuICAgICAgICB0aHJvdyBuZXcgR2VuRXJyb3IoJ1Rocm93aW5nIGVycm9ycyBpbiBtb2NrZWQgY29ubmVjdGlvbiBub3Qgc3VwcG9ydGVkJyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgc2Vzc2lvbklkKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiAnc2Vzc2lvbi1pZCc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgcXVlcnlPYnNlcnZlck1hbmFnZXIoKTogUXVlcnlPYnNlcnZlck1hbmFnZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5fcXVlcnlPYnNlcnZlck1hbmFnZXI7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0TW9ja0l0ZW1zRm9yPFQ+KHJlc291cmNlOiBzdHJpbmcpOiBNb2NrSXRlbXMge1xuICAgICAgICBjb25zdCBtb2NrSXRlbXMgPSB0aGlzLl9tb2NrSXRlbXNbcmVzb3VyY2VdO1xuICAgICAgICBpZiAoIW1vY2tJdGVtcykge1xuICAgICAgICAgICAgLy8gSWYgdGhlIHJlc291cmNlIGRvZXNuJ3QgZXhpc3QsIHdlIGFsd2F5cyByZXR1cm4gYW4gZW1wdHkgcmVzb3VyY2UsIHNvIHRoYXQgdGhlXG4gICAgICAgICAgICAvLyBwcm9jZXNzaW5nIGRvZXNuJ3QgZmFpbCwgaXQganVzdCBhbHdheXMgY29udGFpbnMgbm8gaXRlbXMuXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBNb2NrIEFQSSByZXNvdXJjZSAnJHtyZXNvdXJjZX0nIHJlZmVyZW5jZWQsIGJ1dCBoYXMgbm90IGJlZW4gZGVmaW5lZC5gKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICBwcmltYXJ5S2V5OiAnaWQnLFxuICAgICAgICAgICAgICAgaXRlbXM6IFtdLFxuICAgICAgICAgICAgICAgb2JzZXJ2ZXJzOiBbXSxcbiAgICAgICAgICAgICAgIHF1ZXJ5RXZhbHVhdG9yOiAocXVlcnksIGl0ZW1zKSA9PiBpdGVtcyxcbiAgICAgICAgICAgICAgIGJsYWNraG9sZTogZmFsc2UsXG4gICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbW9ja0l0ZW1zO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3VwZGF0ZU1vY2tPYnNlcnZlcihvYnNlcnZlcjogTW9ja09ic2VydmVyLCBpdGVtczogTW9ja0l0ZW1zLCBub3RpZnk6IGJvb2xlYW4gPSB0cnVlKTogYW55W10ge1xuICAgICAgICBsZXQgb2xkSXRlbXMgPSBvYnNlcnZlci5pdGVtcztcbiAgICAgICAgbGV0IG5ld0l0ZW1zOiBfLkRpY3Rpb25hcnk8YW55PiA9IHt9O1xuXG4gICAgICAgIC8vIEV2YWx1YXRlIHF1ZXJ5IG9uIGFsbCB0aGUgbmV3IGl0ZW1zLlxuICAgICAgICBjb25zdCBuZXdJdGVtc0FycmF5ID0gaXRlbXMucXVlcnlFdmFsdWF0b3Iob2JzZXJ2ZXIucXVlcnksIGl0ZW1zLml0ZW1zKTtcbiAgICAgICAgXy5lYWNoKG5ld0l0ZW1zQXJyYXksIChpdGVtLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgaXRlbS5fb3JkZXIgPSBpbmRleDtcbiAgICAgICAgICAgIG5ld0l0ZW1zW2l0ZW1baXRlbXMucHJpbWFyeUtleV1dID0gaXRlbTtcbiAgICAgICAgfSk7XG4gICAgICAgIG9ic2VydmVyLml0ZW1zID0gbmV3SXRlbXM7XG5cbiAgICAgICAgaWYgKG5vdGlmeSkge1xuICAgICAgICAgICAgY29uc3QgcmVtb3ZlZCA9IF8uZmlsdGVyKG9sZEl0ZW1zLCAoaXRlbSwgaXRlbUlkKSA9PiAhbmV3SXRlbXNbaXRlbUlkXSk7XG4gICAgICAgICAgICBjb25zdCBhZGRlZCA9IF8uZmlsdGVyKG5ld0l0ZW1zLCAoaXRlbSwgaXRlbUlkKSA9PiAhb2xkSXRlbXNbaXRlbUlkXSk7XG5cbiAgICAgICAgICAgIGNvbnN0IGNoYW5nZWQgPSBfLmZpbHRlcihuZXdJdGVtcywgKG5ld0l0ZW0sIGl0ZW1JZCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghb2xkSXRlbXNbaXRlbUlkXSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIHJldHVybiAhXy5pc0VxdWFsKG5ld0l0ZW0sIG9sZEl0ZW1zW2l0ZW1JZF0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGZvciAoY29uc3QgW2NoYW5nZXMsIHR5cGVdIG9mIFtbYWRkZWQsIE1FU1NBR0VfQURERURdLCBbcmVtb3ZlZCwgTUVTU0FHRV9SRU1PVkVEXSwgW2NoYW5nZWQsIE1FU1NBR0VfQ0hBTkdFRF1dKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaXRlbSBvZiBjaGFuZ2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21lc3NhZ2VzLm9uTmV4dCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBtc2c6IDxzdHJpbmc+IHR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBvYnNlcnZlcjogb2JzZXJ2ZXIub2JzZXJ2ZXJJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaW1hcnlfa2V5OiBpdGVtcy5wcmltYXJ5S2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgb3JkZXI6IGl0ZW0uX29yZGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbTogXy5jbG9uZURlZXAoXy5vbWl0KGl0ZW0sICdfb3JkZXInKSksXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBfLm1hcChuZXdJdGVtc0FycmF5LCAoaXRlbSkgPT4gXy5vbWl0KGl0ZW0sICdfb3JkZXInKSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfbm90aWZ5TW9ja09ic2VydmVyczxUPihpdGVtczogTW9ja0l0ZW1zKSB7XG4gICAgICAgIGZvciAobGV0IG9ic2VydmVyIG9mIGl0ZW1zLm9ic2VydmVycykge1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlTW9ja09ic2VydmVyKG9ic2VydmVyLCBpdGVtcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBEZXZlbG9wZXItZmFjaW5nIEFQSSBiZWxvdy5cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIHJlc2V0KCk6IHZvaWQge1xuICAgICAgICB0aGlzLl9tb2NrSXRlbXMgPSB7fTtcbiAgICAgICAgdGhpcy5fbW9ja1Jlc3BvbnNlcyA9IHt9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIGNyZWF0ZVJlc291cmNlPFQ+KHJlc291cmNlOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW1hcnlLZXk6IHN0cmluZyA9ICdpZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5RXZhbHVhdG9yOiBNb2NrUXVlcnlFdmFsdWF0b3I8VD4gPSAocXVlcnksIGl0ZW1zKSA9PiBpdGVtcyk6IHZvaWQge1xuICAgICAgICB0aGlzLl9tb2NrSXRlbXNbcmVzb3VyY2VdID0ge1xuICAgICAgICAgICAgcHJpbWFyeUtleTogcHJpbWFyeUtleSxcbiAgICAgICAgICAgIGl0ZW1zOiBbXSxcbiAgICAgICAgICAgIG9ic2VydmVyczogW10sXG4gICAgICAgICAgICBxdWVyeUV2YWx1YXRvcjogcXVlcnlFdmFsdWF0b3IsXG4gICAgICAgICAgICBibGFja2hvbGU6IGZhbHNlLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIGNyZWF0ZUJsYWNraG9sZVJlc291cmNlKHJlc291cmNlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fbW9ja0l0ZW1zW3Jlc291cmNlXSA9IHtcbiAgICAgICAgICAgIHByaW1hcnlLZXk6IG51bGwsXG4gICAgICAgICAgICBpdGVtczogW10sXG4gICAgICAgICAgICBvYnNlcnZlcnM6IFtdLFxuICAgICAgICAgICAgcXVlcnlFdmFsdWF0b3I6IG51bGwsXG4gICAgICAgICAgICBibGFja2hvbGU6IHRydWUsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgYWRkSXRlbTxUPihyZXNvdXJjZTogc3RyaW5nLCBpdGVtOiBUKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5fZ2V0TW9ja0l0ZW1zRm9yKHJlc291cmNlKTtcbiAgICAgICAgaXRlbXMuaXRlbXMucHVzaChfLmNsb25lRGVlcChpdGVtKSk7XG5cbiAgICAgICAgdGhpcy5fbm90aWZ5TW9ja09ic2VydmVycyhpdGVtcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgYWRkSXRlbXM8VD4ocmVzb3VyY2U6IHN0cmluZywgaXRlbXM6IFRbXSk6IHZvaWQge1xuICAgICAgICBjb25zdCBleGlzdGluZ0l0ZW1zID0gdGhpcy5fZ2V0TW9ja0l0ZW1zRm9yKHJlc291cmNlKTtcbiAgICAgICAgZXhpc3RpbmdJdGVtcy5pdGVtcy5wdXNoLmFwcGx5KGV4aXN0aW5nSXRlbXMuaXRlbXMsIF8uY2xvbmVEZWVwKGl0ZW1zKSk7XG5cbiAgICAgICAgdGhpcy5fbm90aWZ5TW9ja09ic2VydmVycyhleGlzdGluZ0l0ZW1zKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyB1cGRhdGVJdGVtPFQ+KHJlc291cmNlOiBzdHJpbmcsIGl0ZW06IFQpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgaXRlbXMgPSB0aGlzLl9nZXRNb2NrSXRlbXNGb3IocmVzb3VyY2UpO1xuICAgICAgICBjb25zdCBpbmRleCA9IF8uZmluZEluZGV4KGl0ZW1zLml0ZW1zLCB7W2l0ZW1zLnByaW1hcnlLZXldOiBpdGVtW2l0ZW1zLnByaW1hcnlLZXldfSk7XG4gICAgICAgIGl0ZW1zLml0ZW1zW2luZGV4XSA9IGl0ZW07XG5cbiAgICAgICAgdGhpcy5fbm90aWZ5TW9ja09ic2VydmVycyhpdGVtcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgcmVtb3ZlSXRlbShyZXNvdXJjZTogc3RyaW5nLCBpdGVtSWQ6IHN0cmluZyB8IG51bWJlcik6IHZvaWQge1xuICAgICAgICBjb25zdCBpdGVtcyA9IHRoaXMuX2dldE1vY2tJdGVtc0ZvcihyZXNvdXJjZSk7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gXy5maW5kSW5kZXgoaXRlbXMuaXRlbXMsIHtbaXRlbXMucHJpbWFyeUtleV06IGl0ZW1JZH0pO1xuICAgICAgICBfLnB1bGxBdChpdGVtcy5pdGVtcywgaW5kZXgpO1xuXG4gICAgICAgIHRoaXMuX25vdGlmeU1vY2tPYnNlcnZlcnMoaXRlbXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIHdoZW5HZXQ8VD4ocGF0aDogc3RyaW5nIHwgUmVnRXhwLCBoYW5kbGVyOiBNb2NrUmVxdWVzdEhhbmRsZXI8VD4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fcmVnaXN0ZXJNb2NrUmVxdWVzdEhhbmRsZXIoJ2dldCcsIHBhdGgsIGhhbmRsZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIHdoZW5Qb3N0PFQ+KHBhdGg6IHN0cmluZyB8IFJlZ0V4cCwgaGFuZGxlcjogTW9ja1JlcXVlc3RIYW5kbGVyPFQ+KTogdm9pZCB7XG4gICAgICAgIHRoaXMuX3JlZ2lzdGVyTW9ja1JlcXVlc3RIYW5kbGVyKCdwb3N0JywgcGF0aCwgaGFuZGxlcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgd2hlblB1dDxUPihwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPik6IHZvaWQge1xuICAgICAgICB0aGlzLl9yZWdpc3Rlck1vY2tSZXF1ZXN0SGFuZGxlcigncHV0JywgcGF0aCwgaGFuZGxlcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgd2hlblBhdGNoPFQ+KHBhdGg6IHN0cmluZyB8IFJlZ0V4cCwgaGFuZGxlcjogTW9ja1JlcXVlc3RIYW5kbGVyPFQ+KTogdm9pZCB7XG4gICAgICAgIHRoaXMuX3JlZ2lzdGVyTW9ja1JlcXVlc3RIYW5kbGVyKCdwYXRjaCcsIHBhdGgsIGhhbmRsZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIHdoZW5EZWxldGU8VD4ocGF0aDogc3RyaW5nIHwgUmVnRXhwLCBoYW5kbGVyOiBNb2NrUmVxdWVzdEhhbmRsZXI8VD4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fcmVnaXN0ZXJNb2NrUmVxdWVzdEhhbmRsZXIoJ2RlbGV0ZScsIHBhdGgsIGhhbmRsZXIpO1xuICAgIH1cbn1cblxuXG4vKipcbiAqIE1vY2sgQVBJIG1peGluLCB3aGljaCBtYXkgYmUgdXNlZCBpbiB0ZXN0cyB0byBzaW11bGF0ZSB0aGUgYmFja2VuZC5cbiAqL1xuZXhwb3J0IGNsYXNzIE1vY2tBcGlNaXhpbiBpbXBsZW1lbnRzIE1vY2tCYXNlIHtcbiAgICBwdWJsaWMgY29ubmVjdGlvbjogTW9ja0Nvbm5lY3Rpb247XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyByZXNldCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uLnJlc2V0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgY3JlYXRlUmVzb3VyY2U8VD4ocmVzb3VyY2U6IHN0cmluZywgcHJpbWFyeUtleT86IHN0cmluZywgcXVlcnk/OiBNb2NrUXVlcnlFdmFsdWF0b3I8VD4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uLmNyZWF0ZVJlc291cmNlKHJlc291cmNlLCBwcmltYXJ5S2V5LCBxdWVyeSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgY3JlYXRlQmxhY2tob2xlUmVzb3VyY2UocmVzb3VyY2U6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb24uY3JlYXRlQmxhY2tob2xlUmVzb3VyY2UocmVzb3VyY2UpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIGFkZEl0ZW08VD4ocmVzb3VyY2U6IHN0cmluZywgaXRlbTogVCk6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb24uYWRkSXRlbShyZXNvdXJjZSwgaXRlbSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgYWRkSXRlbXM8VD4ocmVzb3VyY2U6IHN0cmluZywgaXRlbXM6IFRbXSk6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb24uYWRkSXRlbXMocmVzb3VyY2UsIGl0ZW1zKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyB1cGRhdGVJdGVtPFQ+KHJlc291cmNlOiBzdHJpbmcsIGl0ZW06IFQpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uLnVwZGF0ZUl0ZW0ocmVzb3VyY2UsIGl0ZW0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIHJlbW92ZUl0ZW0ocmVzb3VyY2U6IHN0cmluZywgaXRlbUlkOiBzdHJpbmcgfCBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uLnJlbW92ZUl0ZW0ocmVzb3VyY2UsIGl0ZW1JZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgd2hlbkdldDxUPihwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPik6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb24ud2hlbkdldChwYXRoLCBoYW5kbGVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyB3aGVuUG9zdDxUPihwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPik6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb24ud2hlblBvc3QocGF0aCwgaGFuZGxlcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgd2hlblB1dDxUPihwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPik6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb24ud2hlblB1dChwYXRoLCBoYW5kbGVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyB3aGVuUGF0Y2g8VD4ocGF0aDogc3RyaW5nIHwgUmVnRXhwLCBoYW5kbGVyOiBNb2NrUmVxdWVzdEhhbmRsZXI8VD4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uLndoZW5QYXRjaChwYXRoLCBoYW5kbGVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyB3aGVuRGVsZXRlPFQ+KHBhdGg6IHN0cmluZyB8IFJlZ0V4cCwgaGFuZGxlcjogTW9ja1JlcXVlc3RIYW5kbGVyPFQ+KTogdm9pZCB7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi53aGVuRGVsZXRlKHBhdGgsIGhhbmRsZXIpO1xuICAgIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBNb2NrQXBpQmFzZSBleHRlbmRzIFJlc29sd2VBcGksIE1vY2tBcGlNaXhpbiB7XG4gICAgY29ubmVjdGlvbjogTW9ja0Nvbm5lY3Rpb247XG5cbiAgICBuZXcgKC4uLmFyZ3M6IGFueVtdKTogTW9ja0FwaUJhc2U7XG4gICAgKC4uLmFyZ3M6IGFueVtdKTogdm9pZDtcbn1cblxuZXhwb3J0IGxldCBNb2NrQXBpQmFzZTogTW9ja0FwaUJhc2UgPSA8TW9ja0FwaUJhc2U+IGNvbXBvc2UoW1Jlc29sd2VBcGksIE1vY2tBcGlNaXhpbl0pO1xuXG5leHBvcnQgY2xhc3MgTW9ja0FwaSBleHRlbmRzIE1vY2tBcGlCYXNlIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIobmV3IE1vY2tDb25uZWN0aW9uKCksIG51bGwsIG51bGwpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gZm9yIHN1cHBvcnRpbmcgcGFnaW5hdGlvbiwgd2hpY2ggY2FuIGJlIHVzZWQgYXMgYSBbW01vY2tRdWVyeUV2YWx1YXRvcl1dLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFnaW5hdGVRdWVyeTxUPihxdWVyeTogYW55LCBpdGVtczogVFtdKTogVFtdIHtcbiAgICBjb25zdCBsaW1pdCA9IHF1ZXJ5LmxpbWl0IHx8IDA7XG4gICAgY29uc3Qgb2Zmc2V0ID0gcXVlcnkub2Zmc2V0IHx8IDA7XG4gICAgcmV0dXJuIGl0ZW1zLnNsaWNlKG9mZnNldCwgbGltaXQgPiAwID8gb2Zmc2V0ICsgbGltaXQgOiB1bmRlZmluZWQpO1xufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiBmb3Igc3VwcG9ydGluZyBvcmRlcmluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9yZGVyaW5nUXVlcnk8VD4ocXVlcnk6IFF1ZXJ5LCBpdGVtczogVFtdKTogVFtdIHtcbiAgICBpZiAoIXF1ZXJ5Lm9yZGVyaW5nKSByZXR1cm4gaXRlbXM7XG4gICAgY29uc3Qgb3JkZXJpbmcgPSBxdWVyeS5vcmRlcmluZy5zcGxpdCgnLCcpO1xuXG4gICAgY29uc3Qgb3JkZXJpbmdEaXJlY3Rpb25zID0gXy5tYXAob3JkZXJpbmcsIChjb2x1bW4pID0+IGNvbHVtblswXSA9PT0gJy0nID8gJ2Rlc2MnIDogJ2FzYycpO1xuICAgIGNvbnN0IG9yZGVyaW5nQ29sdW1ucyA9IF8ubWFwKG9yZGVyaW5nLCAoY29sdW1uKSA9PiBjb2x1bW5bMF0gPT09ICctJyA/IGNvbHVtbi5zdWJzdHIoMSkgOiBjb2x1bW4pO1xuICAgIHJldHVybiBfLnNvcnRCeU9yZGVyKGl0ZW1zLCBvcmRlcmluZ0NvbHVtbnMsIG9yZGVyaW5nRGlyZWN0aW9ucyk7XG59XG4iXX0=
