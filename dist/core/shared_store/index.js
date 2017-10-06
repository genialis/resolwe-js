"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var Rx = require("rx");
var angular = require("angular");
var lang_1 = require("../utils/lang");
var immutable = require("../utils/immutable");
var Actions = /** @class */ (function () {
    function Actions() {
    }
    /// Internal action for setting this store to a specific value.
    Actions.SET = '@@internal/SET';
    return Actions;
}());
exports.Actions = Actions;
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
var SharedStore = /** @class */ (function () {
    function SharedStore(actions) {
        this._queries = {};
        this._subject = new Rx.BehaviorSubject(this.initialState());
        this._actions = actions;
        // Create a local dispatcher.
        this._dispatcher = new Dispatcher();
        this._dispatcher.setDispatcher(this._dispatch.bind(this), this.value.bind(this));
    }
    Object.defineProperty(SharedStore.prototype, "storeId", {
        /**
         * Returns a unique identifier for this shared store.
         */
        get: function () {
            return this._storeId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SharedStore.prototype, "actions", {
        /**
         * Returns store actions.
         */
        get: function () {
            return this._actions;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Internal dispatcher implementation.
     *
     * NOTE: This method is public because there is no way to define private
     * but accessible to other classes within this module in TypeScript.
     */
    SharedStore.prototype._dispatch = function (action) {
        var existingValue = this.value();
        var reducer;
        if (_.startsWith(action.type, '@@internal/')) {
            reducer = this._reduceInternal.bind(this);
        }
        else {
            reducer = this.reduce.bind(this);
        }
        var newValue = reducer(existingValue, action);
        if (_.isUndefined(newValue))
            return;
        if (angular.equals(existingValue, newValue))
            return;
        this._subject.onNext(immutable.makeImmutable(newValue));
    };
    /**
     * Dispatches an action to this shared store.
     *
     * @param action Action to dispatch
     */
    SharedStore.prototype.dispatch = function (action) {
        return this._dispatcher.dispatch(action);
    };
    /**
     * Performs internal reduce actions implemented for each shared store.
     *
     * @param state Existing shared store state
     * @param action Action to perform
     * @return New shared store state
     */
    SharedStore.prototype._reduceInternal = function (state, action) {
        switch (action.type) {
            case Actions.SET: {
                var nextState = action['value'];
                return this.onStateLoad(state, nextState);
            }
            default: {
                // Do nothing.
            }
        }
    };
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
    SharedStore.prototype.onStateLoad = function (state, nextState) {
        return nextState;
    };
    /**
     * A helper method for defining shared store queries. If the query is already
     * defined, the existing observable is returned.
     *
     * @param name Query name
     * @param query Query function
     * @return Resulting query observable
     */
    SharedStore.prototype.defineQuery = function (name, query) {
        var observable = this._queries[name];
        if (observable)
            return observable;
        observable = this._queries[name] = this.observable().let(query).distinctUntilChanged();
        return observable;
    };
    /**
     * Returns the current value stored in the store.
     *
     * You MUST ensure that the resulting object is NOT mutated in any way. Any
     * mutation may cause undefined behavior.
     */
    SharedStore.prototype.value = function () {
        return this._subject.getValue();
    };
    /**
     * Returns an observable of the store's value.
     *
     * You MUST ensure that the observed value is NOT mutated in any way. Any
     * mutation may cause undefined behavior.
     */
    SharedStore.prototype.observable = function () {
        return this._subject;
    };
    /**
     * Returns a value that should be used when saving store state.
     *
     * By default, this will return the same as [[value]].
     */
    SharedStore.prototype.saveValue = function () {
        return this.value();
    };
    return SharedStore;
}());
exports.SharedStore = SharedStore;
/**
 * [[SimpleSharedStore]] is a helper class intended to be used as a type in conjunction with
 * [[SharedStoreProvider]]'s `create` method where only SET action is used.
 *
 * In this case no subclassing of store and actions is needed because only SET action is used.
 * This is convenient for use cases where you only need to set a value that you can subscribe
 * to from other components.
 */
var SimpleSharedStore = /** @class */ (function (_super) {
    __extends(SimpleSharedStore, _super);
    function SimpleSharedStore() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return SimpleSharedStore;
}(SharedStore));
exports.SimpleSharedStore = SimpleSharedStore;
/**
 * Used to dispatch actions to shared stores.
 */
var Dispatcher = /** @class */ (function (_super) {
    __extends(Dispatcher, _super);
    function Dispatcher() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._getState = function () { return undefined; };
        return _this;
    }
    /**
     * Configures a dispatcher function for this dispatcher.
     *
     * @param dispatcher The dispatcher function
     */
    Dispatcher.prototype.setDispatcher = function (dispatcher, getState) {
        // The dispatcher is used to dispatch all actions using a queue, so actions
        // may invoke the dispatch method without causing recursion. The currentThread
        // scheduler puts all pending items inside a queue, which is dispatched after
        // returning from active dispatch.
        this.observeOn(Rx.Scheduler.currentThread).subscribe(dispatcher);
        if (getState)
            this._getState = getState;
    };
    /**
     * Dispatches an action via this dispatcher.
     */
    Dispatcher.prototype.dispatch = function (action) {
        if (_.isFunction(action)) {
            // A thunk has been passed. Execute it with the dispatcher argument and
            // return the result.
            return action(this, this._getState);
        }
        else {
            this.onNext(action);
        }
    };
    return Dispatcher;
}(Rx.Subject));
exports.Dispatcher = Dispatcher;
/**
 * Shared store provider, enabling registration of shared stores. All stores
 * must be registered in the application configuration phase.
 */
var SharedStoreProvider = /** @class */ (function () {
    // @ngInject
    SharedStoreProvider.$inject = ["$provide"];
    function SharedStoreProvider($provide) {
        /// A list of registered stores.
        this._stores = [];
        this._provide = $provide;
    }
    Object.defineProperty(SharedStoreProvider.prototype, "stores", {
        /**
         * A list of registered stores.
         */
        get: function () {
            return this._stores;
        },
        enumerable: true,
        configurable: true
    });
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
    SharedStoreProvider.prototype.create = function (storeId, initialState) {
        if (initialState === void 0) { initialState = null; }
        var Extended = /** @class */ (function (_super) {
            __extends(Extended, _super);
            function Extended() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Extended.prototype.initialState = function () { return initialState; };
            Extended.prototype.reduce = function (state, action) { return undefined; };
            return Extended;
        }(SimpleSharedStore));
        this.register(storeId, Extended);
    };
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
    SharedStoreProvider.prototype.register = function (storeId, storeType) {
        // Register the store as an angular service. We use factory instead of service
        // so we can set the `_storeId` on the instance.
        this._provide.factory(storeIdToServiceId(storeId), 
        // @ngInject
        ["$injector", function ($injector) {
            var store = $injector.instantiate(storeType);
            store._storeId = storeId;
            return store;
        }]);
        this._stores.push(storeId);
    };
    /**
     * Registers a new actions class.
     *
     * This method may only be called in the application's configuration
     * phase.
     *
     * @param actionsId Identifier of the actions class (must be globally unique)
     * @param Actions class
     */
    SharedStoreProvider.prototype.registerActions = function (actionsId, actionsType) {
        this._provide.service(actionsIdToServiceId(actionsId), actionsType);
    };
    // @ngInject
    SharedStoreProvider.prototype.$get = function ($injector, dispatcher) {
        return new SharedStoreManager($injector, dispatcher, this);
    };
    SharedStoreProvider.prototype.$get.$inject = ["$injector", "dispatcher"];
    return SharedStoreProvider;
}());
exports.SharedStoreProvider = SharedStoreProvider;
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
var SharedStoreManager = /** @class */ (function () {
    // @ngInject
    SharedStoreManager.$inject = ["$injector", "dispatcher", "sharedStoreManagerProvider"];
    function SharedStoreManager($injector, dispatcher, sharedStoreManagerProvider) {
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
    SharedStoreManager.prototype.getStore = function (storeId) {
        return this._injector.get(storeIdToServiceId(storeId));
    };
    /**
     * Dispatches an action to all shared stores.
     *
     * @param action Action to dispatch
     */
    SharedStoreManager.prototype.dispatch = function (action) {
        return this._dispatcher.dispatch(action);
    };
    /**
     * Internal global dispatch implementation.
     */
    SharedStoreManager.prototype._dispatch = function (action) {
        for (var _i = 0, _a = this._provider.stores; _i < _a.length; _i++) {
            var storeId = _a[_i];
            this.getStore(storeId)._dispatch(action);
        }
    };
    /**
     * Serializes the values of all shared stores.
     */
    SharedStoreManager.prototype.saveState = function () {
        var result = {};
        for (var _i = 0, _a = this._provider.stores; _i < _a.length; _i++) {
            var storeId = _a[_i];
            var value = this.getStore(storeId).saveValue();
            if (lang_1.isJsonable(value)) {
                result[storeId] = value.toJSON();
            }
            else {
                result[storeId] = angular.copy(value);
            }
        }
        return result;
    };
    /**
     * Loads serialized values of all shared stores. Existing values are overwritten.
     */
    SharedStoreManager.prototype.loadState = function (state) {
        for (var _i = 0, _a = this._provider.stores; _i < _a.length; _i++) {
            var storeId = _a[_i];
            var value = state[storeId];
            if (!value)
                continue;
            this.getStore(storeId).dispatch({ type: Actions.SET, value: value });
        }
    };
    return SharedStoreManager;
}());
exports.SharedStoreManager = SharedStoreManager;
/**
 * Returns the Angular service identifier that can be used to inject a
 * store via dependency injection.
 *
 * @param storeId Store identifier
 */
function storeIdToServiceId(storeId) {
    return _.camelCase(storeId + "-store");
}
/**
 * Returns the Angular service identifier that can be used to inject an
 * actions object via dependency injection.
 *
 * @param actionsId Actions object identifier
 */
function actionsIdToServiceId(actionsId) {
    return _.camelCase(actionsId + "-actions");
}
var angularModule = angular.module('resolwe.services.shared_store', []);
// Register injectable services.
angularModule.provider('sharedStoreManager', SharedStoreProvider);
angularModule.service('dispatcher', Dispatcher);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL3NoYXJlZF9zdG9yZS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwwQkFBNEI7QUFDNUIsdUJBQXlCO0FBQ3pCLGlDQUFtQztBQUVuQyxzQ0FBeUM7QUFDekMsOENBQWdEO0FBd0JoRDtJQUFBO0lBR0EsQ0FBQztJQUZHLCtEQUErRDtJQUNqRCxXQUFHLEdBQUcsZ0JBQWdCLENBQUM7SUFDekMsY0FBQztDQUhELEFBR0MsSUFBQTtBQUhZLDBCQUFPO0FBS3BCOzs7Ozs7Ozs7Ozs7O0dBYUc7QUFDSDtJQU9JLHFCQUFZLE9BQVc7UUFKZixhQUFRLEdBQXlDLEVBQUUsQ0FBQztRQUt4RCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUM1RCxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztRQUV4Qiw2QkFBNkI7UUFDN0IsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLFVBQVUsRUFBRSxDQUFDO1FBQ3BDLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDckYsQ0FBQztJQUtELHNCQUFXLGdDQUFPO1FBSGxCOztXQUVHO2FBQ0g7WUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN6QixDQUFDOzs7T0FBQTtJQUtELHNCQUFXLGdDQUFPO1FBSGxCOztXQUVHO2FBQ0g7WUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN6QixDQUFDOzs7T0FBQTtJQUVEOzs7OztPQUtHO0lBQ0ksK0JBQVMsR0FBaEIsVUFBaUIsTUFBYztRQUMzQixJQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDbkMsSUFBSSxPQUF3QyxDQUFDO1FBQzdDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0MsT0FBTyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNKLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRUQsSUFBSSxRQUFRLEdBQUcsT0FBTyxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUM5QyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQUMsTUFBTSxDQUFDO1FBRXBDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQUMsTUFBTSxDQUFDO1FBQ3BELElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNJLDhCQUFRLEdBQWYsVUFBZ0IsTUFBc0I7UUFDbEMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSyxxQ0FBZSxHQUF2QixVQUF3QixLQUFRLEVBQUUsTUFBYztRQUM1QyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNsQixLQUFLLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDZixJQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ2xDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM5QyxDQUFDO1lBQ0QsU0FBUyxDQUFDO2dCQUNOLGNBQWM7WUFDbEIsQ0FBQztRQUNMLENBQUM7SUFDTCxDQUFDO0lBcUJEOzs7Ozs7Ozs7O09BVUc7SUFDTyxpQ0FBVyxHQUFyQixVQUFzQixLQUFRLEVBQUUsU0FBWTtRQUN4QyxNQUFNLENBQUMsU0FBUyxDQUFDO0lBQ3JCLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ08saUNBQVcsR0FBckIsVUFBeUIsSUFBWSxFQUFFLEtBQTZCO1FBQ2hFLElBQUksVUFBVSxHQUFxQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZELEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQztZQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUM7UUFFbEMsVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1FBQ3ZGLE1BQU0sQ0FBQyxVQUFVLENBQUM7SUFDdEIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ksMkJBQUssR0FBWjtRQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ3BDLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNJLGdDQUFVLEdBQWpCO1FBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7SUFDekIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSwrQkFBUyxHQUFoQjtRQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDeEIsQ0FBQztJQUNMLGtCQUFDO0FBQUQsQ0E5SkEsQUE4SkMsSUFBQTtBQTlKcUIsa0NBQVc7QUFnS2pDOzs7Ozs7O0dBT0c7QUFDSDtJQUFtRCxxQ0FBZ0M7SUFBbkY7O0lBQXNGLENBQUM7SUFBRCx3QkFBQztBQUFELENBQXRGLEFBQXVGLENBQXBDLFdBQVcsR0FBeUI7QUFBakUsOENBQWlCO0FBRXZDOztHQUVHO0FBQ0g7SUFBZ0MsOEJBQWtCO0lBQWxEO1FBQUEscUVBNkJDO1FBNUJXLGVBQVMsR0FBYyxjQUFNLE9BQUEsU0FBUyxFQUFULENBQVMsQ0FBQzs7SUE0Qm5ELENBQUM7SUExQkc7Ozs7T0FJRztJQUNJLGtDQUFhLEdBQXBCLFVBQXFCLFVBQW9DLEVBQUUsUUFBb0I7UUFDM0UsMkVBQTJFO1FBQzNFLDhFQUE4RTtRQUM5RSw2RUFBNkU7UUFDN0Usa0NBQWtDO1FBQ2xDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDakUsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDO1lBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7SUFDNUMsQ0FBQztJQUVEOztPQUVHO0lBQ0ksNkJBQVEsR0FBZixVQUFnQixNQUFzQjtRQUNsQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2Qix1RUFBdUU7WUFDdkUscUJBQXFCO1lBQ3JCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3hCLENBQUM7SUFDTCxDQUFDO0lBQ0wsaUJBQUM7QUFBRCxDQTdCQSxBQTZCQyxDQTdCK0IsRUFBRSxDQUFDLE9BQU8sR0E2QnpDO0FBN0JZLGdDQUFVO0FBMkN2Qjs7O0dBR0c7QUFDSDtJQU1JLFlBQVk7SUFDWiw2QkFBWSxRQUFzQztRQU5sRCxnQ0FBZ0M7UUFDeEIsWUFBTyxHQUFhLEVBQUUsQ0FBQztRQU0zQixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztJQUM3QixDQUFDO0lBS0Qsc0JBQVcsdUNBQU07UUFIakI7O1dBRUc7YUFDSDtZQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3hCLENBQUM7OztPQUFBO0lBRUQ7Ozs7Ozs7Ozs7OztPQVlHO0lBQ0ksb0NBQU0sR0FBYixVQUFpQixPQUFlLEVBQUUsWUFBc0I7UUFBdEIsNkJBQUEsRUFBQSxtQkFBc0I7UUFDcEQ7WUFBdUIsNEJBQW9CO1lBQTNDOztZQUdBLENBQUM7WUFGYSwrQkFBWSxHQUF0QixjQUEyQixNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUN2Qyx5QkFBTSxHQUFoQixVQUFpQixLQUFRLEVBQUUsTUFBYyxJQUFPLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ3ZFLGVBQUM7UUFBRCxDQUhBLEFBR0MsQ0FIc0IsaUJBQWlCLEdBR3ZDO1FBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBSSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVEOzs7Ozs7Ozs7T0FTRztJQUNJLHNDQUFRLEdBQWYsVUFBbUIsT0FBZSxFQUFFLFNBQXFDO1FBQ3JFLDhFQUE4RTtRQUM5RSxnREFBZ0Q7UUFDaEQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQ2pCLGtCQUFrQixDQUFDLE9BQU8sQ0FBQztRQUMzQixZQUFZO1FBQ1osVUFBQyxTQUF3QztZQUNyQyxJQUFNLEtBQUssR0FBUSxTQUFTLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3BELEtBQUssQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO1lBQ3pCLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFDakIsQ0FBQyxDQUNKLENBQUM7UUFDRixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSSw2Q0FBZSxHQUF0QixVQUF1QixTQUFpQixFQUFFLFdBQTBCO1FBQ2hFLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ3hFLENBQUM7SUFFRCxZQUFZO0lBQ0wsa0NBQUksR0FBWCxVQUFZLFNBQXdDLEVBQ3hDLFVBQXNCO1FBQzlCLE1BQU0sQ0FBQyxJQUFJLGtCQUFrQixDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDL0QsQ0FBQztJQUNMLDBCQUFDO0FBQUQsQ0FuRkEsQUFtRkMsSUFBQTtBQW5GWSxrREFBbUI7QUFxRmhDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBNEVHO0FBQ0g7SUFRSSxZQUFZO0lBQ1osNEJBQVksU0FBd0MsRUFDeEMsVUFBc0IsRUFDdEIsMEJBQStDO1FBQ3ZELElBQUksQ0FBQyxTQUFTLEdBQUcsMEJBQTBCLENBQUM7UUFDNUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFDM0IsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7UUFDOUIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0kscUNBQVEsR0FBZixVQUFtQixPQUFlO1FBQzlCLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBc0Isa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUNoRixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNJLHFDQUFRLEdBQWYsVUFBZ0IsTUFBc0I7UUFDbEMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFRDs7T0FFRztJQUNLLHNDQUFTLEdBQWpCLFVBQWtCLE1BQWM7UUFDNUIsR0FBRyxDQUFDLENBQWtCLFVBQXFCLEVBQXJCLEtBQUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQXJCLGNBQXFCLEVBQXJCLElBQXFCO1lBQXRDLElBQU0sT0FBTyxTQUFBO1lBQ2QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDNUM7SUFDTCxDQUFDO0lBRUQ7O09BRUc7SUFDSSxzQ0FBUyxHQUFoQjtRQUNJLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNoQixHQUFHLENBQUMsQ0FBa0IsVUFBcUIsRUFBckIsS0FBQSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBckIsY0FBcUIsRUFBckIsSUFBcUI7WUFBdEMsSUFBTSxPQUFPLFNBQUE7WUFDZCxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQy9DLEVBQUUsQ0FBQyxDQUFDLGlCQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwQixNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3JDLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSixNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMxQyxDQUFDO1NBQ0o7UUFFRCxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFFRDs7T0FFRztJQUNJLHNDQUFTLEdBQWhCLFVBQWlCLEtBQVU7UUFDdkIsR0FBRyxDQUFDLENBQWtCLFVBQXFCLEVBQXJCLEtBQUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQXJCLGNBQXFCLEVBQXJCLElBQXFCO1lBQXRDLElBQU0sT0FBTyxTQUFBO1lBQ2QsSUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzdCLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO2dCQUFDLFFBQVEsQ0FBQztZQUVyQixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFDLElBQUksRUFBRSxPQUFPLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDO1NBQ3RFO0lBQ0wsQ0FBQztJQUNMLHlCQUFDO0FBQUQsQ0EzRUEsQUEyRUMsSUFBQTtBQTNFWSxnREFBa0I7QUE2RS9COzs7OztHQUtHO0FBQ0gsNEJBQTRCLE9BQWU7SUFDdkMsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUksT0FBTyxXQUFRLENBQUMsQ0FBQztBQUMzQyxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCw4QkFBOEIsU0FBaUI7SUFDM0MsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUksU0FBUyxhQUFVLENBQUMsQ0FBQztBQUMvQyxDQUFDO0FBRUQsSUFBTSxhQUFhLEdBQW9CLE9BQU8sQ0FBQyxNQUFNLENBQUMsK0JBQStCLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFFM0YsZ0NBQWdDO0FBQ2hDLGFBQWEsQ0FBQyxRQUFRLENBQUMsb0JBQW9CLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztBQUNsRSxhQUFhLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQyIsImZpbGUiOiJjb3JlL3NoYXJlZF9zdG9yZS9pbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIFJ4IGZyb20gJ3J4JztcbmltcG9ydCAqIGFzIGFuZ3VsYXIgZnJvbSAnYW5ndWxhcic7XG5cbmltcG9ydCB7aXNKc29uYWJsZX0gZnJvbSAnLi4vdXRpbHMvbGFuZyc7XG5pbXBvcnQgKiBhcyBpbW11dGFibGUgZnJvbSAnLi4vdXRpbHMvaW1tdXRhYmxlJztcblxuLyoqXG4gKiBBIHNoYXJlZCBzdG9yZSBhY3Rpb24gY29udGFpbnMgYSBgdHlwZWAgcHJvcGVydHkgYW5kIGFueSBudW1iZXIgb2Ygb3RoZXJcbiAqIGN1c3RvbSBwcm9wZXJ0aWVzLiBBY3Rpb24gdHlwZXMgc3RhcnRpbmcgd2l0aCBgQEBpbnRlcm5hbC9gIGFyZSByZXNlcnZlZFxuICogZm9yIGludGVybmFsIHVzZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBY3Rpb24ge1xuICAgIHR5cGU6IHN0cmluZztcbiAgICBbcHJvcGVydHlOYW1lOiBzdHJpbmddOiBhbnk7XG59XG5cbi8qKlxuICogQSB0aHVuayBpcyBhIGZ1bmN0aW9uLCB3aGljaCBtZWRpYXRlcyB0aGUgZGlzcGF0Y2ggb2YgYW4gYWN0aW9uLiBJdCBtYXlcbiAqIGJlIGRpc3BhdGNoZWQgaW4gdGhlIHNhbWUgd2F5IGFzIGFuIGFjdGlvbi5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUaHVuayB7XG4gICAgKGRpc3BhdGNoZXI6IERpc3BhdGNoZXIsIGdldFN0YXRlOiAoKSA9PiBhbnkpOiBhbnk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2hhcmVkU3RvcmVRdWVyeTxULCBVPiB7XG4gICAgKHN0YXRlOiBSeC5PYnNlcnZhYmxlPFQ+KTogUnguT2JzZXJ2YWJsZTxVPjtcbn1cblxuZXhwb3J0IGNsYXNzIEFjdGlvbnMge1xuICAgIC8vLyBJbnRlcm5hbCBhY3Rpb24gZm9yIHNldHRpbmcgdGhpcyBzdG9yZSB0byBhIHNwZWNpZmljIHZhbHVlLlxuICAgIHB1YmxpYyBzdGF0aWMgU0VUID0gJ0BAaW50ZXJuYWwvU0VUJztcbn1cblxuLyoqXG4gKiBBIHNoYXJlZCBzdG9yZSByZXByZXNlbnRzIHN0YXRlIHRoYXQgaXMgc2hhcmVkIGJldHdlZW4gbXVsdGlwbGUgY29tcG9uZW50cyBpblxuICogYSBwcmVkaWN0YWJsZSB3YXkuIENvbXBvbmVudHMgdXBkYXRlIHRoZSBzdG9yZSBieSBkaXNwYXRjaGluZyBhY3Rpb25zIHRvXG4gKiBpdCB1c2luZyB0aGUgYGRpc3BhdGNoYCBtZXRob2QuXG4gKlxuICogRWFjaCBzaGFyZWQgc3RvcmUgYWxzbyBwcm92aWRlcyBhIHdheSBmb3IgdGhlIGNvbXBvbmVudHMgdG8gc3Vic2NyaWJlIHRvIGFueVxuICogY2hhbmdlcyBpbiB0aGUgc3RvcmUncyBzdGF0ZS5cbiAqXG4gKiBDb25zaWRlciBkZWZpbmluZyBhY3Rpb25zIGZvciB1c2UgaW4gYSBzaGFyZWQgc3RvcmUgc2VwYXJhdGVseSBmcm9tIHRoZSBzdG9yZSxcbiAqIGluIHRoZSBgYWN0aW9uc2Agc3ViZGlyZWN0b3J5LiBTZWUgW1tTaGFyZWRTdG9yZU1hbmFnZXJdXSBmb3IgZGV0YWlscy5cbiAqXG4gKiBEb24ndCBmb3JnZXQgdG8gY2FsbCBjb25zdHJ1Y3RvciB3aXRoIGFjdGlvbnMgYXMgYW4gYXJndW1lbnQgd2hlbiBleHRlbmRpbmdcbiAqIHRoaXMgY2xhc3MuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTaGFyZWRTdG9yZTxULCBVPiB7XG4gICAgcHJpdmF0ZSBfc3ViamVjdDogUnguQmVoYXZpb3JTdWJqZWN0PFQ+O1xuICAgIHByaXZhdGUgX2Rpc3BhdGNoZXI6IERpc3BhdGNoZXI7XG4gICAgcHJpdmF0ZSBfcXVlcmllczoge1tuYW1lOiBzdHJpbmddOiBSeC5PYnNlcnZhYmxlPGFueT59ID0ge307XG4gICAgcHJpdmF0ZSBfYWN0aW9uczogVTtcbiAgICBwcml2YXRlIF9zdG9yZUlkOiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3RvcihhY3Rpb25zPzogVSkge1xuICAgICAgICB0aGlzLl9zdWJqZWN0ID0gbmV3IFJ4LkJlaGF2aW9yU3ViamVjdCh0aGlzLmluaXRpYWxTdGF0ZSgpKTtcbiAgICAgICAgdGhpcy5fYWN0aW9ucyA9IGFjdGlvbnM7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGEgbG9jYWwgZGlzcGF0Y2hlci5cbiAgICAgICAgdGhpcy5fZGlzcGF0Y2hlciA9IG5ldyBEaXNwYXRjaGVyKCk7XG4gICAgICAgIHRoaXMuX2Rpc3BhdGNoZXIuc2V0RGlzcGF0Y2hlcih0aGlzLl9kaXNwYXRjaC5iaW5kKHRoaXMpLCB0aGlzLnZhbHVlLmJpbmQodGhpcykpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSB1bmlxdWUgaWRlbnRpZmllciBmb3IgdGhpcyBzaGFyZWQgc3RvcmUuXG4gICAgICovXG4gICAgcHVibGljIGdldCBzdG9yZUlkKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdG9yZUlkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgc3RvcmUgYWN0aW9ucy5cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IGFjdGlvbnMoKTogVSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hY3Rpb25zO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludGVybmFsIGRpc3BhdGNoZXIgaW1wbGVtZW50YXRpb24uXG4gICAgICpcbiAgICAgKiBOT1RFOiBUaGlzIG1ldGhvZCBpcyBwdWJsaWMgYmVjYXVzZSB0aGVyZSBpcyBubyB3YXkgdG8gZGVmaW5lIHByaXZhdGVcbiAgICAgKiBidXQgYWNjZXNzaWJsZSB0byBvdGhlciBjbGFzc2VzIHdpdGhpbiB0aGlzIG1vZHVsZSBpbiBUeXBlU2NyaXB0LlxuICAgICAqL1xuICAgIHB1YmxpYyBfZGlzcGF0Y2goYWN0aW9uOiBBY3Rpb24pOiB2b2lkIHtcbiAgICAgICAgY29uc3QgZXhpc3RpbmdWYWx1ZSA9IHRoaXMudmFsdWUoKTtcbiAgICAgICAgbGV0IHJlZHVjZXI6ICh2YWx1ZTogVCwgYWN0aW9uOiBBY3Rpb24pID0+IFQ7XG4gICAgICAgIGlmIChfLnN0YXJ0c1dpdGgoYWN0aW9uLnR5cGUsICdAQGludGVybmFsLycpKSB7XG4gICAgICAgICAgICByZWR1Y2VyID0gdGhpcy5fcmVkdWNlSW50ZXJuYWwuYmluZCh0aGlzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlZHVjZXIgPSB0aGlzLnJlZHVjZS5iaW5kKHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5ld1ZhbHVlID0gcmVkdWNlcihleGlzdGluZ1ZhbHVlLCBhY3Rpb24pO1xuICAgICAgICBpZiAoXy5pc1VuZGVmaW5lZChuZXdWYWx1ZSkpIHJldHVybjtcblxuICAgICAgICBpZiAoYW5ndWxhci5lcXVhbHMoZXhpc3RpbmdWYWx1ZSwgbmV3VmFsdWUpKSByZXR1cm47XG4gICAgICAgIHRoaXMuX3N1YmplY3Qub25OZXh0KGltbXV0YWJsZS5tYWtlSW1tdXRhYmxlKG5ld1ZhbHVlKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGlzcGF0Y2hlcyBhbiBhY3Rpb24gdG8gdGhpcyBzaGFyZWQgc3RvcmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYWN0aW9uIEFjdGlvbiB0byBkaXNwYXRjaFxuICAgICAqL1xuICAgIHB1YmxpYyBkaXNwYXRjaChhY3Rpb246IEFjdGlvbiB8IFRodW5rKTogYW55IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Rpc3BhdGNoZXIuZGlzcGF0Y2goYWN0aW9uKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtcyBpbnRlcm5hbCByZWR1Y2UgYWN0aW9ucyBpbXBsZW1lbnRlZCBmb3IgZWFjaCBzaGFyZWQgc3RvcmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc3RhdGUgRXhpc3Rpbmcgc2hhcmVkIHN0b3JlIHN0YXRlXG4gICAgICogQHBhcmFtIGFjdGlvbiBBY3Rpb24gdG8gcGVyZm9ybVxuICAgICAqIEByZXR1cm4gTmV3IHNoYXJlZCBzdG9yZSBzdGF0ZVxuICAgICAqL1xuICAgIHByaXZhdGUgX3JlZHVjZUludGVybmFsKHN0YXRlOiBULCBhY3Rpb246IEFjdGlvbik6IFQge1xuICAgICAgICBzd2l0Y2ggKGFjdGlvbi50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIEFjdGlvbnMuU0VUOiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV4dFN0YXRlID0gYWN0aW9uWyd2YWx1ZSddO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9uU3RhdGVMb2FkKHN0YXRlLCBuZXh0U3RhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgICAgICAgIC8vIERvIG5vdGhpbmcuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtcyB0aGUgZ2l2ZW4gYWN0aW9uIG9uIHRoZSB1bmRlcmx5aW5nIHN0YXRlLlxuICAgICAqXG4gICAgICogU3ViY2xhc3NlcyBtYXkgb3ZlcnJpZGUgdGhpcyBtZXRob2QgdG8gaW1wbGVtZW50IGFyYml0cmFyeSBjb21wbGV4XG4gICAgICogYWN0aW9ucyBvbiB0aGUgZGF0YSBzdG9yZS4gVGhpcyBtZXRob2QgTVVTVCBOT1QgbXV0YXRlIHRoZSBleGlzdGluZ1xuICAgICAqIHN0YXRlLiBJbnN0ZWFkLCBpdCBNVVNUIHJldHVybiBhbiBpbW11dGFibGUgY29weS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB2YWx1ZSBFeGlzdGluZyBzaGFyZWQgc3RvcmUgc3RhdGVcbiAgICAgKiBAcGFyYW0gYWN0aW9uIE9wZXJhdGlvbiB0byBwZXJmb3JtXG4gICAgICogQHJldHVybiBOZXcgc2hhcmVkIHN0b3JlIHN0YXRlXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGFic3RyYWN0IHJlZHVjZShzdGF0ZTogVCwgYWN0aW9uOiBBY3Rpb24pOiBUO1xuXG4gICAgLyoqXG4gICAgICogUHJvdmlkZXMgdGhlIGluaXRpYWwgc3RhdGUgZm9yIHRoaXMgc2hhcmVkIHN0b3JlLiBUaGlzIHN0YXRlIGlzXG4gICAgICogdXNlZCB3aGVuIHRoZSBzdG9yZSBpcyBpbml0aWFsaXplZC5cbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgYWJzdHJhY3QgaW5pdGlhbFN0YXRlKCk6IFQ7XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBnZXRzIGNhbGxlZCB3aGVuIHRoZSBkYXRhIHN0b3JlJ3Mgc3RhdGUgaXMgbG9hZGVkIGZyb21cbiAgICAgKiBhbiBleHRlcm5hbCBzb3VyY2UgKHdoZW4gdGhlIFNFVCBhY3Rpb24gaXMgZGlzcGF0Y2hlZCB0byB0aGUgc3RvcmUpLlxuICAgICAqXG4gICAgICogSXQgaXMgY2FsbGVkIGJlZm9yZSB0aGUgbmV3IHN0YXRlIGhhcyBiZWVuIHNldC4gVGhlIGRlZmF1bHQgaW1wbGVtZW50YXRpb25cbiAgICAgKiBkb2VzIG5vdGhpbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc3RhdGUgT2xkIHN0YXRlXG4gICAgICogQHBhcmFtIG5leHRTdGF0ZSBOZXcgc3RhdGVcbiAgICAgKiBAcmV0dXJuIFBvc3NpYmx5IG1vZGlmaWVkIHN0YXRlIHRoYXQgc2hvdWxkIGJlIHVzZWQgaW5zdGVhZFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBvblN0YXRlTG9hZChzdGF0ZTogVCwgbmV4dFN0YXRlOiBUKTogVCB7XG4gICAgICAgIHJldHVybiBuZXh0U3RhdGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBoZWxwZXIgbWV0aG9kIGZvciBkZWZpbmluZyBzaGFyZWQgc3RvcmUgcXVlcmllcy4gSWYgdGhlIHF1ZXJ5IGlzIGFscmVhZHlcbiAgICAgKiBkZWZpbmVkLCB0aGUgZXhpc3Rpbmcgb2JzZXJ2YWJsZSBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBuYW1lIFF1ZXJ5IG5hbWVcbiAgICAgKiBAcGFyYW0gcXVlcnkgUXVlcnkgZnVuY3Rpb25cbiAgICAgKiBAcmV0dXJuIFJlc3VsdGluZyBxdWVyeSBvYnNlcnZhYmxlXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGRlZmluZVF1ZXJ5PFY+KG5hbWU6IHN0cmluZywgcXVlcnk6IFNoYXJlZFN0b3JlUXVlcnk8VCwgVj4pOiBSeC5PYnNlcnZhYmxlPFY+IHtcbiAgICAgICAgbGV0IG9ic2VydmFibGU6IFJ4Lk9ic2VydmFibGU8Vj4gPSB0aGlzLl9xdWVyaWVzW25hbWVdO1xuICAgICAgICBpZiAob2JzZXJ2YWJsZSkgcmV0dXJuIG9ic2VydmFibGU7XG5cbiAgICAgICAgb2JzZXJ2YWJsZSA9IHRoaXMuX3F1ZXJpZXNbbmFtZV0gPSB0aGlzLm9ic2VydmFibGUoKS5sZXQocXVlcnkpLmRpc3RpbmN0VW50aWxDaGFuZ2VkKCk7XG4gICAgICAgIHJldHVybiBvYnNlcnZhYmxlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgdmFsdWUgc3RvcmVkIGluIHRoZSBzdG9yZS5cbiAgICAgKlxuICAgICAqIFlvdSBNVVNUIGVuc3VyZSB0aGF0IHRoZSByZXN1bHRpbmcgb2JqZWN0IGlzIE5PVCBtdXRhdGVkIGluIGFueSB3YXkuIEFueVxuICAgICAqIG11dGF0aW9uIG1heSBjYXVzZSB1bmRlZmluZWQgYmVoYXZpb3IuXG4gICAgICovXG4gICAgcHVibGljIHZhbHVlKCk6IFQge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3ViamVjdC5nZXRWYWx1ZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYW4gb2JzZXJ2YWJsZSBvZiB0aGUgc3RvcmUncyB2YWx1ZS5cbiAgICAgKlxuICAgICAqIFlvdSBNVVNUIGVuc3VyZSB0aGF0IHRoZSBvYnNlcnZlZCB2YWx1ZSBpcyBOT1QgbXV0YXRlZCBpbiBhbnkgd2F5LiBBbnlcbiAgICAgKiBtdXRhdGlvbiBtYXkgY2F1c2UgdW5kZWZpbmVkIGJlaGF2aW9yLlxuICAgICAqL1xuICAgIHB1YmxpYyBvYnNlcnZhYmxlKCk6IFJ4Lk9ic2VydmFibGU8VD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3ViamVjdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgdmFsdWUgdGhhdCBzaG91bGQgYmUgdXNlZCB3aGVuIHNhdmluZyBzdG9yZSBzdGF0ZS5cbiAgICAgKlxuICAgICAqIEJ5IGRlZmF1bHQsIHRoaXMgd2lsbCByZXR1cm4gdGhlIHNhbWUgYXMgW1t2YWx1ZV1dLlxuICAgICAqL1xuICAgIHB1YmxpYyBzYXZlVmFsdWUoKTogVCB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlKCk7XG4gICAgfVxufVxuXG4vKipcbiAqIFtbU2ltcGxlU2hhcmVkU3RvcmVdXSBpcyBhIGhlbHBlciBjbGFzcyBpbnRlbmRlZCB0byBiZSB1c2VkIGFzIGEgdHlwZSBpbiBjb25qdW5jdGlvbiB3aXRoXG4gKiBbW1NoYXJlZFN0b3JlUHJvdmlkZXJdXSdzIGBjcmVhdGVgIG1ldGhvZCB3aGVyZSBvbmx5IFNFVCBhY3Rpb24gaXMgdXNlZC5cbiAqXG4gKiBJbiB0aGlzIGNhc2Ugbm8gc3ViY2xhc3Npbmcgb2Ygc3RvcmUgYW5kIGFjdGlvbnMgaXMgbmVlZGVkIGJlY2F1c2Ugb25seSBTRVQgYWN0aW9uIGlzIHVzZWQuXG4gKiBUaGlzIGlzIGNvbnZlbmllbnQgZm9yIHVzZSBjYXNlcyB3aGVyZSB5b3Ugb25seSBuZWVkIHRvIHNldCBhIHZhbHVlIHRoYXQgeW91IGNhbiBzdWJzY3JpYmVcbiAqIHRvIGZyb20gb3RoZXIgY29tcG9uZW50cy5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFNpbXBsZVNoYXJlZFN0b3JlPFQ+IGV4dGVuZHMgU2hhcmVkU3RvcmU8VCwgdHlwZW9mIHVuZGVmaW5lZD4geyB9XG5cbi8qKlxuICogVXNlZCB0byBkaXNwYXRjaCBhY3Rpb25zIHRvIHNoYXJlZCBzdG9yZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBEaXNwYXRjaGVyIGV4dGVuZHMgUnguU3ViamVjdDxBY3Rpb24+IHtcbiAgICBwcml2YXRlIF9nZXRTdGF0ZTogKCkgPT4gYW55ID0gKCkgPT4gdW5kZWZpbmVkO1xuXG4gICAgLyoqXG4gICAgICogQ29uZmlndXJlcyBhIGRpc3BhdGNoZXIgZnVuY3Rpb24gZm9yIHRoaXMgZGlzcGF0Y2hlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBkaXNwYXRjaGVyIFRoZSBkaXNwYXRjaGVyIGZ1bmN0aW9uXG4gICAgICovXG4gICAgcHVibGljIHNldERpc3BhdGNoZXIoZGlzcGF0Y2hlcjogKGFjdGlvbjogQWN0aW9uKSA9PiB2b2lkLCBnZXRTdGF0ZT86ICgpID0+IGFueSk6IHZvaWQge1xuICAgICAgICAvLyBUaGUgZGlzcGF0Y2hlciBpcyB1c2VkIHRvIGRpc3BhdGNoIGFsbCBhY3Rpb25zIHVzaW5nIGEgcXVldWUsIHNvIGFjdGlvbnNcbiAgICAgICAgLy8gbWF5IGludm9rZSB0aGUgZGlzcGF0Y2ggbWV0aG9kIHdpdGhvdXQgY2F1c2luZyByZWN1cnNpb24uIFRoZSBjdXJyZW50VGhyZWFkXG4gICAgICAgIC8vIHNjaGVkdWxlciBwdXRzIGFsbCBwZW5kaW5nIGl0ZW1zIGluc2lkZSBhIHF1ZXVlLCB3aGljaCBpcyBkaXNwYXRjaGVkIGFmdGVyXG4gICAgICAgIC8vIHJldHVybmluZyBmcm9tIGFjdGl2ZSBkaXNwYXRjaC5cbiAgICAgICAgdGhpcy5vYnNlcnZlT24oUnguU2NoZWR1bGVyLmN1cnJlbnRUaHJlYWQpLnN1YnNjcmliZShkaXNwYXRjaGVyKTtcbiAgICAgICAgaWYgKGdldFN0YXRlKSB0aGlzLl9nZXRTdGF0ZSA9IGdldFN0YXRlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERpc3BhdGNoZXMgYW4gYWN0aW9uIHZpYSB0aGlzIGRpc3BhdGNoZXIuXG4gICAgICovXG4gICAgcHVibGljIGRpc3BhdGNoKGFjdGlvbjogQWN0aW9uIHwgVGh1bmspOiBhbnkge1xuICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKGFjdGlvbikpIHtcbiAgICAgICAgICAgIC8vIEEgdGh1bmsgaGFzIGJlZW4gcGFzc2VkLiBFeGVjdXRlIGl0IHdpdGggdGhlIGRpc3BhdGNoZXIgYXJndW1lbnQgYW5kXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIHJlc3VsdC5cbiAgICAgICAgICAgIHJldHVybiBhY3Rpb24odGhpcywgdGhpcy5fZ2V0U3RhdGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5vbk5leHQoYWN0aW9uKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuaW50ZXJmYWNlIFNoYXJlZFN0b3JlTWFwIHtcbiAgICBbaW5kZXg6IHN0cmluZ106IFNoYXJlZFN0b3JlPGFueSwgYW55Pjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTaGFyZWRTdG9yZUZhY3Rvcnk8VCwgVT4ge1xuICAgIG5ldyAoLi4uYXJncyk6IFNoYXJlZFN0b3JlPFQsIFU+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFjdGlvbkZhY3Rvcnkge1xuICAgIG5ldyAoLi4uYXJncyk6IGFueTtcbn1cblxuLyoqXG4gKiBTaGFyZWQgc3RvcmUgcHJvdmlkZXIsIGVuYWJsaW5nIHJlZ2lzdHJhdGlvbiBvZiBzaGFyZWQgc3RvcmVzLiBBbGwgc3RvcmVzXG4gKiBtdXN0IGJlIHJlZ2lzdGVyZWQgaW4gdGhlIGFwcGxpY2F0aW9uIGNvbmZpZ3VyYXRpb24gcGhhc2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBTaGFyZWRTdG9yZVByb3ZpZGVyIHtcbiAgICAvLy8gQSBsaXN0IG9mIHJlZ2lzdGVyZWQgc3RvcmVzLlxuICAgIHByaXZhdGUgX3N0b3Jlczogc3RyaW5nW10gPSBbXTtcbiAgICAvLy8gUHJvdmlkZSBzZXJ2aWNlLlxuICAgIHByaXZhdGUgX3Byb3ZpZGU6IGFuZ3VsYXIuYXV0by5JUHJvdmlkZVNlcnZpY2U7XG5cbiAgICAvLyBAbmdJbmplY3RcbiAgICBjb25zdHJ1Y3RvcigkcHJvdmlkZTogYW5ndWxhci5hdXRvLklQcm92aWRlU2VydmljZSkge1xuICAgICAgICB0aGlzLl9wcm92aWRlID0gJHByb3ZpZGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBsaXN0IG9mIHJlZ2lzdGVyZWQgc3RvcmVzLlxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQgc3RvcmVzKCk6IHN0cmluZ1tdIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0b3JlcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IHNoYXJlZCBzdG9yZS5cbiAgICAgKlxuICAgICAqIFdoZW4gY2hvb3NpbmcgYW4gaWRlbnRpZmllciBmb3IgdGhlIHN0b3JlLCB5b3Ugc2hvdWxkIHdyaXRlIGl0IHVzaW5nXG4gICAgICoga2ViYWItY2FzZSBhbmQgbm90IGluY2x1ZGUgdGhlIHN0cmluZyAnc3RvcmUnIGVpdGhlciBhcyBhIHByZWZpeCBvclxuICAgICAqIGEgc3VmZml4LlxuICAgICAqXG4gICAgICogVGhpcyBtZXRob2QgbWF5IG9ubHkgYmUgY2FsbGVkIGluIHRoZSBhcHBsaWNhdGlvbidzIGNvbmZpZ3VyYXRpb25cbiAgICAgKiBwaGFzZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzdG9yZUlkIElkZW50aWZpZXIgb2YgdGhlIHNoYXJlZCBzdG9yZSAobXVzdCBiZSBnbG9iYWxseSB1bmlxdWUpXG4gICAgICogQHBhcmFtIGluaXRpYWxTdGF0ZSBPcHRpb25hbCBpbml0aWFsIHN0YXRlIG9mIHRoZSBzaGFyZWQgc3RvcmVcbiAgICAgKi9cbiAgICBwdWJsaWMgY3JlYXRlPFQ+KHN0b3JlSWQ6IHN0cmluZywgaW5pdGlhbFN0YXRlOiBUID0gbnVsbCk6IHZvaWQge1xuICAgICAgICBjbGFzcyBFeHRlbmRlZCBleHRlbmRzIFNpbXBsZVNoYXJlZFN0b3JlPFQ+IHtcbiAgICAgICAgICAgIHByb3RlY3RlZCBpbml0aWFsU3RhdGUoKSB7IHJldHVybiBpbml0aWFsU3RhdGU7IH1cbiAgICAgICAgICAgIHByb3RlY3RlZCByZWR1Y2Uoc3RhdGU6IFQsIGFjdGlvbjogQWN0aW9uKTogVCB7IHJldHVybiB1bmRlZmluZWQ7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucmVnaXN0ZXI8VD4oc3RvcmVJZCwgRXh0ZW5kZWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVycyBhIG5ldyBzaGFyZWQgc3RvcmUuIEEgc3RvcmUgd2l0aCB0aGUgc2FtZSBuYW1lIG11c3Qgbm90IGFscmVhZHlcbiAgICAgKiBiZSByZWdpc3RlcmVkLlxuICAgICAqXG4gICAgICogVGhpcyBtZXRob2QgbWF5IG9ubHkgYmUgY2FsbGVkIGluIHRoZSBhcHBsaWNhdGlvbidzIGNvbmZpZ3VyYXRpb25cbiAgICAgKiBwaGFzZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzdG9yZUlkIElkZW50aWZpZXIgb2YgdGhlIHNoYXJlZCBzdG9yZSAobXVzdCBiZSBnbG9iYWxseSB1bmlxdWUpXG4gICAgICogQHBhcmFtIFNoYXJlZCBzdG9yZSBjbGFzc1xuICAgICAqL1xuICAgIHB1YmxpYyByZWdpc3RlcjxUPihzdG9yZUlkOiBzdHJpbmcsIHN0b3JlVHlwZTogU2hhcmVkU3RvcmVGYWN0b3J5PFQsIGFueT4pOiB2b2lkIHtcbiAgICAgICAgLy8gUmVnaXN0ZXIgdGhlIHN0b3JlIGFzIGFuIGFuZ3VsYXIgc2VydmljZS4gV2UgdXNlIGZhY3RvcnkgaW5zdGVhZCBvZiBzZXJ2aWNlXG4gICAgICAgIC8vIHNvIHdlIGNhbiBzZXQgdGhlIGBfc3RvcmVJZGAgb24gdGhlIGluc3RhbmNlLlxuICAgICAgICB0aGlzLl9wcm92aWRlLmZhY3RvcnkoXG4gICAgICAgICAgICBzdG9yZUlkVG9TZXJ2aWNlSWQoc3RvcmVJZCksXG4gICAgICAgICAgICAvLyBAbmdJbmplY3RcbiAgICAgICAgICAgICgkaW5qZWN0b3I6IGFuZ3VsYXIuYXV0by5JSW5qZWN0b3JTZXJ2aWNlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RvcmU6IGFueSA9ICRpbmplY3Rvci5pbnN0YW50aWF0ZShzdG9yZVR5cGUpO1xuICAgICAgICAgICAgICAgIHN0b3JlLl9zdG9yZUlkID0gc3RvcmVJZDtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcmU7XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuX3N0b3Jlcy5wdXNoKHN0b3JlSWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVycyBhIG5ldyBhY3Rpb25zIGNsYXNzLlxuICAgICAqXG4gICAgICogVGhpcyBtZXRob2QgbWF5IG9ubHkgYmUgY2FsbGVkIGluIHRoZSBhcHBsaWNhdGlvbidzIGNvbmZpZ3VyYXRpb25cbiAgICAgKiBwaGFzZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBhY3Rpb25zSWQgSWRlbnRpZmllciBvZiB0aGUgYWN0aW9ucyBjbGFzcyAobXVzdCBiZSBnbG9iYWxseSB1bmlxdWUpXG4gICAgICogQHBhcmFtIEFjdGlvbnMgY2xhc3NcbiAgICAgKi9cbiAgICBwdWJsaWMgcmVnaXN0ZXJBY3Rpb25zKGFjdGlvbnNJZDogc3RyaW5nLCBhY3Rpb25zVHlwZTogQWN0aW9uRmFjdG9yeSk6IHZvaWQge1xuICAgICAgICB0aGlzLl9wcm92aWRlLnNlcnZpY2UoYWN0aW9uc0lkVG9TZXJ2aWNlSWQoYWN0aW9uc0lkKSwgYWN0aW9uc1R5cGUpO1xuICAgIH1cblxuICAgIC8vIEBuZ0luamVjdFxuICAgIHB1YmxpYyAkZ2V0KCRpbmplY3RvcjogYW5ndWxhci5hdXRvLklJbmplY3RvclNlcnZpY2UsXG4gICAgICAgICAgICAgICAgZGlzcGF0Y2hlcjogRGlzcGF0Y2hlcik6IFNoYXJlZFN0b3JlTWFuYWdlciB7XG4gICAgICAgIHJldHVybiBuZXcgU2hhcmVkU3RvcmVNYW5hZ2VyKCRpbmplY3RvciwgZGlzcGF0Y2hlciwgdGhpcyk7XG4gICAgfVxufVxuXG4vKipcbiAqIE1hbmFnZXIgb2YgYWxsIHNoYXJlZCBzdG9yZXMgKHNlZSBbW1NoYXJlZFN0b3JlXV0pIGluIGFuIGFwcGxpY2F0aW9uLiBFYWNoIHN0b3JlXG4gKiByZXF1aXJlcyBhIGdsb2JhbGx5IHVuaXF1ZSBpZGVudGlmaWVyLCB3aGljaCBpcyBhbHNvIHVzZWQgZHVyaW5nIHN0YXRlIHNlcmlhbGl6YXRpb24uXG4gKlxuICogSW4gb3JkZXIgdG8gdXNlIHNoYXJlZCBzdG9yZXMsIHlvdSBtdXN0IGZpcnN0IGNyZWF0ZSB0aGVtLiBUaGUgYmVzdCB3YXkgdG8gZG9cbiAqIHRoaXMgaXMgaW5zaWRlIHlvdXIgbW9kdWxlJ3MgYGNvbmZpZ2AgZnVuY3Rpb24gYXMgZm9sbG93czpcbiAqIGBgYFxuICogbW9kdWxlLmNvbmZpZygoc2hhcmVkU3RvcmVNYW5hZ2VyUHJvdmlkZXI6IFNoYXJlZFN0b3JlUHJvdmlkZXIpID0+IHtcbiAqICAgICAvLyBDcmVhdGUgdGhlIHNlbGVjdGVkIFJPU0UyIGRhdGEgaXRlbXMgc2hhcmVkIHN0b3JlLlxuICogICAgIHNoYXJlZFN0b3JlTWFuYWdlclByb3ZpZGVyLmNyZWF0ZSgncm9zZTItc2VsZWN0ZWQtZGF0YS1pdGVtJyk7XG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIFRoZSBzdG9yZSBtYXkgdGhlbiBiZSB1c2VkIGFzIGlucHV0IHRvIHNoYXJlZCBzdGF0ZSBkZWZpbmVkIG9uIHN0YXRlZnVsXG4gKiBjb21wb25lbnRzIChzZWUgW1tTdGF0ZWZ1bENvbXBvbmVudEJhc2VdXSkgYW5kIGNhbiBhbHNvIGJlIGluamVjdGVkIHVzaW5nXG4gKiBhIHNwZWNpZmljIHRva2VuLiBJZiBhIHN0b3JlIGlzIG5hbWVkIGBteS1uaWNlLWl0ZW1zYCwgaXQgd2lsbCBiZSBpbmplY3RhYmxlXG4gKiBieSB1c2luZyB0aGUgdG9rZW4gYG15TmljZUl0ZW1zU3RvcmVgLlxuICpcbiAqIElmIHlvdSB3aXNoIHRvIGRlZmluZSBzaGFyZWQgc3RvcmVzIHdoaWNoIHN1cHBvcnQgYWRkaXRpb25hbCBhY3Rpb25zLCB5b3VcbiAqIHNob3VsZCBzdWJjbGFzcyBbW1NoYXJlZFN0b3JlXV0gYW5kIHJlZ2lzdGVyIHlvdXIgc3RvcmUgYnkgdXNpbmcgW1tyZWdpc3Rlcl1dXG4gKiBhcyBmb2xsb3dzOlxuICogYGBgXG4gKiBjbGFzcyBDb21wbGV4QWN0aW9ucyB7XG4gKiAgICAgc3RhdGljIEFERF9JVEVNID0gJ2NvbXBsZXgvYWRkX2l0ZW0nO1xuICogICAgIHB1YmxpYyBhZGRJdGVtKHZhbHVlOiB0eXBlcy5TYW1wbGVEYXRhKSB7XG4gKiAgICAgICAgIHJldHVybiB7IHR5cGU6IENvbXBsZXhBY3Rpb25zLkFERF9JVEVNLCBpdGVtOiB2YWx1ZSB9O1xuICogICAgIH1cbiAqIH1cbiAqXG4gKiBjbGFzcyBDb21wbGV4U3RvcmUgZXh0ZW5kcyBTaGFyZWRTdG9yZTx0eXBlcy5TYW1wbGVEYXRhW10sIENvbXBsZXhBY3Rpb25zPiB7XG4gKiAgICAgLy8gQG5nSW5qZWN0XG4gKiAgICAgY29uc3RydWN0b3IoY29tcGxleEFjdGlvbnM6IENvbXBsZXhBY3Rpb25zKSB7XG4gKiAgICAgICAgIHN1cGVyKGNvbXBsZXhBY3Rpb25zKTtcbiAqICAgICB9XG4gKlxuICogICAgIHByb3RlY3RlZCBpbml0aWFsU3RhdGUoKTogdHlwZXMuU2FtcGxlRGF0YVtdIHtcbiAqICAgICAgICAgcmV0dXJuIFtdO1xuICogICAgIH1cbiAqXG4gKiAgICAgcHJvdGVjdGVkIHJlZHVjZShzdGF0ZTogdHlwZXMuU2FtcGxlRGF0YVtdLCBhY3Rpb246IGFueSk6IHZvaWQge1xuICogICAgICAgICBzd2l0Y2ggKGFjdGlvbi50eXBlKSB7XG4gKiAgICAgICAgICAgICBjYXNlIEFERF9JVEVNOiB7XG4gKiAgICAgICAgICAgICAgICAgcmV0dXJuIF8udW5pb24oc3RhdGUsIGFjdGlvbi5pdGVtKTtcbiAqICAgICAgICAgICAgIH1cbiAqICAgICAgICAgICAgIC8vIC4uLlxuICogICAgICAgICB9XG4gKiAgICAgfVxuICogfVxuICpcbiAqIG1vZHVsZS5jb25maWcoKHNoYXJlZFN0b3JlTWFuYWdlclByb3ZpZGVyOiBTaGFyZWRTdG9yZVByb3ZpZGVyKSA9PiB7XG4gKiAgICAgc2hhcmVkU3RvcmVNYW5hZ2VyUHJvdmlkZXIucmVnaXN0ZXJBY3Rpb25zKCdjb21wbGV4JywgQ29tcGxleEFjdGlvbnMpO1xuICogICAgIHNoYXJlZFN0b3JlTWFuYWdlclByb3ZpZGVyLnJlZ2lzdGVyKCdjb21wbGV4JywgQ29tcGxleFN0b3JlKTtcbiAqIH0pO1xuICogYGBgXG4gKlxuICogV2hlbiBjcmVhdGluZyBhIG5ldyBzaGFyZWQgc3RvcmUsIGEgZ29vZCBkZXNpZ24gcHJhY3RpY2UgaXMgdG8gc2VwYXJhdGVcbiAqIGFjdGlvbnMgaW50byB0aGUgYGFjdGlvbnNgIGRpcmVjdG9yeSBhbmQgaW1wbGVtZW50IGFjdGlvbnMgYXMgbWV0aG9kcyBvblxuICogdGhlIGFjdGlvbnMgY2xhc3MgbmFtZWQgYWZ0ZXIgeW91ciBzdG9yZSAoZWcuIGZvciBzdG9yZSBgRm9vU3RvcmVgIHB1dFxuICogYWN0aW9ucyBpbnRvIGBGb29BY3Rpb25zYCkuXG4gKlxuICogU3RvcmVzIHRoZW1zZWx2ZXMgc2hvdWxkIG9ubHkgaW1wbGVtZW50IHRoZSBzdGF0ZSBtYW5hZ2VtZW50IGZ1bmN0aW9uYWxpdHlcbiAqIGFuZCBtb3N0IGJ1c2luZXNzIGxvZ2ljIHNob3VsZCBiZSBjb250YWluZWQgaW4gdGhlIGFjdGlvbnMgY2xhc3MuIEZvclxuICogZXhhbXBsZSwgaWYgYWN0aW9ucyByZXF1aXJlIHNvbWUgYXN5bmNocm9ub3VzIG9wZXJhdGlvbnMgdG8gYmUgcGVyZm9ybWVkXG4gKiBvbiBhIHJlbW90ZSBiYWNrZW5kIGFsbCB0aGlzIGZ1bmN0aW9uYWxpdHkgc2hvdWxkIGJlIHB1dCBpbnRvIHRoZSBhY3Rpb25zXG4gKiBjbGFzcyBhbmQgbm90IGludG8gdGhlIHN0b3JlLlxuICpcbiAqIEFsbCBhY3Rpb25zIGNsYXNzZXMgc2hvdWxkIGJlIHJlZ2lzdGVyZWQgdmlhIHRoZSBbW1NoYXJlZFN0b3JlUHJvdmlkZXJdXVxuICogYW5kIHN1cHBvcnQgQW5ndWxhciBkZXBlbmRlbmN5IGluamVjdGlvbi4gQWN0aW9ucyBjbGFzc2VzIGFyZSBpbmplY3RhYmxlXG4gKiB1bmRlciB0aGUgdG9rZW4gYGlkQWN0aW9uc2Agd2hlcmUgdGhlIGBpZGAgcGFydCBpcyB0aGUgdmFsdWUgZGVmaW5lZCBieVxuICogYGFjdGlvbnNJZGAsIGZvcm1hdHRlZCBpbiBjYW1lbENhc2UuIFRoZSBjb25zdHJ1Y3RvciBvZiBhbiBhY3Rpb25zXG4gKiBjbGFzcyBtYXkgYWxzbyBpbmplY3Qgb3RoZXIgZGVwZW5kZW5jaWVzLlxuICpcbiAqIEZvciBjb252ZW5pZW5jZSwgeW91IG1heSBpbmplY3QgeW91ciBhY3Rpb25zIGNsYXNzIGluIHlvdXIgc2hhcmVkIHN0b3JlXG4gKiBjbGFzcyB1bmRlciB0aGUgcHVibGljIGF0dHJpYnV0ZSBgYWN0aW9uc2AuIFRoaXMgd2F5IG9uZSBtYXkgZ2V0IHRoZVxuICogYWN0aW9ucyBjbGFzcyBzaW1wbHkgYnkgYWNjZXNzaW5nIGBzdG9yZS5hY3Rpb25zYCB3aGVuIGdpdmVuIGEgc2hhcmVkXG4gKiBzdG9yZSBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGNsYXNzIFNoYXJlZFN0b3JlTWFuYWdlciB7XG4gICAgLy8vIFNoYXJlZCBzdG9yZSBwcm92aWRlci5cbiAgICBwcml2YXRlIF9wcm92aWRlcjogU2hhcmVkU3RvcmVQcm92aWRlcjtcbiAgICAvLy8gRGlzcGF0Y2hlci5cbiAgICBwcml2YXRlIF9kaXNwYXRjaGVyOiBEaXNwYXRjaGVyO1xuICAgIC8vLyBBbmd1bGFyIGluamVjdG9yLlxuICAgIHByaXZhdGUgX2luamVjdG9yOiBhbmd1bGFyLmF1dG8uSUluamVjdG9yU2VydmljZTtcblxuICAgIC8vIEBuZ0luamVjdFxuICAgIGNvbnN0cnVjdG9yKCRpbmplY3RvcjogYW5ndWxhci5hdXRvLklJbmplY3RvclNlcnZpY2UsXG4gICAgICAgICAgICAgICAgZGlzcGF0Y2hlcjogRGlzcGF0Y2hlcixcbiAgICAgICAgICAgICAgICBzaGFyZWRTdG9yZU1hbmFnZXJQcm92aWRlcjogU2hhcmVkU3RvcmVQcm92aWRlcikge1xuICAgICAgICB0aGlzLl9wcm92aWRlciA9IHNoYXJlZFN0b3JlTWFuYWdlclByb3ZpZGVyO1xuICAgICAgICB0aGlzLl9pbmplY3RvciA9ICRpbmplY3RvcjtcbiAgICAgICAgdGhpcy5fZGlzcGF0Y2hlciA9IGRpc3BhdGNoZXI7XG4gICAgICAgIHRoaXMuX2Rpc3BhdGNoZXIuc2V0RGlzcGF0Y2hlcih0aGlzLl9kaXNwYXRjaC5iaW5kKHRoaXMpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgcHJldmlvdXNseSByZWdpc3RlcmVkIHN0b3JlLiBJdCBpcyBhbiBlcnJvciB0byByZXF1ZXN0IGEgc3RvcmVcbiAgICAgKiB3aGljaCBkb2Vzbid0IGV4aXN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHN0b3JlSWQgSWRlbnRpZmllciBvZiB0aGUgc2hhcmVkIHN0b3JlXG4gICAgICogQHJldHVybiBTaGFyZWQgc3RvcmUgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0U3RvcmU8VD4oc3RvcmVJZDogc3RyaW5nKTogU2hhcmVkU3RvcmU8VCwgYW55PiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pbmplY3Rvci5nZXQ8U2hhcmVkU3RvcmU8VCwgYW55Pj4oc3RvcmVJZFRvU2VydmljZUlkKHN0b3JlSWQpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEaXNwYXRjaGVzIGFuIGFjdGlvbiB0byBhbGwgc2hhcmVkIHN0b3Jlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBhY3Rpb24gQWN0aW9uIHRvIGRpc3BhdGNoXG4gICAgICovXG4gICAgcHVibGljIGRpc3BhdGNoKGFjdGlvbjogQWN0aW9uIHwgVGh1bmspOiBhbnkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGlzcGF0Y2hlci5kaXNwYXRjaChhY3Rpb24pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludGVybmFsIGdsb2JhbCBkaXNwYXRjaCBpbXBsZW1lbnRhdGlvbi5cbiAgICAgKi9cbiAgICBwcml2YXRlIF9kaXNwYXRjaChhY3Rpb246IEFjdGlvbik6IHZvaWQge1xuICAgICAgICBmb3IgKGNvbnN0IHN0b3JlSWQgb2YgdGhpcy5fcHJvdmlkZXIuc3RvcmVzKSB7XG4gICAgICAgICAgICB0aGlzLmdldFN0b3JlKHN0b3JlSWQpLl9kaXNwYXRjaChhY3Rpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VyaWFsaXplcyB0aGUgdmFsdWVzIG9mIGFsbCBzaGFyZWQgc3RvcmVzLlxuICAgICAqL1xuICAgIHB1YmxpYyBzYXZlU3RhdGUoKTogYW55IHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IHt9O1xuICAgICAgICBmb3IgKGNvbnN0IHN0b3JlSWQgb2YgdGhpcy5fcHJvdmlkZXIuc3RvcmVzKSB7XG4gICAgICAgICAgICBsZXQgdmFsdWUgPSB0aGlzLmdldFN0b3JlKHN0b3JlSWQpLnNhdmVWYWx1ZSgpO1xuICAgICAgICAgICAgaWYgKGlzSnNvbmFibGUodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0W3N0b3JlSWRdID0gdmFsdWUudG9KU09OKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdFtzdG9yZUlkXSA9IGFuZ3VsYXIuY29weSh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExvYWRzIHNlcmlhbGl6ZWQgdmFsdWVzIG9mIGFsbCBzaGFyZWQgc3RvcmVzLiBFeGlzdGluZyB2YWx1ZXMgYXJlIG92ZXJ3cml0dGVuLlxuICAgICAqL1xuICAgIHB1YmxpYyBsb2FkU3RhdGUoc3RhdGU6IGFueSk6IHZvaWQge1xuICAgICAgICBmb3IgKGNvbnN0IHN0b3JlSWQgb2YgdGhpcy5fcHJvdmlkZXIuc3RvcmVzKSB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHN0YXRlW3N0b3JlSWRdO1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSkgY29udGludWU7XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0U3RvcmUoc3RvcmVJZCkuZGlzcGF0Y2goe3R5cGU6IEFjdGlvbnMuU0VULCB2YWx1ZTogdmFsdWV9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBBbmd1bGFyIHNlcnZpY2UgaWRlbnRpZmllciB0aGF0IGNhbiBiZSB1c2VkIHRvIGluamVjdCBhXG4gKiBzdG9yZSB2aWEgZGVwZW5kZW5jeSBpbmplY3Rpb24uXG4gKlxuICogQHBhcmFtIHN0b3JlSWQgU3RvcmUgaWRlbnRpZmllclxuICovXG5mdW5jdGlvbiBzdG9yZUlkVG9TZXJ2aWNlSWQoc3RvcmVJZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXy5jYW1lbENhc2UoYCR7c3RvcmVJZH0tc3RvcmVgKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBBbmd1bGFyIHNlcnZpY2UgaWRlbnRpZmllciB0aGF0IGNhbiBiZSB1c2VkIHRvIGluamVjdCBhblxuICogYWN0aW9ucyBvYmplY3QgdmlhIGRlcGVuZGVuY3kgaW5qZWN0aW9uLlxuICpcbiAqIEBwYXJhbSBhY3Rpb25zSWQgQWN0aW9ucyBvYmplY3QgaWRlbnRpZmllclxuICovXG5mdW5jdGlvbiBhY3Rpb25zSWRUb1NlcnZpY2VJZChhY3Rpb25zSWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIF8uY2FtZWxDYXNlKGAke2FjdGlvbnNJZH0tYWN0aW9uc2ApO1xufVxuXG5jb25zdCBhbmd1bGFyTW9kdWxlOiBhbmd1bGFyLklNb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgncmVzb2x3ZS5zZXJ2aWNlcy5zaGFyZWRfc3RvcmUnLCBbXSk7XG5cbi8vIFJlZ2lzdGVyIGluamVjdGFibGUgc2VydmljZXMuXG5hbmd1bGFyTW9kdWxlLnByb3ZpZGVyKCdzaGFyZWRTdG9yZU1hbmFnZXInLCBTaGFyZWRTdG9yZVByb3ZpZGVyKTtcbmFuZ3VsYXJNb2R1bGUuc2VydmljZSgnZGlzcGF0Y2hlcicsIERpc3BhdGNoZXIpO1xuIl19
