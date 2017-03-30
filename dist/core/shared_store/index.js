"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var _ = require("lodash");
var Rx = require("rx");
var angular = require("angular");
var lang_1 = require("../utils/lang");
var immutable = require("../utils/immutable");
var Actions = (function () {
    function Actions() {
    }
    return Actions;
}());
/// Internal action for setting this store to a specific value.
Actions.SET = '@@internal/SET';
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
var SharedStore = (function () {
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
var SimpleSharedStore = (function (_super) {
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
var Dispatcher = (function (_super) {
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
var SharedStoreProvider = (function () {
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
        var Extended = (function (_super) {
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
var SharedStoreManager = (function () {
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
            var value = this.getStore(storeId).value();
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL3NoYXJlZF9zdG9yZS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwwQkFBNEI7QUFDNUIsdUJBQXlCO0FBQ3pCLGlDQUFtQztBQUVuQyxzQ0FBeUM7QUFDekMsOENBQWdEO0FBd0JoRDtJQUFBO0lBR0EsQ0FBQztJQUFELGNBQUM7QUFBRCxDQUhBLEFBR0M7QUFGRywrREFBK0Q7QUFDakQsV0FBRyxHQUFHLGdCQUFnQixDQUFDO0FBRjVCLDBCQUFPO0FBS3BCOzs7Ozs7Ozs7Ozs7O0dBYUc7QUFDSDtJQU9JLHFCQUFZLE9BQVc7UUFKZixhQUFRLEdBQXlDLEVBQUUsQ0FBQztRQUt4RCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUM1RCxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztRQUV4Qiw2QkFBNkI7UUFDN0IsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLFVBQVUsRUFBRSxDQUFDO1FBQ3BDLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDckYsQ0FBQztJQUtELHNCQUFXLGdDQUFPO1FBSGxCOztXQUVHO2FBQ0g7WUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN6QixDQUFDOzs7T0FBQTtJQUtELHNCQUFXLGdDQUFPO1FBSGxCOztXQUVHO2FBQ0g7WUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN6QixDQUFDOzs7T0FBQTtJQUVEOzs7OztPQUtHO0lBQ0ksK0JBQVMsR0FBaEIsVUFBaUIsTUFBYztRQUMzQixJQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENB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QUFDO1NBQ3RFO0lBQ0wsQ0FBQztJQUNMLHlCQUFDO0FBQUQsQ0EzRUEsQUEyRUMsSUFBQTtBQTNFWSxnREFBa0I7QUE2RS9COzs7OztHQUtHO0FBQ0gsNEJBQTRCLE9BQWU7SUFDdkMsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUksT0FBTyxXQUFRLENBQUMsQ0FBQztBQUMzQyxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCw4QkFBOEIsU0FBaUI7SUFDM0MsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUksU0FBUyxhQUFVLENBQUMsQ0FBQztBQUMvQyxDQUFDO0FBRUQsSUFBTSxhQUFhLEdBQW9CLE9BQU8sQ0FBQyxNQUFNLENBQUMsK0JBQStCLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFFM0YsZ0NBQWdDO0FBQ2hDLGFBQWEsQ0FBQyxRQUFRLENBQUMsb0JBQW9CLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztBQUNsRSxhQUFhLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQyIsImZpbGUiOiJjb3JlL3NoYXJlZF9zdG9yZS9pbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0ICogYXMgUnggZnJvbSAncngnO1xyXG5pbXBvcnQgKiBhcyBhbmd1bGFyIGZyb20gJ2FuZ3VsYXInO1xyXG5cclxuaW1wb3J0IHtpc0pzb25hYmxlfSBmcm9tICcuLi91dGlscy9sYW5nJztcclxuaW1wb3J0ICogYXMgaW1tdXRhYmxlIGZyb20gJy4uL3V0aWxzL2ltbXV0YWJsZSc7XHJcblxyXG4vKipcclxuICogQSBzaGFyZWQgc3RvcmUgYWN0aW9uIGNvbnRhaW5zIGEgYHR5cGVgIHByb3BlcnR5IGFuZCBhbnkgbnVtYmVyIG9mIG90aGVyXHJcbiAqIGN1c3RvbSBwcm9wZXJ0aWVzLiBBY3Rpb24gdHlwZXMgc3RhcnRpbmcgd2l0aCBgQEBpbnRlcm5hbC9gIGFyZSByZXNlcnZlZFxyXG4gKiBmb3IgaW50ZXJuYWwgdXNlLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBBY3Rpb24ge1xyXG4gICAgdHlwZTogc3RyaW5nO1xyXG4gICAgW3Byb3BlcnR5TmFtZTogc3RyaW5nXTogYW55O1xyXG59XHJcblxyXG4vKipcclxuICogQSB0aHVuayBpcyBhIGZ1bmN0aW9uLCB3aGljaCBtZWRpYXRlcyB0aGUgZGlzcGF0Y2ggb2YgYW4gYWN0aW9uLiBJdCBtYXlcclxuICogYmUgZGlzcGF0Y2hlZCBpbiB0aGUgc2FtZSB3YXkgYXMgYW4gYWN0aW9uLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBUaHVuayB7XHJcbiAgICAoZGlzcGF0Y2hlcjogRGlzcGF0Y2hlciwgZ2V0U3RhdGU6ICgpID0+IGFueSk6IGFueTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTaGFyZWRTdG9yZVF1ZXJ5PFQsIFU+IHtcclxuICAgIChzdGF0ZTogUnguT2JzZXJ2YWJsZTxUPik6IFJ4Lk9ic2VydmFibGU8VT47XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBBY3Rpb25zIHtcclxuICAgIC8vLyBJbnRlcm5hbCBhY3Rpb24gZm9yIHNldHRpbmcgdGhpcyBzdG9yZSB0byBhIHNwZWNpZmljIHZhbHVlLlxyXG4gICAgcHVibGljIHN0YXRpYyBTRVQgPSAnQEBpbnRlcm5hbC9TRVQnO1xyXG59XHJcblxyXG4vKipcclxuICogQSBzaGFyZWQgc3RvcmUgcmVwcmVzZW50cyBzdGF0ZSB0aGF0IGlzIHNoYXJlZCBiZXR3ZWVuIG11bHRpcGxlIGNvbXBvbmVudHMgaW5cclxuICogYSBwcmVkaWN0YWJsZSB3YXkuIENvbXBvbmVudHMgdXBkYXRlIHRoZSBzdG9yZSBieSBkaXNwYXRjaGluZyBhY3Rpb25zIHRvXHJcbiAqIGl0IHVzaW5nIHRoZSBgZGlzcGF0Y2hgIG1ldGhvZC5cclxuICpcclxuICogRWFjaCBzaGFyZWQgc3RvcmUgYWxzbyBwcm92aWRlcyBhIHdheSBmb3IgdGhlIGNvbXBvbmVudHMgdG8gc3Vic2NyaWJlIHRvIGFueVxyXG4gKiBjaGFuZ2VzIGluIHRoZSBzdG9yZSdzIHN0YXRlLlxyXG4gKlxyXG4gKiBDb25zaWRlciBkZWZpbmluZyBhY3Rpb25zIGZvciB1c2UgaW4gYSBzaGFyZWQgc3RvcmUgc2VwYXJhdGVseSBmcm9tIHRoZSBzdG9yZSxcclxuICogaW4gdGhlIGBhY3Rpb25zYCBzdWJkaXJlY3RvcnkuIFNlZSBbW1NoYXJlZFN0b3JlTWFuYWdlcl1dIGZvciBkZXRhaWxzLlxyXG4gKlxyXG4gKiBEb24ndCBmb3JnZXQgdG8gY2FsbCBjb25zdHJ1Y3RvciB3aXRoIGFjdGlvbnMgYXMgYW4gYXJndW1lbnQgd2hlbiBleHRlbmRpbmdcclxuICogdGhpcyBjbGFzcy5cclxuICovXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTaGFyZWRTdG9yZTxULCBVPiB7XHJcbiAgICBwcml2YXRlIF9zdWJqZWN0OiBSeC5CZWhhdmlvclN1YmplY3Q8VD47XHJcbiAgICBwcml2YXRlIF9kaXNwYXRjaGVyOiBEaXNwYXRjaGVyO1xyXG4gICAgcHJpdmF0ZSBfcXVlcmllczoge1tuYW1lOiBzdHJpbmddOiBSeC5PYnNlcnZhYmxlPGFueT59ID0ge307XHJcbiAgICBwcml2YXRlIF9hY3Rpb25zOiBVO1xyXG4gICAgcHJpdmF0ZSBfc3RvcmVJZDogc3RyaW5nO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFjdGlvbnM/OiBVKSB7XHJcbiAgICAgICAgdGhpcy5fc3ViamVjdCA9IG5ldyBSeC5CZWhhdmlvclN1YmplY3QodGhpcy5pbml0aWFsU3RhdGUoKSk7XHJcbiAgICAgICAgdGhpcy5fYWN0aW9ucyA9IGFjdGlvbnM7XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSBhIGxvY2FsIGRpc3BhdGNoZXIuXHJcbiAgICAgICAgdGhpcy5fZGlzcGF0Y2hlciA9IG5ldyBEaXNwYXRjaGVyKCk7XHJcbiAgICAgICAgdGhpcy5fZGlzcGF0Y2hlci5zZXREaXNwYXRjaGVyKHRoaXMuX2Rpc3BhdGNoLmJpbmQodGhpcyksIHRoaXMudmFsdWUuYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIGEgdW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoaXMgc2hhcmVkIHN0b3JlLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0IHN0b3JlSWQoKTogc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fc3RvcmVJZDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgc3RvcmUgYWN0aW9ucy5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldCBhY3Rpb25zKCk6IFUge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9hY3Rpb25zO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW50ZXJuYWwgZGlzcGF0Y2hlciBpbXBsZW1lbnRhdGlvbi5cclxuICAgICAqXHJcbiAgICAgKiBOT1RFOiBUaGlzIG1ldGhvZCBpcyBwdWJsaWMgYmVjYXVzZSB0aGVyZSBpcyBubyB3YXkgdG8gZGVmaW5lIHByaXZhdGVcclxuICAgICAqIGJ1dCBhY2Nlc3NpYmxlIHRvIG90aGVyIGNsYXNzZXMgd2l0aGluIHRoaXMgbW9kdWxlIGluIFR5cGVTY3JpcHQuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBfZGlzcGF0Y2goYWN0aW9uOiBBY3Rpb24pOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBleGlzdGluZ1ZhbHVlID0gdGhpcy52YWx1ZSgpO1xyXG4gICAgICAgIGxldCByZWR1Y2VyOiAodmFsdWU6IFQsIGFjdGlvbjogQWN0aW9uKSA9PiBUO1xyXG4gICAgICAgIGlmIChfLnN0YXJ0c1dpdGgoYWN0aW9uLnR5cGUsICdAQGludGVybmFsLycpKSB7XHJcbiAgICAgICAgICAgIHJlZHVjZXIgPSB0aGlzLl9yZWR1Y2VJbnRlcm5hbC5iaW5kKHRoaXMpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJlZHVjZXIgPSB0aGlzLnJlZHVjZS5iaW5kKHRoaXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IG5ld1ZhbHVlID0gcmVkdWNlcihleGlzdGluZ1ZhbHVlLCBhY3Rpb24pO1xyXG4gICAgICAgIGlmIChfLmlzVW5kZWZpbmVkKG5ld1ZhbHVlKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZiAoYW5ndWxhci5lcXVhbHMoZXhpc3RpbmdWYWx1ZSwgbmV3VmFsdWUpKSByZXR1cm47XHJcbiAgICAgICAgdGhpcy5fc3ViamVjdC5vbk5leHQoaW1tdXRhYmxlLm1ha2VJbW11dGFibGUobmV3VmFsdWUpKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIERpc3BhdGNoZXMgYW4gYWN0aW9uIHRvIHRoaXMgc2hhcmVkIHN0b3JlLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBhY3Rpb24gQWN0aW9uIHRvIGRpc3BhdGNoXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBkaXNwYXRjaChhY3Rpb246IEFjdGlvbiB8IFRodW5rKTogYW55IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZGlzcGF0Y2hlci5kaXNwYXRjaChhY3Rpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUGVyZm9ybXMgaW50ZXJuYWwgcmVkdWNlIGFjdGlvbnMgaW1wbGVtZW50ZWQgZm9yIGVhY2ggc2hhcmVkIHN0b3JlLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBzdGF0ZSBFeGlzdGluZyBzaGFyZWQgc3RvcmUgc3RhdGVcclxuICAgICAqIEBwYXJhbSBhY3Rpb24gQWN0aW9uIHRvIHBlcmZvcm1cclxuICAgICAqIEByZXR1cm4gTmV3IHNoYXJlZCBzdG9yZSBzdGF0ZVxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIF9yZWR1Y2VJbnRlcm5hbChzdGF0ZTogVCwgYWN0aW9uOiBBY3Rpb24pOiBUIHtcclxuICAgICAgICBzd2l0Y2ggKGFjdGlvbi50eXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgQWN0aW9ucy5TRVQ6IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG5leHRTdGF0ZSA9IGFjdGlvblsndmFsdWUnXTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9uU3RhdGVMb2FkKHN0YXRlLCBuZXh0U3RhdGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHtcclxuICAgICAgICAgICAgICAgIC8vIERvIG5vdGhpbmcuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQZXJmb3JtcyB0aGUgZ2l2ZW4gYWN0aW9uIG9uIHRoZSB1bmRlcmx5aW5nIHN0YXRlLlxyXG4gICAgICpcclxuICAgICAqIFN1YmNsYXNzZXMgbWF5IG92ZXJyaWRlIHRoaXMgbWV0aG9kIHRvIGltcGxlbWVudCBhcmJpdHJhcnkgY29tcGxleFxyXG4gICAgICogYWN0aW9ucyBvbiB0aGUgZGF0YSBzdG9yZS4gVGhpcyBtZXRob2QgTVVTVCBOT1QgbXV0YXRlIHRoZSBleGlzdGluZ1xyXG4gICAgICogc3RhdGUuIEluc3RlYWQsIGl0IE1VU1QgcmV0dXJuIGFuIGltbXV0YWJsZSBjb3B5LlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB2YWx1ZSBFeGlzdGluZyBzaGFyZWQgc3RvcmUgc3RhdGVcclxuICAgICAqIEBwYXJhbSBhY3Rpb24gT3BlcmF0aW9uIHRvIHBlcmZvcm1cclxuICAgICAqIEByZXR1cm4gTmV3IHNoYXJlZCBzdG9yZSBzdGF0ZVxyXG4gICAgICovXHJcbiAgICBwcm90ZWN0ZWQgYWJzdHJhY3QgcmVkdWNlKHN0YXRlOiBULCBhY3Rpb246IEFjdGlvbik6IFQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQcm92aWRlcyB0aGUgaW5pdGlhbCBzdGF0ZSBmb3IgdGhpcyBzaGFyZWQgc3RvcmUuIFRoaXMgc3RhdGUgaXNcclxuICAgICAqIHVzZWQgd2hlbiB0aGUgc3RvcmUgaXMgaW5pdGlhbGl6ZWQuXHJcbiAgICAgKi9cclxuICAgIHByb3RlY3RlZCBhYnN0cmFjdCBpbml0aWFsU3RhdGUoKTogVDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgbWV0aG9kIGdldHMgY2FsbGVkIHdoZW4gdGhlIGRhdGEgc3RvcmUncyBzdGF0ZSBpcyBsb2FkZWQgZnJvbVxyXG4gICAgICogYW4gZXh0ZXJuYWwgc291cmNlICh3aGVuIHRoZSBTRVQgYWN0aW9uIGlzIGRpc3BhdGNoZWQgdG8gdGhlIHN0b3JlKS5cclxuICAgICAqXHJcbiAgICAgKiBJdCBpcyBjYWxsZWQgYmVmb3JlIHRoZSBuZXcgc3RhdGUgaGFzIGJlZW4gc2V0LiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvblxyXG4gICAgICogZG9lcyBub3RoaW5nLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBzdGF0ZSBPbGQgc3RhdGVcclxuICAgICAqIEBwYXJhbSBuZXh0U3RhdGUgTmV3IHN0YXRlXHJcbiAgICAgKiBAcmV0dXJuIFBvc3NpYmx5IG1vZGlmaWVkIHN0YXRlIHRoYXQgc2hvdWxkIGJlIHVzZWQgaW5zdGVhZFxyXG4gICAgICovXHJcbiAgICBwcm90ZWN0ZWQgb25TdGF0ZUxvYWQoc3RhdGU6IFQsIG5leHRTdGF0ZTogVCk6IFQge1xyXG4gICAgICAgIHJldHVybiBuZXh0U3RhdGU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBIGhlbHBlciBtZXRob2QgZm9yIGRlZmluaW5nIHNoYXJlZCBzdG9yZSBxdWVyaWVzLiBJZiB0aGUgcXVlcnkgaXMgYWxyZWFkeVxyXG4gICAgICogZGVmaW5lZCwgdGhlIGV4aXN0aW5nIG9ic2VydmFibGUgaXMgcmV0dXJuZWQuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIG5hbWUgUXVlcnkgbmFtZVxyXG4gICAgICogQHBhcmFtIHF1ZXJ5IFF1ZXJ5IGZ1bmN0aW9uXHJcbiAgICAgKiBAcmV0dXJuIFJlc3VsdGluZyBxdWVyeSBvYnNlcnZhYmxlXHJcbiAgICAgKi9cclxuICAgIHByb3RlY3RlZCBkZWZpbmVRdWVyeTxWPihuYW1lOiBzdHJpbmcsIHF1ZXJ5OiBTaGFyZWRTdG9yZVF1ZXJ5PFQsIFY+KTogUnguT2JzZXJ2YWJsZTxWPiB7XHJcbiAgICAgICAgbGV0IG9ic2VydmFibGU6IFJ4Lk9ic2VydmFibGU8Vj4gPSB0aGlzLl9xdWVyaWVzW25hbWVdO1xyXG4gICAgICAgIGlmIChvYnNlcnZhYmxlKSByZXR1cm4gb2JzZXJ2YWJsZTtcclxuXHJcbiAgICAgICAgb2JzZXJ2YWJsZSA9IHRoaXMuX3F1ZXJpZXNbbmFtZV0gPSB0aGlzLm9ic2VydmFibGUoKS5sZXQocXVlcnkpLmRpc3RpbmN0VW50aWxDaGFuZ2VkKCk7XHJcbiAgICAgICAgcmV0dXJuIG9ic2VydmFibGU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IHZhbHVlIHN0b3JlZCBpbiB0aGUgc3RvcmUuXHJcbiAgICAgKlxyXG4gICAgICogWW91IE1VU1QgZW5zdXJlIHRoYXQgdGhlIHJlc3VsdGluZyBvYmplY3QgaXMgTk9UIG11dGF0ZWQgaW4gYW55IHdheS4gQW55XHJcbiAgICAgKiBtdXRhdGlvbiBtYXkgY2F1c2UgdW5kZWZpbmVkIGJlaGF2aW9yLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgdmFsdWUoKTogVCB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N1YmplY3QuZ2V0VmFsdWUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgYW4gb2JzZXJ2YWJsZSBvZiB0aGUgc3RvcmUncyB2YWx1ZS5cclxuICAgICAqXHJcbiAgICAgKiBZb3UgTVVTVCBlbnN1cmUgdGhhdCB0aGUgb2JzZXJ2ZWQgdmFsdWUgaXMgTk9UIG11dGF0ZWQgaW4gYW55IHdheS4gQW55XHJcbiAgICAgKiBtdXRhdGlvbiBtYXkgY2F1c2UgdW5kZWZpbmVkIGJlaGF2aW9yLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgb2JzZXJ2YWJsZSgpOiBSeC5PYnNlcnZhYmxlPFQ+IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fc3ViamVjdDtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFtbU2ltcGxlU2hhcmVkU3RvcmVdXSBpcyBhIGhlbHBlciBjbGFzcyBpbnRlbmRlZCB0byBiZSB1c2VkIGFzIGEgdHlwZSBpbiBjb25qdW5jdGlvbiB3aXRoXHJcbiAqIFtbU2hhcmVkU3RvcmVQcm92aWRlcl1dJ3MgYGNyZWF0ZWAgbWV0aG9kIHdoZXJlIG9ubHkgU0VUIGFjdGlvbiBpcyB1c2VkLlxyXG4gKlxyXG4gKiBJbiB0aGlzIGNhc2Ugbm8gc3ViY2xhc3Npbmcgb2Ygc3RvcmUgYW5kIGFjdGlvbnMgaXMgbmVlZGVkIGJlY2F1c2Ugb25seSBTRVQgYWN0aW9uIGlzIHVzZWQuXHJcbiAqIFRoaXMgaXMgY29udmVuaWVudCBmb3IgdXNlIGNhc2VzIHdoZXJlIHlvdSBvbmx5IG5lZWQgdG8gc2V0IGEgdmFsdWUgdGhhdCB5b3UgY2FuIHN1YnNjcmliZVxyXG4gKiB0byBmcm9tIG90aGVyIGNvbXBvbmVudHMuXHJcbiAqL1xyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU2ltcGxlU2hhcmVkU3RvcmU8VD4gZXh0ZW5kcyBTaGFyZWRTdG9yZTxULCB0eXBlb2YgdW5kZWZpbmVkPiB7IH1cclxuXHJcbi8qKlxyXG4gKiBVc2VkIHRvIGRpc3BhdGNoIGFjdGlvbnMgdG8gc2hhcmVkIHN0b3Jlcy5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBEaXNwYXRjaGVyIGV4dGVuZHMgUnguU3ViamVjdDxBY3Rpb24+IHtcclxuICAgIHByaXZhdGUgX2dldFN0YXRlOiAoKSA9PiBhbnkgPSAoKSA9PiB1bmRlZmluZWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb25maWd1cmVzIGEgZGlzcGF0Y2hlciBmdW5jdGlvbiBmb3IgdGhpcyBkaXNwYXRjaGVyLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBkaXNwYXRjaGVyIFRoZSBkaXNwYXRjaGVyIGZ1bmN0aW9uXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzZXREaXNwYXRjaGVyKGRpc3BhdGNoZXI6IChhY3Rpb246IEFjdGlvbikgPT4gdm9pZCwgZ2V0U3RhdGU/OiAoKSA9PiBhbnkpOiB2b2lkIHtcclxuICAgICAgICAvLyBUaGUgZGlzcGF0Y2hlciBpcyB1c2VkIHRvIGRpc3BhdGNoIGFsbCBhY3Rpb25zIHVzaW5nIGEgcXVldWUsIHNvIGFjdGlvbnNcclxuICAgICAgICAvLyBtYXkgaW52b2tlIHRoZSBkaXNwYXRjaCBtZXRob2Qgd2l0aG91dCBjYXVzaW5nIHJlY3Vyc2lvbi4gVGhlIGN1cnJlbnRUaHJlYWRcclxuICAgICAgICAvLyBzY2hlZHVsZXIgcHV0cyBhbGwgcGVuZGluZyBpdGVtcyBpbnNpZGUgYSBxdWV1ZSwgd2hpY2ggaXMgZGlzcGF0Y2hlZCBhZnRlclxyXG4gICAgICAgIC8vIHJldHVybmluZyBmcm9tIGFjdGl2ZSBkaXNwYXRjaC5cclxuICAgICAgICB0aGlzLm9ic2VydmVPbihSeC5TY2hlZHVsZXIuY3VycmVudFRocmVhZCkuc3Vic2NyaWJlKGRpc3BhdGNoZXIpO1xyXG4gICAgICAgIGlmIChnZXRTdGF0ZSkgdGhpcy5fZ2V0U3RhdGUgPSBnZXRTdGF0ZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIERpc3BhdGNoZXMgYW4gYWN0aW9uIHZpYSB0aGlzIGRpc3BhdGNoZXIuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBkaXNwYXRjaChhY3Rpb246IEFjdGlvbiB8IFRodW5rKTogYW55IHtcclxuICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKGFjdGlvbikpIHtcclxuICAgICAgICAgICAgLy8gQSB0aHVuayBoYXMgYmVlbiBwYXNzZWQuIEV4ZWN1dGUgaXQgd2l0aCB0aGUgZGlzcGF0Y2hlciBhcmd1bWVudCBhbmRcclxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSByZXN1bHQuXHJcbiAgICAgICAgICAgIHJldHVybiBhY3Rpb24odGhpcywgdGhpcy5fZ2V0U3RhdGUpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMub25OZXh0KGFjdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgU2hhcmVkU3RvcmVNYXAge1xyXG4gICAgW2luZGV4OiBzdHJpbmddOiBTaGFyZWRTdG9yZTxhbnksIGFueT47XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2hhcmVkU3RvcmVGYWN0b3J5PFQsIFU+IHtcclxuICAgIG5ldyAoLi4uYXJncyk6IFNoYXJlZFN0b3JlPFQsIFU+O1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEFjdGlvbkZhY3Rvcnkge1xyXG4gICAgbmV3ICguLi5hcmdzKTogYW55O1xyXG59XHJcblxyXG4vKipcclxuICogU2hhcmVkIHN0b3JlIHByb3ZpZGVyLCBlbmFibGluZyByZWdpc3RyYXRpb24gb2Ygc2hhcmVkIHN0b3Jlcy4gQWxsIHN0b3Jlc1xyXG4gKiBtdXN0IGJlIHJlZ2lzdGVyZWQgaW4gdGhlIGFwcGxpY2F0aW9uIGNvbmZpZ3VyYXRpb24gcGhhc2UuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgU2hhcmVkU3RvcmVQcm92aWRlciB7XHJcbiAgICAvLy8gQSBsaXN0IG9mIHJlZ2lzdGVyZWQgc3RvcmVzLlxyXG4gICAgcHJpdmF0ZSBfc3RvcmVzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgLy8vIFByb3ZpZGUgc2VydmljZS5cclxuICAgIHByaXZhdGUgX3Byb3ZpZGU6IGFuZ3VsYXIuYXV0by5JUHJvdmlkZVNlcnZpY2U7XHJcblxyXG4gICAgLy8gQG5nSW5qZWN0XHJcbiAgICBjb25zdHJ1Y3RvcigkcHJvdmlkZTogYW5ndWxhci5hdXRvLklQcm92aWRlU2VydmljZSkge1xyXG4gICAgICAgIHRoaXMuX3Byb3ZpZGUgPSAkcHJvdmlkZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEEgbGlzdCBvZiByZWdpc3RlcmVkIHN0b3Jlcy5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldCBzdG9yZXMoKTogc3RyaW5nW10ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9zdG9yZXM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGVzIGEgbmV3IHNoYXJlZCBzdG9yZS5cclxuICAgICAqXHJcbiAgICAgKiBXaGVuIGNob29zaW5nIGFuIGlkZW50aWZpZXIgZm9yIHRoZSBzdG9yZSwgeW91IHNob3VsZCB3cml0ZSBpdCB1c2luZ1xyXG4gICAgICoga2ViYWItY2FzZSBhbmQgbm90IGluY2x1ZGUgdGhlIHN0cmluZyAnc3RvcmUnIGVpdGhlciBhcyBhIHByZWZpeCBvclxyXG4gICAgICogYSBzdWZmaXguXHJcbiAgICAgKlxyXG4gICAgICogVGhpcyBtZXRob2QgbWF5IG9ubHkgYmUgY2FsbGVkIGluIHRoZSBhcHBsaWNhdGlvbidzIGNvbmZpZ3VyYXRpb25cclxuICAgICAqIHBoYXNlLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBzdG9yZUlkIElkZW50aWZpZXIgb2YgdGhlIHNoYXJlZCBzdG9yZSAobXVzdCBiZSBnbG9iYWxseSB1bmlxdWUpXHJcbiAgICAgKiBAcGFyYW0gaW5pdGlhbFN0YXRlIE9wdGlvbmFsIGluaXRpYWwgc3RhdGUgb2YgdGhlIHNoYXJlZCBzdG9yZVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgY3JlYXRlPFQ+KHN0b3JlSWQ6IHN0cmluZywgaW5pdGlhbFN0YXRlOiBUID0gbnVsbCk6IHZvaWQge1xyXG4gICAgICAgIGNsYXNzIEV4dGVuZGVkIGV4dGVuZHMgU2ltcGxlU2hhcmVkU3RvcmU8VD4ge1xyXG4gICAgICAgICAgICBwcm90ZWN0ZWQgaW5pdGlhbFN0YXRlKCkgeyByZXR1cm4gaW5pdGlhbFN0YXRlOyB9XHJcbiAgICAgICAgICAgIHByb3RlY3RlZCByZWR1Y2Uoc3RhdGU6IFQsIGFjdGlvbjogQWN0aW9uKTogVCB7IHJldHVybiB1bmRlZmluZWQ7IH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucmVnaXN0ZXI8VD4oc3RvcmVJZCwgRXh0ZW5kZWQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVnaXN0ZXJzIGEgbmV3IHNoYXJlZCBzdG9yZS4gQSBzdG9yZSB3aXRoIHRoZSBzYW1lIG5hbWUgbXVzdCBub3QgYWxyZWFkeVxyXG4gICAgICogYmUgcmVnaXN0ZXJlZC5cclxuICAgICAqXHJcbiAgICAgKiBUaGlzIG1ldGhvZCBtYXkgb25seSBiZSBjYWxsZWQgaW4gdGhlIGFwcGxpY2F0aW9uJ3MgY29uZmlndXJhdGlvblxyXG4gICAgICogcGhhc2UuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHN0b3JlSWQgSWRlbnRpZmllciBvZiB0aGUgc2hhcmVkIHN0b3JlIChtdXN0IGJlIGdsb2JhbGx5IHVuaXF1ZSlcclxuICAgICAqIEBwYXJhbSBTaGFyZWQgc3RvcmUgY2xhc3NcclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlZ2lzdGVyPFQ+KHN0b3JlSWQ6IHN0cmluZywgc3RvcmVUeXBlOiBTaGFyZWRTdG9yZUZhY3Rvcnk8VCwgYW55Pik6IHZvaWQge1xyXG4gICAgICAgIC8vIFJlZ2lzdGVyIHRoZSBzdG9yZSBhcyBhbiBhbmd1bGFyIHNlcnZpY2UuIFdlIHVzZSBmYWN0b3J5IGluc3RlYWQgb2Ygc2VydmljZVxyXG4gICAgICAgIC8vIHNvIHdlIGNhbiBzZXQgdGhlIGBfc3RvcmVJZGAgb24gdGhlIGluc3RhbmNlLlxyXG4gICAgICAgIHRoaXMuX3Byb3ZpZGUuZmFjdG9yeShcclxuICAgICAgICAgICAgc3RvcmVJZFRvU2VydmljZUlkKHN0b3JlSWQpLFxyXG4gICAgICAgICAgICAvLyBAbmdJbmplY3RcclxuICAgICAgICAgICAgKCRpbmplY3RvcjogYW5ndWxhci5hdXRvLklJbmplY3RvclNlcnZpY2UpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHN0b3JlOiBhbnkgPSAkaW5qZWN0b3IuaW5zdGFudGlhdGUoc3RvcmVUeXBlKTtcclxuICAgICAgICAgICAgICAgIHN0b3JlLl9zdG9yZUlkID0gc3RvcmVJZDtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzdG9yZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgdGhpcy5fc3RvcmVzLnB1c2goc3RvcmVJZCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWdpc3RlcnMgYSBuZXcgYWN0aW9ucyBjbGFzcy5cclxuICAgICAqXHJcbiAgICAgKiBUaGlzIG1ldGhvZCBtYXkgb25seSBiZSBjYWxsZWQgaW4gdGhlIGFwcGxpY2F0aW9uJ3MgY29uZmlndXJhdGlvblxyXG4gICAgICogcGhhc2UuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIGFjdGlvbnNJZCBJZGVudGlmaWVyIG9mIHRoZSBhY3Rpb25zIGNsYXNzIChtdXN0IGJlIGdsb2JhbGx5IHVuaXF1ZSlcclxuICAgICAqIEBwYXJhbSBBY3Rpb25zIGNsYXNzXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWdpc3RlckFjdGlvbnMoYWN0aW9uc0lkOiBzdHJpbmcsIGFjdGlvbnNUeXBlOiBBY3Rpb25GYWN0b3J5KTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5fcHJvdmlkZS5zZXJ2aWNlKGFjdGlvbnNJZFRvU2VydmljZUlkKGFjdGlvbnNJZCksIGFjdGlvbnNUeXBlKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBAbmdJbmplY3RcclxuICAgIHB1YmxpYyAkZ2V0KCRpbmplY3RvcjogYW5ndWxhci5hdXRvLklJbmplY3RvclNlcnZpY2UsXHJcbiAgICAgICAgICAgICAgICBkaXNwYXRjaGVyOiBEaXNwYXRjaGVyKTogU2hhcmVkU3RvcmVNYW5hZ2VyIHtcclxuICAgICAgICByZXR1cm4gbmV3IFNoYXJlZFN0b3JlTWFuYWdlcigkaW5qZWN0b3IsIGRpc3BhdGNoZXIsIHRoaXMpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogTWFuYWdlciBvZiBhbGwgc2hhcmVkIHN0b3JlcyAoc2VlIFtbU2hhcmVkU3RvcmVdXSkgaW4gYW4gYXBwbGljYXRpb24uIEVhY2ggc3RvcmVcclxuICogcmVxdWlyZXMgYSBnbG9iYWxseSB1bmlxdWUgaWRlbnRpZmllciwgd2hpY2ggaXMgYWxzbyB1c2VkIGR1cmluZyBzdGF0ZSBzZXJpYWxpemF0aW9uLlxyXG4gKlxyXG4gKiBJbiBvcmRlciB0byB1c2Ugc2hhcmVkIHN0b3JlcywgeW91IG11c3QgZmlyc3QgY3JlYXRlIHRoZW0uIFRoZSBiZXN0IHdheSB0byBkb1xyXG4gKiB0aGlzIGlzIGluc2lkZSB5b3VyIG1vZHVsZSdzIGBjb25maWdgIGZ1bmN0aW9uIGFzIGZvbGxvd3M6XHJcbiAqIGBgYFxyXG4gKiBtb2R1bGUuY29uZmlnKChzaGFyZWRTdG9yZU1hbmFnZXJQcm92aWRlcjogU2hhcmVkU3RvcmVQcm92aWRlcikgPT4ge1xyXG4gKiAgICAgLy8gQ3JlYXRlIHRoZSBzZWxlY3RlZCBST1NFMiBkYXRhIGl0ZW1zIHNoYXJlZCBzdG9yZS5cclxuICogICAgIHNoYXJlZFN0b3JlTWFuYWdlclByb3ZpZGVyLmNyZWF0ZSgncm9zZTItc2VsZWN0ZWQtZGF0YS1pdGVtJyk7XHJcbiAqIH0pO1xyXG4gKiBgYGBcclxuICpcclxuICogVGhlIHN0b3JlIG1heSB0aGVuIGJlIHVzZWQgYXMgaW5wdXQgdG8gc2hhcmVkIHN0YXRlIGRlZmluZWQgb24gc3RhdGVmdWxcclxuICogY29tcG9uZW50cyAoc2VlIFtbU3RhdGVmdWxDb21wb25lbnRCYXNlXV0pIGFuZCBjYW4gYWxzbyBiZSBpbmplY3RlZCB1c2luZ1xyXG4gKiBhIHNwZWNpZmljIHRva2VuLiBJZiBhIHN0b3JlIGlzIG5hbWVkIGBteS1uaWNlLWl0ZW1zYCwgaXQgd2lsbCBiZSBpbmplY3RhYmxlXHJcbiAqIGJ5IHVzaW5nIHRoZSB0b2tlbiBgbXlOaWNlSXRlbXNTdG9yZWAuXHJcbiAqXHJcbiAqIElmIHlvdSB3aXNoIHRvIGRlZmluZSBzaGFyZWQgc3RvcmVzIHdoaWNoIHN1cHBvcnQgYWRkaXRpb25hbCBhY3Rpb25zLCB5b3VcclxuICogc2hvdWxkIHN1YmNsYXNzIFtbU2hhcmVkU3RvcmVdXSBhbmQgcmVnaXN0ZXIgeW91ciBzdG9yZSBieSB1c2luZyBbW3JlZ2lzdGVyXV1cclxuICogYXMgZm9sbG93czpcclxuICogYGBgXHJcbiAqIGNsYXNzIENvbXBsZXhBY3Rpb25zIHtcclxuICogICAgIHN0YXRpYyBBRERfSVRFTSA9ICdjb21wbGV4L2FkZF9pdGVtJztcclxuICogICAgIHB1YmxpYyBhZGRJdGVtKHZhbHVlOiB0eXBlcy5TYW1wbGVEYXRhKSB7XHJcbiAqICAgICAgICAgcmV0dXJuIHsgdHlwZTogQ29tcGxleEFjdGlvbnMuQUREX0lURU0sIGl0ZW06IHZhbHVlIH07XHJcbiAqICAgICB9XHJcbiAqIH1cclxuICpcclxuICogY2xhc3MgQ29tcGxleFN0b3JlIGV4dGVuZHMgU2hhcmVkU3RvcmU8dHlwZXMuU2FtcGxlRGF0YVtdLCBDb21wbGV4QWN0aW9ucz4ge1xyXG4gKiAgICAgLy8gQG5nSW5qZWN0XHJcbiAqICAgICBjb25zdHJ1Y3Rvcihjb21wbGV4QWN0aW9uczogQ29tcGxleEFjdGlvbnMpIHtcclxuICogICAgICAgICBzdXBlcihjb21wbGV4QWN0aW9ucyk7XHJcbiAqICAgICB9XHJcbiAqXHJcbiAqICAgICBwcm90ZWN0ZWQgaW5pdGlhbFN0YXRlKCk6IHR5cGVzLlNhbXBsZURhdGFbXSB7XHJcbiAqICAgICAgICAgcmV0dXJuIFtdO1xyXG4gKiAgICAgfVxyXG4gKlxyXG4gKiAgICAgcHJvdGVjdGVkIHJlZHVjZShzdGF0ZTogdHlwZXMuU2FtcGxlRGF0YVtdLCBhY3Rpb246IGFueSk6IHZvaWQge1xyXG4gKiAgICAgICAgIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcclxuICogICAgICAgICAgICAgY2FzZSBBRERfSVRFTToge1xyXG4gKiAgICAgICAgICAgICAgICAgcmV0dXJuIF8udW5pb24oc3RhdGUsIGFjdGlvbi5pdGVtKTtcclxuICogICAgICAgICAgICAgfVxyXG4gKiAgICAgICAgICAgICAvLyAuLi5cclxuICogICAgICAgICB9XHJcbiAqICAgICB9XHJcbiAqIH1cclxuICpcclxuICogbW9kdWxlLmNvbmZpZygoc2hhcmVkU3RvcmVNYW5hZ2VyUHJvdmlkZXI6IFNoYXJlZFN0b3JlUHJvdmlkZXIpID0+IHtcclxuICogICAgIHNoYXJlZFN0b3JlTWFuYWdlclByb3ZpZGVyLnJlZ2lzdGVyQWN0aW9ucygnY29tcGxleCcsIENvbXBsZXhBY3Rpb25zKTtcclxuICogICAgIHNoYXJlZFN0b3JlTWFuYWdlclByb3ZpZGVyLnJlZ2lzdGVyKCdjb21wbGV4JywgQ29tcGxleFN0b3JlKTtcclxuICogfSk7XHJcbiAqIGBgYFxyXG4gKlxyXG4gKiBXaGVuIGNyZWF0aW5nIGEgbmV3IHNoYXJlZCBzdG9yZSwgYSBnb29kIGRlc2lnbiBwcmFjdGljZSBpcyB0byBzZXBhcmF0ZVxyXG4gKiBhY3Rpb25zIGludG8gdGhlIGBhY3Rpb25zYCBkaXJlY3RvcnkgYW5kIGltcGxlbWVudCBhY3Rpb25zIGFzIG1ldGhvZHMgb25cclxuICogdGhlIGFjdGlvbnMgY2xhc3MgbmFtZWQgYWZ0ZXIgeW91ciBzdG9yZSAoZWcuIGZvciBzdG9yZSBgRm9vU3RvcmVgIHB1dFxyXG4gKiBhY3Rpb25zIGludG8gYEZvb0FjdGlvbnNgKS5cclxuICpcclxuICogU3RvcmVzIHRoZW1zZWx2ZXMgc2hvdWxkIG9ubHkgaW1wbGVtZW50IHRoZSBzdGF0ZSBtYW5hZ2VtZW50IGZ1bmN0aW9uYWxpdHlcclxuICogYW5kIG1vc3QgYnVzaW5lc3MgbG9naWMgc2hvdWxkIGJlIGNvbnRhaW5lZCBpbiB0aGUgYWN0aW9ucyBjbGFzcy4gRm9yXHJcbiAqIGV4YW1wbGUsIGlmIGFjdGlvbnMgcmVxdWlyZSBzb21lIGFzeW5jaHJvbm91cyBvcGVyYXRpb25zIHRvIGJlIHBlcmZvcm1lZFxyXG4gKiBvbiBhIHJlbW90ZSBiYWNrZW5kIGFsbCB0aGlzIGZ1bmN0aW9uYWxpdHkgc2hvdWxkIGJlIHB1dCBpbnRvIHRoZSBhY3Rpb25zXHJcbiAqIGNsYXNzIGFuZCBub3QgaW50byB0aGUgc3RvcmUuXHJcbiAqXHJcbiAqIEFsbCBhY3Rpb25zIGNsYXNzZXMgc2hvdWxkIGJlIHJlZ2lzdGVyZWQgdmlhIHRoZSBbW1NoYXJlZFN0b3JlUHJvdmlkZXJdXVxyXG4gKiBhbmQgc3VwcG9ydCBBbmd1bGFyIGRlcGVuZGVuY3kgaW5qZWN0aW9uLiBBY3Rpb25zIGNsYXNzZXMgYXJlIGluamVjdGFibGVcclxuICogdW5kZXIgdGhlIHRva2VuIGBpZEFjdGlvbnNgIHdoZXJlIHRoZSBgaWRgIHBhcnQgaXMgdGhlIHZhbHVlIGRlZmluZWQgYnlcclxuICogYGFjdGlvbnNJZGAsIGZvcm1hdHRlZCBpbiBjYW1lbENhc2UuIFRoZSBjb25zdHJ1Y3RvciBvZiBhbiBhY3Rpb25zXHJcbiAqIGNsYXNzIG1heSBhbHNvIGluamVjdCBvdGhlciBkZXBlbmRlbmNpZXMuXHJcbiAqXHJcbiAqIEZvciBjb252ZW5pZW5jZSwgeW91IG1heSBpbmplY3QgeW91ciBhY3Rpb25zIGNsYXNzIGluIHlvdXIgc2hhcmVkIHN0b3JlXHJcbiAqIGNsYXNzIHVuZGVyIHRoZSBwdWJsaWMgYXR0cmlidXRlIGBhY3Rpb25zYC4gVGhpcyB3YXkgb25lIG1heSBnZXQgdGhlXHJcbiAqIGFjdGlvbnMgY2xhc3Mgc2ltcGx5IGJ5IGFjY2Vzc2luZyBgc3RvcmUuYWN0aW9uc2Agd2hlbiBnaXZlbiBhIHNoYXJlZFxyXG4gKiBzdG9yZSBpbnN0YW5jZS5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBTaGFyZWRTdG9yZU1hbmFnZXIge1xyXG4gICAgLy8vIFNoYXJlZCBzdG9yZSBwcm92aWRlci5cclxuICAgIHByaXZhdGUgX3Byb3ZpZGVyOiBTaGFyZWRTdG9yZVByb3ZpZGVyO1xyXG4gICAgLy8vIERpc3BhdGNoZXIuXHJcbiAgICBwcml2YXRlIF9kaXNwYXRjaGVyOiBEaXNwYXRjaGVyO1xyXG4gICAgLy8vIEFuZ3VsYXIgaW5qZWN0b3IuXHJcbiAgICBwcml2YXRlIF9pbmplY3RvcjogYW5ndWxhci5hdXRvLklJbmplY3RvclNlcnZpY2U7XHJcblxyXG4gICAgLy8gQG5nSW5qZWN0XHJcbiAgICBjb25zdHJ1Y3RvcigkaW5qZWN0b3I6IGFuZ3VsYXIuYXV0by5JSW5qZWN0b3JTZXJ2aWNlLFxyXG4gICAgICAgICAgICAgICAgZGlzcGF0Y2hlcjogRGlzcGF0Y2hlcixcclxuICAgICAgICAgICAgICAgIHNoYXJlZFN0b3JlTWFuYWdlclByb3ZpZGVyOiBTaGFyZWRTdG9yZVByb3ZpZGVyKSB7XHJcbiAgICAgICAgdGhpcy5fcHJvdmlkZXIgPSBzaGFyZWRTdG9yZU1hbmFnZXJQcm92aWRlcjtcclxuICAgICAgICB0aGlzLl9pbmplY3RvciA9ICRpbmplY3RvcjtcclxuICAgICAgICB0aGlzLl9kaXNwYXRjaGVyID0gZGlzcGF0Y2hlcjtcclxuICAgICAgICB0aGlzLl9kaXNwYXRjaGVyLnNldERpc3BhdGNoZXIodGhpcy5fZGlzcGF0Y2guYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIGEgcHJldmlvdXNseSByZWdpc3RlcmVkIHN0b3JlLiBJdCBpcyBhbiBlcnJvciB0byByZXF1ZXN0IGEgc3RvcmVcclxuICAgICAqIHdoaWNoIGRvZXNuJ3QgZXhpc3QuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHN0b3JlSWQgSWRlbnRpZmllciBvZiB0aGUgc2hhcmVkIHN0b3JlXHJcbiAgICAgKiBAcmV0dXJuIFNoYXJlZCBzdG9yZSBpbnN0YW5jZVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0U3RvcmU8VD4oc3RvcmVJZDogc3RyaW5nKTogU2hhcmVkU3RvcmU8VCwgYW55PiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2luamVjdG9yLmdldDxTaGFyZWRTdG9yZTxULCBhbnk+PihzdG9yZUlkVG9TZXJ2aWNlSWQoc3RvcmVJZCkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGlzcGF0Y2hlcyBhbiBhY3Rpb24gdG8gYWxsIHNoYXJlZCBzdG9yZXMuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIGFjdGlvbiBBY3Rpb24gdG8gZGlzcGF0Y2hcclxuICAgICAqL1xyXG4gICAgcHVibGljIGRpc3BhdGNoKGFjdGlvbjogQWN0aW9uIHwgVGh1bmspOiBhbnkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9kaXNwYXRjaGVyLmRpc3BhdGNoKGFjdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbnRlcm5hbCBnbG9iYWwgZGlzcGF0Y2ggaW1wbGVtZW50YXRpb24uXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgX2Rpc3BhdGNoKGFjdGlvbjogQWN0aW9uKTogdm9pZCB7XHJcbiAgICAgICAgZm9yIChjb25zdCBzdG9yZUlkIG9mIHRoaXMuX3Byb3ZpZGVyLnN0b3Jlcykge1xyXG4gICAgICAgICAgICB0aGlzLmdldFN0b3JlKHN0b3JlSWQpLl9kaXNwYXRjaChhY3Rpb24pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNlcmlhbGl6ZXMgdGhlIHZhbHVlcyBvZiBhbGwgc2hhcmVkIHN0b3Jlcy5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHNhdmVTdGF0ZSgpOiBhbnkge1xyXG4gICAgICAgIGxldCByZXN1bHQgPSB7fTtcclxuICAgICAgICBmb3IgKGNvbnN0IHN0b3JlSWQgb2YgdGhpcy5fcHJvdmlkZXIuc3RvcmVzKSB7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHRoaXMuZ2V0U3RvcmUoc3RvcmVJZCkudmFsdWUoKTtcclxuICAgICAgICAgICAgaWYgKGlzSnNvbmFibGUodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRbc3RvcmVJZF0gPSB2YWx1ZS50b0pTT04oKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdFtzdG9yZUlkXSA9IGFuZ3VsYXIuY29weSh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBMb2FkcyBzZXJpYWxpemVkIHZhbHVlcyBvZiBhbGwgc2hhcmVkIHN0b3Jlcy4gRXhpc3RpbmcgdmFsdWVzIGFyZSBvdmVyd3JpdHRlbi5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGxvYWRTdGF0ZShzdGF0ZTogYW55KTogdm9pZCB7XHJcbiAgICAgICAgZm9yIChjb25zdCBzdG9yZUlkIG9mIHRoaXMuX3Byb3ZpZGVyLnN0b3Jlcykge1xyXG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHN0YXRlW3N0b3JlSWRdO1xyXG4gICAgICAgICAgICBpZiAoIXZhbHVlKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuZ2V0U3RvcmUoc3RvcmVJZCkuZGlzcGF0Y2goe3R5cGU6IEFjdGlvbnMuU0VULCB2YWx1ZTogdmFsdWV9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBBbmd1bGFyIHNlcnZpY2UgaWRlbnRpZmllciB0aGF0IGNhbiBiZSB1c2VkIHRvIGluamVjdCBhXHJcbiAqIHN0b3JlIHZpYSBkZXBlbmRlbmN5IGluamVjdGlvbi5cclxuICpcclxuICogQHBhcmFtIHN0b3JlSWQgU3RvcmUgaWRlbnRpZmllclxyXG4gKi9cclxuZnVuY3Rpb24gc3RvcmVJZFRvU2VydmljZUlkKHN0b3JlSWQ6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gXy5jYW1lbENhc2UoYCR7c3RvcmVJZH0tc3RvcmVgKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgdGhlIEFuZ3VsYXIgc2VydmljZSBpZGVudGlmaWVyIHRoYXQgY2FuIGJlIHVzZWQgdG8gaW5qZWN0IGFuXHJcbiAqIGFjdGlvbnMgb2JqZWN0IHZpYSBkZXBlbmRlbmN5IGluamVjdGlvbi5cclxuICpcclxuICogQHBhcmFtIGFjdGlvbnNJZCBBY3Rpb25zIG9iamVjdCBpZGVudGlmaWVyXHJcbiAqL1xyXG5mdW5jdGlvbiBhY3Rpb25zSWRUb1NlcnZpY2VJZChhY3Rpb25zSWQ6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gXy5jYW1lbENhc2UoYCR7YWN0aW9uc0lkfS1hY3Rpb25zYCk7XHJcbn1cclxuXHJcbmNvbnN0IGFuZ3VsYXJNb2R1bGU6IGFuZ3VsYXIuSU1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCdyZXNvbHdlLnNlcnZpY2VzLnNoYXJlZF9zdG9yZScsIFtdKTtcclxuXHJcbi8vIFJlZ2lzdGVyIGluamVjdGFibGUgc2VydmljZXMuXHJcbmFuZ3VsYXJNb2R1bGUucHJvdmlkZXIoJ3NoYXJlZFN0b3JlTWFuYWdlcicsIFNoYXJlZFN0b3JlUHJvdmlkZXIpO1xyXG5hbmd1bGFyTW9kdWxlLnNlcnZpY2UoJ2Rpc3BhdGNoZXInLCBEaXNwYXRjaGVyKTtcclxuIl19
