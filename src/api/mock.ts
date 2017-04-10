import * as _ from 'lodash';
import * as Rx from 'rx';

import {Connection, Message} from './connection';
import {QueryObserverManager, MESSAGE_ADDED, MESSAGE_CHANGED, MESSAGE_REMOVED} from './queryobserver';
import {GenError} from '../core/errors/error';
import {APIError} from './errors';
import {Query, SampleBase, CollectionBase, DataBase} from './types/rest';
import {ResolweApi} from './index';
import {compose} from '../core/utils/lang';
import * as random from '../core/utils/random';

/**
 * Mock request handler function. It receives any query arguments and data that
 * was used to make the request. If a regular expression was used to define the
 * path match, the result of performing `RegExp.exec` is also given as an argument
 * and can be used to extract regexp matches.
 *
 * @param parameters Query parameters
 * @param data Request data
 * @param path Regular expression matches
 * @return Value that should be returned as a response
 */
export interface MockRequestHandler<T> {
    (parameters: any, data: any, path?: RegExpExecArray): T;
}

/**
 * A function, which mocks evaluation of a query. It receives the original query
 * object and a list of items currently in the mock database. It may return a
 * modified list of items, transformed based on the query, or the items unchanged.
 *
 * @param query The original query object
 * @param items A list of items
 */
export interface MockQueryEvaluator<T> {
    (query: any, items: T[]): T[];
}

/**
 * Developer-facing interface for configuring responses that the mocked
 * backend should return.
 */
export interface MockBase {
    /**
     * Resets all registered mock API resources and handlers. This method can be used
     * to reinitialize the mock API between test cases.
     */
    reset(): void;

    /**
     * Enables or disables delay simulation.
     */
    simulateDelay(value: boolean): void;

    /**
     * Creates a new mock resource that will handle reactive queries. A resource
     * must be created before it can be used in [[addItem]], [[updateItem]] and
     * [[removeItem]].
     *
     * @param {string} resource Name of the resource (eg. 'collection')
     * @param {string} primaryKey Name of the property that holds the primary key
     * @param {MockQueryEvaluator<T>} query Mock query evaluator function
     */
    createResource<T>(resource: string, primaryKey?: string, query?: MockQueryEvaluator<T>): void;

    /**
     * Creates a new mock resource that will blackhole requests. Any queries
     * submitted to this resource will never complete.
     *
     * @param {string} resource Name of the resource (eg. 'collection')
     */
    createBlackholeResource(resource: string): void;

    /**
     * Adds an item to the mock database backing the specific resource.
     *
     * @param {string} resource Name of the resource
     * @param {T} item Item to add
     */
    addItem<T>(resource: string, item: T): void;

    /**
     * Adds multiple items to the mock database backing the specific resource.
     *
     * @param {string} resource Name of the resource
     * @param {T[]} items Items to add
     */
    addItems<T>(resource: string, items: T[]): void;

    /**
     * Updates an existing item in the mock database backing the specific
     * resource. Items are matched based on the primary key configured for the
     * referenced resource in [[createResource]].
     *
     * @param {string} resource Name of the resource
     * @param {T} item Item to update
     */
    updateItem<T>(resource: string, item: T): void;

    /**
     * Removes an item from the mock database backing the specific resource.
     * Items are matched based on the primary key configured for the referenced
     * resource in [[createResource]].
     *
     * @param {string} resource Name of the resource
     * @param {string|number} itemId Primary key value of the item to remove
     */
    removeItem(resource: string, itemId: string | number): void;

    /**
     * Registeres a mock GET request handler for a specific path. The path can
     * either be a string or a regular expression.
     *
     * @param {string|RegExp} path Path to register the handler for
     * @param {MockRequestHandler<T>} handler Request handler
     */
    whenGet<T>(path: string | RegExp, handler: MockRequestHandler<T>): void;

    /**
     * Registeres a mock POST request handler for a specific path. The path can
     * either be a string or a regular expression.
     *
     * @param {string|RegExp} path Path to register the handler for
     * @param {MockRequestHandler<T>} handler Request handler
     */
    whenPost<T>(path: string | RegExp, handler: MockRequestHandler<T>): void;

    /**
     * Registeres a mock PUT request handler for a specific path. The path can
     * either be a string or a regular expression.
     *
     * @param {string|RegExp} path Path to register the handler for
     * @param {MockRequestHandler<T>} handler Request handler
     */
    whenPut<T>(path: string | RegExp, handler: MockRequestHandler<T>): void;

    /**
     * Registeres a mock PATCH request handler for a specific path. The path can
     * either be a string or a regular expression.
     *
     * @param {string|RegExp} path Path to register the handler for
     * @param {MockRequestHandler<T>} handler Request handler
     */
    whenPatch<T>(path: string | RegExp, handler: MockRequestHandler<T>): void;

    /**
     * Registeres a mock DELETE request handler for a specific path. The path can
     * either be a string or a regular expression.
     *
     * @param {string|RegExp} path Path to register the handler for
     * @param {MockRequestHandler<T>} handler Request handler
     */
    whenDelete<T>(path: string | RegExp, handler: MockRequestHandler<T>): void;
}

interface MockObserver {
    observerId: string;
    query: any;
    items: _.Dictionary<any>;
}

interface MockItems {
    primaryKey: string;
    observers: MockObserver[];
    items: any[];
    queryEvaluator: MockQueryEvaluator<any>;
    blackhole: boolean;
}

interface MockItemStore {
    [index: string]: MockItems;
}

interface MockResponseDescriptor {
    path: string | RegExp;
    handler: MockRequestHandler<any>;
}

interface MockResponseStore {
    [method: string]: MockResponseDescriptor[];
}

class MockQueryObserverManager extends QueryObserverManager {
    /**
     * @inheritdoc
     */
    public remove(observerId: string) {
        this._deleteObserver(observerId);
        // Call the unsubscribe method immediately during tests. The actual query
        // observer manager will defer these calls instead.
        this._unsubscribe(observerId).subscribe(() => {
            // Subscribe to process the (mock) request.
        });
    }

    /**
     * @inheritdoc
     */
    public chainAfterUnsubscribe<T>(makeObservable: () => Rx.Observable<T>): Rx.Observable<T> {
        // Do not defer makeObservable during tests.
        return makeObservable();
    }
}

export class MockConnection implements Connection, MockBase {
    private _mockItems: MockItemStore = {};
    private _mockResponses: MockResponseStore = {};
    private _messages: Rx.Subject<Message>;
    private _isConnected: Rx.BehaviorSubject<boolean>;
    private _queryObserverManager: QueryObserverManager;
    private _errors: Rx.Subject<APIError>;
    private _simulateDelay: boolean = false;

    constructor() {
        this._messages = new Rx.Subject<Message>();
        this._isConnected = new Rx.BehaviorSubject(false);
        this._errors = new Rx.Subject<APIError>();
        this._queryObserverManager = new MockQueryObserverManager(this, this._errors);
    }

    /**
     * @inheritdoc
     */
    public connect(restUri: string, websocketUri: string) {
        this._isConnected.onNext(true);
        this.messages().subscribe(this._queryObserverManager.update.bind(this._queryObserverManager));
    }

    /**
     * @inheritdoc
     */
    public disconnect() {
        this._isConnected.onNext(false);
    }

    /**
     * @inheritdoc
     */
    public isConnected(): Rx.Observable<boolean> {
        return this._isConnected;
    }

    private _registerMockRequestHandler<T>(method: string, path: string | RegExp, handler: MockRequestHandler<T>) {
        if (!this._mockResponses[method]) this._mockResponses[method] = [];
        const handlers = this._mockResponses[method];

        if (_.any(handlers, (existingHandler) => existingHandler.path === path)) {
            console.error(`Method ${method} for path ${path} already registered`);
        }

        handlers.push({
            path: path,
            handler: handler,
        });
    }

    private _handleMockResponse(method: string, responsePath: string, parameters: any, data: any): Rx.Observable<any> {
        const matchingHandlers = _.filter(this._mockResponses[method], ({path}) => {
            if (path instanceof RegExp) return path.test(responsePath);
            return path === responsePath;
        });

        if (_.isEmpty(matchingHandlers)) {
            return Rx.Observable.just({});
        }

        if (_.size(matchingHandlers) > 1) {
            console.error(`Multiple handlers matched for method ${method} on path ${responsePath}`);
        }

        // TODO: Support mocking errors as well.
        const {path, handler} = matchingHandlers[0];
        if (path instanceof RegExp) {
            return Rx.Observable.just(handler(parameters, data, path.exec(responsePath)));
        }
        return Rx.Observable.just(handler(parameters, data));
    }

    /**
     * @inheritdoc
     */
    public simulateDelay(value: boolean): void {
        this._simulateDelay = value;
    }

    /**
     * @inheritdoc
     */
    public get<T>(path: string, parameters?: Object): Rx.Observable<T> {
        if (!_.startsWith(path, '/api/')) return this._handleMockResponse('get', path, parameters, {});

        const reactive = _.has(parameters, 'observe');
        const atoms = path.split('/');
        const resource = atoms.slice(2).join('/');

        if (!reactive && !_.has(this._mockItems, resource)) {
            return this._handleMockResponse('get', path, parameters, {});
        }

        let items = this._getMockItemsFor(resource);
        if (items.blackhole) return Rx.Observable.never<T>();

        let observable: Rx.Observable<any>;
        if (!reactive) {
            // Non-reactive query.
            observable = Rx.Observable.just<any>(items.queryEvaluator(parameters, items.items));
        } else {
            // Reactive query.
            const observer = {
                observerId: random.randomUuid(),
                query: _.omit(parameters, 'observe'),
                items: {},
            };
            items.observers.push(observer);

            observable = Rx.Observable.just<any>({
                observer: observer.observerId,
                items: this._updateMockObserver(observer, items, false),
            });
        }

        return this._simulateDelay ? observable.delay(100) : observable;
    }

    /**
     * @inheritdoc
     */
    public post<T>(path: string, data: Object, parameters?: Object): Rx.Observable<T> {
        return this._handleMockResponse('post', path, parameters, data);
    }

    /**
     * @inheritdoc
     */
    public put<T>(path: string, data: Object, parameters?: Object): Rx.Observable<T> {
        return this._handleMockResponse('put', path, parameters, data);
    }

    /**
     * @inheritdoc
     */
    public patch<T>(path: string, data: Object, parameters?: Object): Rx.Observable<T> {
        return this._handleMockResponse('patch', path, parameters, data);
    }

    /**
     * @inheritdoc
     */
    public delete<T>(path: string, data: Object, parameters?: Object): Rx.Observable<T> {
        return this._handleMockResponse('delete', path, parameters, data);
    }

    /**
     * @inheritdoc
     */
    public createUriFromPath(path: string): string {
        return path;
    }

    /**
     * @inheritdoc
     */
    public csrfCookie(): string {
        return 'cookie';
    }

    /**
     * @inheritdoc
     */
    public messages(): Rx.Observable<Message> {
        return this._messages;
    }

    /**
     * @inheritdoc
     */
    public errors(): Rx.Observable<APIError> {
        throw new GenError('Throwing errors in mocked connection not supported');
    }

    /**
     * @inheritdoc
     */
    public sessionId(): string {
        return 'session-id';
    }

    /**
     * @inheritdoc
     */
    public queryObserverManager(): QueryObserverManager {
        return this._queryObserverManager;
    }

    private _getMockItemsFor<T>(resource: string): MockItems {
        const mockItems = this._mockItems[resource];
        if (!mockItems) {
            // If the resource doesn't exist, we always return an empty resource, so that the
            // processing doesn't fail, it just always contains no items.
            console.error(`Mock API resource '${resource}' referenced, but has not been defined.`);
            return {
               primaryKey: 'id',
               items: [],
               observers: [],
               queryEvaluator: (query, items) => items,
               blackhole: false,
           };
        }

        return mockItems;
    }

    private _updateMockObserver(observer: MockObserver, items: MockItems, notify: boolean = true): any[] {
        let oldItems = observer.items;
        let newItems: _.Dictionary<any> = {};

        // Evaluate query on all the new items.
        const newItemsArray = items.queryEvaluator(observer.query, items.items);
        _.each(newItemsArray, (item, index) => {
            item._order = index;
            newItems[item[items.primaryKey]] = item;
        });
        observer.items = newItems;

        if (notify) {
            const removed = _.filter(oldItems, (item, itemId) => !newItems[itemId]);
            const added = _.filter(newItems, (item, itemId) => !oldItems[itemId]);

            const changed = _.filter(newItems, (newItem, itemId) => {
                if (!oldItems[itemId]) return false;
                return !_.isEqual(newItem, oldItems[itemId]);
            });

            for (const [changes, type] of [[added, MESSAGE_ADDED], [removed, MESSAGE_REMOVED], [changed, MESSAGE_CHANGED]]) {
                for (let item of changes) {
                    this._messages.onNext({
                        msg: <string> type,
                        observer: observer.observerId,
                        primary_key: items.primaryKey,
                        order: item._order,
                        item: _.cloneDeep(_.omit(item, '_order')),
                    });
                }
            }
        }

        return _.map(newItemsArray, (item) => _.omit(item, '_order'));
    }

    private _notifyMockObservers<T>(items: MockItems) {
        for (let observer of items.observers) {
            this._updateMockObserver(observer, items);
        }
    }

    // Developer-facing API below.

    /**
     * @inheritdoc
     */
    public reset(): void {
        this._mockItems = {};
        this._mockResponses = {};
    }

    /**
     * @inheritdoc
     */
    public createResource<T>(resource: string,
                             primaryKey: string = 'id',
                             queryEvaluator: MockQueryEvaluator<T> = (query, items) => items): void {
        this._mockItems[resource] = {
            primaryKey: primaryKey,
            items: [],
            observers: [],
            queryEvaluator: queryEvaluator,
            blackhole: false,
        };
    }

    /**
     * @inheritdoc
     */
    public createBlackholeResource(resource: string): void {
        this._mockItems[resource] = {
            primaryKey: null,
            items: [],
            observers: [],
            queryEvaluator: null,
            blackhole: true,
        };
    }

    /**
     * @inheritdoc
     */
    public addItem<T>(resource: string, item: T): void {
        const items = this._getMockItemsFor(resource);
        items.items.push(_.cloneDeep(item));

        this._notifyMockObservers(items);
    }

    /**
     * @inheritdoc
     */
    public addItems<T>(resource: string, items: T[]): void {
        const existingItems = this._getMockItemsFor(resource);
        existingItems.items.push.apply(existingItems.items, _.cloneDeep(items));

        this._notifyMockObservers(existingItems);
    }

    /**
     * @inheritdoc
     */
    public updateItem<T>(resource: string, item: T): void {
        const items = this._getMockItemsFor(resource);
        const index = _.findIndex(items.items, {[items.primaryKey]: item[items.primaryKey]});
        items.items[index] = item;

        this._notifyMockObservers(items);
    }

    /**
     * @inheritdoc
     */
    public removeItem(resource: string, itemId: string | number): void {
        const items = this._getMockItemsFor(resource);
        const index = _.findIndex(items.items, {[items.primaryKey]: itemId});
        _.pullAt(items.items, index);

        this._notifyMockObservers(items);
    }

    /**
     * @inheritdoc
     */
    public whenGet<T>(path: string | RegExp, handler: MockRequestHandler<T>): void {
        this._registerMockRequestHandler('get', path, handler);
    }

    /**
     * @inheritdoc
     */
    public whenPost<T>(path: string | RegExp, handler: MockRequestHandler<T>): void {
        this._registerMockRequestHandler('post', path, handler);
    }

    /**
     * @inheritdoc
     */
    public whenPut<T>(path: string | RegExp, handler: MockRequestHandler<T>): void {
        this._registerMockRequestHandler('put', path, handler);
    }

    /**
     * @inheritdoc
     */
    public whenPatch<T>(path: string | RegExp, handler: MockRequestHandler<T>): void {
        this._registerMockRequestHandler('patch', path, handler);
    }

    /**
     * @inheritdoc
     */
    public whenDelete<T>(path: string | RegExp, handler: MockRequestHandler<T>): void {
        this._registerMockRequestHandler('delete', path, handler);
    }
}


/**
 * Mock API mixin, which may be used in tests to simulate the backend.
 */
export class MockApiMixin implements MockBase {
    public connection: MockConnection;

    /**
     * @inheritdoc
     */
    public reset(): void {
        this.connection.reset();
    }

    /**
     * @inheritdoc
     */
    public simulateDelay(value: boolean): void {
        this.connection.simulateDelay(value);
    }

    /**
     * @inheritdoc
     */
    public createResource<T>(resource: string, primaryKey?: string, query?: MockQueryEvaluator<T>): void {
        this.connection.createResource(resource, primaryKey, query);
    }

    /**
     * @inheritdoc
     */
    public createBlackholeResource(resource: string): void {
        this.connection.createBlackholeResource(resource);
    }

    /**
     * @inheritdoc
     */
    public addItem<T>(resource: string, item: T): void {
        this.connection.addItem(resource, item);
    }

    /**
     * @inheritdoc
     */
    public addItems<T>(resource: string, items: T[]): void {
        this.connection.addItems(resource, items);
    }

    /**
     * @inheritdoc
     */
    public updateItem<T>(resource: string, item: T): void {
        this.connection.updateItem(resource, item);
    }

    /**
     * @inheritdoc
     */
    public removeItem(resource: string, itemId: string | number): void {
        this.connection.removeItem(resource, itemId);
    }

    /**
     * @inheritdoc
     */
    public whenGet<T>(path: string | RegExp, handler: MockRequestHandler<T>): void {
        this.connection.whenGet(path, handler);
    }

    /**
     * @inheritdoc
     */
    public whenPost<T>(path: string | RegExp, handler: MockRequestHandler<T>): void {
        this.connection.whenPost(path, handler);
    }

    /**
     * @inheritdoc
     */
    public whenPut<T>(path: string | RegExp, handler: MockRequestHandler<T>): void {
        this.connection.whenPut(path, handler);
    }

    /**
     * @inheritdoc
     */
    public whenPatch<T>(path: string | RegExp, handler: MockRequestHandler<T>): void {
        this.connection.whenPatch(path, handler);
    }

    /**
     * @inheritdoc
     */
    public whenDelete<T>(path: string | RegExp, handler: MockRequestHandler<T>): void {
        this.connection.whenDelete(path, handler);
    }
}

export interface MockApiBase extends ResolweApi, MockApiMixin {
    connection: MockConnection;

    new (...args: any[]): MockApiBase;
    (...args: any[]): void;
}

export let MockApiBase: MockApiBase = <MockApiBase> compose([ResolweApi, MockApiMixin]);

export class MockApi extends MockApiBase {
    constructor() {
        super(new MockConnection(), null, null);
    }
}

/**
 * Helper function for supporting pagination, which can be used as a [[MockQueryEvaluator]].
 */
export function paginateQuery<T>(query: any, items: T[]): T[] {
    const limit = query.limit || 0;
    const offset = query.offset || 0;
    return items.slice(offset, limit > 0 ? offset + limit : undefined);
}

/**
 * Helper function for supporting ordering.
 */
export function orderingQuery<T>(query: Query, items: T[]): T[] {
    if (!query.ordering) return items;
    const ordering = query.ordering.split(',');

    const orderingDirections = _.map(ordering, (column) => column[0] === '-' ? 'desc' : 'asc');
    const orderingColumns = _.map(ordering, (column) => column[0] === '-' ? column.substr(1) : column);
    return _.sortByOrder(items, orderingColumns, orderingDirections);
}

/**
 * Helper function for supporting filtering by descriptor_completed, which can be used as a [[MockQueryEvaluator]].
 */
export function annotatedQuery<T extends SampleBase>(query: any, items: T[]): T[] {
    if (_.isUndefined(query.descriptor_completed) || _.isNull(query.descriptor_completed)) return items;

    return _.filter(items, (item) => item.descriptor_completed === query.descriptor_completed);
}

/**
 * Helper function for supporting filtering by slug, which can be used as a [[MockQueryEvaluator]].
 */
export function slugQuery<T extends CollectionBase | DataBase>(query: any, items: T[]): T[] {
    if (!query.slug) return items;

    return _.filter(items, (item) => item.slug === query.slug);
}
