import * as _ from 'lodash';
import * as Rx from 'rx';
import * as angular from 'angular';

import {isJsonable} from '../utils/lang';
import * as immutable from '../utils/immutable';

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

export class Actions {
    /// Internal action for setting this store to a specific value.
    public static SET = '@@internal/SET';
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
export abstract class SharedStore<T, U> {
    private _subject: Rx.BehaviorSubject<T>;
    private _dispatcher: Dispatcher;
    private _queries: {[name: string]: Rx.Observable<any>} = {};
    private _actions: U;
    private _storeId: string;

    constructor(actions?: U) {
        this._subject = new Rx.BehaviorSubject(this.initialState());
        this._actions = actions;

        // Create a local dispatcher.
        this._dispatcher = new Dispatcher();
        this._dispatcher.setDispatcher(this._dispatch.bind(this), this.value.bind(this));
    }

    /**
     * Returns a unique identifier for this shared store.
     */
    public get storeId(): string {
        return this._storeId;
    }

    /**
     * Returns store actions.
     */
    public get actions(): U {
        return this._actions;
    }

    /**
     * Internal dispatcher implementation.
     *
     * NOTE: This method is public because there is no way to define private
     * but accessible to other classes within this module in TypeScript.
     */
    public _dispatch(action: Action): void {
        const existingValue = this.value();
        let reducer: (value: T, action: Action) => T;
        if (_.startsWith(action.type, '@@internal/')) {
            reducer = this._reduceInternal.bind(this);
        } else {
            reducer = this.reduce.bind(this);
        }

        let newValue = reducer(existingValue, action);
        if (_.isUndefined(newValue)) return;

        if (angular.equals(existingValue, newValue)) return;
        this._subject.onNext(immutable.makeImmutable(newValue));
    }

    /**
     * Dispatches an action to this shared store.
     *
     * @param action Action to dispatch
     */
    public dispatch(action: Action | Thunk): any {
        return this._dispatcher.dispatch(action);
    }

    /**
     * Performs internal reduce actions implemented for each shared store.
     *
     * @param state Existing shared store state
     * @param action Action to perform
     * @return New shared store state
     */
    private _reduceInternal(state: T, action: Action): T {
        switch (action.type) {
            case Actions.SET: {
                const nextState = action['value'];
                return this.onStateLoad(state, nextState);
            }
            default: {
                // Do nothing.
            }
        }
    }

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
     * @param state Old state
     * @param nextState New state
     * @return Possibly modified state that should be used instead
     */
    protected onStateLoad(state: T, nextState: T): T {
        return nextState;
    }

    /**
     * A helper method for defining shared store queries. If the query is already
     * defined, the existing observable is returned.
     *
     * @param name Query name
     * @param query Query function
     * @return Resulting query observable
     */
    protected defineQuery<V>(name: string, query: SharedStoreQuery<T, V>): Rx.Observable<V> {
        let observable: Rx.Observable<V> = this._queries[name];
        if (observable) return observable;

        observable = this._queries[name] = this.observable().let(query).distinctUntilChanged();
        return observable;
    }

    /**
     * Returns the current value stored in the store.
     *
     * You MUST ensure that the resulting object is NOT mutated in any way. Any
     * mutation may cause undefined behavior.
     */
    public value(): T {
        return this._subject.getValue();
    }

    /**
     * Returns an observable of the store's value.
     *
     * You MUST ensure that the observed value is NOT mutated in any way. Any
     * mutation may cause undefined behavior.
     */
    public observable(): Rx.Observable<T> {
        return this._subject;
    }
}

/**
 * [[SimpleSharedStore]] is a helper class intended to be used as a type in conjunction with
 * [[SharedStoreProvider]]'s `create` method where only SET action is used.
 *
 * In this case no subclassing of store and actions is needed because only SET action is used.
 * This is convenient for use cases where you only need to set a value that you can subscribe
 * to from other components.
 */
export abstract class SimpleSharedStore<T> extends SharedStore<T, typeof undefined> { }

/**
 * Used to dispatch actions to shared stores.
 */
export class Dispatcher extends Rx.Subject<Action> {
    private _getState: () => any = () => undefined;

    /**
     * Configures a dispatcher function for this dispatcher.
     *
     * @param dispatcher The dispatcher function
     */
    public setDispatcher(dispatcher: (action: Action) => void, getState?: () => any): void {
        // The dispatcher is used to dispatch all actions using a queue, so actions
        // may invoke the dispatch method without causing recursion. The currentThread
        // scheduler puts all pending items inside a queue, which is dispatched after
        // returning from active dispatch.
        this.observeOn(Rx.Scheduler.currentThread).subscribe(dispatcher);
        if (getState) this._getState = getState;
    }

    /**
     * Dispatches an action via this dispatcher.
     */
    public dispatch(action: Action | Thunk): any {
        if (_.isFunction(action)) {
            // A thunk has been passed. Execute it with the dispatcher argument and
            // return the result.
            return action(this, this._getState);
        } else {
            this.onNext(action);
        }
    }
}

interface SharedStoreMap {
    [index: string]: SharedStore<any, any>;
}

export interface SharedStoreFactory<T, U> {
    new (...args): SharedStore<T, U>;
}

export interface ActionFactory {
    new (...args): any;
}

/**
 * Shared store provider, enabling registration of shared stores. All stores
 * must be registered in the application configuration phase.
 */
export class SharedStoreProvider {
    /// A list of registered stores.
    private _stores: string[] = [];
    /// Provide service.
    private _provide: angular.auto.IProvideService;

    // @ngInject
    constructor($provide: angular.auto.IProvideService) {
        this._provide = $provide;
    }

    /**
     * A list of registered stores.
     */
    public get stores(): string[] {
        return this._stores;
    }

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
    public create<T>(storeId: string, initialState: T = null): void {
        class Extended extends SimpleSharedStore<T> {
            protected initialState() { return initialState; }
            protected reduce(state: T, action: Action): T { return undefined; }
        }

        this.register<T>(storeId, Extended);
    }

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
    public register<T>(storeId: string, storeType: SharedStoreFactory<T, any>): void {
        // Register the store as an angular service. We use factory instead of service
        // so we can set the `_storeId` on the instance.
        this._provide.factory(
            storeIdToServiceId(storeId),
            // @ngInject
            ($injector: angular.auto.IInjectorService) => {
                const store: any = $injector.instantiate(storeType);
                store._storeId = storeId;
                return store;
            }
        );
        this._stores.push(storeId);
    }

    /**
     * Registers a new actions class.
     *
     * This method may only be called in the application's configuration
     * phase.
     *
     * @param actionsId Identifier of the actions class (must be globally unique)
     * @param Actions class
     */
    public registerActions(actionsId: string, actionsType: ActionFactory): void {
        this._provide.service(actionsIdToServiceId(actionsId), actionsType);
    }

    // @ngInject
    public $get($injector: angular.auto.IInjectorService,
                dispatcher: Dispatcher): SharedStoreManager {
        return new SharedStoreManager($injector, dispatcher, this);
    }
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
export class SharedStoreManager {
    /// Shared store provider.
    private _provider: SharedStoreProvider;
    /// Dispatcher.
    private _dispatcher: Dispatcher;
    /// Angular injector.
    private _injector: angular.auto.IInjectorService;

    // @ngInject
    constructor($injector: angular.auto.IInjectorService,
                dispatcher: Dispatcher,
                sharedStoreManagerProvider: SharedStoreProvider) {
        this._provider = sharedStoreManagerProvider;
        this._injector = $injector;
        this._dispatcher = dispatcher;
        this._dispatcher.setDispatcher(this._dispatch.bind(this));
    }

    /**
     * Returns a previously registered store. It is an error to request a store
     * which doesn't exist.
     *
     * @param storeId Identifier of the shared store
     * @return Shared store instance
     */
    public getStore<T>(storeId: string): SharedStore<T, any> {
        return this._injector.get<SharedStore<T, any>>(storeIdToServiceId(storeId));
    }

    /**
     * Dispatches an action to all shared stores.
     *
     * @param action Action to dispatch
     */
    public dispatch(action: Action | Thunk): any {
        return this._dispatcher.dispatch(action);
    }

    /**
     * Internal global dispatch implementation.
     */
    private _dispatch(action: Action): void {
        for (const storeId of this._provider.stores) {
            this.getStore(storeId)._dispatch(action);
        }
    }

    /**
     * Serializes the values of all shared stores.
     */
    public saveState(): any {
        let result = {};
        for (const storeId of this._provider.stores) {
            let value = this.getStore(storeId).value();
            if (isJsonable(value)) {
                result[storeId] = value.toJSON();
            } else {
                result[storeId] = angular.copy(value);
            }
        }

        return result;
    }

    /**
     * Loads serialized values of all shared stores. Existing values are overwritten.
     */
    public loadState(state: any): void {
        for (const storeId of this._provider.stores) {
            const value = state[storeId];
            if (!value) continue;

            this.getStore(storeId).dispatch({type: Actions.SET, value: value});
        }
    }
}

/**
 * Returns the Angular service identifier that can be used to inject a
 * store via dependency injection.
 *
 * @param storeId Store identifier
 */
function storeIdToServiceId(storeId: string): string {
    return _.camelCase(`${storeId}-store`);
}

/**
 * Returns the Angular service identifier that can be used to inject an
 * actions object via dependency injection.
 *
 * @param actionsId Actions object identifier
 */
function actionsIdToServiceId(actionsId: string): string {
    return _.camelCase(`${actionsId}-actions`);
}

const angularModule: angular.IModule = angular.module('resolwe.services.shared_store', []);

// Register injectable services.
angularModule.provider('sharedStoreManager', SharedStoreProvider);
angularModule.service('dispatcher', Dispatcher);
