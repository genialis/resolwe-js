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
                return this.onStateLoad(nextState);
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
     * @param state New state
     * @return Possibly modified state that should be used instead
     */
    SharedStore.prototype.onStateLoad = function (state) {
        return state;
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL3NoYXJlZF9zdG9yZS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwwQkFBNEI7QUFDNUIsdUJBQXlCO0FBQ3pCLGlDQUFtQztBQUVuQyxzQ0FBeUM7QUFDekMsOENBQWdEO0FBd0JoRDtJQUFBO0lBR0EsQ0FBQztJQUFELGNBQUM7QUFBRCxDQUhBLEFBR0M7QUFGRywrREFBK0Q7QUFDakQsV0FBRyxHQUFHLGdCQUFnQixDQUFDO0FBRjVCLDBCQUFPO0FBS3BCOzs7Ozs7Ozs7Ozs7O0dBYUc7QUFDSDtJQU9JLHFCQUFZLE9BQVc7UUFKZixhQUFRLEdBQXlDLEVBQUUsQ0FBQztRQUt4RCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUM1RCxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztRQUV4Qiw2QkFBNkI7UUFDN0IsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLFVBQVUsRUFBRSxDQUFDO1FBQ3BDLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDckYsQ0FBQztJQUtELHNCQUFXLGdDQUFPO1FBSGxCOztXQUVHO2FBQ0g7WUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN6QixDQUFDOzs7T0FBQTtJQUtELHNCQUFXLGdDQUFPO1FBSGxCOztXQUVHO2FBQ0g7WUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN6QixDQUFDOzs7T0FBQTtJQUVEOzs7OztPQUtHO0lBQ0ksK0JBQVMsR0FBaEIsVUFBaUIsTUFBYztRQUMzQixJQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENB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QUNMLHlCQUFDO0FBQUQsQ0EzRUEsQUEyRUMsSUFBQTtBQTNFWSxnREFBa0I7QUE2RS9COzs7OztHQUtHO0FBQ0gsNEJBQTRCLE9BQWU7SUFDdkMsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUksT0FBTyxXQUFRLENBQUMsQ0FBQztBQUMzQyxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCw4QkFBOEIsU0FBaUI7SUFDM0MsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUksU0FBUyxhQUFVLENBQUMsQ0FBQztBQUMvQyxDQUFDO0FBRUQsSUFBTSxhQUFhLEdBQW9CLE9BQU8sQ0FBQyxNQUFNLENBQUMsK0JBQStCLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFFM0YsZ0NBQWdDO0FBQ2hDLGFBQWEsQ0FBQyxRQUFRLENBQUMsb0JBQW9CLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztBQUNsRSxhQUFhLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQyIsImZpbGUiOiJjb3JlL3NoYXJlZF9zdG9yZS9pbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIFJ4IGZyb20gJ3J4JztcbmltcG9ydCAqIGFzIGFuZ3VsYXIgZnJvbSAnYW5ndWxhcic7XG5cbmltcG9ydCB7aXNKc29uYWJsZX0gZnJvbSAnLi4vdXRpbHMvbGFuZyc7XG5pbXBvcnQgKiBhcyBpbW11dGFibGUgZnJvbSAnLi4vdXRpbHMvaW1tdXRhYmxlJztcblxuLyoqXG4gKiBBIHNoYXJlZCBzdG9yZSBhY3Rpb24gY29udGFpbnMgYSBgdHlwZWAgcHJvcGVydHkgYW5kIGFueSBudW1iZXIgb2Ygb3RoZXJcbiAqIGN1c3RvbSBwcm9wZXJ0aWVzLiBBY3Rpb24gdHlwZXMgc3RhcnRpbmcgd2l0aCBgQEBpbnRlcm5hbC9gIGFyZSByZXNlcnZlZFxuICogZm9yIGludGVybmFsIHVzZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBY3Rpb24ge1xuICAgIHR5cGU6IHN0cmluZztcbiAgICBbcHJvcGVydHlOYW1lOiBzdHJpbmddOiBhbnk7XG59XG5cbi8qKlxuICogQSB0aHVuayBpcyBhIGZ1bmN0aW9uLCB3aGljaCBtZWRpYXRlcyB0aGUgZGlzcGF0Y2ggb2YgYW4gYWN0aW9uLiBJdCBtYXlcbiAqIGJlIGRpc3BhdGNoZWQgaW4gdGhlIHNhbWUgd2F5IGFzIGFuIGFjdGlvbi5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUaHVuayB7XG4gICAgKGRpc3BhdGNoZXI6IERpc3BhdGNoZXIsIGdldFN0YXRlOiAoKSA9PiBhbnkpOiBhbnk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2hhcmVkU3RvcmVRdWVyeTxULCBVPiB7XG4gICAgKHN0YXRlOiBSeC5PYnNlcnZhYmxlPFQ+KTogUnguT2JzZXJ2YWJsZTxVPjtcbn1cblxuZXhwb3J0IGNsYXNzIEFjdGlvbnMge1xuICAgIC8vLyBJbnRlcm5hbCBhY3Rpb24gZm9yIHNldHRpbmcgdGhpcyBzdG9yZSB0byBhIHNwZWNpZmljIHZhbHVlLlxuICAgIHB1YmxpYyBzdGF0aWMgU0VUID0gJ0BAaW50ZXJuYWwvU0VUJztcbn1cblxuLyoqXG4gKiBBIHNoYXJlZCBzdG9yZSByZXByZXNlbnRzIHN0YXRlIHRoYXQgaXMgc2hhcmVkIGJldHdlZW4gbXVsdGlwbGUgY29tcG9uZW50cyBpblxuICogYSBwcmVkaWN0YWJsZSB3YXkuIENvbXBvbmVudHMgdXBkYXRlIHRoZSBzdG9yZSBieSBkaXNwYXRjaGluZyBhY3Rpb25zIHRvXG4gKiBpdCB1c2luZyB0aGUgYGRpc3BhdGNoYCBtZXRob2QuXG4gKlxuICogRWFjaCBzaGFyZWQgc3RvcmUgYWxzbyBwcm92aWRlcyBhIHdheSBmb3IgdGhlIGNvbXBvbmVudHMgdG8gc3Vic2NyaWJlIHRvIGFueVxuICogY2hhbmdlcyBpbiB0aGUgc3RvcmUncyBzdGF0ZS5cbiAqXG4gKiBDb25zaWRlciBkZWZpbmluZyBhY3Rpb25zIGZvciB1c2UgaW4gYSBzaGFyZWQgc3RvcmUgc2VwYXJhdGVseSBmcm9tIHRoZSBzdG9yZSxcbiAqIGluIHRoZSBgYWN0aW9uc2Agc3ViZGlyZWN0b3J5LiBTZWUgW1tTaGFyZWRTdG9yZU1hbmFnZXJdXSBmb3IgZGV0YWlscy5cbiAqXG4gKiBEb24ndCBmb3JnZXQgdG8gY2FsbCBjb25zdHJ1Y3RvciB3aXRoIGFjdGlvbnMgYXMgYW4gYXJndW1lbnQgd2hlbiBleHRlbmRpbmdcbiAqIHRoaXMgY2xhc3MuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTaGFyZWRTdG9yZTxULCBVPiB7XG4gICAgcHJpdmF0ZSBfc3ViamVjdDogUnguQmVoYXZpb3JTdWJqZWN0PFQ+O1xuICAgIHByaXZhdGUgX2Rpc3BhdGNoZXI6IERpc3BhdGNoZXI7XG4gICAgcHJpdmF0ZSBfcXVlcmllczoge1tuYW1lOiBzdHJpbmddOiBSeC5PYnNlcnZhYmxlPGFueT59ID0ge307XG4gICAgcHJpdmF0ZSBfYWN0aW9uczogVTtcbiAgICBwcml2YXRlIF9zdG9yZUlkOiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3RvcihhY3Rpb25zPzogVSkge1xuICAgICAgICB0aGlzLl9zdWJqZWN0ID0gbmV3IFJ4LkJlaGF2aW9yU3ViamVjdCh0aGlzLmluaXRpYWxTdGF0ZSgpKTtcbiAgICAgICAgdGhpcy5fYWN0aW9ucyA9IGFjdGlvbnM7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGEgbG9jYWwgZGlzcGF0Y2hlci5cbiAgICAgICAgdGhpcy5fZGlzcGF0Y2hlciA9IG5ldyBEaXNwYXRjaGVyKCk7XG4gICAgICAgIHRoaXMuX2Rpc3BhdGNoZXIuc2V0RGlzcGF0Y2hlcih0aGlzLl9kaXNwYXRjaC5iaW5kKHRoaXMpLCB0aGlzLnZhbHVlLmJpbmQodGhpcykpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSB1bmlxdWUgaWRlbnRpZmllciBmb3IgdGhpcyBzaGFyZWQgc3RvcmUuXG4gICAgICovXG4gICAgcHVibGljIGdldCBzdG9yZUlkKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdG9yZUlkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgc3RvcmUgYWN0aW9ucy5cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IGFjdGlvbnMoKTogVSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hY3Rpb25zO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludGVybmFsIGRpc3BhdGNoZXIgaW1wbGVtZW50YXRpb24uXG4gICAgICpcbiAgICAgKiBOT1RFOiBUaGlzIG1ldGhvZCBpcyBwdWJsaWMgYmVjYXVzZSB0aGVyZSBpcyBubyB3YXkgdG8gZGVmaW5lIHByaXZhdGVcbiAgICAgKiBidXQgYWNjZXNzaWJsZSB0byBvdGhlciBjbGFzc2VzIHdpdGhpbiB0aGlzIG1vZHVsZSBpbiBUeXBlU2NyaXB0LlxuICAgICAqL1xuICAgIHB1YmxpYyBfZGlzcGF0Y2goYWN0aW9uOiBBY3Rpb24pOiB2b2lkIHtcbiAgICAgICAgY29uc3QgZXhpc3RpbmdWYWx1ZSA9IHRoaXMudmFsdWUoKTtcbiAgICAgICAgbGV0IHJlZHVjZXI6ICh2YWx1ZTogVCwgYWN0aW9uOiBBY3Rpb24pID0+IFQ7XG4gICAgICAgIGlmIChfLnN0YXJ0c1dpdGgoYWN0aW9uLnR5cGUsICdAQGludGVybmFsLycpKSB7XG4gICAgICAgICAgICByZWR1Y2VyID0gdGhpcy5fcmVkdWNlSW50ZXJuYWwuYmluZCh0aGlzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlZHVjZXIgPSB0aGlzLnJlZHVjZS5iaW5kKHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5ld1ZhbHVlID0gcmVkdWNlcihleGlzdGluZ1ZhbHVlLCBhY3Rpb24pO1xuICAgICAgICBpZiAoXy5pc1VuZGVmaW5lZChuZXdWYWx1ZSkpIHJldHVybjtcblxuICAgICAgICBpZiAoYW5ndWxhci5lcXVhbHMoZXhpc3RpbmdWYWx1ZSwgbmV3VmFsdWUpKSByZXR1cm47XG4gICAgICAgIHRoaXMuX3N1YmplY3Qub25OZXh0KGltbXV0YWJsZS5tYWtlSW1tdXRhYmxlKG5ld1ZhbHVlKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGlzcGF0Y2hlcyBhbiBhY3Rpb24gdG8gdGhpcyBzaGFyZWQgc3RvcmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYWN0aW9uIEFjdGlvbiB0byBkaXNwYXRjaFxuICAgICAqL1xuICAgIHB1YmxpYyBkaXNwYXRjaChhY3Rpb246IEFjdGlvbiB8IFRodW5rKTogYW55IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Rpc3BhdGNoZXIuZGlzcGF0Y2goYWN0aW9uKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtcyBpbnRlcm5hbCByZWR1Y2UgYWN0aW9ucyBpbXBsZW1lbnRlZCBmb3IgZWFjaCBzaGFyZWQgc3RvcmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc3RhdGUgRXhpc3Rpbmcgc2hhcmVkIHN0b3JlIHN0YXRlXG4gICAgICogQHBhcmFtIGFjdGlvbiBBY3Rpb24gdG8gcGVyZm9ybVxuICAgICAqIEByZXR1cm4gTmV3IHNoYXJlZCBzdG9yZSBzdGF0ZVxuICAgICAqL1xuICAgIHByaXZhdGUgX3JlZHVjZUludGVybmFsKHN0YXRlOiBULCBhY3Rpb246IEFjdGlvbik6IFQge1xuICAgICAgICBzd2l0Y2ggKGFjdGlvbi50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIEFjdGlvbnMuU0VUOiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV4dFN0YXRlID0gYWN0aW9uWyd2YWx1ZSddO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9uU3RhdGVMb2FkKG5leHRTdGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICAgICAgLy8gRG8gbm90aGluZy5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm1zIHRoZSBnaXZlbiBhY3Rpb24gb24gdGhlIHVuZGVybHlpbmcgc3RhdGUuXG4gICAgICpcbiAgICAgKiBTdWJjbGFzc2VzIG1heSBvdmVycmlkZSB0aGlzIG1ldGhvZCB0byBpbXBsZW1lbnQgYXJiaXRyYXJ5IGNvbXBsZXhcbiAgICAgKiBhY3Rpb25zIG9uIHRoZSBkYXRhIHN0b3JlLiBUaGlzIG1ldGhvZCBNVVNUIE5PVCBtdXRhdGUgdGhlIGV4aXN0aW5nXG4gICAgICogc3RhdGUuIEluc3RlYWQsIGl0IE1VU1QgcmV0dXJuIGFuIGltbXV0YWJsZSBjb3B5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHZhbHVlIEV4aXN0aW5nIHNoYXJlZCBzdG9yZSBzdGF0ZVxuICAgICAqIEBwYXJhbSBhY3Rpb24gT3BlcmF0aW9uIHRvIHBlcmZvcm1cbiAgICAgKiBAcmV0dXJuIE5ldyBzaGFyZWQgc3RvcmUgc3RhdGVcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgYWJzdHJhY3QgcmVkdWNlKHN0YXRlOiBULCBhY3Rpb246IEFjdGlvbik6IFQ7XG5cbiAgICAvKipcbiAgICAgKiBQcm92aWRlcyB0aGUgaW5pdGlhbCBzdGF0ZSBmb3IgdGhpcyBzaGFyZWQgc3RvcmUuIFRoaXMgc3RhdGUgaXNcbiAgICAgKiB1c2VkIHdoZW4gdGhlIHN0b3JlIGlzIGluaXRpYWxpemVkLlxuICAgICAqL1xuICAgIHByb3RlY3RlZCBhYnN0cmFjdCBpbml0aWFsU3RhdGUoKTogVDtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIGdldHMgY2FsbGVkIHdoZW4gdGhlIGRhdGEgc3RvcmUncyBzdGF0ZSBpcyBsb2FkZWQgZnJvbVxuICAgICAqIGFuIGV4dGVybmFsIHNvdXJjZSAod2hlbiB0aGUgU0VUIGFjdGlvbiBpcyBkaXNwYXRjaGVkIHRvIHRoZSBzdG9yZSkuXG4gICAgICpcbiAgICAgKiBJdCBpcyBjYWxsZWQgYmVmb3JlIHRoZSBuZXcgc3RhdGUgaGFzIGJlZW4gc2V0LiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvblxuICAgICAqIGRvZXMgbm90aGluZy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzdGF0ZSBOZXcgc3RhdGVcbiAgICAgKiBAcmV0dXJuIFBvc3NpYmx5IG1vZGlmaWVkIHN0YXRlIHRoYXQgc2hvdWxkIGJlIHVzZWQgaW5zdGVhZFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBvblN0YXRlTG9hZChzdGF0ZTogVCk6IFQge1xuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSBoZWxwZXIgbWV0aG9kIGZvciBkZWZpbmluZyBzaGFyZWQgc3RvcmUgcXVlcmllcy4gSWYgdGhlIHF1ZXJ5IGlzIGFscmVhZHlcbiAgICAgKiBkZWZpbmVkLCB0aGUgZXhpc3Rpbmcgb2JzZXJ2YWJsZSBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBuYW1lIFF1ZXJ5IG5hbWVcbiAgICAgKiBAcGFyYW0gcXVlcnkgUXVlcnkgZnVuY3Rpb25cbiAgICAgKiBAcmV0dXJuIFJlc3VsdGluZyBxdWVyeSBvYnNlcnZhYmxlXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGRlZmluZVF1ZXJ5PFY+KG5hbWU6IHN0cmluZywgcXVlcnk6IFNoYXJlZFN0b3JlUXVlcnk8VCwgVj4pOiBSeC5PYnNlcnZhYmxlPFY+IHtcbiAgICAgICAgbGV0IG9ic2VydmFibGU6IFJ4Lk9ic2VydmFibGU8Vj4gPSB0aGlzLl9xdWVyaWVzW25hbWVdO1xuICAgICAgICBpZiAob2JzZXJ2YWJsZSkgcmV0dXJuIG9ic2VydmFibGU7XG5cbiAgICAgICAgb2JzZXJ2YWJsZSA9IHRoaXMuX3F1ZXJpZXNbbmFtZV0gPSB0aGlzLm9ic2VydmFibGUoKS5sZXQocXVlcnkpLmRpc3RpbmN0VW50aWxDaGFuZ2VkKCk7XG4gICAgICAgIHJldHVybiBvYnNlcnZhYmxlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgdmFsdWUgc3RvcmVkIGluIHRoZSBzdG9yZS5cbiAgICAgKlxuICAgICAqIFlvdSBNVVNUIGVuc3VyZSB0aGF0IHRoZSByZXN1bHRpbmcgb2JqZWN0IGlzIE5PVCBtdXRhdGVkIGluIGFueSB3YXkuIEFueVxuICAgICAqIG11dGF0aW9uIG1heSBjYXVzZSB1bmRlZmluZWQgYmVoYXZpb3IuXG4gICAgICovXG4gICAgcHVibGljIHZhbHVlKCk6IFQge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3ViamVjdC5nZXRWYWx1ZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYW4gb2JzZXJ2YWJsZSBvZiB0aGUgc3RvcmUncyB2YWx1ZS5cbiAgICAgKlxuICAgICAqIFlvdSBNVVNUIGVuc3VyZSB0aGF0IHRoZSBvYnNlcnZlZCB2YWx1ZSBpcyBOT1QgbXV0YXRlZCBpbiBhbnkgd2F5LiBBbnlcbiAgICAgKiBtdXRhdGlvbiBtYXkgY2F1c2UgdW5kZWZpbmVkIGJlaGF2aW9yLlxuICAgICAqL1xuICAgIHB1YmxpYyBvYnNlcnZhYmxlKCk6IFJ4Lk9ic2VydmFibGU8VD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3ViamVjdDtcbiAgICB9XG59XG5cbi8qKlxuICogW1tTaW1wbGVTaGFyZWRTdG9yZV1dIGlzIGEgaGVscGVyIGNsYXNzIGludGVuZGVkIHRvIGJlIHVzZWQgYXMgYSB0eXBlIGluIGNvbmp1bmN0aW9uIHdpdGhcbiAqIFtbU2hhcmVkU3RvcmVQcm92aWRlcl1dJ3MgYGNyZWF0ZWAgbWV0aG9kIHdoZXJlIG9ubHkgU0VUIGFjdGlvbiBpcyB1c2VkLlxuICpcbiAqIEluIHRoaXMgY2FzZSBubyBzdWJjbGFzc2luZyBvZiBzdG9yZSBhbmQgYWN0aW9ucyBpcyBuZWVkZWQgYmVjYXVzZSBvbmx5IFNFVCBhY3Rpb24gaXMgdXNlZC5cbiAqIFRoaXMgaXMgY29udmVuaWVudCBmb3IgdXNlIGNhc2VzIHdoZXJlIHlvdSBvbmx5IG5lZWQgdG8gc2V0IGEgdmFsdWUgdGhhdCB5b3UgY2FuIHN1YnNjcmliZVxuICogdG8gZnJvbSBvdGhlciBjb21wb25lbnRzLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU2ltcGxlU2hhcmVkU3RvcmU8VD4gZXh0ZW5kcyBTaGFyZWRTdG9yZTxULCB0eXBlb2YgdW5kZWZpbmVkPiB7IH1cblxuLyoqXG4gKiBVc2VkIHRvIGRpc3BhdGNoIGFjdGlvbnMgdG8gc2hhcmVkIHN0b3Jlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIERpc3BhdGNoZXIgZXh0ZW5kcyBSeC5TdWJqZWN0PEFjdGlvbj4ge1xuICAgIHByaXZhdGUgX2dldFN0YXRlOiAoKSA9PiBhbnkgPSAoKSA9PiB1bmRlZmluZWQ7XG5cbiAgICAvKipcbiAgICAgKiBDb25maWd1cmVzIGEgZGlzcGF0Y2hlciBmdW5jdGlvbiBmb3IgdGhpcyBkaXNwYXRjaGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGRpc3BhdGNoZXIgVGhlIGRpc3BhdGNoZXIgZnVuY3Rpb25cbiAgICAgKi9cbiAgICBwdWJsaWMgc2V0RGlzcGF0Y2hlcihkaXNwYXRjaGVyOiAoYWN0aW9uOiBBY3Rpb24pID0+IHZvaWQsIGdldFN0YXRlPzogKCkgPT4gYW55KTogdm9pZCB7XG4gICAgICAgIC8vIFRoZSBkaXNwYXRjaGVyIGlzIHVzZWQgdG8gZGlzcGF0Y2ggYWxsIGFjdGlvbnMgdXNpbmcgYSBxdWV1ZSwgc28gYWN0aW9uc1xuICAgICAgICAvLyBtYXkgaW52b2tlIHRoZSBkaXNwYXRjaCBtZXRob2Qgd2l0aG91dCBjYXVzaW5nIHJlY3Vyc2lvbi4gVGhlIGN1cnJlbnRUaHJlYWRcbiAgICAgICAgLy8gc2NoZWR1bGVyIHB1dHMgYWxsIHBlbmRpbmcgaXRlbXMgaW5zaWRlIGEgcXVldWUsIHdoaWNoIGlzIGRpc3BhdGNoZWQgYWZ0ZXJcbiAgICAgICAgLy8gcmV0dXJuaW5nIGZyb20gYWN0aXZlIGRpc3BhdGNoLlxuICAgICAgICB0aGlzLm9ic2VydmVPbihSeC5TY2hlZHVsZXIuY3VycmVudFRocmVhZCkuc3Vic2NyaWJlKGRpc3BhdGNoZXIpO1xuICAgICAgICBpZiAoZ2V0U3RhdGUpIHRoaXMuX2dldFN0YXRlID0gZ2V0U3RhdGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGlzcGF0Y2hlcyBhbiBhY3Rpb24gdmlhIHRoaXMgZGlzcGF0Y2hlci5cbiAgICAgKi9cbiAgICBwdWJsaWMgZGlzcGF0Y2goYWN0aW9uOiBBY3Rpb24gfCBUaHVuayk6IGFueSB7XG4gICAgICAgIGlmIChfLmlzRnVuY3Rpb24oYWN0aW9uKSkge1xuICAgICAgICAgICAgLy8gQSB0aHVuayBoYXMgYmVlbiBwYXNzZWQuIEV4ZWN1dGUgaXQgd2l0aCB0aGUgZGlzcGF0Y2hlciBhcmd1bWVudCBhbmRcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgcmVzdWx0LlxuICAgICAgICAgICAgcmV0dXJuIGFjdGlvbih0aGlzLCB0aGlzLl9nZXRTdGF0ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm9uTmV4dChhY3Rpb24pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5pbnRlcmZhY2UgU2hhcmVkU3RvcmVNYXAge1xuICAgIFtpbmRleDogc3RyaW5nXTogU2hhcmVkU3RvcmU8YW55LCBhbnk+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNoYXJlZFN0b3JlRmFjdG9yeTxULCBVPiB7XG4gICAgbmV3ICguLi5hcmdzKTogU2hhcmVkU3RvcmU8VCwgVT47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQWN0aW9uRmFjdG9yeSB7XG4gICAgbmV3ICguLi5hcmdzKTogYW55O1xufVxuXG4vKipcbiAqIFNoYXJlZCBzdG9yZSBwcm92aWRlciwgZW5hYmxpbmcgcmVnaXN0cmF0aW9uIG9mIHNoYXJlZCBzdG9yZXMuIEFsbCBzdG9yZXNcbiAqIG11c3QgYmUgcmVnaXN0ZXJlZCBpbiB0aGUgYXBwbGljYXRpb24gY29uZmlndXJhdGlvbiBwaGFzZS5cbiAqL1xuZXhwb3J0IGNsYXNzIFNoYXJlZFN0b3JlUHJvdmlkZXIge1xuICAgIC8vLyBBIGxpc3Qgb2YgcmVnaXN0ZXJlZCBzdG9yZXMuXG4gICAgcHJpdmF0ZSBfc3RvcmVzOiBzdHJpbmdbXSA9IFtdO1xuICAgIC8vLyBQcm92aWRlIHNlcnZpY2UuXG4gICAgcHJpdmF0ZSBfcHJvdmlkZTogYW5ndWxhci5hdXRvLklQcm92aWRlU2VydmljZTtcblxuICAgIC8vIEBuZ0luamVjdFxuICAgIGNvbnN0cnVjdG9yKCRwcm92aWRlOiBhbmd1bGFyLmF1dG8uSVByb3ZpZGVTZXJ2aWNlKSB7XG4gICAgICAgIHRoaXMuX3Byb3ZpZGUgPSAkcHJvdmlkZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBIGxpc3Qgb2YgcmVnaXN0ZXJlZCBzdG9yZXMuXG4gICAgICovXG4gICAgcHVibGljIGdldCBzdG9yZXMoKTogc3RyaW5nW10ge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RvcmVzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgc2hhcmVkIHN0b3JlLlxuICAgICAqXG4gICAgICogV2hlbiBjaG9vc2luZyBhbiBpZGVudGlmaWVyIGZvciB0aGUgc3RvcmUsIHlvdSBzaG91bGQgd3JpdGUgaXQgdXNpbmdcbiAgICAgKiBrZWJhYi1jYXNlIGFuZCBub3QgaW5jbHVkZSB0aGUgc3RyaW5nICdzdG9yZScgZWl0aGVyIGFzIGEgcHJlZml4IG9yXG4gICAgICogYSBzdWZmaXguXG4gICAgICpcbiAgICAgKiBUaGlzIG1ldGhvZCBtYXkgb25seSBiZSBjYWxsZWQgaW4gdGhlIGFwcGxpY2F0aW9uJ3MgY29uZmlndXJhdGlvblxuICAgICAqIHBoYXNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHN0b3JlSWQgSWRlbnRpZmllciBvZiB0aGUgc2hhcmVkIHN0b3JlIChtdXN0IGJlIGdsb2JhbGx5IHVuaXF1ZSlcbiAgICAgKiBAcGFyYW0gaW5pdGlhbFN0YXRlIE9wdGlvbmFsIGluaXRpYWwgc3RhdGUgb2YgdGhlIHNoYXJlZCBzdG9yZVxuICAgICAqL1xuICAgIHB1YmxpYyBjcmVhdGU8VD4oc3RvcmVJZDogc3RyaW5nLCBpbml0aWFsU3RhdGU6IFQgPSBudWxsKTogdm9pZCB7XG4gICAgICAgIGNsYXNzIEV4dGVuZGVkIGV4dGVuZHMgU2ltcGxlU2hhcmVkU3RvcmU8VD4ge1xuICAgICAgICAgICAgcHJvdGVjdGVkIGluaXRpYWxTdGF0ZSgpIHsgcmV0dXJuIGluaXRpYWxTdGF0ZTsgfVxuICAgICAgICAgICAgcHJvdGVjdGVkIHJlZHVjZShzdGF0ZTogVCwgYWN0aW9uOiBBY3Rpb24pOiBUIHsgcmV0dXJuIHVuZGVmaW5lZDsgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZWdpc3RlcjxUPihzdG9yZUlkLCBFeHRlbmRlZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXJzIGEgbmV3IHNoYXJlZCBzdG9yZS4gQSBzdG9yZSB3aXRoIHRoZSBzYW1lIG5hbWUgbXVzdCBub3QgYWxyZWFkeVxuICAgICAqIGJlIHJlZ2lzdGVyZWQuXG4gICAgICpcbiAgICAgKiBUaGlzIG1ldGhvZCBtYXkgb25seSBiZSBjYWxsZWQgaW4gdGhlIGFwcGxpY2F0aW9uJ3MgY29uZmlndXJhdGlvblxuICAgICAqIHBoYXNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHN0b3JlSWQgSWRlbnRpZmllciBvZiB0aGUgc2hhcmVkIHN0b3JlIChtdXN0IGJlIGdsb2JhbGx5IHVuaXF1ZSlcbiAgICAgKiBAcGFyYW0gU2hhcmVkIHN0b3JlIGNsYXNzXG4gICAgICovXG4gICAgcHVibGljIHJlZ2lzdGVyPFQ+KHN0b3JlSWQ6IHN0cmluZywgc3RvcmVUeXBlOiBTaGFyZWRTdG9yZUZhY3Rvcnk8VCwgYW55Pik6IHZvaWQge1xuICAgICAgICAvLyBSZWdpc3RlciB0aGUgc3RvcmUgYXMgYW4gYW5ndWxhciBzZXJ2aWNlLiBXZSB1c2UgZmFjdG9yeSBpbnN0ZWFkIG9mIHNlcnZpY2VcbiAgICAgICAgLy8gc28gd2UgY2FuIHNldCB0aGUgYF9zdG9yZUlkYCBvbiB0aGUgaW5zdGFuY2UuXG4gICAgICAgIHRoaXMuX3Byb3ZpZGUuZmFjdG9yeShcbiAgICAgICAgICAgIHN0b3JlSWRUb1NlcnZpY2VJZChzdG9yZUlkKSxcbiAgICAgICAgICAgIC8vIEBuZ0luamVjdFxuICAgICAgICAgICAgKCRpbmplY3RvcjogYW5ndWxhci5hdXRvLklJbmplY3RvclNlcnZpY2UpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdG9yZTogYW55ID0gJGluamVjdG9yLmluc3RhbnRpYXRlKHN0b3JlVHlwZSk7XG4gICAgICAgICAgICAgICAgc3RvcmUuX3N0b3JlSWQgPSBzdG9yZUlkO1xuICAgICAgICAgICAgICAgIHJldHVybiBzdG9yZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5fc3RvcmVzLnB1c2goc3RvcmVJZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXJzIGEgbmV3IGFjdGlvbnMgY2xhc3MuXG4gICAgICpcbiAgICAgKiBUaGlzIG1ldGhvZCBtYXkgb25seSBiZSBjYWxsZWQgaW4gdGhlIGFwcGxpY2F0aW9uJ3MgY29uZmlndXJhdGlvblxuICAgICAqIHBoYXNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGFjdGlvbnNJZCBJZGVudGlmaWVyIG9mIHRoZSBhY3Rpb25zIGNsYXNzIChtdXN0IGJlIGdsb2JhbGx5IHVuaXF1ZSlcbiAgICAgKiBAcGFyYW0gQWN0aW9ucyBjbGFzc1xuICAgICAqL1xuICAgIHB1YmxpYyByZWdpc3RlckFjdGlvbnMoYWN0aW9uc0lkOiBzdHJpbmcsIGFjdGlvbnNUeXBlOiBBY3Rpb25GYWN0b3J5KTogdm9pZCB7XG4gICAgICAgIHRoaXMuX3Byb3ZpZGUuc2VydmljZShhY3Rpb25zSWRUb1NlcnZpY2VJZChhY3Rpb25zSWQpLCBhY3Rpb25zVHlwZSk7XG4gICAgfVxuXG4gICAgLy8gQG5nSW5qZWN0XG4gICAgcHVibGljICRnZXQoJGluamVjdG9yOiBhbmd1bGFyLmF1dG8uSUluamVjdG9yU2VydmljZSxcbiAgICAgICAgICAgICAgICBkaXNwYXRjaGVyOiBEaXNwYXRjaGVyKTogU2hhcmVkU3RvcmVNYW5hZ2VyIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTaGFyZWRTdG9yZU1hbmFnZXIoJGluamVjdG9yLCBkaXNwYXRjaGVyLCB0aGlzKTtcbiAgICB9XG59XG5cbi8qKlxuICogTWFuYWdlciBvZiBhbGwgc2hhcmVkIHN0b3JlcyAoc2VlIFtbU2hhcmVkU3RvcmVdXSkgaW4gYW4gYXBwbGljYXRpb24uIEVhY2ggc3RvcmVcbiAqIHJlcXVpcmVzIGEgZ2xvYmFsbHkgdW5pcXVlIGlkZW50aWZpZXIsIHdoaWNoIGlzIGFsc28gdXNlZCBkdXJpbmcgc3RhdGUgc2VyaWFsaXphdGlvbi5cbiAqXG4gKiBJbiBvcmRlciB0byB1c2Ugc2hhcmVkIHN0b3JlcywgeW91IG11c3QgZmlyc3QgY3JlYXRlIHRoZW0uIFRoZSBiZXN0IHdheSB0byBkb1xuICogdGhpcyBpcyBpbnNpZGUgeW91ciBtb2R1bGUncyBgY29uZmlnYCBmdW5jdGlvbiBhcyBmb2xsb3dzOlxuICogYGBgXG4gKiBtb2R1bGUuY29uZmlnKChzaGFyZWRTdG9yZU1hbmFnZXJQcm92aWRlcjogU2hhcmVkU3RvcmVQcm92aWRlcikgPT4ge1xuICogICAgIC8vIENyZWF0ZSB0aGUgc2VsZWN0ZWQgUk9TRTIgZGF0YSBpdGVtcyBzaGFyZWQgc3RvcmUuXG4gKiAgICAgc2hhcmVkU3RvcmVNYW5hZ2VyUHJvdmlkZXIuY3JlYXRlKCdyb3NlMi1zZWxlY3RlZC1kYXRhLWl0ZW0nKTtcbiAqIH0pO1xuICogYGBgXG4gKlxuICogVGhlIHN0b3JlIG1heSB0aGVuIGJlIHVzZWQgYXMgaW5wdXQgdG8gc2hhcmVkIHN0YXRlIGRlZmluZWQgb24gc3RhdGVmdWxcbiAqIGNvbXBvbmVudHMgKHNlZSBbW1N0YXRlZnVsQ29tcG9uZW50QmFzZV1dKSBhbmQgY2FuIGFsc28gYmUgaW5qZWN0ZWQgdXNpbmdcbiAqIGEgc3BlY2lmaWMgdG9rZW4uIElmIGEgc3RvcmUgaXMgbmFtZWQgYG15LW5pY2UtaXRlbXNgLCBpdCB3aWxsIGJlIGluamVjdGFibGVcbiAqIGJ5IHVzaW5nIHRoZSB0b2tlbiBgbXlOaWNlSXRlbXNTdG9yZWAuXG4gKlxuICogSWYgeW91IHdpc2ggdG8gZGVmaW5lIHNoYXJlZCBzdG9yZXMgd2hpY2ggc3VwcG9ydCBhZGRpdGlvbmFsIGFjdGlvbnMsIHlvdVxuICogc2hvdWxkIHN1YmNsYXNzIFtbU2hhcmVkU3RvcmVdXSBhbmQgcmVnaXN0ZXIgeW91ciBzdG9yZSBieSB1c2luZyBbW3JlZ2lzdGVyXV1cbiAqIGFzIGZvbGxvd3M6XG4gKiBgYGBcbiAqIGNsYXNzIENvbXBsZXhBY3Rpb25zIHtcbiAqICAgICBzdGF0aWMgQUREX0lURU0gPSAnY29tcGxleC9hZGRfaXRlbSc7XG4gKiAgICAgcHVibGljIGFkZEl0ZW0odmFsdWU6IHR5cGVzLlNhbXBsZURhdGEpIHtcbiAqICAgICAgICAgcmV0dXJuIHsgdHlwZTogQ29tcGxleEFjdGlvbnMuQUREX0lURU0sIGl0ZW06IHZhbHVlIH07XG4gKiAgICAgfVxuICogfVxuICpcbiAqIGNsYXNzIENvbXBsZXhTdG9yZSBleHRlbmRzIFNoYXJlZFN0b3JlPHR5cGVzLlNhbXBsZURhdGFbXSwgQ29tcGxleEFjdGlvbnM+IHtcbiAqICAgICAvLyBAbmdJbmplY3RcbiAqICAgICBjb25zdHJ1Y3Rvcihjb21wbGV4QWN0aW9uczogQ29tcGxleEFjdGlvbnMpIHtcbiAqICAgICAgICAgc3VwZXIoY29tcGxleEFjdGlvbnMpO1xuICogICAgIH1cbiAqXG4gKiAgICAgcHJvdGVjdGVkIGluaXRpYWxTdGF0ZSgpOiB0eXBlcy5TYW1wbGVEYXRhW10ge1xuICogICAgICAgICByZXR1cm4gW107XG4gKiAgICAgfVxuICpcbiAqICAgICBwcm90ZWN0ZWQgcmVkdWNlKHN0YXRlOiB0eXBlcy5TYW1wbGVEYXRhW10sIGFjdGlvbjogYW55KTogdm9pZCB7XG4gKiAgICAgICAgIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAqICAgICAgICAgICAgIGNhc2UgQUREX0lURU06IHtcbiAqICAgICAgICAgICAgICAgICByZXR1cm4gXy51bmlvbihzdGF0ZSwgYWN0aW9uLml0ZW0pO1xuICogICAgICAgICAgICAgfVxuICogICAgICAgICAgICAgLy8gLi4uXG4gKiAgICAgICAgIH1cbiAqICAgICB9XG4gKiB9XG4gKlxuICogbW9kdWxlLmNvbmZpZygoc2hhcmVkU3RvcmVNYW5hZ2VyUHJvdmlkZXI6IFNoYXJlZFN0b3JlUHJvdmlkZXIpID0+IHtcbiAqICAgICBzaGFyZWRTdG9yZU1hbmFnZXJQcm92aWRlci5yZWdpc3RlckFjdGlvbnMoJ2NvbXBsZXgnLCBDb21wbGV4QWN0aW9ucyk7XG4gKiAgICAgc2hhcmVkU3RvcmVNYW5hZ2VyUHJvdmlkZXIucmVnaXN0ZXIoJ2NvbXBsZXgnLCBDb21wbGV4U3RvcmUpO1xuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBXaGVuIGNyZWF0aW5nIGEgbmV3IHNoYXJlZCBzdG9yZSwgYSBnb29kIGRlc2lnbiBwcmFjdGljZSBpcyB0byBzZXBhcmF0ZVxuICogYWN0aW9ucyBpbnRvIHRoZSBgYWN0aW9uc2AgZGlyZWN0b3J5IGFuZCBpbXBsZW1lbnQgYWN0aW9ucyBhcyBtZXRob2RzIG9uXG4gKiB0aGUgYWN0aW9ucyBjbGFzcyBuYW1lZCBhZnRlciB5b3VyIHN0b3JlIChlZy4gZm9yIHN0b3JlIGBGb29TdG9yZWAgcHV0XG4gKiBhY3Rpb25zIGludG8gYEZvb0FjdGlvbnNgKS5cbiAqXG4gKiBTdG9yZXMgdGhlbXNlbHZlcyBzaG91bGQgb25seSBpbXBsZW1lbnQgdGhlIHN0YXRlIG1hbmFnZW1lbnQgZnVuY3Rpb25hbGl0eVxuICogYW5kIG1vc3QgYnVzaW5lc3MgbG9naWMgc2hvdWxkIGJlIGNvbnRhaW5lZCBpbiB0aGUgYWN0aW9ucyBjbGFzcy4gRm9yXG4gKiBleGFtcGxlLCBpZiBhY3Rpb25zIHJlcXVpcmUgc29tZSBhc3luY2hyb25vdXMgb3BlcmF0aW9ucyB0byBiZSBwZXJmb3JtZWRcbiAqIG9uIGEgcmVtb3RlIGJhY2tlbmQgYWxsIHRoaXMgZnVuY3Rpb25hbGl0eSBzaG91bGQgYmUgcHV0IGludG8gdGhlIGFjdGlvbnNcbiAqIGNsYXNzIGFuZCBub3QgaW50byB0aGUgc3RvcmUuXG4gKlxuICogQWxsIGFjdGlvbnMgY2xhc3NlcyBzaG91bGQgYmUgcmVnaXN0ZXJlZCB2aWEgdGhlIFtbU2hhcmVkU3RvcmVQcm92aWRlcl1dXG4gKiBhbmQgc3VwcG9ydCBBbmd1bGFyIGRlcGVuZGVuY3kgaW5qZWN0aW9uLiBBY3Rpb25zIGNsYXNzZXMgYXJlIGluamVjdGFibGVcbiAqIHVuZGVyIHRoZSB0b2tlbiBgaWRBY3Rpb25zYCB3aGVyZSB0aGUgYGlkYCBwYXJ0IGlzIHRoZSB2YWx1ZSBkZWZpbmVkIGJ5XG4gKiBgYWN0aW9uc0lkYCwgZm9ybWF0dGVkIGluIGNhbWVsQ2FzZS4gVGhlIGNvbnN0cnVjdG9yIG9mIGFuIGFjdGlvbnNcbiAqIGNsYXNzIG1heSBhbHNvIGluamVjdCBvdGhlciBkZXBlbmRlbmNpZXMuXG4gKlxuICogRm9yIGNvbnZlbmllbmNlLCB5b3UgbWF5IGluamVjdCB5b3VyIGFjdGlvbnMgY2xhc3MgaW4geW91ciBzaGFyZWQgc3RvcmVcbiAqIGNsYXNzIHVuZGVyIHRoZSBwdWJsaWMgYXR0cmlidXRlIGBhY3Rpb25zYC4gVGhpcyB3YXkgb25lIG1heSBnZXQgdGhlXG4gKiBhY3Rpb25zIGNsYXNzIHNpbXBseSBieSBhY2Nlc3NpbmcgYHN0b3JlLmFjdGlvbnNgIHdoZW4gZ2l2ZW4gYSBzaGFyZWRcbiAqIHN0b3JlIGluc3RhbmNlLlxuICovXG5leHBvcnQgY2xhc3MgU2hhcmVkU3RvcmVNYW5hZ2VyIHtcbiAgICAvLy8gU2hhcmVkIHN0b3JlIHByb3ZpZGVyLlxuICAgIHByaXZhdGUgX3Byb3ZpZGVyOiBTaGFyZWRTdG9yZVByb3ZpZGVyO1xuICAgIC8vLyBEaXNwYXRjaGVyLlxuICAgIHByaXZhdGUgX2Rpc3BhdGNoZXI6IERpc3BhdGNoZXI7XG4gICAgLy8vIEFuZ3VsYXIgaW5qZWN0b3IuXG4gICAgcHJpdmF0ZSBfaW5qZWN0b3I6IGFuZ3VsYXIuYXV0by5JSW5qZWN0b3JTZXJ2aWNlO1xuXG4gICAgLy8gQG5nSW5qZWN0XG4gICAgY29uc3RydWN0b3IoJGluamVjdG9yOiBhbmd1bGFyLmF1dG8uSUluamVjdG9yU2VydmljZSxcbiAgICAgICAgICAgICAgICBkaXNwYXRjaGVyOiBEaXNwYXRjaGVyLFxuICAgICAgICAgICAgICAgIHNoYXJlZFN0b3JlTWFuYWdlclByb3ZpZGVyOiBTaGFyZWRTdG9yZVByb3ZpZGVyKSB7XG4gICAgICAgIHRoaXMuX3Byb3ZpZGVyID0gc2hhcmVkU3RvcmVNYW5hZ2VyUHJvdmlkZXI7XG4gICAgICAgIHRoaXMuX2luamVjdG9yID0gJGluamVjdG9yO1xuICAgICAgICB0aGlzLl9kaXNwYXRjaGVyID0gZGlzcGF0Y2hlcjtcbiAgICAgICAgdGhpcy5fZGlzcGF0Y2hlci5zZXREaXNwYXRjaGVyKHRoaXMuX2Rpc3BhdGNoLmJpbmQodGhpcykpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBwcmV2aW91c2x5IHJlZ2lzdGVyZWQgc3RvcmUuIEl0IGlzIGFuIGVycm9yIHRvIHJlcXVlc3QgYSBzdG9yZVxuICAgICAqIHdoaWNoIGRvZXNuJ3QgZXhpc3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc3RvcmVJZCBJZGVudGlmaWVyIG9mIHRoZSBzaGFyZWQgc3RvcmVcbiAgICAgKiBAcmV0dXJuIFNoYXJlZCBzdG9yZSBpbnN0YW5jZVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXRTdG9yZTxUPihzdG9yZUlkOiBzdHJpbmcpOiBTaGFyZWRTdG9yZTxULCBhbnk+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2luamVjdG9yLmdldDxTaGFyZWRTdG9yZTxULCBhbnk+PihzdG9yZUlkVG9TZXJ2aWNlSWQoc3RvcmVJZCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERpc3BhdGNoZXMgYW4gYWN0aW9uIHRvIGFsbCBzaGFyZWQgc3RvcmVzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGFjdGlvbiBBY3Rpb24gdG8gZGlzcGF0Y2hcbiAgICAgKi9cbiAgICBwdWJsaWMgZGlzcGF0Y2goYWN0aW9uOiBBY3Rpb24gfCBUaHVuayk6IGFueSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kaXNwYXRjaGVyLmRpc3BhdGNoKGFjdGlvbik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW50ZXJuYWwgZ2xvYmFsIGRpc3BhdGNoIGltcGxlbWVudGF0aW9uLlxuICAgICAqL1xuICAgIHByaXZhdGUgX2Rpc3BhdGNoKGFjdGlvbjogQWN0aW9uKTogdm9pZCB7XG4gICAgICAgIGZvciAoY29uc3Qgc3RvcmVJZCBvZiB0aGlzLl9wcm92aWRlci5zdG9yZXMpIHtcbiAgICAgICAgICAgIHRoaXMuZ2V0U3RvcmUoc3RvcmVJZCkuX2Rpc3BhdGNoKGFjdGlvbik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXJpYWxpemVzIHRoZSB2YWx1ZXMgb2YgYWxsIHNoYXJlZCBzdG9yZXMuXG4gICAgICovXG4gICAgcHVibGljIHNhdmVTdGF0ZSgpOiBhbnkge1xuICAgICAgICBsZXQgcmVzdWx0ID0ge307XG4gICAgICAgIGZvciAoY29uc3Qgc3RvcmVJZCBvZiB0aGlzLl9wcm92aWRlci5zdG9yZXMpIHtcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHRoaXMuZ2V0U3RvcmUoc3RvcmVJZCkudmFsdWUoKTtcbiAgICAgICAgICAgIGlmIChpc0pzb25hYmxlKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdFtzdG9yZUlkXSA9IHZhbHVlLnRvSlNPTigpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHRbc3RvcmVJZF0gPSBhbmd1bGFyLmNvcHkodmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb2FkcyBzZXJpYWxpemVkIHZhbHVlcyBvZiBhbGwgc2hhcmVkIHN0b3Jlcy4gRXhpc3RpbmcgdmFsdWVzIGFyZSBvdmVyd3JpdHRlbi5cbiAgICAgKi9cbiAgICBwdWJsaWMgbG9hZFN0YXRlKHN0YXRlOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgZm9yIChjb25zdCBzdG9yZUlkIG9mIHRoaXMuX3Byb3ZpZGVyLnN0b3Jlcykge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBzdGF0ZVtzdG9yZUlkXTtcbiAgICAgICAgICAgIGlmICghdmFsdWUpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICB0aGlzLmdldFN0b3JlKHN0b3JlSWQpLmRpc3BhdGNoKHt0eXBlOiBBY3Rpb25zLlNFVCwgdmFsdWU6IHZhbHVlfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgQW5ndWxhciBzZXJ2aWNlIGlkZW50aWZpZXIgdGhhdCBjYW4gYmUgdXNlZCB0byBpbmplY3QgYVxuICogc3RvcmUgdmlhIGRlcGVuZGVuY3kgaW5qZWN0aW9uLlxuICpcbiAqIEBwYXJhbSBzdG9yZUlkIFN0b3JlIGlkZW50aWZpZXJcbiAqL1xuZnVuY3Rpb24gc3RvcmVJZFRvU2VydmljZUlkKHN0b3JlSWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIF8uY2FtZWxDYXNlKGAke3N0b3JlSWR9LXN0b3JlYCk7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgQW5ndWxhciBzZXJ2aWNlIGlkZW50aWZpZXIgdGhhdCBjYW4gYmUgdXNlZCB0byBpbmplY3QgYW5cbiAqIGFjdGlvbnMgb2JqZWN0IHZpYSBkZXBlbmRlbmN5IGluamVjdGlvbi5cbiAqXG4gKiBAcGFyYW0gYWN0aW9uc0lkIEFjdGlvbnMgb2JqZWN0IGlkZW50aWZpZXJcbiAqL1xuZnVuY3Rpb24gYWN0aW9uc0lkVG9TZXJ2aWNlSWQoYWN0aW9uc0lkOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBfLmNhbWVsQ2FzZShgJHthY3Rpb25zSWR9LWFjdGlvbnNgKTtcbn1cblxuY29uc3QgYW5ndWxhck1vZHVsZTogYW5ndWxhci5JTW9kdWxlID0gYW5ndWxhci5tb2R1bGUoJ3Jlc29sd2Uuc2VydmljZXMuc2hhcmVkX3N0b3JlJywgW10pO1xuXG4vLyBSZWdpc3RlciBpbmplY3RhYmxlIHNlcnZpY2VzLlxuYW5ndWxhck1vZHVsZS5wcm92aWRlcignc2hhcmVkU3RvcmVNYW5hZ2VyJywgU2hhcmVkU3RvcmVQcm92aWRlcik7XG5hbmd1bGFyTW9kdWxlLnNlcnZpY2UoJ2Rpc3BhdGNoZXInLCBEaXNwYXRjaGVyKTtcbiJdfQ==
