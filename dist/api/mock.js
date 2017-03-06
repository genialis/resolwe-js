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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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LEVBQUUsVUFBQyxJQUFJLElBQUssT0FBQSxJQUFJLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxJQUFJLEVBQXhCLENBQXdCLENBQUMsQ0FBQztBQUMvRCxDQUFDO0FBSkQsOEJBSUMiLCJmaWxlIjoiYXBpL21vY2suanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgKiBhcyBSeCBmcm9tICdyeCc7XG5cbmltcG9ydCB7Q29ubmVjdGlvbiwgTWVzc2FnZX0gZnJvbSAnLi9jb25uZWN0aW9uJztcbmltcG9ydCB7UXVlcnlPYnNlcnZlck1hbmFnZXIsIE1FU1NBR0VfQURERUQsIE1FU1NBR0VfQ0hBTkdFRCwgTUVTU0FHRV9SRU1PVkVEfSBmcm9tICcuL3F1ZXJ5b2JzZXJ2ZXInO1xuaW1wb3J0IHtHZW5FcnJvcn0gZnJvbSAnLi4vY29yZS9lcnJvcnMvZXJyb3InO1xuaW1wb3J0IHtBUElFcnJvcn0gZnJvbSAnLi9lcnJvcnMnO1xuaW1wb3J0IHtRdWVyeSwgU2FtcGxlQmFzZSwgQ29sbGVjdGlvbkJhc2UsIERhdGFCYXNlfSBmcm9tICcuL3R5cGVzL3Jlc3QnO1xuaW1wb3J0IHtSZXNvbHdlQXBpfSBmcm9tICcuL2luZGV4JztcbmltcG9ydCB7Y29tcG9zZX0gZnJvbSAnLi4vY29yZS91dGlscy9sYW5nJztcbmltcG9ydCAqIGFzIHJhbmRvbSBmcm9tICcuLi9jb3JlL3V0aWxzL3JhbmRvbSc7XG5cbi8qKlxuICogTW9jayByZXF1ZXN0IGhhbmRsZXIgZnVuY3Rpb24uIEl0IHJlY2VpdmVzIGFueSBxdWVyeSBhcmd1bWVudHMgYW5kIGRhdGEgdGhhdFxuICogd2FzIHVzZWQgdG8gbWFrZSB0aGUgcmVxdWVzdC4gSWYgYSByZWd1bGFyIGV4cHJlc3Npb24gd2FzIHVzZWQgdG8gZGVmaW5lIHRoZVxuICogcGF0aCBtYXRjaCwgdGhlIHJlc3VsdCBvZiBwZXJmb3JtaW5nIGBSZWdFeHAuZXhlY2AgaXMgYWxzbyBnaXZlbiBhcyBhbiBhcmd1bWVudFxuICogYW5kIGNhbiBiZSB1c2VkIHRvIGV4dHJhY3QgcmVnZXhwIG1hdGNoZXMuXG4gKlxuICogQHBhcmFtIHBhcmFtZXRlcnMgUXVlcnkgcGFyYW1ldGVyc1xuICogQHBhcmFtIGRhdGEgUmVxdWVzdCBkYXRhXG4gKiBAcGFyYW0gcGF0aCBSZWd1bGFyIGV4cHJlc3Npb24gbWF0Y2hlc1xuICogQHJldHVybiBWYWx1ZSB0aGF0IHNob3VsZCBiZSByZXR1cm5lZCBhcyBhIHJlc3BvbnNlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTW9ja1JlcXVlc3RIYW5kbGVyPFQ+IHtcbiAgICAocGFyYW1ldGVyczogYW55LCBkYXRhOiBhbnksIHBhdGg/OiBSZWdFeHBFeGVjQXJyYXkpOiBUO1xufVxuXG4vKipcbiAqIEEgZnVuY3Rpb24sIHdoaWNoIG1vY2tzIGV2YWx1YXRpb24gb2YgYSBxdWVyeS4gSXQgcmVjZWl2ZXMgdGhlIG9yaWdpbmFsIHF1ZXJ5XG4gKiBvYmplY3QgYW5kIGEgbGlzdCBvZiBpdGVtcyBjdXJyZW50bHkgaW4gdGhlIG1vY2sgZGF0YWJhc2UuIEl0IG1heSByZXR1cm4gYVxuICogbW9kaWZpZWQgbGlzdCBvZiBpdGVtcywgdHJhbnNmb3JtZWQgYmFzZWQgb24gdGhlIHF1ZXJ5LCBvciB0aGUgaXRlbXMgdW5jaGFuZ2VkLlxuICpcbiAqIEBwYXJhbSBxdWVyeSBUaGUgb3JpZ2luYWwgcXVlcnkgb2JqZWN0XG4gKiBAcGFyYW0gaXRlbXMgQSBsaXN0IG9mIGl0ZW1zXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTW9ja1F1ZXJ5RXZhbHVhdG9yPFQ+IHtcbiAgICAocXVlcnk6IGFueSwgaXRlbXM6IFRbXSk6IFRbXTtcbn1cblxuLyoqXG4gKiBEZXZlbG9wZXItZmFjaW5nIGludGVyZmFjZSBmb3IgY29uZmlndXJpbmcgcmVzcG9uc2VzIHRoYXQgdGhlIG1vY2tlZFxuICogYmFja2VuZCBzaG91bGQgcmV0dXJuLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIE1vY2tCYXNlIHtcbiAgICAvKipcbiAgICAgKiBSZXNldHMgYWxsIHJlZ2lzdGVyZWQgbW9jayBBUEkgcmVzb3VyY2VzIGFuZCBoYW5kbGVycy4gVGhpcyBtZXRob2QgY2FuIGJlIHVzZWRcbiAgICAgKiB0byByZWluaXRpYWxpemUgdGhlIG1vY2sgQVBJIGJldHdlZW4gdGVzdCBjYXNlcy5cbiAgICAgKi9cbiAgICByZXNldCgpOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBtb2NrIHJlc291cmNlIHRoYXQgd2lsbCBoYW5kbGUgcmVhY3RpdmUgcXVlcmllcy4gQSByZXNvdXJjZVxuICAgICAqIG11c3QgYmUgY3JlYXRlZCBiZWZvcmUgaXQgY2FuIGJlIHVzZWQgaW4gW1thZGRJdGVtXV0sIFtbdXBkYXRlSXRlbV1dIGFuZFxuICAgICAqIFtbcmVtb3ZlSXRlbV1dLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHJlc291cmNlIE5hbWUgb2YgdGhlIHJlc291cmNlIChlZy4gJ2NvbGxlY3Rpb24nKVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwcmltYXJ5S2V5IE5hbWUgb2YgdGhlIHByb3BlcnR5IHRoYXQgaG9sZHMgdGhlIHByaW1hcnkga2V5XG4gICAgICogQHBhcmFtIHtNb2NrUXVlcnlFdmFsdWF0b3I8VD59IHF1ZXJ5IE1vY2sgcXVlcnkgZXZhbHVhdG9yIGZ1bmN0aW9uXG4gICAgICovXG4gICAgY3JlYXRlUmVzb3VyY2U8VD4ocmVzb3VyY2U6IHN0cmluZywgcHJpbWFyeUtleT86IHN0cmluZywgcXVlcnk/OiBNb2NrUXVlcnlFdmFsdWF0b3I8VD4pOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBtb2NrIHJlc291cmNlIHRoYXQgd2lsbCBibGFja2hvbGUgcmVxdWVzdHMuIEFueSBxdWVyaWVzXG4gICAgICogc3VibWl0dGVkIHRvIHRoaXMgcmVzb3VyY2Ugd2lsbCBuZXZlciBjb21wbGV0ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXNvdXJjZSBOYW1lIG9mIHRoZSByZXNvdXJjZSAoZWcuICdjb2xsZWN0aW9uJylcbiAgICAgKi9cbiAgICBjcmVhdGVCbGFja2hvbGVSZXNvdXJjZShyZXNvdXJjZTogc3RyaW5nKTogdm9pZDtcblxuICAgIC8qKlxuICAgICAqIEFkZHMgYW4gaXRlbSB0byB0aGUgbW9jayBkYXRhYmFzZSBiYWNraW5nIHRoZSBzcGVjaWZpYyByZXNvdXJjZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXNvdXJjZSBOYW1lIG9mIHRoZSByZXNvdXJjZVxuICAgICAqIEBwYXJhbSB7VH0gaXRlbSBJdGVtIHRvIGFkZFxuICAgICAqL1xuICAgIGFkZEl0ZW08VD4ocmVzb3VyY2U6IHN0cmluZywgaXRlbTogVCk6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIG11bHRpcGxlIGl0ZW1zIHRvIHRoZSBtb2NrIGRhdGFiYXNlIGJhY2tpbmcgdGhlIHNwZWNpZmljIHJlc291cmNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHJlc291cmNlIE5hbWUgb2YgdGhlIHJlc291cmNlXG4gICAgICogQHBhcmFtIHtUW119IGl0ZW1zIEl0ZW1zIHRvIGFkZFxuICAgICAqL1xuICAgIGFkZEl0ZW1zPFQ+KHJlc291cmNlOiBzdHJpbmcsIGl0ZW1zOiBUW10pOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyBhbiBleGlzdGluZyBpdGVtIGluIHRoZSBtb2NrIGRhdGFiYXNlIGJhY2tpbmcgdGhlIHNwZWNpZmljXG4gICAgICogcmVzb3VyY2UuIEl0ZW1zIGFyZSBtYXRjaGVkIGJhc2VkIG9uIHRoZSBwcmltYXJ5IGtleSBjb25maWd1cmVkIGZvciB0aGVcbiAgICAgKiByZWZlcmVuY2VkIHJlc291cmNlIGluIFtbY3JlYXRlUmVzb3VyY2VdXS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZXNvdXJjZSBOYW1lIG9mIHRoZSByZXNvdXJjZVxuICAgICAqIEBwYXJhbSB7VH0gaXRlbSBJdGVtIHRvIHVwZGF0ZVxuICAgICAqL1xuICAgIHVwZGF0ZUl0ZW08VD4ocmVzb3VyY2U6IHN0cmluZywgaXRlbTogVCk6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGFuIGl0ZW0gZnJvbSB0aGUgbW9jayBkYXRhYmFzZSBiYWNraW5nIHRoZSBzcGVjaWZpYyByZXNvdXJjZS5cbiAgICAgKiBJdGVtcyBhcmUgbWF0Y2hlZCBiYXNlZCBvbiB0aGUgcHJpbWFyeSBrZXkgY29uZmlndXJlZCBmb3IgdGhlIHJlZmVyZW5jZWRcbiAgICAgKiByZXNvdXJjZSBpbiBbW2NyZWF0ZVJlc291cmNlXV0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmVzb3VyY2UgTmFtZSBvZiB0aGUgcmVzb3VyY2VcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IGl0ZW1JZCBQcmltYXJ5IGtleSB2YWx1ZSBvZiB0aGUgaXRlbSB0byByZW1vdmVcbiAgICAgKi9cbiAgICByZW1vdmVJdGVtKHJlc291cmNlOiBzdHJpbmcsIGl0ZW1JZDogc3RyaW5nIHwgbnVtYmVyKTogdm9pZDtcblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVyZXMgYSBtb2NrIEdFVCByZXF1ZXN0IGhhbmRsZXIgZm9yIGEgc3BlY2lmaWMgcGF0aC4gVGhlIHBhdGggY2FuXG4gICAgICogZWl0aGVyIGJlIGEgc3RyaW5nIG9yIGEgcmVndWxhciBleHByZXNzaW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfSBwYXRoIFBhdGggdG8gcmVnaXN0ZXIgdGhlIGhhbmRsZXIgZm9yXG4gICAgICogQHBhcmFtIHtNb2NrUmVxdWVzdEhhbmRsZXI8VD59IGhhbmRsZXIgUmVxdWVzdCBoYW5kbGVyXG4gICAgICovXG4gICAgd2hlbkdldDxUPihwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPik6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlcmVzIGEgbW9jayBQT1NUIHJlcXVlc3QgaGFuZGxlciBmb3IgYSBzcGVjaWZpYyBwYXRoLiBUaGUgcGF0aCBjYW5cbiAgICAgKiBlaXRoZXIgYmUgYSBzdHJpbmcgb3IgYSByZWd1bGFyIGV4cHJlc3Npb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB9IHBhdGggUGF0aCB0byByZWdpc3RlciB0aGUgaGFuZGxlciBmb3JcbiAgICAgKiBAcGFyYW0ge01vY2tSZXF1ZXN0SGFuZGxlcjxUPn0gaGFuZGxlciBSZXF1ZXN0IGhhbmRsZXJcbiAgICAgKi9cbiAgICB3aGVuUG9zdDxUPihwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPik6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlcmVzIGEgbW9jayBQVVQgcmVxdWVzdCBoYW5kbGVyIGZvciBhIHNwZWNpZmljIHBhdGguIFRoZSBwYXRoIGNhblxuICAgICAqIGVpdGhlciBiZSBhIHN0cmluZyBvciBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cH0gcGF0aCBQYXRoIHRvIHJlZ2lzdGVyIHRoZSBoYW5kbGVyIGZvclxuICAgICAqIEBwYXJhbSB7TW9ja1JlcXVlc3RIYW5kbGVyPFQ+fSBoYW5kbGVyIFJlcXVlc3QgaGFuZGxlclxuICAgICAqL1xuICAgIHdoZW5QdXQ8VD4ocGF0aDogc3RyaW5nIHwgUmVnRXhwLCBoYW5kbGVyOiBNb2NrUmVxdWVzdEhhbmRsZXI8VD4pOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXJlcyBhIG1vY2sgUEFUQ0ggcmVxdWVzdCBoYW5kbGVyIGZvciBhIHNwZWNpZmljIHBhdGguIFRoZSBwYXRoIGNhblxuICAgICAqIGVpdGhlciBiZSBhIHN0cmluZyBvciBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cH0gcGF0aCBQYXRoIHRvIHJlZ2lzdGVyIHRoZSBoYW5kbGVyIGZvclxuICAgICAqIEBwYXJhbSB7TW9ja1JlcXVlc3RIYW5kbGVyPFQ+fSBoYW5kbGVyIFJlcXVlc3QgaGFuZGxlclxuICAgICAqL1xuICAgIHdoZW5QYXRjaDxUPihwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPik6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlcmVzIGEgbW9jayBERUxFVEUgcmVxdWVzdCBoYW5kbGVyIGZvciBhIHNwZWNpZmljIHBhdGguIFRoZSBwYXRoIGNhblxuICAgICAqIGVpdGhlciBiZSBhIHN0cmluZyBvciBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cH0gcGF0aCBQYXRoIHRvIHJlZ2lzdGVyIHRoZSBoYW5kbGVyIGZvclxuICAgICAqIEBwYXJhbSB7TW9ja1JlcXVlc3RIYW5kbGVyPFQ+fSBoYW5kbGVyIFJlcXVlc3QgaGFuZGxlclxuICAgICAqL1xuICAgIHdoZW5EZWxldGU8VD4ocGF0aDogc3RyaW5nIHwgUmVnRXhwLCBoYW5kbGVyOiBNb2NrUmVxdWVzdEhhbmRsZXI8VD4pOiB2b2lkO1xufVxuXG5pbnRlcmZhY2UgTW9ja09ic2VydmVyIHtcbiAgICBvYnNlcnZlcklkOiBzdHJpbmc7XG4gICAgcXVlcnk6IGFueTtcbiAgICBpdGVtczogXy5EaWN0aW9uYXJ5PGFueT47XG59XG5cbmludGVyZmFjZSBNb2NrSXRlbXMge1xuICAgIHByaW1hcnlLZXk6IHN0cmluZztcbiAgICBvYnNlcnZlcnM6IE1vY2tPYnNlcnZlcltdO1xuICAgIGl0ZW1zOiBhbnlbXTtcbiAgICBxdWVyeUV2YWx1YXRvcjogTW9ja1F1ZXJ5RXZhbHVhdG9yPGFueT47XG4gICAgYmxhY2tob2xlOiBib29sZWFuO1xufVxuXG5pbnRlcmZhY2UgTW9ja0l0ZW1TdG9yZSB7XG4gICAgW2luZGV4OiBzdHJpbmddOiBNb2NrSXRlbXM7XG59XG5cbmludGVyZmFjZSBNb2NrUmVzcG9uc2VEZXNjcmlwdG9yIHtcbiAgICBwYXRoOiBzdHJpbmcgfCBSZWdFeHA7XG4gICAgaGFuZGxlcjogTW9ja1JlcXVlc3RIYW5kbGVyPGFueT47XG59XG5cbmludGVyZmFjZSBNb2NrUmVzcG9uc2VTdG9yZSB7XG4gICAgW21ldGhvZDogc3RyaW5nXTogTW9ja1Jlc3BvbnNlRGVzY3JpcHRvcltdO1xufVxuXG5jbGFzcyBNb2NrUXVlcnlPYnNlcnZlck1hbmFnZXIgZXh0ZW5kcyBRdWVyeU9ic2VydmVyTWFuYWdlciB7XG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgcmVtb3ZlKG9ic2VydmVySWQ6IHN0cmluZykge1xuICAgICAgICB0aGlzLl9kZWxldGVPYnNlcnZlcihvYnNlcnZlcklkKTtcbiAgICAgICAgLy8gQ2FsbCB0aGUgdW5zdWJzY3JpYmUgbWV0aG9kIGltbWVkaWF0ZWx5IGR1cmluZyB0ZXN0cy4gVGhlIGFjdHVhbCBxdWVyeVxuICAgICAgICAvLyBvYnNlcnZlciBtYW5hZ2VyIHdpbGwgZGVmZXIgdGhlc2UgY2FsbHMgaW5zdGVhZC5cbiAgICAgICAgdGhpcy5fdW5zdWJzY3JpYmUob2JzZXJ2ZXJJZCkuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgIC8vIFN1YnNjcmliZSB0byBwcm9jZXNzIHRoZSAobW9jaykgcmVxdWVzdC5cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgY2hhaW5BZnRlclVuc3Vic2NyaWJlPFQ+KG1ha2VPYnNlcnZhYmxlOiAoKSA9PiBSeC5PYnNlcnZhYmxlPFQ+KTogUnguT2JzZXJ2YWJsZTxUPiB7XG4gICAgICAgIC8vIERvIG5vdCBkZWZlciBtYWtlT2JzZXJ2YWJsZSBkdXJpbmcgdGVzdHMuXG4gICAgICAgIHJldHVybiBtYWtlT2JzZXJ2YWJsZSgpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIE1vY2tDb25uZWN0aW9uIGltcGxlbWVudHMgQ29ubmVjdGlvbiwgTW9ja0Jhc2Uge1xuICAgIHByaXZhdGUgX21vY2tJdGVtczogTW9ja0l0ZW1TdG9yZSA9IHt9O1xuICAgIHByaXZhdGUgX21vY2tSZXNwb25zZXM6IE1vY2tSZXNwb25zZVN0b3JlID0ge307XG4gICAgcHJpdmF0ZSBfbWVzc2FnZXM6IFJ4LlN1YmplY3Q8TWVzc2FnZT47XG4gICAgcHJpdmF0ZSBfaXNDb25uZWN0ZWQ6IFJ4LkJlaGF2aW9yU3ViamVjdDxib29sZWFuPjtcbiAgICBwcml2YXRlIF9xdWVyeU9ic2VydmVyTWFuYWdlcjogUXVlcnlPYnNlcnZlck1hbmFnZXI7XG4gICAgcHJpdmF0ZSBfZXJyb3JzOiBSeC5TdWJqZWN0PEFQSUVycm9yPjtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLl9tZXNzYWdlcyA9IG5ldyBSeC5TdWJqZWN0PE1lc3NhZ2U+KCk7XG4gICAgICAgIHRoaXMuX2lzQ29ubmVjdGVkID0gbmV3IFJ4LkJlaGF2aW9yU3ViamVjdChmYWxzZSk7XG4gICAgICAgIHRoaXMuX2Vycm9ycyA9IG5ldyBSeC5TdWJqZWN0PEFQSUVycm9yPigpO1xuICAgICAgICB0aGlzLl9xdWVyeU9ic2VydmVyTWFuYWdlciA9IG5ldyBNb2NrUXVlcnlPYnNlcnZlck1hbmFnZXIodGhpcywgdGhpcy5fZXJyb3JzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBjb25uZWN0KHJlc3RVcmk6IHN0cmluZywgd2Vic29ja2V0VXJpOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5faXNDb25uZWN0ZWQub25OZXh0KHRydWUpO1xuICAgICAgICB0aGlzLm1lc3NhZ2VzKCkuc3Vic2NyaWJlKHRoaXMuX3F1ZXJ5T2JzZXJ2ZXJNYW5hZ2VyLnVwZGF0ZS5iaW5kKHRoaXMuX3F1ZXJ5T2JzZXJ2ZXJNYW5hZ2VyKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgZGlzY29ubmVjdCgpIHtcbiAgICAgICAgdGhpcy5faXNDb25uZWN0ZWQub25OZXh0KGZhbHNlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBpc0Nvbm5lY3RlZCgpOiBSeC5PYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzQ29ubmVjdGVkO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3JlZ2lzdGVyTW9ja1JlcXVlc3RIYW5kbGVyPFQ+KG1ldGhvZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPikge1xuICAgICAgICBpZiAoIXRoaXMuX21vY2tSZXNwb25zZXNbbWV0aG9kXSkgdGhpcy5fbW9ja1Jlc3BvbnNlc1ttZXRob2RdID0gW107XG4gICAgICAgIGNvbnN0IGhhbmRsZXJzID0gdGhpcy5fbW9ja1Jlc3BvbnNlc1ttZXRob2RdO1xuXG4gICAgICAgIGlmIChfLmFueShoYW5kbGVycywgKGV4aXN0aW5nSGFuZGxlcikgPT4gZXhpc3RpbmdIYW5kbGVyLnBhdGggPT09IHBhdGgpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBNZXRob2QgJHttZXRob2R9IGZvciBwYXRoICR7cGF0aH0gYWxyZWFkeSByZWdpc3RlcmVkYCk7XG4gICAgICAgIH1cblxuICAgICAgICBoYW5kbGVycy5wdXNoKHtcbiAgICAgICAgICAgIHBhdGg6IHBhdGgsXG4gICAgICAgICAgICBoYW5kbGVyOiBoYW5kbGVyLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9oYW5kbGVNb2NrUmVzcG9uc2UobWV0aG9kOiBzdHJpbmcsIHJlc3BvbnNlUGF0aDogc3RyaW5nLCBwYXJhbWV0ZXJzOiBhbnksIGRhdGE6IGFueSk6IFJ4Lk9ic2VydmFibGU8YW55PiB7XG4gICAgICAgIGNvbnN0IG1hdGNoaW5nSGFuZGxlcnMgPSBfLmZpbHRlcih0aGlzLl9tb2NrUmVzcG9uc2VzW21ldGhvZF0sICh7cGF0aH0pID0+IHtcbiAgICAgICAgICAgIGlmIChwYXRoIGluc3RhbmNlb2YgUmVnRXhwKSByZXR1cm4gcGF0aC50ZXN0KHJlc3BvbnNlUGF0aCk7XG4gICAgICAgICAgICByZXR1cm4gcGF0aCA9PT0gcmVzcG9uc2VQYXRoO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoXy5pc0VtcHR5KG1hdGNoaW5nSGFuZGxlcnMpKSB7XG4gICAgICAgICAgICByZXR1cm4gUnguT2JzZXJ2YWJsZS5qdXN0KHt9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChfLnNpemUobWF0Y2hpbmdIYW5kbGVycykgPiAxKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBNdWx0aXBsZSBoYW5kbGVycyBtYXRjaGVkIGZvciBtZXRob2QgJHttZXRob2R9IG9uIHBhdGggJHtyZXNwb25zZVBhdGh9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUT0RPOiBTdXBwb3J0IG1vY2tpbmcgZXJyb3JzIGFzIHdlbGwuXG4gICAgICAgIGNvbnN0IHtwYXRoLCBoYW5kbGVyfSA9IG1hdGNoaW5nSGFuZGxlcnNbMF07XG4gICAgICAgIGlmIChwYXRoIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICByZXR1cm4gUnguT2JzZXJ2YWJsZS5qdXN0KGhhbmRsZXIocGFyYW1ldGVycywgZGF0YSwgcGF0aC5leGVjKHJlc3BvbnNlUGF0aCkpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUnguT2JzZXJ2YWJsZS5qdXN0KGhhbmRsZXIocGFyYW1ldGVycywgZGF0YSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIGdldDxUPihwYXRoOiBzdHJpbmcsIHBhcmFtZXRlcnM/OiBPYmplY3QpOiBSeC5PYnNlcnZhYmxlPFQ+IHtcbiAgICAgICAgaWYgKCFfLnN0YXJ0c1dpdGgocGF0aCwgJy9hcGkvJykpIHJldHVybiB0aGlzLl9oYW5kbGVNb2NrUmVzcG9uc2UoJ2dldCcsIHBhdGgsIHBhcmFtZXRlcnMsIHt9KTtcbiAgICAgICAgaWYgKCFfLmhhcyhwYXJhbWV0ZXJzLCAnb2JzZXJ2ZScpKSByZXR1cm4gdGhpcy5faGFuZGxlTW9ja1Jlc3BvbnNlKCdnZXQnLCBwYXRoLCBwYXJhbWV0ZXJzLCB7fSk7XG5cbiAgICAgICAgY29uc3QgYXRvbXMgPSBwYXRoLnNwbGl0KCcvJyk7XG4gICAgICAgIGNvbnN0IHJlc291cmNlID0gYXRvbXMuc2xpY2UoMikuam9pbignLycpO1xuXG4gICAgICAgIGxldCBpdGVtcyA9IHRoaXMuX2dldE1vY2tJdGVtc0ZvcihyZXNvdXJjZSk7XG4gICAgICAgIGlmIChpdGVtcy5ibGFja2hvbGUpIHJldHVybiBSeC5PYnNlcnZhYmxlLm5ldmVyPFQ+KCk7XG5cbiAgICAgICAgY29uc3Qgb2JzZXJ2ZXIgPSB7XG4gICAgICAgICAgICBvYnNlcnZlcklkOiByYW5kb20ucmFuZG9tVXVpZCgpLFxuICAgICAgICAgICAgcXVlcnk6IF8ub21pdChwYXJhbWV0ZXJzLCAnb2JzZXJ2ZScpLFxuICAgICAgICAgICAgaXRlbXM6IHt9LFxuICAgICAgICB9O1xuICAgICAgICBpdGVtcy5vYnNlcnZlcnMucHVzaChvYnNlcnZlcik7XG5cbiAgICAgICAgcmV0dXJuIFJ4Lk9ic2VydmFibGUuanVzdDxhbnk+KHtcbiAgICAgICAgICAgIG9ic2VydmVyOiBvYnNlcnZlci5vYnNlcnZlcklkLFxuICAgICAgICAgICAgaXRlbXM6IHRoaXMuX3VwZGF0ZU1vY2tPYnNlcnZlcihvYnNlcnZlciwgaXRlbXMsIGZhbHNlKSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgcG9zdDxUPihwYXRoOiBzdHJpbmcsIGRhdGE6IE9iamVjdCwgcGFyYW1ldGVycz86IE9iamVjdCk6IFJ4Lk9ic2VydmFibGU8VD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5faGFuZGxlTW9ja1Jlc3BvbnNlKCdwb3N0JywgcGF0aCwgcGFyYW1ldGVycywgZGF0YSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgcHV0PFQ+KHBhdGg6IHN0cmluZywgZGF0YTogT2JqZWN0LCBwYXJhbWV0ZXJzPzogT2JqZWN0KTogUnguT2JzZXJ2YWJsZTxUPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9oYW5kbGVNb2NrUmVzcG9uc2UoJ3B1dCcsIHBhdGgsIHBhcmFtZXRlcnMsIGRhdGEpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIHBhdGNoPFQ+KHBhdGg6IHN0cmluZywgZGF0YTogT2JqZWN0LCBwYXJhbWV0ZXJzPzogT2JqZWN0KTogUnguT2JzZXJ2YWJsZTxUPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9oYW5kbGVNb2NrUmVzcG9uc2UoJ3BhdGNoJywgcGF0aCwgcGFyYW1ldGVycywgZGF0YSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgZGVsZXRlPFQ+KHBhdGg6IHN0cmluZywgZGF0YTogT2JqZWN0LCBwYXJhbWV0ZXJzPzogT2JqZWN0KTogUnguT2JzZXJ2YWJsZTxUPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9oYW5kbGVNb2NrUmVzcG9uc2UoJ2RlbGV0ZScsIHBhdGgsIHBhcmFtZXRlcnMsIGRhdGEpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIGNyZWF0ZVVyaUZyb21QYXRoKHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBwYXRoO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIGNzcmZDb29raWUoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuICdjb29raWUnO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIG1lc3NhZ2VzKCk6IFJ4Lk9ic2VydmFibGU8TWVzc2FnZT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWVzc2FnZXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgZXJyb3JzKCk6IFJ4Lk9ic2VydmFibGU8QVBJRXJyb3I+IHtcbiAgICAgICAgdGhyb3cgbmV3IEdlbkVycm9yKCdUaHJvd2luZyBlcnJvcnMgaW4gbW9ja2VkIGNvbm5lY3Rpb24gbm90IHN1cHBvcnRlZCcpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIHNlc3Npb25JZCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gJ3Nlc3Npb24taWQnO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIHF1ZXJ5T2JzZXJ2ZXJNYW5hZ2VyKCk6IFF1ZXJ5T2JzZXJ2ZXJNYW5hZ2VyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3F1ZXJ5T2JzZXJ2ZXJNYW5hZ2VyO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldE1vY2tJdGVtc0ZvcjxUPihyZXNvdXJjZTogc3RyaW5nKTogTW9ja0l0ZW1zIHtcbiAgICAgICAgY29uc3QgbW9ja0l0ZW1zID0gdGhpcy5fbW9ja0l0ZW1zW3Jlc291cmNlXTtcbiAgICAgICAgaWYgKCFtb2NrSXRlbXMpIHtcbiAgICAgICAgICAgIC8vIElmIHRoZSByZXNvdXJjZSBkb2Vzbid0IGV4aXN0LCB3ZSBhbHdheXMgcmV0dXJuIGFuIGVtcHR5IHJlc291cmNlLCBzbyB0aGF0IHRoZVxuICAgICAgICAgICAgLy8gcHJvY2Vzc2luZyBkb2Vzbid0IGZhaWwsIGl0IGp1c3QgYWx3YXlzIGNvbnRhaW5zIG5vIGl0ZW1zLlxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgTW9jayBBUEkgcmVzb3VyY2UgJyR7cmVzb3VyY2V9JyByZWZlcmVuY2VkLCBidXQgaGFzIG5vdCBiZWVuIGRlZmluZWQuYCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgcHJpbWFyeUtleTogJ2lkJyxcbiAgICAgICAgICAgICAgIGl0ZW1zOiBbXSxcbiAgICAgICAgICAgICAgIG9ic2VydmVyczogW10sXG4gICAgICAgICAgICAgICBxdWVyeUV2YWx1YXRvcjogKHF1ZXJ5LCBpdGVtcykgPT4gaXRlbXMsXG4gICAgICAgICAgICAgICBibGFja2hvbGU6IGZhbHNlLFxuICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1vY2tJdGVtcztcbiAgICB9XG5cbiAgICBwcml2YXRlIF91cGRhdGVNb2NrT2JzZXJ2ZXIob2JzZXJ2ZXI6IE1vY2tPYnNlcnZlciwgaXRlbXM6IE1vY2tJdGVtcywgbm90aWZ5OiBib29sZWFuID0gdHJ1ZSk6IGFueVtdIHtcbiAgICAgICAgbGV0IG9sZEl0ZW1zID0gb2JzZXJ2ZXIuaXRlbXM7XG4gICAgICAgIGxldCBuZXdJdGVtczogXy5EaWN0aW9uYXJ5PGFueT4gPSB7fTtcblxuICAgICAgICAvLyBFdmFsdWF0ZSBxdWVyeSBvbiBhbGwgdGhlIG5ldyBpdGVtcy5cbiAgICAgICAgY29uc3QgbmV3SXRlbXNBcnJheSA9IGl0ZW1zLnF1ZXJ5RXZhbHVhdG9yKG9ic2VydmVyLnF1ZXJ5LCBpdGVtcy5pdGVtcyk7XG4gICAgICAgIF8uZWFjaChuZXdJdGVtc0FycmF5LCAoaXRlbSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGl0ZW0uX29yZGVyID0gaW5kZXg7XG4gICAgICAgICAgICBuZXdJdGVtc1tpdGVtW2l0ZW1zLnByaW1hcnlLZXldXSA9IGl0ZW07XG4gICAgICAgIH0pO1xuICAgICAgICBvYnNlcnZlci5pdGVtcyA9IG5ld0l0ZW1zO1xuXG4gICAgICAgIGlmIChub3RpZnkpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlbW92ZWQgPSBfLmZpbHRlcihvbGRJdGVtcywgKGl0ZW0sIGl0ZW1JZCkgPT4gIW5ld0l0ZW1zW2l0ZW1JZF0pO1xuICAgICAgICAgICAgY29uc3QgYWRkZWQgPSBfLmZpbHRlcihuZXdJdGVtcywgKGl0ZW0sIGl0ZW1JZCkgPT4gIW9sZEl0ZW1zW2l0ZW1JZF0pO1xuXG4gICAgICAgICAgICBjb25zdCBjaGFuZ2VkID0gXy5maWx0ZXIobmV3SXRlbXMsIChuZXdJdGVtLCBpdGVtSWQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIW9sZEl0ZW1zW2l0ZW1JZF0pIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gIV8uaXNFcXVhbChuZXdJdGVtLCBvbGRJdGVtc1tpdGVtSWRdKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtjaGFuZ2VzLCB0eXBlXSBvZiBbW2FkZGVkLCBNRVNTQUdFX0FEREVEXSwgW3JlbW92ZWQsIE1FU1NBR0VfUkVNT1ZFRF0sIFtjaGFuZ2VkLCBNRVNTQUdFX0NIQU5HRURdXSkge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGl0ZW0gb2YgY2hhbmdlcykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tZXNzYWdlcy5vbk5leHQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgbXNnOiA8c3RyaW5nPiB0eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgb2JzZXJ2ZXI6IG9ic2VydmVyLm9ic2VydmVySWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmltYXJ5X2tleTogaXRlbXMucHJpbWFyeUtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9yZGVyOiBpdGVtLl9vcmRlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW06IF8uY2xvbmVEZWVwKF8ub21pdChpdGVtLCAnX29yZGVyJykpLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gXy5tYXAobmV3SXRlbXNBcnJheSwgKGl0ZW0pID0+IF8ub21pdChpdGVtLCAnX29yZGVyJykpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX25vdGlmeU1vY2tPYnNlcnZlcnM8VD4oaXRlbXM6IE1vY2tJdGVtcykge1xuICAgICAgICBmb3IgKGxldCBvYnNlcnZlciBvZiBpdGVtcy5vYnNlcnZlcnMpIHtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZU1vY2tPYnNlcnZlcihvYnNlcnZlciwgaXRlbXMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gRGV2ZWxvcGVyLWZhY2luZyBBUEkgYmVsb3cuXG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyByZXNldCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fbW9ja0l0ZW1zID0ge307XG4gICAgICAgIHRoaXMuX21vY2tSZXNwb25zZXMgPSB7fTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBjcmVhdGVSZXNvdXJjZTxUPihyZXNvdXJjZTogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmltYXJ5S2V5OiBzdHJpbmcgPSAnaWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWVyeUV2YWx1YXRvcjogTW9ja1F1ZXJ5RXZhbHVhdG9yPFQ+ID0gKHF1ZXJ5LCBpdGVtcykgPT4gaXRlbXMpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fbW9ja0l0ZW1zW3Jlc291cmNlXSA9IHtcbiAgICAgICAgICAgIHByaW1hcnlLZXk6IHByaW1hcnlLZXksXG4gICAgICAgICAgICBpdGVtczogW10sXG4gICAgICAgICAgICBvYnNlcnZlcnM6IFtdLFxuICAgICAgICAgICAgcXVlcnlFdmFsdWF0b3I6IHF1ZXJ5RXZhbHVhdG9yLFxuICAgICAgICAgICAgYmxhY2tob2xlOiBmYWxzZSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBjcmVhdGVCbGFja2hvbGVSZXNvdXJjZShyZXNvdXJjZTogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX21vY2tJdGVtc1tyZXNvdXJjZV0gPSB7XG4gICAgICAgICAgICBwcmltYXJ5S2V5OiBudWxsLFxuICAgICAgICAgICAgaXRlbXM6IFtdLFxuICAgICAgICAgICAgb2JzZXJ2ZXJzOiBbXSxcbiAgICAgICAgICAgIHF1ZXJ5RXZhbHVhdG9yOiBudWxsLFxuICAgICAgICAgICAgYmxhY2tob2xlOiB0cnVlLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIGFkZEl0ZW08VD4ocmVzb3VyY2U6IHN0cmluZywgaXRlbTogVCk6IHZvaWQge1xuICAgICAgICBjb25zdCBpdGVtcyA9IHRoaXMuX2dldE1vY2tJdGVtc0ZvcihyZXNvdXJjZSk7XG4gICAgICAgIGl0ZW1zLml0ZW1zLnB1c2goXy5jbG9uZURlZXAoaXRlbSkpO1xuXG4gICAgICAgIHRoaXMuX25vdGlmeU1vY2tPYnNlcnZlcnMoaXRlbXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIGFkZEl0ZW1zPFQ+KHJlc291cmNlOiBzdHJpbmcsIGl0ZW1zOiBUW10pOiB2b2lkIHtcbiAgICAgICAgY29uc3QgZXhpc3RpbmdJdGVtcyA9IHRoaXMuX2dldE1vY2tJdGVtc0ZvcihyZXNvdXJjZSk7XG4gICAgICAgIGV4aXN0aW5nSXRlbXMuaXRlbXMucHVzaC5hcHBseShleGlzdGluZ0l0ZW1zLml0ZW1zLCBfLmNsb25lRGVlcChpdGVtcykpO1xuXG4gICAgICAgIHRoaXMuX25vdGlmeU1vY2tPYnNlcnZlcnMoZXhpc3RpbmdJdGVtcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgdXBkYXRlSXRlbTxUPihyZXNvdXJjZTogc3RyaW5nLCBpdGVtOiBUKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5fZ2V0TW9ja0l0ZW1zRm9yKHJlc291cmNlKTtcbiAgICAgICAgY29uc3QgaW5kZXggPSBfLmZpbmRJbmRleChpdGVtcy5pdGVtcywge1tpdGVtcy5wcmltYXJ5S2V5XTogaXRlbVtpdGVtcy5wcmltYXJ5S2V5XX0pO1xuICAgICAgICBpdGVtcy5pdGVtc1tpbmRleF0gPSBpdGVtO1xuXG4gICAgICAgIHRoaXMuX25vdGlmeU1vY2tPYnNlcnZlcnMoaXRlbXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIHJlbW92ZUl0ZW0ocmVzb3VyY2U6IHN0cmluZywgaXRlbUlkOiBzdHJpbmcgfCBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgaXRlbXMgPSB0aGlzLl9nZXRNb2NrSXRlbXNGb3IocmVzb3VyY2UpO1xuICAgICAgICBjb25zdCBpbmRleCA9IF8uZmluZEluZGV4KGl0ZW1zLml0ZW1zLCB7W2l0ZW1zLnByaW1hcnlLZXldOiBpdGVtSWR9KTtcbiAgICAgICAgXy5wdWxsQXQoaXRlbXMuaXRlbXMsIGluZGV4KTtcblxuICAgICAgICB0aGlzLl9ub3RpZnlNb2NrT2JzZXJ2ZXJzKGl0ZW1zKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyB3aGVuR2V0PFQ+KHBhdGg6IHN0cmluZyB8IFJlZ0V4cCwgaGFuZGxlcjogTW9ja1JlcXVlc3RIYW5kbGVyPFQ+KTogdm9pZCB7XG4gICAgICAgIHRoaXMuX3JlZ2lzdGVyTW9ja1JlcXVlc3RIYW5kbGVyKCdnZXQnLCBwYXRoLCBoYW5kbGVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyB3aGVuUG9zdDxUPihwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPik6IHZvaWQge1xuICAgICAgICB0aGlzLl9yZWdpc3Rlck1vY2tSZXF1ZXN0SGFuZGxlcigncG9zdCcsIHBhdGgsIGhhbmRsZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIHdoZW5QdXQ8VD4ocGF0aDogc3RyaW5nIHwgUmVnRXhwLCBoYW5kbGVyOiBNb2NrUmVxdWVzdEhhbmRsZXI8VD4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fcmVnaXN0ZXJNb2NrUmVxdWVzdEhhbmRsZXIoJ3B1dCcsIHBhdGgsIGhhbmRsZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIHdoZW5QYXRjaDxUPihwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPik6IHZvaWQge1xuICAgICAgICB0aGlzLl9yZWdpc3Rlck1vY2tSZXF1ZXN0SGFuZGxlcigncGF0Y2gnLCBwYXRoLCBoYW5kbGVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyB3aGVuRGVsZXRlPFQ+KHBhdGg6IHN0cmluZyB8IFJlZ0V4cCwgaGFuZGxlcjogTW9ja1JlcXVlc3RIYW5kbGVyPFQ+KTogdm9pZCB7XG4gICAgICAgIHRoaXMuX3JlZ2lzdGVyTW9ja1JlcXVlc3RIYW5kbGVyKCdkZWxldGUnLCBwYXRoLCBoYW5kbGVyKTtcbiAgICB9XG59XG5cblxuLyoqXG4gKiBNb2NrIEFQSSBtaXhpbiwgd2hpY2ggbWF5IGJlIHVzZWQgaW4gdGVzdHMgdG8gc2ltdWxhdGUgdGhlIGJhY2tlbmQuXG4gKi9cbmV4cG9ydCBjbGFzcyBNb2NrQXBpTWl4aW4gaW1wbGVtZW50cyBNb2NrQmFzZSB7XG4gICAgcHVibGljIGNvbm5lY3Rpb246IE1vY2tDb25uZWN0aW9uO1xuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgcmVzZXQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi5yZXNldCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIGNyZWF0ZVJlc291cmNlPFQ+KHJlc291cmNlOiBzdHJpbmcsIHByaW1hcnlLZXk/OiBzdHJpbmcsIHF1ZXJ5PzogTW9ja1F1ZXJ5RXZhbHVhdG9yPFQ+KTogdm9pZCB7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi5jcmVhdGVSZXNvdXJjZShyZXNvdXJjZSwgcHJpbWFyeUtleSwgcXVlcnkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIGNyZWF0ZUJsYWNraG9sZVJlc291cmNlKHJlc291cmNlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uLmNyZWF0ZUJsYWNraG9sZVJlc291cmNlKHJlc291cmNlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyBhZGRJdGVtPFQ+KHJlc291cmNlOiBzdHJpbmcsIGl0ZW06IFQpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uLmFkZEl0ZW0ocmVzb3VyY2UsIGl0ZW0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIGFkZEl0ZW1zPFQ+KHJlc291cmNlOiBzdHJpbmcsIGl0ZW1zOiBUW10pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uLmFkZEl0ZW1zKHJlc291cmNlLCBpdGVtcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgdXBkYXRlSXRlbTxUPihyZXNvdXJjZTogc3RyaW5nLCBpdGVtOiBUKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi51cGRhdGVJdGVtKHJlc291cmNlLCBpdGVtKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHB1YmxpYyByZW1vdmVJdGVtKHJlc291cmNlOiBzdHJpbmcsIGl0ZW1JZDogc3RyaW5nIHwgbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi5yZW1vdmVJdGVtKHJlc291cmNlLCBpdGVtSWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIHdoZW5HZXQ8VD4ocGF0aDogc3RyaW5nIHwgUmVnRXhwLCBoYW5kbGVyOiBNb2NrUmVxdWVzdEhhbmRsZXI8VD4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uLndoZW5HZXQocGF0aCwgaGFuZGxlcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgd2hlblBvc3Q8VD4ocGF0aDogc3RyaW5nIHwgUmVnRXhwLCBoYW5kbGVyOiBNb2NrUmVxdWVzdEhhbmRsZXI8VD4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uLndoZW5Qb3N0KHBhdGgsIGhhbmRsZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHVibGljIHdoZW5QdXQ8VD4ocGF0aDogc3RyaW5nIHwgUmVnRXhwLCBoYW5kbGVyOiBNb2NrUmVxdWVzdEhhbmRsZXI8VD4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uLndoZW5QdXQocGF0aCwgaGFuZGxlcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgd2hlblBhdGNoPFQ+KHBhdGg6IHN0cmluZyB8IFJlZ0V4cCwgaGFuZGxlcjogTW9ja1JlcXVlc3RIYW5kbGVyPFQ+KTogdm9pZCB7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi53aGVuUGF0Y2gocGF0aCwgaGFuZGxlcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICBwdWJsaWMgd2hlbkRlbGV0ZTxUPihwYXRoOiBzdHJpbmcgfCBSZWdFeHAsIGhhbmRsZXI6IE1vY2tSZXF1ZXN0SGFuZGxlcjxUPik6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb24ud2hlbkRlbGV0ZShwYXRoLCBoYW5kbGVyKTtcbiAgICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTW9ja0FwaUJhc2UgZXh0ZW5kcyBSZXNvbHdlQXBpLCBNb2NrQXBpTWl4aW4ge1xuICAgIGNvbm5lY3Rpb246IE1vY2tDb25uZWN0aW9uO1xuXG4gICAgbmV3ICguLi5hcmdzOiBhbnlbXSk6IE1vY2tBcGlCYXNlO1xuICAgICguLi5hcmdzOiBhbnlbXSk6IHZvaWQ7XG59XG5cbmV4cG9ydCBsZXQgTW9ja0FwaUJhc2U6IE1vY2tBcGlCYXNlID0gPE1vY2tBcGlCYXNlPiBjb21wb3NlKFtSZXNvbHdlQXBpLCBNb2NrQXBpTWl4aW5dKTtcblxuZXhwb3J0IGNsYXNzIE1vY2tBcGkgZXh0ZW5kcyBNb2NrQXBpQmFzZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKG5ldyBNb2NrQ29ubmVjdGlvbigpLCBudWxsLCBudWxsKTtcbiAgICB9XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIGZvciBzdXBwb3J0aW5nIHBhZ2luYXRpb24sIHdoaWNoIGNhbiBiZSB1c2VkIGFzIGEgW1tNb2NrUXVlcnlFdmFsdWF0b3JdXS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhZ2luYXRlUXVlcnk8VD4ocXVlcnk6IGFueSwgaXRlbXM6IFRbXSk6IFRbXSB7XG4gICAgY29uc3QgbGltaXQgPSBxdWVyeS5saW1pdCB8fCAwO1xuICAgIGNvbnN0IG9mZnNldCA9IHF1ZXJ5Lm9mZnNldCB8fCAwO1xuICAgIHJldHVybiBpdGVtcy5zbGljZShvZmZzZXQsIGxpbWl0ID4gMCA/IG9mZnNldCArIGxpbWl0IDogdW5kZWZpbmVkKTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gZm9yIHN1cHBvcnRpbmcgb3JkZXJpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvcmRlcmluZ1F1ZXJ5PFQ+KHF1ZXJ5OiBRdWVyeSwgaXRlbXM6IFRbXSk6IFRbXSB7XG4gICAgaWYgKCFxdWVyeS5vcmRlcmluZykgcmV0dXJuIGl0ZW1zO1xuICAgIGNvbnN0IG9yZGVyaW5nID0gcXVlcnkub3JkZXJpbmcuc3BsaXQoJywnKTtcblxuICAgIGNvbnN0IG9yZGVyaW5nRGlyZWN0aW9ucyA9IF8ubWFwKG9yZGVyaW5nLCAoY29sdW1uKSA9PiBjb2x1bW5bMF0gPT09ICctJyA/ICdkZXNjJyA6ICdhc2MnKTtcbiAgICBjb25zdCBvcmRlcmluZ0NvbHVtbnMgPSBfLm1hcChvcmRlcmluZywgKGNvbHVtbikgPT4gY29sdW1uWzBdID09PSAnLScgPyBjb2x1bW4uc3Vic3RyKDEpIDogY29sdW1uKTtcbiAgICByZXR1cm4gXy5zb3J0QnlPcmRlcihpdGVtcywgb3JkZXJpbmdDb2x1bW5zLCBvcmRlcmluZ0RpcmVjdGlvbnMpO1xufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiBmb3Igc3VwcG9ydGluZyBmaWx0ZXJpbmcgYnkgZGVzY3JpcHRvcl9jb21wbGV0ZWQsIHdoaWNoIGNhbiBiZSB1c2VkIGFzIGEgW1tNb2NrUXVlcnlFdmFsdWF0b3JdXS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFubm90YXRlZFF1ZXJ5PFQgZXh0ZW5kcyBTYW1wbGVCYXNlPihxdWVyeTogYW55LCBpdGVtczogVFtdKTogVFtdIHtcbiAgICBpZiAoXy5pc1VuZGVmaW5lZChxdWVyeS5kZXNjcmlwdG9yX2NvbXBsZXRlZCkgfHwgXy5pc051bGwocXVlcnkuZGVzY3JpcHRvcl9jb21wbGV0ZWQpKSByZXR1cm4gaXRlbXM7XG5cbiAgICByZXR1cm4gXy5maWx0ZXIoaXRlbXMsIChpdGVtKSA9PiBpdGVtLmRlc2NyaXB0b3JfY29tcGxldGVkID09PSBxdWVyeS5kZXNjcmlwdG9yX2NvbXBsZXRlZCk7XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIGZvciBzdXBwb3J0aW5nIGZpbHRlcmluZyBieSBzbHVnLCB3aGljaCBjYW4gYmUgdXNlZCBhcyBhIFtbTW9ja1F1ZXJ5RXZhbHVhdG9yXV0uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzbHVnUXVlcnk8VCBleHRlbmRzIENvbGxlY3Rpb25CYXNlIHwgRGF0YUJhc2U+KHF1ZXJ5OiBhbnksIGl0ZW1zOiBUW10pOiBUW10ge1xuICAgIGlmICghcXVlcnkuc2x1ZykgcmV0dXJuIGl0ZW1zO1xuXG4gICAgcmV0dXJuIF8uZmlsdGVyKGl0ZW1zLCAoaXRlbSkgPT4gaXRlbS5zbHVnID09PSBxdWVyeS5zbHVnKTtcbn1cbiJdfQ==
