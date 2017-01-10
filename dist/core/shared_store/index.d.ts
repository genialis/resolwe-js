/// <reference types="angular" />
import * as Rx from 'rx';
import * as angular from 'angular';
/**
 * A shared store action contains a `type` property and any number of other
 * custom properties. Action types starting with `@@internal/` are reserved
 * for internal use.
 */
export interface Action {
    type: string;
    [propertyName: string]: any;
}
/**
 * A thunk is a function, which mediates the dispatch of an action. It may
 * be dispatched in the same way as an action.
 */
export interface Thunk {
    (dispatcher: Dispatcher, getState: () => any): any;
}
export interface SharedStoreQuery<T, U> {
    (state: Rx.Observable<T>): Rx.Observable<U>;
}
export declare class Actions {
    static SET: string;
}
/**
 * A shared store represents state that is shared between multiple components in
 * a predictable way. Components update the store by dispatching actions to
 * it using the `dispatch` method.
 *
 * Each shared store also provides a way for the components to subscribe to any
 * changes in the store's state.
 *
 * Consider defining actions for use in a shared store separately from the store,
 * in the `actions` subdirectory. See [[SharedStoreManager]] for details.
 *
 * Don't forget to call constructor with actions as an argument when extending
 * this class.
 */
export declare abstract class SharedStore<T, U> {
    private _subject;
    private _dispatcher;
    private _queries;
    private _actions;
    private _storeId;
    constructor(actions?: U);
    /**
     * Returns a unique identifier for this shared store.
     */
    readonly storeId: string;
    /**
     * Returns store actions.
     */
    readonly actions: U;
    /**
     * Internal dispatcher implementation.
     *
     * NOTE: This method is public because there is no way to define private
     * but accessible to other classes within this module in TypeScript.
     */
    _dispatch(action: Action): void;
    /**
     * Dispatches an action to this shared store.
     *
     * @param action Action to dispatch
     */
    dispatch(action: Action | Thunk): any;
    /**
     * Performs internal reduce actions implemented for each shared store.
     *
     * @param state Existing shared store state
     * @param action Action to perform
     * @return New shared store state
     */
    private _reduceInternal(state, action);
    /**
     * Performs the given action on the underlying state.
     *
     * Subclasses may override this method to implement arbitrary complex
     * actions on the data store. This method MUST NOT mutate the existing
     * state. Instead, it MUST return an immutable copy.
     *
     * @param value Existing shared store state
     * @param action Operation to perform
     * @return New shared store state
     */
    protected abstract reduce(state: T, action: Action): T;
    /**
     * Provides the initial state for this shared store. This state is
     * used when the store is initialized.
     */
    protected abstract initialState(): T;
    /**
     * This method gets called when the data store's state is loaded from
     * an external source (when the SET action is dispatched to the store).
     *
     * It is called before the new state has been set. The default implementation
     * does nothing.
     *
     * @param state New state
     * @return Possibly modified state that should be used instead
     */
    protected onStateLoad(state: T): T;
    /**
     * A helper method for defining shared store queries. If the query is already
     * defined, the existing observable is returned.
     *
     * @param name Query name
     * @param query Query function
     * @return Resulting query observable
     */
    protected defineQuery<V>(name: string, query: SharedStoreQuery<T, V>): Rx.Observable<V>;
    /**
     * Returns the current value stored in the store.
     *
     * You MUST ensure that the resulting object is NOT mutated in any way. Any
     * mutation may cause undefined behavior.
     */
    value(): T;
    /**
     * Returns an observable of the store's value.
     *
     * You MUST ensure that the observed value is NOT mutated in any way. Any
     * mutation may cause undefined behavior.
     */
    observable(): Rx.Observable<T>;
}
/**
 * [[SimpleSharedStore]] is a helper class intended to be used as a type in conjunction with
 * [[SharedStoreProvider]]'s `create` method where only SET action is used.
 *
 * In this case no subclassing of store and actions is needed because only SET action is used.
 * This is convenient for use cases where you only need to set a value that you can subscribe
 * to from other components.
 */
export declare abstract class SimpleSharedStore<T> extends SharedStore<T, typeof undefined> {
}
/**
 * Used to dispatch actions to shared stores.
 */
export declare class Dispatcher extends Rx.Subject<Action> {
    private _getState;
    /**
     * Configures a dispatcher function for this dispatcher.
     *
     * @param dispatcher The dispatcher function
     */
    setDispatcher(dispatcher: (action: Action) => void, getState?: () => any): void;
    /**
     * Dispatches an action via this dispatcher.
     */
    dispatch(action: Action | Thunk): any;
}
export interface SharedStoreFactory<T, U> {
    new (...args: any[]): SharedStore<T, U>;
}
export interface ActionFactory {
    new (...args: any[]): any;
}
/**
 * Shared store provider, enabling registration of shared stores. All stores
 * must be registered in the application configuration phase.
 */
export declare class SharedStoreProvider {
    private _stores;
    private _provide;
    constructor($provide: angular.auto.IProvideService);
    /**
     * A list of registered stores.
     */
    readonly stores: string[];
    /**
     * Creates a new shared store.
     *
     * When choosing an identifier for the store, you should write it using
     * kebab-case and not include the string 'store' either as a prefix or
     * a suffix.
     *
     * This method may only be called in the application's configuration
     * phase.
     *
     * @param storeId Identifier of the shared store (must be globally unique)
     * @param initialState Optional initial state of the shared store
     */
    create<T>(storeId: string, initialState?: T): void;
    /**
     * Registers a new shared store. A store with the same name must not already
     * be registered.
     *
     * This method may only be called in the application's configuration
     * phase.
     *
     * @param storeId Identifier of the shared store (must be globally unique)
     * @param Shared store class
     */
    register<T>(storeId: string, storeType: SharedStoreFactory<T, any>): void;
    /**
     * Registers a new actions class.
     *
     * This method may only be called in the application's configuration
     * phase.
     *
     * @param actionsId Identifier of the actions class (must be globally unique)
     * @param Actions class
     */
    registerActions(actionsId: string, actionsType: ActionFactory): void;
    $get($injector: angular.auto.IInjectorService, dispatcher: Dispatcher): SharedStoreManager;
}
/**
 * Manager of all shared stores (see [[SharedStore]]) in an application. Each store
 * requires a globally unique identifier, which is also used during state serialization.
 *
 * In order to use shared stores, you must first create them. The best way to do
 * this is inside your module's `config` function as follows:
 * ```
 * module.config((sharedStoreManagerProvider: SharedStoreProvider) => {
 *     // Create the selected ROSE2 data items shared store.
 *     sharedStoreManagerProvider.create('rose2-selected-data-item');
 * });
 * ```
 *
 * The store may then be used as input to shared state defined on stateful
 * components (see [[StatefulComponentBase]]) and can also be injected using
 * a specific token. If a store is named `my-nice-items`, it will be injectable
 * by using the token `myNiceItemsStore`.
 *
 * If you wish to define shared stores which support additional actions, you
 * should subclass [[SharedStore]] and register your store by using [[register]]
 * as follows:
 * ```
 * class ComplexActions {
 *     static ADD_ITEM = 'complex/add_item';
 *     public addItem(value: types.SampleData) {
 *         return { type: ComplexActions.ADD_ITEM, item: value };
 *     }
 * }
 *
 * class ComplexStore extends SharedStore<types.SampleData[], ComplexActions> {
 *     // @ngInject
 *     constructor(complexActions: ComplexActions) {
 *         super(complexActions);
 *     }
 *
 *     protected initialState(): types.SampleData[] {
 *         return [];
 *     }
 *
 *     protected reduce(state: types.SampleData[], action: any): void {
 *         switch (action.type) {
 *             case ADD_ITEM: {
 *                 return _.union(state, action.item);
 *             }
 *             // ...
 *         }
 *     }
 * }
 *
 * module.config((sharedStoreManagerProvider: SharedStoreProvider) => {
 *     sharedStoreManagerProvider.registerActions('complex', ComplexActions);
 *     sharedStoreManagerProvider.register('complex', ComplexStore);
 * });
 * ```
 *
 * When creating a new shared store, a good design practice is to separate
 * actions into the `actions` directory and implement actions as methods on
 * the actions class named after your store (eg. for store `FooStore` put
 * actions into `FooActions`).
 *
 * Stores themselves should only implement the state management functionality
 * and most business logic should be contained in the actions class. For
 * example, if actions require some asynchronous operations to be performed
 * on a remote backend all this functionality should be put into the actions
 * class and not into the store.
 *
 * All actions classes should be registered via the [[SharedStoreProvider]]
 * and support Angular dependency injection. Actions classes are injectable
 * under the token `idActions` where the `id` part is the value defined by
 * `actionsId`, formatted in camelCase. The constructor of an actions
 * class may also inject other dependencies.
 *
 * For convenience, you may inject your actions class in your shared store
 * class under the public attribute `actions`. This way one may get the
 * actions class simply by accessing `store.actions` when given a shared
 * store instance.
 */
export declare class SharedStoreManager {
    private _provider;
    private _dispatcher;
    private _injector;
    constructor($injector: angular.auto.IInjectorService, dispatcher: Dispatcher, sharedStoreManagerProvider: SharedStoreProvider);
    /**
     * Returns a previously registered store. It is an error to request a store
     * which doesn't exist.
     *
     * @param storeId Identifier of the shared store
     * @return Shared store instance
     */
    getStore<T>(storeId: string): SharedStore<T, any>;
    /**
     * Dispatches an action to all shared stores.
     *
     * @param action Action to dispatch
     */
    dispatch(action: Action | Thunk): any;
    /**
     * Internal global dispatch implementation.
     */
    private _dispatch(action);
    /**
     * Serializes the values of all shared stores.
     */
    saveState(): any;
    /**
     * Loads serialized values of all shared stores. Existing values are overwritten.
     */
    loadState(state: any): void;
}
