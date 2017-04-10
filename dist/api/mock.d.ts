import * as Rx from 'rx';
import { Connection, Message } from './connection';
import { QueryObserverManager } from './queryobserver';
import { APIError } from './errors';
import { Query, SampleBase, CollectionBase, DataBase } from './types/rest';
import { ResolweApi } from './index';
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
export declare class MockConnection implements Connection, MockBase {
    private _mockItems;
    private _mockResponses;
    private _messages;
    private _isConnected;
    private _queryObserverManager;
    private _errors;
    private _simulateDelay;
    constructor();
    /**
     * @inheritdoc
     */
    connect(restUri: string, websocketUri: string): void;
    /**
     * @inheritdoc
     */
    disconnect(): void;
    /**
     * @inheritdoc
     */
    isConnected(): Rx.Observable<boolean>;
    private _registerMockRequestHandler<T>(method, path, handler);
    private _handleMockResponse(method, responsePath, parameters, data);
    /**
     * @inheritdoc
     */
    simulateDelay(value: boolean): void;
    /**
     * @inheritdoc
     */
    get<T>(path: string, parameters?: Object): Rx.Observable<T>;
    /**
     * @inheritdoc
     */
    post<T>(path: string, data: Object, parameters?: Object): Rx.Observable<T>;
    /**
     * @inheritdoc
     */
    put<T>(path: string, data: Object, parameters?: Object): Rx.Observable<T>;
    /**
     * @inheritdoc
     */
    patch<T>(path: string, data: Object, parameters?: Object): Rx.Observable<T>;
    /**
     * @inheritdoc
     */
    delete<T>(path: string, data: Object, parameters?: Object): Rx.Observable<T>;
    /**
     * @inheritdoc
     */
    createUriFromPath(path: string): string;
    /**
     * @inheritdoc
     */
    csrfCookie(): string;
    /**
     * @inheritdoc
     */
    messages(): Rx.Observable<Message>;
    /**
     * @inheritdoc
     */
    errors(): Rx.Observable<APIError>;
    /**
     * @inheritdoc
     */
    sessionId(): string;
    /**
     * @inheritdoc
     */
    queryObserverManager(): QueryObserverManager;
    private _getMockItemsFor<T>(resource);
    private _updateMockObserver(observer, items, notify?);
    private _notifyMockObservers<T>(items);
    /**
     * @inheritdoc
     */
    reset(): void;
    /**
     * @inheritdoc
     */
    createResource<T>(resource: string, primaryKey?: string, queryEvaluator?: MockQueryEvaluator<T>): void;
    /**
     * @inheritdoc
     */
    createBlackholeResource(resource: string): void;
    /**
     * @inheritdoc
     */
    addItem<T>(resource: string, item: T): void;
    /**
     * @inheritdoc
     */
    addItems<T>(resource: string, items: T[]): void;
    /**
     * @inheritdoc
     */
    updateItem<T>(resource: string, item: T): void;
    /**
     * @inheritdoc
     */
    removeItem(resource: string, itemId: string | number): void;
    /**
     * @inheritdoc
     */
    whenGet<T>(path: string | RegExp, handler: MockRequestHandler<T>): void;
    /**
     * @inheritdoc
     */
    whenPost<T>(path: string | RegExp, handler: MockRequestHandler<T>): void;
    /**
     * @inheritdoc
     */
    whenPut<T>(path: string | RegExp, handler: MockRequestHandler<T>): void;
    /**
     * @inheritdoc
     */
    whenPatch<T>(path: string | RegExp, handler: MockRequestHandler<T>): void;
    /**
     * @inheritdoc
     */
    whenDelete<T>(path: string | RegExp, handler: MockRequestHandler<T>): void;
}
/**
 * Mock API mixin, which may be used in tests to simulate the backend.
 */
export declare class MockApiMixin implements MockBase {
    connection: MockConnection;
    /**
     * @inheritdoc
     */
    reset(): void;
    /**
     * @inheritdoc
     */
    simulateDelay(value: boolean): void;
    /**
     * @inheritdoc
     */
    createResource<T>(resource: string, primaryKey?: string, query?: MockQueryEvaluator<T>): void;
    /**
     * @inheritdoc
     */
    createBlackholeResource(resource: string): void;
    /**
     * @inheritdoc
     */
    addItem<T>(resource: string, item: T): void;
    /**
     * @inheritdoc
     */
    addItems<T>(resource: string, items: T[]): void;
    /**
     * @inheritdoc
     */
    updateItem<T>(resource: string, item: T): void;
    /**
     * @inheritdoc
     */
    removeItem(resource: string, itemId: string | number): void;
    /**
     * @inheritdoc
     */
    whenGet<T>(path: string | RegExp, handler: MockRequestHandler<T>): void;
    /**
     * @inheritdoc
     */
    whenPost<T>(path: string | RegExp, handler: MockRequestHandler<T>): void;
    /**
     * @inheritdoc
     */
    whenPut<T>(path: string | RegExp, handler: MockRequestHandler<T>): void;
    /**
     * @inheritdoc
     */
    whenPatch<T>(path: string | RegExp, handler: MockRequestHandler<T>): void;
    /**
     * @inheritdoc
     */
    whenDelete<T>(path: string | RegExp, handler: MockRequestHandler<T>): void;
}
export interface MockApiBase extends ResolweApi, MockApiMixin {
    connection: MockConnection;
    new (...args: any[]): MockApiBase;
    (...args: any[]): void;
}
export declare let MockApiBase: MockApiBase;
export declare class MockApi extends MockApiBase {
    constructor();
}
/**
 * Helper function for supporting pagination, which can be used as a [[MockQueryEvaluator]].
 */
export declare function paginateQuery<T>(query: any, items: T[]): T[];
/**
 * Helper function for supporting ordering.
 */
export declare function orderingQuery<T>(query: Query, items: T[]): T[];
/**
 * Helper function for supporting filtering by descriptor_completed, which can be used as a [[MockQueryEvaluator]].
 */
export declare function annotatedQuery<T extends SampleBase>(query: any, items: T[]): T[];
/**
 * Helper function for supporting filtering by slug, which can be used as a [[MockQueryEvaluator]].
 */
export declare function slugQuery<T extends CollectionBase | DataBase>(query: any, items: T[]): T[];
