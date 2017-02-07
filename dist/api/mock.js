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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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LEVBQUUsVUFBQyxJQUFJLElBQUssT0FBQSxJQUFJLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxJQUFJLEVBQXhCLENBQXdCLENBQUMsQ0FBQztBQUMvRCxDQUFDO0FBSkQsOEJBSUMiLCJmaWxlIjoiYXBpL21vY2suanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCAqIGFzIFJ4IGZyb20gJ3J4JztcclxuXHJcbmltcG9ydCB7Q29ubmVjdGlvbiwgTWVzc2FnZX0gZnJvbSAnLi9jb25uZWN0aW9uJztcclxuaW1wb3J0IHtRdWVyeU9ic2VydmVyTWFuYWdlciwgTUVTU0FHRV9BRERFRCwgTUVTU0FHRV9DSEFOR0VELCBNRVNTQUdFX1JFTU9WRUR9IGZyb20gJy4vcXVlcnlvYnNlcnZlcic7XHJcbmltcG9ydCB7R2VuRXJyb3J9IGZyb20gJy4uL2NvcmUvZXJyb3JzL2Vycm9yJztcclxuaW1wb3J0IHtBUElFcnJvcn0gZnJvbSAnLi9lcnJvcnMnO1xyXG5pbXBvcnQge1F1ZXJ5LCBTYW1wbGVCYXNlLCBDb2xsZWN0aW9uQmFzZSwgRGF0YUJhc2V9IGZyb20gJy4vdHlwZXMvcmVzdCc7XHJcbmltcG9ydCB7UmVzb2x3ZUFwaX0gZnJvbSAnLi9pbmRleCc7XHJcbmltcG9ydCB7Y29tcG9zZX0gZnJvbSAnLi4vY29yZS91dGlscy9sYW5nJztcclxuaW1wb3J0ICogYXMgcmFuZG9tIGZyb20gJy4uL2NvcmUvdXRpbHMvcmFuZG9tJztcclxuXHJcbi8qKlxyXG4gKiBNb2NrIHJlcXVlc3QgaGFuZGxlciBmdW5jdGlvbi4gSXQgcmVjZWl2ZXMgYW55IHF1ZXJ5IGFyZ3VtZW50cyBhbmQgZGF0YSB0aGF0XHJcbiAqIHdhcyB1c2VkIHRvIG1ha2UgdGhlIHJlcXVlc3QuIElmIGEgcmVndWxhciBleHByZXNzaW9uIHdhcyB1c2VkIHRvIGRlZmluZSB0aGVcclxuICogcGF0aCBtYXRjaCwgdGhlIHJlc3VsdCBvZiBwZXJmb3JtaW5nIGBSZWdFeHAuZXhlY2AgaXMgYWxzbyBnaXZlbiBhcyBhbiBhcmd1bWVudFxyXG4gKiBhbmQgY2FuIGJlIHVzZWQgdG8gZXh0cmFjdCByZWdleHAgbWF0Y2hlcy5cclxuICpcclxuICogQHBhcmFtIHBhcmFtZXRlcnMgUXVlcnkgcGFyYW1ldGVyc1xyXG4gKiBAcGFyYW0gZGF0YSBSZXF1ZXN0IGRhdGFcclxuICogQHBhcmFtIHBhdGggUmVndWxhciBleHByZXNzaW9uIG1hdGNoZXNcclxuICogQHJldHVybiBWYWx1ZSB0aGF0IHNob3VsZCBiZSByZXR1cm5lZCBhcyBhIHJlc3BvbnNlXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIE1vY2tSZXF1ZXN0SGFuZGxlcjxUPiB7XHJcbiAgICAocGFyYW1ldGVyczogYW55LCBkYXRhOiBhbnksIHBhdGg/OiBSZWdFeHBFeGVjQXJyYXkpOiBUO1xyXG59XHJcblxyXG4vKipcclxuICogQSBmdW5jdGlvbiwgd2hpY2ggbW9ja3MgZXZhbHVhdGlvbiBvZiBhIHF1ZXJ5LiBJdCByZWNlaXZlcyB0aGUgb3JpZ2luYWwgcXVlcnlcclxuICogb2JqZWN0IGFuZCBhIGxpc3Qgb2YgaXRlbXMgY3VycmVudGx5IGluIHRoZSBtb2NrIGRhdGFiYXNlLiBJdCBtYXkgcmV0dXJuIGFcclxuICogbW9kaWZpZWQgbGlzdCBvZiBpdGVtcywgdHJhbnNmb3JtZWQgYmFzZWQgb24gdGhlIHF1ZXJ5LCBvciB0aGUgaXRlbXMgdW5jaGFuZ2VkLlxyXG4gKlxyXG4gKiBAcGFyYW0gcXVlcnkgVGhlIG9yaWdpbmFsIHF1ZXJ5IG9iamVjdFxyXG4gKiBAcGFyYW0gaXRlbXMgQSBsaXN0IG9mIGl0ZW1zXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIE1vY2tRdWVyeUV2YWx1YXRvcjxUPiB7XHJcbiAgICAocXVlcnk6IGFueSwgaXRlbXM6IFRbXSk6IFRbXTtcclxufVxyXG5cclxuLyoqXHJcbiAqIERldmVsb3Blci1mYWNpbmcgaW50ZXJmYWNlIGZvciBjb25maWd1cmluZyByZXNwb25zZXMgdGhhdCB0aGUgbW9ja2VkXHJcbiAqIGJhY2tlbmQgc2hvdWxkIHJldHVybi5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgTW9ja0Jhc2Uge1xyXG4gICAgLyoqXHJcbiAgICAgKiBSZXNldHMgYWxsIHJlZ2lzdGVyZWQgbW9jayBBUEkgcmVzb3VyY2VzIGFuZCBoYW5kbGVycy4gVGhpcyBtZXRob2QgY2FuIGJlIHVzZWRcclxuICAgICAqIHRvIHJlaW5pdGlhbGl6ZSB0aGUgbW9jayBBUEkgYmV0d2VlbiB0ZXN0IGNhc2VzLlxyXG4gICAgICovXHJcbiAgICByZXNldCgpOiB2b2lkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlcyBhIG5ldyBtb2NrIHJlc291cmNlIHRoYXQgd2lsbCBoYW5kbGUgcmVhY3RpdmUgcXVlcmllcy4gQSByZXNvdXJjZVxyXG4gICAgICogbXVzdCBiZSBjcmVhdGVkIGJlZm9yZSBpdCBjYW4gYmUgdXNlZCBpbiBbW2FkZEl0ZW1dXSwgW1t1cGRhdGVJdGVtXV0gYW5kXHJcbiAgICAgKiBbW3JlbW92ZUl0ZW1dXS5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVzb3VyY2UgTmFtZSBvZiB0aGUgcmVzb3VyY2UgKGVnLiAnY29sbGVjdGlvbicpXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcHJpbWFyeUtleSBOYW1lIG9mIHRoZSBwcm9wZXJ0eSB0aGF0IGhvbGRzIHRoZSBwcmltYXJ5IGtleVxyXG4gICAgICogQHBhcmFtIHtNb2NrUXVlcnlFdmFsdWF0b3I8VD59IHF1ZXJ5IE1vY2sgcXVlcnkgZXZhbHVhdG9yIGZ1bmN0aW9uXHJcbiAgICAgKi9cclxuICAgIGNyZWF0ZVJlc291cmNlPFQ+KHJlc291cmNlOiBzdHJpbmcsIHByaW1hcnlLZXk/OiBzdHJpbmcsIHF1ZXJ5PzogTW9ja1F1ZXJ5RXZhbHVhdG9yPFQ+KTogdm9pZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZXMgYSBuZXcgbW9jayByZXNvdXJjZSB0aGF0IHdpbGwgYmxhY2tob2xlIHJlcXVlc3RzLiBBbnkgcXVlcmllc1xyXG4gICAgICogc3VibWl0dGVkIHRvIHRoaXMgcmVzb3VyY2Ugd2lsbCBuZXZlciBjb21wbGV0ZS5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVzb3VyY2UgTmFtZSBvZiB0aGUgcmVzb3VyY2UgKGVnLiAnY29sbGVjdGlvbicpXHJcbiAgICAgKi9cclxuICAgIGNyZWF0ZUJsYWNraG9sZVJlc291cmNlKHJlc291cmNlOiBzdHJpbmcpOiB2b2lkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkcyBhbiBpdGVtIHRvIHRoZSBtb2NrIGRhdGFiYXNlIGJhY2tpbmcgdGhlIHNwZWNpZmljIHJlc291cmNlLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXNvdXJjZSBOYW1lIG9mIHRoZSByZXNvdXJjZVxyXG4gICAgICogQHBhcmFtIHtUfSBpdGVtIEl0ZW0gdG8gYWRkXHJcbiAgICAgKi9cclxuICAgIGFkZEl0ZW08VD4ocmVzb3VyY2U6IHN0cmluZywgaXRlbTogVCk6IHZvaWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGRzIG11bHRpcGxlIGl0ZW1zIHRvIHRoZSBtb2NrIGRhdGFiYXNlIGJhY2tpbmcgdGhlIHNwZWNpZmljIHJlc291cmNlLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXNvdXJjZSBOYW1lIG9mIHRoZSByZXNvdXJjZVxyXG4gICAgICogQHBhcmFtIHtUW119IGl0ZW1zIEl0ZW1zIHRvIGFkZFxyXG4gICAgICovXHJcbiAgICBhZGRJdGVtczxUPihyZXNvdXJjZTogc3RyaW5nLCBpdGVtczogVFtdKTogdm9pZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVwZGF0ZXMgYW4gZXhpc3RpbmcgaXRlbSBpbiB0aGUgbW9jayBkYXRhYmFzZSBiYWNraW5nIHRoZSBzcGVjaWZpY1xyXG4gICAgICogcmVzb3VyY2UuIEl0ZW1zIGFyZSBtYXRjaGVkIGJhc2VkIG9uIHRoZSBwcmltYXJ5IGtleSBjb25maWd1cmVkIGZvciB0aGVcclxuICAgICAqIHJlZmVyZW5jZWQgcmVzb3VyY2UgaW4gW1tjcmVhdGVSZXNvdXJjZV1dLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXNvdXJjZSBOYW1lIG9mIHRoZSByZXNvdXJjZVxyXG4gICAgICogQHBhcmFtIHtUfSBpdGVtIEl0ZW0gdG8gdXBkYXRlXHJcbiAgICAgKi9cclxuICAgIHVwZGF0ZUl0ZW08VD4ocmVzb3VyY2U6IHN0cmluZywgaXRlbTogVCk6IHZvaWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW1vdmVzIGFuIGl0ZW0gZnJvbSB0aGUgbW9jayBkYXRhYmFzZSBiYWNraW5nIHRoZSBzcGVjaWZpYyByZXNvdXJjZS5cclxuICAgICAqIEl0ZW1zIGFyZSBtYXRjaGVkIGJhc2VkIG9uIHRoZSBwcmltYXJ5IGtleSBjb25maWd1cmVkIGZvciB0aGUgcmVmZXJlbmNlZFxyXG4gICAgICogcmVzb3VyY2UgaW4gW1tjcmVhdGVSZXNvdXJjZV1dLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXNvdXJjZSBOYW1lIG9mIHRoZSByZXNvdXJjZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBpdGVtSWQgUHJpbWFyeSBrZXkgdmFsdWUgb2YgdGhlIGl0ZW0gdG8gcmVtb3ZlXHJcbiAgICAgKi9cclxuICAgIHJlbW92ZUl0ZW0ocmVzb3VyY2U6IHN0cmluZywgaXRlbUlkOiBzdHJpbmcgfCBudW1iZXIpOiB2b2lkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVnaXN0ZXJlcyBhIG1vY2sgR0VUIHJlcXVlc3QgaGFuZGxlciBmb3IgYSBzcGVjaWZpYyBwYXRoLiBUaGUgcGF0aCBjYW5cclxuICAgICAqIGVpdGhlciBiZSBhIHN0cmluZyBvciBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB9IHBhdGggUGF0aCB0byByZWdpc3RlciB0aGUgaGFuZGxlciBmb3JcclxuICAgICAqIEBwYXJhbSB7TW9ja1JlcXVlc3RIYW5kbGVyPFQ+fSBoYW5kbGVyIFJlcXVlc3QgaGFuZGxlclxyXG4gICAgICovXHJcbiAgICB3aGVuR2V0PFQ+KHBhdGg6IHN0cmluZyB8IFJlZ0V4cCwgaGFuZGxlcjogTW9ja1JlcXVlc3RIYW5kbGVyPFQ+KTogdm9pZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlZ2lzdGVyZXMgYSBtb2NrIFBPU1QgcmVxdWVzdCBoYW5kbGVyIGZvciBhIHNwZWNpZmljIHBhdGguIFRoZSBwYXRoIGNhblxyXG4gICAgICogZWl0aGVyIGJlIGEgc3RyaW5nIG9yIGEgcmVndWxhciBleHByZXNzaW9uLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cH0gcGF0aCBQYXRoIHRvIHJlZ2lzdGVyIHRoZSBoYW5kbGVyIGZvclxyXG4gICAgICogQHBhcmFtIHtNb2NrUmVxdWVzdEhhbmRsZXI8VD59IGhhbmRsZXIgUmVxdWVzdCBoYW5kbGVyXHJcbiAgICAgKi9cclxuICAgIHdoZW5Qb3N0PFQ+KHBhdGg6IHN0cmluZyB8IFJlZ0V4cCwgaGFuZGxlcjogTW9ja1JlcXVlc3RIYW5kbGVyPFQ+KTogdm9pZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlZ2lzdGVyZXMgYSBtb2NrIFBVVCByZXF1ZXN0IGhhbmRsZXIgZm9yIGEgc3BlY2lmaWMgcGF0aC4gVGhlIHBhdGggY2FuXHJcbiAgICAgKiBlaXRoZXIgYmUgYSBzdHJpbmcgb3IgYSByZWd1bGFyIGV4cHJlc3Npb24uXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfSBwYXRoIFBhdGggdG8gcmVnaXN0ZXIgdGhlIGhhbmRsZXIgZm9yXHJcbiAgICAgKiBAcGFyYW0ge01vY2tSZXF1ZXN0SGFuZGxlcjxUPn0gaGFuZGxlciBSZXF1ZXN0IGhhbmRsZXJcclxuICAgICAqL1xyXG4gICAgd2hlblB1dDxUPihwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPik6IHZvaWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWdpc3RlcmVzIGEgbW9jayBQQVRDSCByZXF1ZXN0IGhhbmRsZXIgZm9yIGEgc3BlY2lmaWMgcGF0aC4gVGhlIHBhdGggY2FuXHJcbiAgICAgKiBlaXRoZXIgYmUgYSBzdHJpbmcgb3IgYSByZWd1bGFyIGV4cHJlc3Npb24uXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfSBwYXRoIFBhdGggdG8gcmVnaXN0ZXIgdGhlIGhhbmRsZXIgZm9yXHJcbiAgICAgKiBAcGFyYW0ge01vY2tSZXF1ZXN0SGFuZGxlcjxUPn0gaGFuZGxlciBSZXF1ZXN0IGhhbmRsZXJcclxuICAgICAqL1xyXG4gICAgd2hlblBhdGNoPFQ+KHBhdGg6IHN0cmluZyB8IFJlZ0V4cCwgaGFuZGxlcjogTW9ja1JlcXVlc3RIYW5kbGVyPFQ+KTogdm9pZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlZ2lzdGVyZXMgYSBtb2NrIERFTEVURSByZXF1ZXN0IGhhbmRsZXIgZm9yIGEgc3BlY2lmaWMgcGF0aC4gVGhlIHBhdGggY2FuXHJcbiAgICAgKiBlaXRoZXIgYmUgYSBzdHJpbmcgb3IgYSByZWd1bGFyIGV4cHJlc3Npb24uXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfSBwYXRoIFBhdGggdG8gcmVnaXN0ZXIgdGhlIGhhbmRsZXIgZm9yXHJcbiAgICAgKiBAcGFyYW0ge01vY2tSZXF1ZXN0SGFuZGxlcjxUPn0gaGFuZGxlciBSZXF1ZXN0IGhhbmRsZXJcclxuICAgICAqL1xyXG4gICAgd2hlbkRlbGV0ZTxUPihwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPik6IHZvaWQ7XHJcbn1cclxuXHJcbmludGVyZmFjZSBNb2NrT2JzZXJ2ZXIge1xyXG4gICAgb2JzZXJ2ZXJJZDogc3RyaW5nO1xyXG4gICAgcXVlcnk6IGFueTtcclxuICAgIGl0ZW1zOiBfLkRpY3Rpb25hcnk8YW55PjtcclxufVxyXG5cclxuaW50ZXJmYWNlIE1vY2tJdGVtcyB7XHJcbiAgICBwcmltYXJ5S2V5OiBzdHJpbmc7XHJcbiAgICBvYnNlcnZlcnM6IE1vY2tPYnNlcnZlcltdO1xyXG4gICAgaXRlbXM6IGFueVtdO1xyXG4gICAgcXVlcnlFdmFsdWF0b3I6IE1vY2tRdWVyeUV2YWx1YXRvcjxhbnk+O1xyXG4gICAgYmxhY2tob2xlOiBib29sZWFuO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgTW9ja0l0ZW1TdG9yZSB7XHJcbiAgICBbaW5kZXg6IHN0cmluZ106IE1vY2tJdGVtcztcclxufVxyXG5cclxuaW50ZXJmYWNlIE1vY2tSZXNwb25zZURlc2NyaXB0b3Ige1xyXG4gICAgcGF0aDogc3RyaW5nIHwgUmVnRXhwO1xyXG4gICAgaGFuZGxlcjogTW9ja1JlcXVlc3RIYW5kbGVyPGFueT47XHJcbn1cclxuXHJcbmludGVyZmFjZSBNb2NrUmVzcG9uc2VTdG9yZSB7XHJcbiAgICBbbWV0aG9kOiBzdHJpbmddOiBNb2NrUmVzcG9uc2VEZXNjcmlwdG9yW107XHJcbn1cclxuXHJcbmNsYXNzIE1vY2tRdWVyeU9ic2VydmVyTWFuYWdlciBleHRlbmRzIFF1ZXJ5T2JzZXJ2ZXJNYW5hZ2VyIHtcclxuICAgIC8qKlxyXG4gICAgICogQGluaGVyaXRkb2NcclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlbW92ZShvYnNlcnZlcklkOiBzdHJpbmcpIHtcclxuICAgICAgICB0aGlzLl9kZWxldGVPYnNlcnZlcihvYnNlcnZlcklkKTtcclxuICAgICAgICAvLyBDYWxsIHRoZSB1bnN1YnNjcmliZSBtZXRob2QgaW1tZWRpYXRlbHkgZHVyaW5nIHRlc3RzLiBUaGUgYWN0dWFsIHF1ZXJ5XHJcbiAgICAgICAgLy8gb2JzZXJ2ZXIgbWFuYWdlciB3aWxsIGRlZmVyIHRoZXNlIGNhbGxzIGluc3RlYWQuXHJcbiAgICAgICAgdGhpcy5fdW5zdWJzY3JpYmUob2JzZXJ2ZXJJZCkuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgLy8gU3Vic2NyaWJlIHRvIHByb2Nlc3MgdGhlIChtb2NrKSByZXF1ZXN0LlxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQGluaGVyaXRkb2NcclxuICAgICAqL1xyXG4gICAgcHVibGljIGNoYWluQWZ0ZXJVbnN1YnNjcmliZTxUPihtYWtlT2JzZXJ2YWJsZTogKCkgPT4gUnguT2JzZXJ2YWJsZTxUPik6IFJ4Lk9ic2VydmFibGU8VD4ge1xyXG4gICAgICAgIC8vIERvIG5vdCBkZWZlciBtYWtlT2JzZXJ2YWJsZSBkdXJpbmcgdGVzdHMuXHJcbiAgICAgICAgcmV0dXJuIG1ha2VPYnNlcnZhYmxlKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBNb2NrQ29ubmVjdGlvbiBpbXBsZW1lbnRzIENvbm5lY3Rpb24sIE1vY2tCYXNlIHtcclxuICAgIHByaXZhdGUgX21vY2tJdGVtczogTW9ja0l0ZW1TdG9yZSA9IHt9O1xyXG4gICAgcHJpdmF0ZSBfbW9ja1Jlc3BvbnNlczogTW9ja1Jlc3BvbnNlU3RvcmUgPSB7fTtcclxuICAgIHByaXZhdGUgX21lc3NhZ2VzOiBSeC5TdWJqZWN0PE1lc3NhZ2U+O1xyXG4gICAgcHJpdmF0ZSBfaXNDb25uZWN0ZWQ6IFJ4LkJlaGF2aW9yU3ViamVjdDxib29sZWFuPjtcclxuICAgIHByaXZhdGUgX3F1ZXJ5T2JzZXJ2ZXJNYW5hZ2VyOiBRdWVyeU9ic2VydmVyTWFuYWdlcjtcclxuICAgIHByaXZhdGUgX2Vycm9yczogUnguU3ViamVjdDxBUElFcnJvcj47XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5fbWVzc2FnZXMgPSBuZXcgUnguU3ViamVjdDxNZXNzYWdlPigpO1xyXG4gICAgICAgIHRoaXMuX2lzQ29ubmVjdGVkID0gbmV3IFJ4LkJlaGF2aW9yU3ViamVjdChmYWxzZSk7XHJcbiAgICAgICAgdGhpcy5fZXJyb3JzID0gbmV3IFJ4LlN1YmplY3Q8QVBJRXJyb3I+KCk7XHJcbiAgICAgICAgdGhpcy5fcXVlcnlPYnNlcnZlck1hbmFnZXIgPSBuZXcgTW9ja1F1ZXJ5T2JzZXJ2ZXJNYW5hZ2VyKHRoaXMsIHRoaXMuX2Vycm9ycyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAaW5oZXJpdGRvY1xyXG4gICAgICovXHJcbiAgICBwdWJsaWMgY29ubmVjdChyZXN0VXJpOiBzdHJpbmcsIHdlYnNvY2tldFVyaTogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy5faXNDb25uZWN0ZWQub25OZXh0KHRydWUpO1xyXG4gICAgICAgIHRoaXMubWVzc2FnZXMoKS5zdWJzY3JpYmUodGhpcy5fcXVlcnlPYnNlcnZlck1hbmFnZXIudXBkYXRlLmJpbmQodGhpcy5fcXVlcnlPYnNlcnZlck1hbmFnZXIpKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBpbmhlcml0ZG9jXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBkaXNjb25uZWN0KCkge1xyXG4gICAgICAgIHRoaXMuX2lzQ29ubmVjdGVkLm9uTmV4dChmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAaW5oZXJpdGRvY1xyXG4gICAgICovXHJcbiAgICBwdWJsaWMgaXNDb25uZWN0ZWQoKTogUnguT2JzZXJ2YWJsZTxib29sZWFuPiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzQ29ubmVjdGVkO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3JlZ2lzdGVyTW9ja1JlcXVlc3RIYW5kbGVyPFQ+KG1ldGhvZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPikge1xyXG4gICAgICAgIGlmICghdGhpcy5fbW9ja1Jlc3BvbnNlc1ttZXRob2RdKSB0aGlzLl9tb2NrUmVzcG9uc2VzW21ldGhvZF0gPSBbXTtcclxuICAgICAgICBjb25zdCBoYW5kbGVycyA9IHRoaXMuX21vY2tSZXNwb25zZXNbbWV0aG9kXTtcclxuXHJcbiAgICAgICAgaWYgKF8uYW55KGhhbmRsZXJzLCAoZXhpc3RpbmdIYW5kbGVyKSA9PiBleGlzdGluZ0hhbmRsZXIucGF0aCA9PT0gcGF0aCkpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgTWV0aG9kICR7bWV0aG9kfSBmb3IgcGF0aCAke3BhdGh9IGFscmVhZHkgcmVnaXN0ZXJlZGApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaGFuZGxlcnMucHVzaCh7XHJcbiAgICAgICAgICAgIHBhdGg6IHBhdGgsXHJcbiAgICAgICAgICAgIGhhbmRsZXI6IGhhbmRsZXIsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfaGFuZGxlTW9ja1Jlc3BvbnNlKG1ldGhvZDogc3RyaW5nLCByZXNwb25zZVBhdGg6IHN0cmluZywgcGFyYW1ldGVyczogYW55LCBkYXRhOiBhbnkpOiBSeC5PYnNlcnZhYmxlPGFueT4ge1xyXG4gICAgICAgIGNvbnN0IG1hdGNoaW5nSGFuZGxlcnMgPSBfLmZpbHRlcih0aGlzLl9tb2NrUmVzcG9uc2VzW21ldGhvZF0sICh7cGF0aH0pID0+IHtcclxuICAgICAgICAgICAgaWYgKHBhdGggaW5zdGFuY2VvZiBSZWdFeHApIHJldHVybiBwYXRoLnRlc3QocmVzcG9uc2VQYXRoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHBhdGggPT09IHJlc3BvbnNlUGF0aDtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKF8uaXNFbXB0eShtYXRjaGluZ0hhbmRsZXJzKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gUnguT2JzZXJ2YWJsZS5qdXN0KHt9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChfLnNpemUobWF0Y2hpbmdIYW5kbGVycykgPiAxKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYE11bHRpcGxlIGhhbmRsZXJzIG1hdGNoZWQgZm9yIG1ldGhvZCAke21ldGhvZH0gb24gcGF0aCAke3Jlc3BvbnNlUGF0aH1gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFRPRE86IFN1cHBvcnQgbW9ja2luZyBlcnJvcnMgYXMgd2VsbC5cclxuICAgICAgICBjb25zdCB7cGF0aCwgaGFuZGxlcn0gPSBtYXRjaGluZ0hhbmRsZXJzWzBdO1xyXG4gICAgICAgIGlmIChwYXRoIGluc3RhbmNlb2YgUmVnRXhwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBSeC5PYnNlcnZhYmxlLmp1c3QoaGFuZGxlcihwYXJhbWV0ZXJzLCBkYXRhLCBwYXRoLmV4ZWMocmVzcG9uc2VQYXRoKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gUnguT2JzZXJ2YWJsZS5qdXN0KGhhbmRsZXIocGFyYW1ldGVycywgZGF0YSkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQGluaGVyaXRkb2NcclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldDxUPihwYXRoOiBzdHJpbmcsIHBhcmFtZXRlcnM/OiBPYmplY3QpOiBSeC5PYnNlcnZhYmxlPFQ+IHtcclxuICAgICAgICBpZiAoIV8uc3RhcnRzV2l0aChwYXRoLCAnL2FwaS8nKSkgcmV0dXJuIHRoaXMuX2hhbmRsZU1vY2tSZXNwb25zZSgnZ2V0JywgcGF0aCwgcGFyYW1ldGVycywge30pO1xyXG4gICAgICAgIGlmICghXy5oYXMocGFyYW1ldGVycywgJ29ic2VydmUnKSkgcmV0dXJuIHRoaXMuX2hhbmRsZU1vY2tSZXNwb25zZSgnZ2V0JywgcGF0aCwgcGFyYW1ldGVycywge30pO1xyXG5cclxuICAgICAgICBjb25zdCBhdG9tcyA9IHBhdGguc3BsaXQoJy8nKTtcclxuICAgICAgICBjb25zdCByZXNvdXJjZSA9IGF0b21zLnNsaWNlKDIpLmpvaW4oJy8nKTtcclxuXHJcbiAgICAgICAgbGV0IGl0ZW1zID0gdGhpcy5fZ2V0TW9ja0l0ZW1zRm9yKHJlc291cmNlKTtcclxuICAgICAgICBpZiAoaXRlbXMuYmxhY2tob2xlKSByZXR1cm4gUnguT2JzZXJ2YWJsZS5uZXZlcjxUPigpO1xyXG5cclxuICAgICAgICBjb25zdCBvYnNlcnZlciA9IHtcclxuICAgICAgICAgICAgb2JzZXJ2ZXJJZDogcmFuZG9tLnJhbmRvbVV1aWQoKSxcclxuICAgICAgICAgICAgcXVlcnk6IF8ub21pdChwYXJhbWV0ZXJzLCAnb2JzZXJ2ZScpLFxyXG4gICAgICAgICAgICBpdGVtczoge30sXHJcbiAgICAgICAgfTtcclxuICAgICAgICBpdGVtcy5vYnNlcnZlcnMucHVzaChvYnNlcnZlcik7XHJcblxyXG4gICAgICAgIHJldHVybiBSeC5PYnNlcnZhYmxlLmp1c3Q8YW55Pih7XHJcbiAgICAgICAgICAgIG9ic2VydmVyOiBvYnNlcnZlci5vYnNlcnZlcklkLFxyXG4gICAgICAgICAgICBpdGVtczogdGhpcy5fdXBkYXRlTW9ja09ic2VydmVyKG9ic2VydmVyLCBpdGVtcywgZmFsc2UpLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQGluaGVyaXRkb2NcclxuICAgICAqL1xyXG4gICAgcHVibGljIHBvc3Q8VD4ocGF0aDogc3RyaW5nLCBkYXRhOiBPYmplY3QsIHBhcmFtZXRlcnM/OiBPYmplY3QpOiBSeC5PYnNlcnZhYmxlPFQ+IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faGFuZGxlTW9ja1Jlc3BvbnNlKCdwb3N0JywgcGF0aCwgcGFyYW1ldGVycywgZGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAaW5oZXJpdGRvY1xyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcHV0PFQ+KHBhdGg6IHN0cmluZywgZGF0YTogT2JqZWN0LCBwYXJhbWV0ZXJzPzogT2JqZWN0KTogUnguT2JzZXJ2YWJsZTxUPiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2hhbmRsZU1vY2tSZXNwb25zZSgncHV0JywgcGF0aCwgcGFyYW1ldGVycywgZGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAaW5oZXJpdGRvY1xyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcGF0Y2g8VD4ocGF0aDogc3RyaW5nLCBkYXRhOiBPYmplY3QsIHBhcmFtZXRlcnM/OiBPYmplY3QpOiBSeC5PYnNlcnZhYmxlPFQ+IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faGFuZGxlTW9ja1Jlc3BvbnNlKCdwYXRjaCcsIHBhdGgsIHBhcmFtZXRlcnMsIGRhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQGluaGVyaXRkb2NcclxuICAgICAqL1xyXG4gICAgcHVibGljIGRlbGV0ZTxUPihwYXRoOiBzdHJpbmcsIGRhdGE6IE9iamVjdCwgcGFyYW1ldGVycz86IE9iamVjdCk6IFJ4Lk9ic2VydmFibGU8VD4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9oYW5kbGVNb2NrUmVzcG9uc2UoJ2RlbGV0ZScsIHBhdGgsIHBhcmFtZXRlcnMsIGRhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQGluaGVyaXRkb2NcclxuICAgICAqL1xyXG4gICAgcHVibGljIGNyZWF0ZVVyaUZyb21QYXRoKHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuIHBhdGg7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAaW5oZXJpdGRvY1xyXG4gICAgICovXHJcbiAgICBwdWJsaWMgY3NyZkNvb2tpZSgpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiAnY29va2llJztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBpbmhlcml0ZG9jXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBtZXNzYWdlcygpOiBSeC5PYnNlcnZhYmxlPE1lc3NhZ2U+IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fbWVzc2FnZXM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAaW5oZXJpdGRvY1xyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZXJyb3JzKCk6IFJ4Lk9ic2VydmFibGU8QVBJRXJyb3I+IHtcclxuICAgICAgICB0aHJvdyBuZXcgR2VuRXJyb3IoJ1Rocm93aW5nIGVycm9ycyBpbiBtb2NrZWQgY29ubmVjdGlvbiBub3Qgc3VwcG9ydGVkJyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAaW5oZXJpdGRvY1xyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc2Vzc2lvbklkKCk6IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuICdzZXNzaW9uLWlkJztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBpbmhlcml0ZG9jXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBxdWVyeU9ic2VydmVyTWFuYWdlcigpOiBRdWVyeU9ic2VydmVyTWFuYWdlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3F1ZXJ5T2JzZXJ2ZXJNYW5hZ2VyO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2dldE1vY2tJdGVtc0ZvcjxUPihyZXNvdXJjZTogc3RyaW5nKTogTW9ja0l0ZW1zIHtcclxuICAgICAgICBjb25zdCBtb2NrSXRlbXMgPSB0aGlzLl9tb2NrSXRlbXNbcmVzb3VyY2VdO1xyXG4gICAgICAgIGlmICghbW9ja0l0ZW1zKSB7XHJcbiAgICAgICAgICAgIC8vIElmIHRoZSByZXNvdXJjZSBkb2Vzbid0IGV4aXN0LCB3ZSBhbHdheXMgcmV0dXJuIGFuIGVtcHR5IHJlc291cmNlLCBzbyB0aGF0IHRoZVxyXG4gICAgICAgICAgICAvLyBwcm9jZXNzaW5nIGRvZXNuJ3QgZmFpbCwgaXQganVzdCBhbHdheXMgY29udGFpbnMgbm8gaXRlbXMuXHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYE1vY2sgQVBJIHJlc291cmNlICcke3Jlc291cmNlfScgcmVmZXJlbmNlZCwgYnV0IGhhcyBub3QgYmVlbiBkZWZpbmVkLmApO1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICBwcmltYXJ5S2V5OiAnaWQnLFxyXG4gICAgICAgICAgICAgICBpdGVtczogW10sXHJcbiAgICAgICAgICAgICAgIG9ic2VydmVyczogW10sXHJcbiAgICAgICAgICAgICAgIHF1ZXJ5RXZhbHVhdG9yOiAocXVlcnksIGl0ZW1zKSA9PiBpdGVtcyxcclxuICAgICAgICAgICAgICAgYmxhY2tob2xlOiBmYWxzZSxcclxuICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG1vY2tJdGVtcztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF91cGRhdGVNb2NrT2JzZXJ2ZXIob2JzZXJ2ZXI6IE1vY2tPYnNlcnZlciwgaXRlbXM6IE1vY2tJdGVtcywgbm90aWZ5OiBib29sZWFuID0gdHJ1ZSk6IGFueVtdIHtcclxuICAgICAgICBsZXQgb2xkSXRlbXMgPSBvYnNlcnZlci5pdGVtcztcclxuICAgICAgICBsZXQgbmV3SXRlbXM6IF8uRGljdGlvbmFyeTxhbnk+ID0ge307XHJcblxyXG4gICAgICAgIC8vIEV2YWx1YXRlIHF1ZXJ5IG9uIGFsbCB0aGUgbmV3IGl0ZW1zLlxyXG4gICAgICAgIGNvbnN0IG5ld0l0ZW1zQXJyYXkgPSBpdGVtcy5xdWVyeUV2YWx1YXRvcihvYnNlcnZlci5xdWVyeSwgaXRlbXMuaXRlbXMpO1xyXG4gICAgICAgIF8uZWFjaChuZXdJdGVtc0FycmF5LCAoaXRlbSwgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgaXRlbS5fb3JkZXIgPSBpbmRleDtcclxuICAgICAgICAgICAgbmV3SXRlbXNbaXRlbVtpdGVtcy5wcmltYXJ5S2V5XV0gPSBpdGVtO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIG9ic2VydmVyLml0ZW1zID0gbmV3SXRlbXM7XHJcblxyXG4gICAgICAgIGlmIChub3RpZnkpIHtcclxuICAgICAgICAgICAgY29uc3QgcmVtb3ZlZCA9IF8uZmlsdGVyKG9sZEl0ZW1zLCAoaXRlbSwgaXRlbUlkKSA9PiAhbmV3SXRlbXNbaXRlbUlkXSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGFkZGVkID0gXy5maWx0ZXIobmV3SXRlbXMsIChpdGVtLCBpdGVtSWQpID0+ICFvbGRJdGVtc1tpdGVtSWRdKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGNoYW5nZWQgPSBfLmZpbHRlcihuZXdJdGVtcywgKG5ld0l0ZW0sIGl0ZW1JZCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFvbGRJdGVtc1tpdGVtSWRdKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gIV8uaXNFcXVhbChuZXdJdGVtLCBvbGRJdGVtc1tpdGVtSWRdKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtjaGFuZ2VzLCB0eXBlXSBvZiBbW2FkZGVkLCBNRVNTQUdFX0FEREVEXSwgW3JlbW92ZWQsIE1FU1NBR0VfUkVNT1ZFRF0sIFtjaGFuZ2VkLCBNRVNTQUdFX0NIQU5HRURdXSkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaXRlbSBvZiBjaGFuZ2VzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWVzc2FnZXMub25OZXh0KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbXNnOiA8c3RyaW5nPiB0eXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvYnNlcnZlcjogb2JzZXJ2ZXIub2JzZXJ2ZXJJZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbWFyeV9rZXk6IGl0ZW1zLnByaW1hcnlLZXksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9yZGVyOiBpdGVtLl9vcmRlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbTogXy5jbG9uZURlZXAoXy5vbWl0KGl0ZW0sICdfb3JkZXInKSksXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBfLm1hcChuZXdJdGVtc0FycmF5LCAoaXRlbSkgPT4gXy5vbWl0KGl0ZW0sICdfb3JkZXInKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfbm90aWZ5TW9ja09ic2VydmVyczxUPihpdGVtczogTW9ja0l0ZW1zKSB7XHJcbiAgICAgICAgZm9yIChsZXQgb2JzZXJ2ZXIgb2YgaXRlbXMub2JzZXJ2ZXJzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZU1vY2tPYnNlcnZlcihvYnNlcnZlciwgaXRlbXMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBEZXZlbG9wZXItZmFjaW5nIEFQSSBiZWxvdy5cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBpbmhlcml0ZG9jXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZXNldCgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLl9tb2NrSXRlbXMgPSB7fTtcclxuICAgICAgICB0aGlzLl9tb2NrUmVzcG9uc2VzID0ge307XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAaW5oZXJpdGRvY1xyXG4gICAgICovXHJcbiAgICBwdWJsaWMgY3JlYXRlUmVzb3VyY2U8VD4ocmVzb3VyY2U6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmltYXJ5S2V5OiBzdHJpbmcgPSAnaWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5RXZhbHVhdG9yOiBNb2NrUXVlcnlFdmFsdWF0b3I8VD4gPSAocXVlcnksIGl0ZW1zKSA9PiBpdGVtcyk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuX21vY2tJdGVtc1tyZXNvdXJjZV0gPSB7XHJcbiAgICAgICAgICAgIHByaW1hcnlLZXk6IHByaW1hcnlLZXksXHJcbiAgICAgICAgICAgIGl0ZW1zOiBbXSxcclxuICAgICAgICAgICAgb2JzZXJ2ZXJzOiBbXSxcclxuICAgICAgICAgICAgcXVlcnlFdmFsdWF0b3I6IHF1ZXJ5RXZhbHVhdG9yLFxyXG4gICAgICAgICAgICBibGFja2hvbGU6IGZhbHNlLFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAaW5oZXJpdGRvY1xyXG4gICAgICovXHJcbiAgICBwdWJsaWMgY3JlYXRlQmxhY2tob2xlUmVzb3VyY2UocmVzb3VyY2U6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuX21vY2tJdGVtc1tyZXNvdXJjZV0gPSB7XHJcbiAgICAgICAgICAgIHByaW1hcnlLZXk6IG51bGwsXHJcbiAgICAgICAgICAgIGl0ZW1zOiBbXSxcclxuICAgICAgICAgICAgb2JzZXJ2ZXJzOiBbXSxcclxuICAgICAgICAgICAgcXVlcnlFdmFsdWF0b3I6IG51bGwsXHJcbiAgICAgICAgICAgIGJsYWNraG9sZTogdHJ1ZSxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQGluaGVyaXRkb2NcclxuICAgICAqL1xyXG4gICAgcHVibGljIGFkZEl0ZW08VD4ocmVzb3VyY2U6IHN0cmluZywgaXRlbTogVCk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5fZ2V0TW9ja0l0ZW1zRm9yKHJlc291cmNlKTtcclxuICAgICAgICBpdGVtcy5pdGVtcy5wdXNoKF8uY2xvbmVEZWVwKGl0ZW0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5fbm90aWZ5TW9ja09ic2VydmVycyhpdGVtcyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAaW5oZXJpdGRvY1xyXG4gICAgICovXHJcbiAgICBwdWJsaWMgYWRkSXRlbXM8VD4ocmVzb3VyY2U6IHN0cmluZywgaXRlbXM6IFRbXSk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGV4aXN0aW5nSXRlbXMgPSB0aGlzLl9nZXRNb2NrSXRlbXNGb3IocmVzb3VyY2UpO1xyXG4gICAgICAgIGV4aXN0aW5nSXRlbXMuaXRlbXMucHVzaC5hcHBseShleGlzdGluZ0l0ZW1zLml0ZW1zLCBfLmNsb25lRGVlcChpdGVtcykpO1xyXG5cclxuICAgICAgICB0aGlzLl9ub3RpZnlNb2NrT2JzZXJ2ZXJzKGV4aXN0aW5nSXRlbXMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQGluaGVyaXRkb2NcclxuICAgICAqL1xyXG4gICAgcHVibGljIHVwZGF0ZUl0ZW08VD4ocmVzb3VyY2U6IHN0cmluZywgaXRlbTogVCk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5fZ2V0TW9ja0l0ZW1zRm9yKHJlc291cmNlKTtcclxuICAgICAgICBjb25zdCBpbmRleCA9IF8uZmluZEluZGV4KGl0ZW1zLml0ZW1zLCB7W2l0ZW1zLnByaW1hcnlLZXldOiBpdGVtW2l0ZW1zLnByaW1hcnlLZXldfSk7XHJcbiAgICAgICAgaXRlbXMuaXRlbXNbaW5kZXhdID0gaXRlbTtcclxuXHJcbiAgICAgICAgdGhpcy5fbm90aWZ5TW9ja09ic2VydmVycyhpdGVtcyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAaW5oZXJpdGRvY1xyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVtb3ZlSXRlbShyZXNvdXJjZTogc3RyaW5nLCBpdGVtSWQ6IHN0cmluZyB8IG51bWJlcik6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5fZ2V0TW9ja0l0ZW1zRm9yKHJlc291cmNlKTtcclxuICAgICAgICBjb25zdCBpbmRleCA9IF8uZmluZEluZGV4KGl0ZW1zLml0ZW1zLCB7W2l0ZW1zLnByaW1hcnlLZXldOiBpdGVtSWR9KTtcclxuICAgICAgICBfLnB1bGxBdChpdGVtcy5pdGVtcywgaW5kZXgpO1xyXG5cclxuICAgICAgICB0aGlzLl9ub3RpZnlNb2NrT2JzZXJ2ZXJzKGl0ZW1zKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBpbmhlcml0ZG9jXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyB3aGVuR2V0PFQ+KHBhdGg6IHN0cmluZyB8IFJlZ0V4cCwgaGFuZGxlcjogTW9ja1JlcXVlc3RIYW5kbGVyPFQ+KTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5fcmVnaXN0ZXJNb2NrUmVxdWVzdEhhbmRsZXIoJ2dldCcsIHBhdGgsIGhhbmRsZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQGluaGVyaXRkb2NcclxuICAgICAqL1xyXG4gICAgcHVibGljIHdoZW5Qb3N0PFQ+KHBhdGg6IHN0cmluZyB8IFJlZ0V4cCwgaGFuZGxlcjogTW9ja1JlcXVlc3RIYW5kbGVyPFQ+KTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5fcmVnaXN0ZXJNb2NrUmVxdWVzdEhhbmRsZXIoJ3Bvc3QnLCBwYXRoLCBoYW5kbGVyKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBpbmhlcml0ZG9jXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyB3aGVuUHV0PFQ+KHBhdGg6IHN0cmluZyB8IFJlZ0V4cCwgaGFuZGxlcjogTW9ja1JlcXVlc3RIYW5kbGVyPFQ+KTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5fcmVnaXN0ZXJNb2NrUmVxdWVzdEhhbmRsZXIoJ3B1dCcsIHBhdGgsIGhhbmRsZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQGluaGVyaXRkb2NcclxuICAgICAqL1xyXG4gICAgcHVibGljIHdoZW5QYXRjaDxUPihwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuX3JlZ2lzdGVyTW9ja1JlcXVlc3RIYW5kbGVyKCdwYXRjaCcsIHBhdGgsIGhhbmRsZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQGluaGVyaXRkb2NcclxuICAgICAqL1xyXG4gICAgcHVibGljIHdoZW5EZWxldGU8VD4ocGF0aDogc3RyaW5nIHwgUmVnRXhwLCBoYW5kbGVyOiBNb2NrUmVxdWVzdEhhbmRsZXI8VD4pOiB2b2lkIHtcclxuICAgICAgICB0aGlzLl9yZWdpc3Rlck1vY2tSZXF1ZXN0SGFuZGxlcignZGVsZXRlJywgcGF0aCwgaGFuZGxlcik7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogTW9jayBBUEkgbWl4aW4sIHdoaWNoIG1heSBiZSB1c2VkIGluIHRlc3RzIHRvIHNpbXVsYXRlIHRoZSBiYWNrZW5kLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIE1vY2tBcGlNaXhpbiBpbXBsZW1lbnRzIE1vY2tCYXNlIHtcclxuICAgIHB1YmxpYyBjb25uZWN0aW9uOiBNb2NrQ29ubmVjdGlvbjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEBpbmhlcml0ZG9jXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZXNldCgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmNvbm5lY3Rpb24ucmVzZXQoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBpbmhlcml0ZG9jXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBjcmVhdGVSZXNvdXJjZTxUPihyZXNvdXJjZTogc3RyaW5nLCBwcmltYXJ5S2V5Pzogc3RyaW5nLCBxdWVyeT86IE1vY2tRdWVyeUV2YWx1YXRvcjxUPik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi5jcmVhdGVSZXNvdXJjZShyZXNvdXJjZSwgcHJpbWFyeUtleSwgcXVlcnkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQGluaGVyaXRkb2NcclxuICAgICAqL1xyXG4gICAgcHVibGljIGNyZWF0ZUJsYWNraG9sZVJlc291cmNlKHJlc291cmNlOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmNvbm5lY3Rpb24uY3JlYXRlQmxhY2tob2xlUmVzb3VyY2UocmVzb3VyY2UpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQGluaGVyaXRkb2NcclxuICAgICAqL1xyXG4gICAgcHVibGljIGFkZEl0ZW08VD4ocmVzb3VyY2U6IHN0cmluZywgaXRlbTogVCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi5hZGRJdGVtKHJlc291cmNlLCBpdGVtKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBpbmhlcml0ZG9jXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBhZGRJdGVtczxUPihyZXNvdXJjZTogc3RyaW5nLCBpdGVtczogVFtdKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uLmFkZEl0ZW1zKHJlc291cmNlLCBpdGVtcyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAaW5oZXJpdGRvY1xyXG4gICAgICovXHJcbiAgICBwdWJsaWMgdXBkYXRlSXRlbTxUPihyZXNvdXJjZTogc3RyaW5nLCBpdGVtOiBUKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uLnVwZGF0ZUl0ZW0ocmVzb3VyY2UsIGl0ZW0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQGluaGVyaXRkb2NcclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlbW92ZUl0ZW0ocmVzb3VyY2U6IHN0cmluZywgaXRlbUlkOiBzdHJpbmcgfCBudW1iZXIpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmNvbm5lY3Rpb24ucmVtb3ZlSXRlbShyZXNvdXJjZSwgaXRlbUlkKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBpbmhlcml0ZG9jXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyB3aGVuR2V0PFQ+KHBhdGg6IHN0cmluZyB8IFJlZ0V4cCwgaGFuZGxlcjogTW9ja1JlcXVlc3RIYW5kbGVyPFQ+KTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uLndoZW5HZXQocGF0aCwgaGFuZGxlcik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAaW5oZXJpdGRvY1xyXG4gICAgICovXHJcbiAgICBwdWJsaWMgd2hlblBvc3Q8VD4ocGF0aDogc3RyaW5nIHwgUmVnRXhwLCBoYW5kbGVyOiBNb2NrUmVxdWVzdEhhbmRsZXI8VD4pOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmNvbm5lY3Rpb24ud2hlblBvc3QocGF0aCwgaGFuZGxlcik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAaW5oZXJpdGRvY1xyXG4gICAgICovXHJcbiAgICBwdWJsaWMgd2hlblB1dDxUPihwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi53aGVuUHV0KHBhdGgsIGhhbmRsZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQGluaGVyaXRkb2NcclxuICAgICAqL1xyXG4gICAgcHVibGljIHdoZW5QYXRjaDxUPihwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi53aGVuUGF0Y2gocGF0aCwgaGFuZGxlcik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAaW5oZXJpdGRvY1xyXG4gICAgICovXHJcbiAgICBwdWJsaWMgd2hlbkRlbGV0ZTxUPihwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi53aGVuRGVsZXRlKHBhdGgsIGhhbmRsZXIpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIE1vY2tBcGlCYXNlIGV4dGVuZHMgUmVzb2x3ZUFwaSwgTW9ja0FwaU1peGluIHtcclxuICAgIGNvbm5lY3Rpb246IE1vY2tDb25uZWN0aW9uO1xyXG5cclxuICAgIG5ldyAoLi4uYXJnczogYW55W10pOiBNb2NrQXBpQmFzZTtcclxuICAgICguLi5hcmdzOiBhbnlbXSk6IHZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBsZXQgTW9ja0FwaUJhc2U6IE1vY2tBcGlCYXNlID0gPE1vY2tBcGlCYXNlPiBjb21wb3NlKFtSZXNvbHdlQXBpLCBNb2NrQXBpTWl4aW5dKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBNb2NrQXBpIGV4dGVuZHMgTW9ja0FwaUJhc2Uge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIobmV3IE1vY2tDb25uZWN0aW9uKCksIG51bGwsIG51bGwpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogSGVscGVyIGZ1bmN0aW9uIGZvciBzdXBwb3J0aW5nIHBhZ2luYXRpb24sIHdoaWNoIGNhbiBiZSB1c2VkIGFzIGEgW1tNb2NrUXVlcnlFdmFsdWF0b3JdXS5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBwYWdpbmF0ZVF1ZXJ5PFQ+KHF1ZXJ5OiBhbnksIGl0ZW1zOiBUW10pOiBUW10ge1xyXG4gICAgY29uc3QgbGltaXQgPSBxdWVyeS5saW1pdCB8fCAwO1xyXG4gICAgY29uc3Qgb2Zmc2V0ID0gcXVlcnkub2Zmc2V0IHx8IDA7XHJcbiAgICByZXR1cm4gaXRlbXMuc2xpY2Uob2Zmc2V0LCBsaW1pdCA+IDAgPyBvZmZzZXQgKyBsaW1pdCA6IHVuZGVmaW5lZCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBIZWxwZXIgZnVuY3Rpb24gZm9yIHN1cHBvcnRpbmcgb3JkZXJpbmcuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gb3JkZXJpbmdRdWVyeTxUPihxdWVyeTogUXVlcnksIGl0ZW1zOiBUW10pOiBUW10ge1xyXG4gICAgaWYgKCFxdWVyeS5vcmRlcmluZykgcmV0dXJuIGl0ZW1zO1xyXG4gICAgY29uc3Qgb3JkZXJpbmcgPSBxdWVyeS5vcmRlcmluZy5zcGxpdCgnLCcpO1xyXG5cclxuICAgIGNvbnN0IG9yZGVyaW5nRGlyZWN0aW9ucyA9IF8ubWFwKG9yZGVyaW5nLCAoY29sdW1uKSA9PiBjb2x1bW5bMF0gPT09ICctJyA/ICdkZXNjJyA6ICdhc2MnKTtcclxuICAgIGNvbnN0IG9yZGVyaW5nQ29sdW1ucyA9IF8ubWFwKG9yZGVyaW5nLCAoY29sdW1uKSA9PiBjb2x1bW5bMF0gPT09ICctJyA/IGNvbHVtbi5zdWJzdHIoMSkgOiBjb2x1bW4pO1xyXG4gICAgcmV0dXJuIF8uc29ydEJ5T3JkZXIoaXRlbXMsIG9yZGVyaW5nQ29sdW1ucywgb3JkZXJpbmdEaXJlY3Rpb25zKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEhlbHBlciBmdW5jdGlvbiBmb3Igc3VwcG9ydGluZyBmaWx0ZXJpbmcgYnkgZGVzY3JpcHRvcl9jb21wbGV0ZWQsIHdoaWNoIGNhbiBiZSB1c2VkIGFzIGEgW1tNb2NrUXVlcnlFdmFsdWF0b3JdXS5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBhbm5vdGF0ZWRRdWVyeTxUIGV4dGVuZHMgU2FtcGxlQmFzZT4ocXVlcnk6IGFueSwgaXRlbXM6IFRbXSk6IFRbXSB7XHJcbiAgICBpZiAoXy5pc1VuZGVmaW5lZChxdWVyeS5kZXNjcmlwdG9yX2NvbXBsZXRlZCkgfHwgXy5pc051bGwocXVlcnkuZGVzY3JpcHRvcl9jb21wbGV0ZWQpKSByZXR1cm4gaXRlbXM7XHJcblxyXG4gICAgcmV0dXJuIF8uZmlsdGVyKGl0ZW1zLCAoaXRlbSkgPT4gaXRlbS5kZXNjcmlwdG9yX2NvbXBsZXRlZCA9PT0gcXVlcnkuZGVzY3JpcHRvcl9jb21wbGV0ZWQpO1xyXG59XHJcblxyXG4vKipcclxuICogSGVscGVyIGZ1bmN0aW9uIGZvciBzdXBwb3J0aW5nIGZpbHRlcmluZyBieSBzbHVnLCB3aGljaCBjYW4gYmUgdXNlZCBhcyBhIFtbTW9ja1F1ZXJ5RXZhbHVhdG9yXV0uXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gc2x1Z1F1ZXJ5PFQgZXh0ZW5kcyBDb2xsZWN0aW9uQmFzZSB8IERhdGFCYXNlPihxdWVyeTogYW55LCBpdGVtczogVFtdKTogVFtdIHtcclxuICAgIGlmICghcXVlcnkuc2x1ZykgcmV0dXJuIGl0ZW1zO1xyXG5cclxuICAgIHJldHVybiBfLmZpbHRlcihpdGVtcywgKGl0ZW0pID0+IGl0ZW0uc2x1ZyA9PT0gcXVlcnkuc2x1Zyk7XHJcbn1cclxuIl19
