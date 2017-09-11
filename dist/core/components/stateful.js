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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var angular = require("angular");
var base_1 = require("./base");
var error_1 = require("../errors/error");
var StateItemMetadata = /** @class */ (function () {
    function StateItemMetadata(propertyName, shared) {
        this.propertyName = propertyName;
        this.shared = shared;
    }
    StateItemMetadata.prototype.getSharedStoreNameProperty = function () {
        return '_sharedStoreName_' + this.propertyName;
    };
    return StateItemMetadata;
}());
exports.StateItemMetadata = StateItemMetadata;
/**
 * A component which contains state that may be saved and reloaded later. Such
 * stateful components are automatically organized into a hierarchy, so that
 * parents also store state for all their children. Calling `saveState` on the
 * top-level component will therefore save the state of the complete application.
 *
 * Component state is defined by using property decorators as follows:
 * ```
 * export class ProcessGroups extends ViewComponent {
 *     @state() public selectedGroup: number;
 *
 *     // ...
 * }
 * ```
 *
 * It may be then referenced and watched from the controller or templates and
 * will automatically be saved when calling [[StatefulComponentBase.saveState]]
 * and reloaded when calling [[StatefulComponentBase.loadState]].
 *
 * A related decorator may be used to declare state, which is shared between
 * multiple components:
 * ```
 * export class WidgetRose2 extends WidgetBase {
 *     @sharedState() public selectedValue: SharedStore<types.Data>;
 *
 *     // ...
 * }
 * ```
 *
 * See [[SharedStoreManager]] and [[SharedStore]] for more documentation on
 * defining shared state using shared stores.
 *
 * For example, if a stateful component defines a shared state property called
 * `selectedValue` (as shown above) and you want to link it with the shared store
 * named `rose2-selected-data-item`, you can do the following in your template:
 * ```html
 * <gen-widget-rose2 store-selected-value="rose2-selected-data-item"></gen-widget-rose2>
 * ```
 *
 * Note that the template attribute name is prefixed with `store` even when the
 * property is called just `selectedValue`. This is done because what you pass
 * in the template is just a name of the store, which must be resolved using the
 * shared store manager.
 *
 * Inside the components you can then dispatch and subscribe to the underlying
 * store:
 * ```
 * // Publish something by dispatching an action to the shared store.
 * this.selectedValue.dispatch({type: Actions.SET, value: 42});
 *
 * // Subscribe to updates of the shared store.
 * this.subscribeSharedState('selectedValue', (data) => {
 *     console.log("Shared state 'selectedValue' is now", data);
 * });
 * ```
 */
var StatefulComponentBase = /** @class */ (function (_super) {
    __extends(StatefulComponentBase, _super);
    // @ngInject
    StatefulComponentBase.$inject = ["$scope", "stateManager"];
    function StatefulComponentBase($scope, stateManager) {
        var _this = _super.call(this, $scope) || this;
        /// Parent stateful component.
        _this._parent = null;
        /// A list of child stateful components.
        _this._children = [];
        /// Subscription requests for shared stores.
        _this._sharedStoreSubscribeRequests = [];
        /// Subscriptions to shared stores.
        _this._sharedStoreSubscriptions = [];
        _this._stateManager = stateManager;
        _this._sharedStoreManager = stateManager.sharedStoreManager;
        return _this;
    }
    StatefulComponentBase_1 = StatefulComponentBase;
    StatefulComponentBase.prototype.onComponentInit = function () {
        var _this = this;
        _super.prototype.onComponentInit.call(this);
        // When state identifier is not defined, default to directive name.
        if (_.isEmpty(this.stateId)) {
            this.stateId = this.getConfig().directive;
        }
        // Determine our parent and register ourselves with it.
        this._parent = this._findParentComponent();
        if (this._parent) {
            this._parent._registerChild(this);
            this.globalStateId = this._parent.globalStateId + '-' + this.stateId;
        }
        else {
            this._stateManager.addTopLevelComponent(this);
            this.globalStateId = this.stateId;
        }
        // Check if there is any pending state for us.
        this._stateManager.loadPendingComponentState(this);
        // Automatically load any configured shared state.
        var stateMetadata = this.__stateMetadata;
        _.forOwn(stateMetadata, function (metadata) {
            if (metadata.shared) {
                var sharedStoreName = _this[metadata.getSharedStoreNameProperty()];
                if (!_.isEmpty(sharedStoreName)) {
                    var store = _this._sharedStoreManager.getStore(sharedStoreName);
                    _this[metadata.propertyName] = store;
                }
                _this._setupSharedStore(metadata.propertyName);
            }
        });
    };
    /**
     * Sets up the shared store. This method may be overriden by subclasses when something
     * different should be done here.
     *
     * @param {store} Shared state
     */
    StatefulComponentBase.prototype._setupSharedStore = function (store) {
        // Subscribe to shared store, so that this component's scope gets updated when the
        // value in the store is updated.
        this.subscribeSharedState(store, _.noop);
    };
    Object.defineProperty(StatefulComponentBase.prototype, "stateManager", {
        /**
         * Returns the state manager.
         */
        get: function () {
            return this._stateManager;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StatefulComponentBase.prototype, "sharedStoreManager", {
        /**
         * Returns the shared store manager.
         */
        get: function () {
            return this._sharedStoreManager;
        },
        enumerable: true,
        configurable: true
    });
    StatefulComponentBase.prototype.onComponentDestroyed = function () {
        // Save current component state, so it will be available when this component
        // is instantiated again.
        this._stateManager.savePendingComponentState(this);
        if (this._parent) {
            this._parent._unregisterChild(this);
        }
        else {
            this._stateManager.removeTopLevelComponent(this);
        }
        _super.prototype.onComponentDestroyed.call(this);
    };
    /**
     * This method will be called after the component's state has been loaded.
     */
    StatefulComponentBase.prototype.onComponentStateAfterLoad = function () {
        // Do nothing by default.
    };
    /**
     * This method will be called before the component's state has been saved.
     */
    StatefulComponentBase.prototype.onComponentStatePreSave = function () {
        // Do nothing by default.
    };
    /**
     * Discovers the parent stateful component.
     */
    StatefulComponentBase.prototype._findParentComponent = function () {
        var scope = this.$scope.$parent;
        while (scope) {
            if (scope['ctrl'] instanceof StatefulComponentBase_1) {
                return scope['ctrl'];
            }
            scope = scope.$parent;
        }
        return null;
    };
    /**
     * Registers a new child of this stateful component.
     *
     * @param {StatefulComponentBase} child Child component instance
     */
    StatefulComponentBase.prototype._registerChild = function (child) {
        // Ensure the child's local state id is unique.
        if (_.any(this._children, function (c) { return c.stateId === child.stateId; })) {
            throw new error_1.GenError("Duplicate stateful component state identifier '" + child.stateId + "'.");
        }
        this._children.push(child);
    };
    /**
     * Unregisters an existing child of this stateful component.
     *
     * @param {StatefulComponentBase} child Child component instance
     */
    StatefulComponentBase.prototype._unregisterChild = function (child) {
        this._children = _.without(this._children, child);
    };
    /**
     * Returns the parent stateful component.
     */
    StatefulComponentBase.prototype.parentComponent = function () {
        return this._parent;
    };
    /**
     * Returns a list of child stateful components.
     */
    StatefulComponentBase.prototype.childComponents = function () {
        return _.clone(this._children);
    };
    /**
     * Finds a child component by its state identifier.
     *
     * @param {string} stateId Child's state identifier
     * @return {StatefulComponentBase} Child component instance
     */
    StatefulComponentBase.prototype.getChildComponent = function (stateId) {
        return _.find(this._children, function (child) { return child.stateId === stateId; });
    };
    /**
     * Subscribes to shared state. This is the same as a normal subscribe, but in
     * addition it also properly handles underlying data store changes when
     * component state is reloaded.
     *
     * The value observed from the shared store MUST NOT be mutated in any way as
     * doing so may cause undefined behavior. If you need to mutate the observed
     * value, use [[subscribeSharedStateMutable]] instead.
     *
     * @param {string} name Name of shared state
     * @param callback Callback to be invoked on subscription
     */
    StatefulComponentBase.prototype.subscribeSharedState = function (name, callback) {
        var _this = this;
        var storeMetadata = this._getStateMetadata(name);
        if (!storeMetadata || !storeMetadata.shared) {
            throw new error_1.GenError("Shared state '" + name + "' not found.");
        }
        var subscriber = function () {
            var store = _this[storeMetadata.propertyName];
            if (!store) {
            }
            if (!store)
                return;
            _this._sharedStoreSubscriptions.push(_this.subscribe(callback, store.observable()));
        };
        this._sharedStoreSubscribeRequests.push(subscriber);
        subscriber();
    };
    /**
     * A version of [[subscribeSharedState]], which ensures that the observed shared
     * store value is copied and can thus be safely mutated afterwards.
     *
     * @param {string} name Name of shared state
     * @param callback Callback to be invoked on subscription
     */
    StatefulComponentBase.prototype.subscribeSharedStateMutable = function (name, callback) {
        this.subscribeSharedState(name, function (value) { return callback(angular.copy(value)); });
    };
    /**
     * Returns metadata for specific component state.
     *
     * @param {string} name Name of shared state (not property name)
     * @return {StateItemMetadata} State metadata
     */
    StatefulComponentBase.prototype._getStateMetadata = function (name) {
        return this.__stateMetadata[name];
    };
    /**
     * Saves this component's current state and returns it.
     */
    StatefulComponentBase.prototype.saveState = function (saveChildren) {
        var _this = this;
        if (saveChildren === void 0) { saveChildren = true; }
        this.onComponentStatePreSave();
        var result = {};
        var state = result[this.globalStateId] = {};
        _.forOwn(this.__stateMetadata, function (metadata, key) {
            var value = _this[metadata.propertyName];
            if (metadata.shared) {
                // In case of shared state, save the identifier of the shared store.
                value = value.storeId;
            }
            state[key] = value;
        });
        // Save child state.
        if (saveChildren) {
            for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                var child = _a[_i];
                _.extend(result, child.saveState());
            }
        }
        return result;
    };
    /**
     * Loads this component's current state.
     *
     * @param {any} globalState Global state
     */
    StatefulComponentBase.prototype.loadState = function (globalState, loadChildren) {
        var _this = this;
        if (loadChildren === void 0) { loadChildren = true; }
        var state = globalState[this.globalStateId];
        var sharedStateChanged = false;
        _.forOwn(this.__stateMetadata, function (metadata, key) {
            var value = state[key];
            if (_.isUndefined(value))
                return;
            if (metadata.shared) {
                // Get the shared store from the shared store manager.
                var existingValue = _this[metadata.propertyName];
                if (existingValue.storeId !== value) {
                    _this[metadata.propertyName] = _this._sharedStoreManager.getStore(value);
                    sharedStateChanged = true;
                }
            }
            else {
                _this[metadata.propertyName] = value;
            }
        });
        // Load child state.
        if (loadChildren) {
            for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                var child = _a[_i];
                child.loadState(globalState);
            }
        }
        if (sharedStateChanged) {
            // Cancel any previous subscriptions to shared stores.
            for (var _b = 0, _c = this._sharedStoreSubscriptions; _b < _c.length; _b++) {
                var subscription = _c[_b];
                subscription.unsubscribe();
            }
            // Resubscribe, using the new stores.
            for (var _d = 0, _e = this._sharedStoreSubscribeRequests; _d < _e.length; _d++) {
                var request = _e[_d];
                request();
            }
        }
        this.onComponentStateAfterLoad();
        // Propagate state updates to the view.
        this.$scope.$applyAsync();
    };
    StatefulComponentBase.configureComponent = function (config) {
        var stateMetadata = this.prototype.__stateMetadata;
        if (!config.bindings)
            config.bindings = {};
        _.forOwn(stateMetadata, function (metadata, key) {
            if (metadata.shared) {
                config.bindings[metadata.getSharedStoreNameProperty()] = '@store' + _.capitalize(key);
            }
        });
        return config;
    };
    StatefulComponentBase = StatefulComponentBase_1 = __decorate([
        base_1.component({
            abstract: true,
            bindings: {
                stateId: '@stateId',
            },
        })
    ], StatefulComponentBase);
    return StatefulComponentBase;
    var StatefulComponentBase_1;
}(base_1.ComponentBase));
exports.StatefulComponentBase = StatefulComponentBase;
/**
 * Marks a property as being part of the component's state.
 *
 * @param {string} name Optional state name
 * @param {boolean} shared Does this state reference a shared store
 */
function state(name, shared) {
    if (shared === void 0) { shared = false; }
    return function (target, propertyKey) {
        if (!name)
            name = propertyKey;
        if (name[0] === '_') {
            throw new error_1.GenError("State identifiers starting with an underscore are reserved.");
        }
        if (!target.__stateMetadata) {
            target.__stateMetadata = {};
        }
        if (target.__stateMetadata[name]) {
            throw new error_1.GenError("Duplicate state identifier '" + name + "' on stateful component '" + target + "'.");
        }
        target.__stateMetadata[name] = new StateItemMetadata(propertyKey, shared);
    };
}
exports.state = state;
/**
 * Marks a property as being part of the component's state, which references
 * a shared store.
 *
 * @param {string} name Optional state name
 */
function sharedState(name) {
    return state(name, true);
}
exports.sharedState = sharedState;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2NvbXBvbmVudHMvc3RhdGVmdWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMEJBQTRCO0FBQzVCLGlDQUFtQztBQUVuQywrQkFBc0Y7QUFHdEYseUNBQXlDO0FBRXpDO0lBQ0ksMkJBQW1CLFlBQW9CLEVBQVMsTUFBZTtRQUE1QyxpQkFBWSxHQUFaLFlBQVksQ0FBUTtRQUFTLFdBQU0sR0FBTixNQUFNLENBQVM7SUFDL0QsQ0FBQztJQUVNLHNEQUEwQixHQUFqQztRQUNJLE1BQU0sQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO0lBQ25ELENBQUM7SUFDTCx3QkFBQztBQUFELENBUEEsQUFPQyxJQUFBO0FBUFksOENBQWlCO0FBaUI5Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXVERztBQU9IO0lBQW9ELHlDQUFhO0lBb0I3RCxZQUFZO0lBQ1osK0JBQVksTUFBc0IsRUFBRSxZQUEwQjtRQUE5RCxZQUNJLGtCQUFNLE1BQU0sQ0FBQyxTQUloQjtRQW5CRCw4QkFBOEI7UUFDdEIsYUFBTyxHQUEwQixJQUFJLENBQUM7UUFDOUMsd0NBQXdDO1FBQ2hDLGVBQVMsR0FBNEIsRUFBRSxDQUFDO1FBS2hELDRDQUE0QztRQUNwQyxtQ0FBNkIsR0FBa0MsRUFBRSxDQUFDO1FBQzFFLG1DQUFtQztRQUMzQiwrQkFBeUIsR0FBbUIsRUFBRSxDQUFDO1FBTW5ELEtBQUksQ0FBQyxhQUFhLEdBQUcsWUFBWSxDQUFDO1FBQ2xDLEtBQUksQ0FBQyxtQkFBbUIsR0FBRyxZQUFZLENBQUMsa0JBQWtCLENBQUM7O0lBQy9ELENBQUM7OEJBMUJpQixxQkFBcUI7SUE0QmhDLCtDQUFlLEdBQXRCO1FBQUEsaUJBa0NDO1FBakNHLGlCQUFNLGVBQWUsV0FBRSxDQUFDO1FBRXhCLG1FQUFtRTtRQUNuRSxFQUFFLENBQUMsQ0FBQyxDQUFD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QUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9CLE1BQU0sSUFBSSxnQkFBUSxDQUFDLDhCQUE4QixHQUFHLElBQUksR0FBRywyQkFBMkIsR0FBRyxNQUFNLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDNUcsQ0FBQztRQUNELE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxpQkFBaUIsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDOUUsQ0FBQyxDQUFDO0FBQ04sQ0FBQztBQWpCRCxzQkFpQkM7QUFFRDs7Ozs7R0FLRztBQUNILHFCQUE0QixJQUFhO0lBQ3JDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQzdCLENBQUM7QUFGRCxrQ0FFQyIsImZpbGUiOiJjb3JlL2NvbXBvbmVudHMvc3RhdGVmdWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgKiBhcyBhbmd1bGFyIGZyb20gJ2FuZ3VsYXInO1xuXG5pbXBvcnQge0NvbXBvbmVudEJhc2UsIGNvbXBvbmVudCwgQ29tcG9uZW50Q29uZmlndXJhdGlvbiwgU3Vic2NyaXB0aW9ufSBmcm9tICcuL2Jhc2UnO1xuaW1wb3J0IHtTaGFyZWRTdG9yZSwgU2hhcmVkU3RvcmVNYW5hZ2VyfSBmcm9tICcuLi9zaGFyZWRfc3RvcmUvaW5kZXgnO1xuaW1wb3J0IHtTdGF0ZU1hbmFnZXJ9IGZyb20gJy4vbWFuYWdlcic7XG5pbXBvcnQge0dlbkVycm9yfSBmcm9tICcuLi9lcnJvcnMvZXJyb3InO1xuXG5leHBvcnQgY2xhc3MgU3RhdGVJdGVtTWV0YWRhdGEge1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBwcm9wZXJ0eU5hbWU6IHN0cmluZywgcHVibGljIHNoYXJlZDogYm9vbGVhbikge1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRTaGFyZWRTdG9yZU5hbWVQcm9wZXJ0eSgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gJ19zaGFyZWRTdG9yZU5hbWVfJyArIHRoaXMucHJvcGVydHlOYW1lO1xuICAgIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdGF0ZU1ldGFkYXRhIHtcbiAgICBbaW5kZXg6IHN0cmluZ106IFN0YXRlSXRlbU1ldGFkYXRhO1xufVxuXG5pbnRlcmZhY2UgU2hhcmVkU3RvcmVTdWJzY3JpYmVSZXF1ZXN0IHtcbiAgICAoKTogdm9pZDtcbn1cblxuLyoqXG4gKiBBIGNvbXBvbmVudCB3aGljaCBjb250YWlucyBzdGF0ZSB0aGF0IG1heSBiZSBzYXZlZCBhbmQgcmVsb2FkZWQgbGF0ZXIuIFN1Y2hcbiAqIHN0YXRlZnVsIGNvbXBvbmVudHMgYXJlIGF1dG9tYXRpY2FsbHkgb3JnYW5pemVkIGludG8gYSBoaWVyYXJjaHksIHNvIHRoYXRcbiAqIHBhcmVudHMgYWxzbyBzdG9yZSBzdGF0ZSBmb3IgYWxsIHRoZWlyIGNoaWxkcmVuLiBDYWxsaW5nIGBzYXZlU3RhdGVgIG9uIHRoZVxuICogdG9wLWxldmVsIGNvbXBvbmVudCB3aWxsIHRoZXJlZm9yZSBzYXZlIHRoZSBzdGF0ZSBvZiB0aGUgY29tcGxldGUgYXBwbGljYXRpb24uXG4gKlxuICogQ29tcG9uZW50IHN0YXRlIGlzIGRlZmluZWQgYnkgdXNpbmcgcHJvcGVydHkgZGVjb3JhdG9ycyBhcyBmb2xsb3dzOlxuICogYGBgXG4gKiBleHBvcnQgY2xhc3MgUHJvY2Vzc0dyb3VwcyBleHRlbmRzIFZpZXdDb21wb25lbnQge1xuICogICAgIEBzdGF0ZSgpIHB1YmxpYyBzZWxlY3RlZEdyb3VwOiBudW1iZXI7XG4gKlxuICogICAgIC8vIC4uLlxuICogfVxuICogYGBgXG4gKlxuICogSXQgbWF5IGJlIHRoZW4gcmVmZXJlbmNlZCBhbmQgd2F0Y2hlZCBmcm9tIHRoZSBjb250cm9sbGVyIG9yIHRlbXBsYXRlcyBhbmRcbiAqIHdpbGwgYXV0b21hdGljYWxseSBiZSBzYXZlZCB3aGVuIGNhbGxpbmcgW1tTdGF0ZWZ1bENvbXBvbmVudEJhc2Uuc2F2ZVN0YXRlXV1cbiAqIGFuZCByZWxvYWRlZCB3aGVuIGNhbGxpbmcgW1tTdGF0ZWZ1bENvbXBvbmVudEJhc2UubG9hZFN0YXRlXV0uXG4gKlxuICogQSByZWxhdGVkIGRlY29yYXRvciBtYXkgYmUgdXNlZCB0byBkZWNsYXJlIHN0YXRlLCB3aGljaCBpcyBzaGFyZWQgYmV0d2VlblxuICogbXVsdGlwbGUgY29tcG9uZW50czpcbiAqIGBgYFxuICogZXhwb3J0IGNsYXNzIFdpZGdldFJvc2UyIGV4dGVuZHMgV2lkZ2V0QmFzZSB7XG4gKiAgICAgQHNoYXJlZFN0YXRlKCkgcHVibGljIHNlbGVjdGVkVmFsdWU6IFNoYXJlZFN0b3JlPHR5cGVzLkRhdGE+O1xuICpcbiAqICAgICAvLyAuLi5cbiAqIH1cbiAqIGBgYFxuICpcbiAqIFNlZSBbW1NoYXJlZFN0b3JlTWFuYWdlcl1dIGFuZCBbW1NoYXJlZFN0b3JlXV0gZm9yIG1vcmUgZG9jdW1lbnRhdGlvbiBvblxuICogZGVmaW5pbmcgc2hhcmVkIHN0YXRlIHVzaW5nIHNoYXJlZCBzdG9yZXMuXG4gKlxuICogRm9yIGV4YW1wbGUsIGlmIGEgc3RhdGVmdWwgY29tcG9uZW50IGRlZmluZXMgYSBzaGFyZWQgc3RhdGUgcHJvcGVydHkgY2FsbGVkXG4gKiBgc2VsZWN0ZWRWYWx1ZWAgKGFzIHNob3duIGFib3ZlKSBhbmQgeW91IHdhbnQgdG8gbGluayBpdCB3aXRoIHRoZSBzaGFyZWQgc3RvcmVcbiAqIG5hbWVkIGByb3NlMi1zZWxlY3RlZC1kYXRhLWl0ZW1gLCB5b3UgY2FuIGRvIHRoZSBmb2xsb3dpbmcgaW4geW91ciB0ZW1wbGF0ZTpcbiAqIGBgYGh0bWxcbiAqIDxnZW4td2lkZ2V0LXJvc2UyIHN0b3JlLXNlbGVjdGVkLXZhbHVlPVwicm9zZTItc2VsZWN0ZWQtZGF0YS1pdGVtXCI+PC9nZW4td2lkZ2V0LXJvc2UyPlxuICogYGBgXG4gKlxuICogTm90ZSB0aGF0IHRoZSB0ZW1wbGF0ZSBhdHRyaWJ1dGUgbmFtZSBpcyBwcmVmaXhlZCB3aXRoIGBzdG9yZWAgZXZlbiB3aGVuIHRoZVxuICogcHJvcGVydHkgaXMgY2FsbGVkIGp1c3QgYHNlbGVjdGVkVmFsdWVgLiBUaGlzIGlzIGRvbmUgYmVjYXVzZSB3aGF0IHlvdSBwYXNzXG4gKiBpbiB0aGUgdGVtcGxhdGUgaXMganVzdCBhIG5hbWUgb2YgdGhlIHN0b3JlLCB3aGljaCBtdXN0IGJlIHJlc29sdmVkIHVzaW5nIHRoZVxuICogc2hhcmVkIHN0b3JlIG1hbmFnZXIuXG4gKlxuICogSW5zaWRlIHRoZSBjb21wb25lbnRzIHlvdSBjYW4gdGhlbiBkaXNwYXRjaCBhbmQgc3Vic2NyaWJlIHRvIHRoZSB1bmRlcmx5aW5nXG4gKiBzdG9yZTpcbiAqIGBgYFxuICogLy8gUHVibGlzaCBzb21ldGhpbmcgYnkgZGlzcGF0Y2hpbmcgYW4gYWN0aW9uIHRvIHRoZSBzaGFyZWQgc3RvcmUuXG4gKiB0aGlzLnNlbGVjdGVkVmFsdWUuZGlzcGF0Y2goe3R5cGU6IEFjdGlvbnMuU0VULCB2YWx1ZTogNDJ9KTtcbiAqXG4gKiAvLyBTdWJzY3JpYmUgdG8gdXBkYXRlcyBvZiB0aGUgc2hhcmVkIHN0b3JlLlxuICogdGhpcy5zdWJzY3JpYmVTaGFyZWRTdGF0ZSgnc2VsZWN0ZWRWYWx1ZScsIChkYXRhKSA9PiB7XG4gKiAgICAgY29uc29sZS5sb2coXCJTaGFyZWQgc3RhdGUgJ3NlbGVjdGVkVmFsdWUnIGlzIG5vd1wiLCBkYXRhKTtcbiAqIH0pO1xuICogYGBgXG4gKi9cbkBjb21wb25lbnQoe1xuICAgIGFic3RyYWN0OiB0cnVlLFxuICAgIGJpbmRpbmdzOiB7XG4gICAgICAgIHN0YXRlSWQ6ICdAc3RhdGVJZCcsXG4gICAgfSxcbn0pXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU3RhdGVmdWxDb21wb25lbnRCYXNlIGV4dGVuZHMgQ29tcG9uZW50QmFzZSB7XG4gICAgLy8vIE1ldGFkYXRhIGFib3V0IHRoZSBzdGF0ZSBkZWZpbmVkIG9uIHRoZSBjb21wb25lbnQuXG4gICAgcHVibGljIF9fc3RhdGVNZXRhZGF0YTogU3RhdGVNZXRhZGF0YTtcbiAgICAvLy8gVGhpcyBjb21wb25lbnQncyBsb2NhbCBzdGF0ZSBpZGVudGlmaWVyLlxuICAgIHB1YmxpYyBzdGF0ZUlkOiBzdHJpbmc7XG4gICAgLy8vIFRoaXMgY29tcG9uZW50J3MgZ2xvYmFsIHN0YXRlIGlkZW50aWZpZXIuXG4gICAgcHVibGljIGdsb2JhbFN0YXRlSWQ6IHN0cmluZztcbiAgICAvLy8gUGFyZW50IHN0YXRlZnVsIGNvbXBvbmVudC5cbiAgICBwcml2YXRlIF9wYXJlbnQ6IFN0YXRlZnVsQ29tcG9uZW50QmFzZSA9IG51bGw7XG4gICAgLy8vIEEgbGlzdCBvZiBjaGlsZCBzdGF0ZWZ1bCBjb21wb25lbnRzLlxuICAgIHByaXZhdGUgX2NoaWxkcmVuOiBTdGF0ZWZ1bENvbXBvbmVudEJhc2VbXSA9IFtdO1xuICAgIC8vLyBTdGF0ZSBtYW5hZ2VyLlxuICAgIHByaXZhdGUgX3N0YXRlTWFuYWdlcjogU3RhdGVNYW5hZ2VyO1xuICAgIC8vLyBTaGFyZWQgc3RvcmUgbWFuYWdlci5cbiAgICBwcml2YXRlIF9zaGFyZWRTdG9yZU1hbmFnZXI6IFNoYXJlZFN0b3JlTWFuYWdlcjtcbiAgICAvLy8gU3Vic2NyaXB0aW9uIHJlcXVlc3RzIGZvciBzaGFyZWQgc3RvcmVzLlxuICAgIHByaXZhdGUgX3NoYXJlZFN0b3JlU3Vic2NyaWJlUmVxdWVzdHM6IFNoYXJlZFN0b3JlU3Vic2NyaWJlUmVxdWVzdFtdID0gW107XG4gICAgLy8vIFN1YnNjcmlwdGlvbnMgdG8gc2hhcmVkIHN0b3Jlcy5cbiAgICBwcml2YXRlIF9zaGFyZWRTdG9yZVN1YnNjcmlwdGlvbnM6IFN1YnNjcmlwdGlvbltdID0gW107XG5cbiAgICAvLyBAbmdJbmplY3RcbiAgICBjb25zdHJ1Y3Rvcigkc2NvcGU6IGFuZ3VsYXIuSVNjb3BlLCBzdGF0ZU1hbmFnZXI6IFN0YXRlTWFuYWdlcikge1xuICAgICAgICBzdXBlcigkc2NvcGUpO1xuXG4gICAgICAgIHRoaXMuX3N0YXRlTWFuYWdlciA9IHN0YXRlTWFuYWdlcjtcbiAgICAgICAgdGhpcy5fc2hhcmVkU3RvcmVNYW5hZ2VyID0gc3RhdGVNYW5hZ2VyLnNoYXJlZFN0b3JlTWFuYWdlcjtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25Db21wb25lbnRJbml0KCkge1xuICAgICAgICBzdXBlci5vbkNvbXBvbmVudEluaXQoKTtcblxuICAgICAgICAvLyBXaGVuIHN0YXRlIGlkZW50aWZpZXIgaXMgbm90IGRlZmluZWQsIGRlZmF1bHQgdG8gZGlyZWN0aXZlIG5hbWUuXG4gICAgICAgIGlmIChfLmlzRW1wdHkodGhpcy5zdGF0ZUlkKSkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZUlkID0gdGhpcy5nZXRDb25maWcoKS5kaXJlY3RpdmU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEZXRlcm1pbmUgb3VyIHBhcmVudCBhbmQgcmVnaXN0ZXIgb3Vyc2VsdmVzIHdpdGggaXQuXG4gICAgICAgIHRoaXMuX3BhcmVudCA9IHRoaXMuX2ZpbmRQYXJlbnRDb21wb25lbnQoKTtcbiAgICAgICAgaWYgKHRoaXMuX3BhcmVudCkge1xuICAgICAgICAgICAgdGhpcy5fcGFyZW50Ll9yZWdpc3RlckNoaWxkKHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5nbG9iYWxTdGF0ZUlkID0gdGhpcy5fcGFyZW50Lmdsb2JhbFN0YXRlSWQgKyAnLScgKyB0aGlzLnN0YXRlSWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZU1hbmFnZXIuYWRkVG9wTGV2ZWxDb21wb25lbnQodGhpcyk7XG4gICAgICAgICAgICB0aGlzLmdsb2JhbFN0YXRlSWQgPSB0aGlzLnN0YXRlSWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhbnkgcGVuZGluZyBzdGF0ZSBmb3IgdXMuXG4gICAgICAgIHRoaXMuX3N0YXRlTWFuYWdlci5sb2FkUGVuZGluZ0NvbXBvbmVudFN0YXRlKHRoaXMpO1xuXG4gICAgICAgIC8vIEF1dG9tYXRpY2FsbHkgbG9hZCBhbnkgY29uZmlndXJlZCBzaGFyZWQgc3RhdGUuXG4gICAgICAgIGNvbnN0IHN0YXRlTWV0YWRhdGEgPSB0aGlzLl9fc3RhdGVNZXRhZGF0YTtcbiAgICAgICAgXy5mb3JPd24oc3RhdGVNZXRhZGF0YSwgKG1ldGFkYXRhKSA9PiB7XG4gICAgICAgICAgICBpZiAobWV0YWRhdGEuc2hhcmVkKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2hhcmVkU3RvcmVOYW1lID0gdGhpc1ttZXRhZGF0YS5nZXRTaGFyZWRTdG9yZU5hbWVQcm9wZXJ0eSgpXTtcbiAgICAgICAgICAgICAgICBpZiAoIV8uaXNFbXB0eShzaGFyZWRTdG9yZU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0b3JlID0gdGhpcy5fc2hhcmVkU3RvcmVNYW5hZ2VyLmdldFN0b3JlKHNoYXJlZFN0b3JlTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNbbWV0YWRhdGEucHJvcGVydHlOYW1lXSA9IHN0b3JlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuX3NldHVwU2hhcmVkU3RvcmUobWV0YWRhdGEucHJvcGVydHlOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB1cCB0aGUgc2hhcmVkIHN0b3JlLiBUaGlzIG1ldGhvZCBtYXkgYmUgb3ZlcnJpZGVuIGJ5IHN1YmNsYXNzZXMgd2hlbiBzb21ldGhpbmdcbiAgICAgKiBkaWZmZXJlbnQgc2hvdWxkIGJlIGRvbmUgaGVyZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RvcmV9IFNoYXJlZCBzdGF0ZVxuICAgICAqL1xuICAgIHByb3RlY3RlZCBfc2V0dXBTaGFyZWRTdG9yZShzdG9yZTogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIC8vIFN1YnNjcmliZSB0byBzaGFyZWQgc3RvcmUsIHNvIHRoYXQgdGhpcyBjb21wb25lbnQncyBzY29wZSBnZXRzIHVwZGF0ZWQgd2hlbiB0aGVcbiAgICAgICAgLy8gdmFsdWUgaW4gdGhlIHN0b3JlIGlzIHVwZGF0ZWQuXG4gICAgICAgIHRoaXMuc3Vic2NyaWJlU2hhcmVkU3RhdGUoc3RvcmUsIF8ubm9vcCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgc3RhdGUgbWFuYWdlci5cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IHN0YXRlTWFuYWdlcigpOiBTdGF0ZU1hbmFnZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdGVNYW5hZ2VyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHNoYXJlZCBzdG9yZSBtYW5hZ2VyLlxuICAgICAqL1xuICAgIHByb3RlY3RlZCBnZXQgc2hhcmVkU3RvcmVNYW5hZ2VyKCk6IFNoYXJlZFN0b3JlTWFuYWdlciB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zaGFyZWRTdG9yZU1hbmFnZXI7XG4gICAgfVxuXG4gICAgcHVibGljIG9uQ29tcG9uZW50RGVzdHJveWVkKCk6IHZvaWQge1xuICAgICAgICAvLyBTYXZlIGN1cnJlbnQgY29tcG9uZW50IHN0YXRlLCBzbyBpdCB3aWxsIGJlIGF2YWlsYWJsZSB3aGVuIHRoaXMgY29tcG9uZW50XG4gICAgICAgIC8vIGlzIGluc3RhbnRpYXRlZCBhZ2Fpbi5cbiAgICAgICAgdGhpcy5fc3RhdGVNYW5hZ2VyLnNhdmVQZW5kaW5nQ29tcG9uZW50U3RhdGUodGhpcyk7XG5cbiAgICAgICAgaWYgKHRoaXMuX3BhcmVudCkge1xuICAgICAgICAgICAgdGhpcy5fcGFyZW50Ll91bnJlZ2lzdGVyQ2hpbGQodGhpcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZU1hbmFnZXIucmVtb3ZlVG9wTGV2ZWxDb21wb25lbnQodGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICBzdXBlci5vbkNvbXBvbmVudERlc3Ryb3llZCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkIGFmdGVyIHRoZSBjb21wb25lbnQncyBzdGF0ZSBoYXMgYmVlbiBsb2FkZWQuXG4gICAgICovXG4gICAgcHVibGljIG9uQ29tcG9uZW50U3RhdGVBZnRlckxvYWQoKTogdm9pZCB7XG4gICAgICAgIC8vIERvIG5vdGhpbmcgYnkgZGVmYXVsdC5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCBiZWZvcmUgdGhlIGNvbXBvbmVudCdzIHN0YXRlIGhhcyBiZWVuIHNhdmVkLlxuICAgICAqL1xuICAgIHB1YmxpYyBvbkNvbXBvbmVudFN0YXRlUHJlU2F2ZSgpOiB2b2lkIHtcbiAgICAgICAgLy8gRG8gbm90aGluZyBieSBkZWZhdWx0LlxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERpc2NvdmVycyB0aGUgcGFyZW50IHN0YXRlZnVsIGNvbXBvbmVudC5cbiAgICAgKi9cbiAgICBwcml2YXRlIF9maW5kUGFyZW50Q29tcG9uZW50KCk6IFN0YXRlZnVsQ29tcG9uZW50QmFzZSB7XG4gICAgICAgIGxldCBzY29wZSA9IHRoaXMuJHNjb3BlLiRwYXJlbnQ7XG4gICAgICAgIHdoaWxlIChzY29wZSkge1xuICAgICAgICAgICAgaWYgKHNjb3BlWydjdHJsJ10gaW5zdGFuY2VvZiBTdGF0ZWZ1bENvbXBvbmVudEJhc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2NvcGVbJ2N0cmwnXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2NvcGUgPSBzY29wZS4kcGFyZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXJzIGEgbmV3IGNoaWxkIG9mIHRoaXMgc3RhdGVmdWwgY29tcG9uZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdGF0ZWZ1bENvbXBvbmVudEJhc2V9IGNoaWxkIENoaWxkIGNvbXBvbmVudCBpbnN0YW5jZVxuICAgICAqL1xuICAgIHByaXZhdGUgX3JlZ2lzdGVyQ2hpbGQoY2hpbGQ6IFN0YXRlZnVsQ29tcG9uZW50QmFzZSkge1xuICAgICAgICAvLyBFbnN1cmUgdGhlIGNoaWxkJ3MgbG9jYWwgc3RhdGUgaWQgaXMgdW5pcXVlLlxuICAgICAgICBpZiAoXy5hbnkodGhpcy5fY2hpbGRyZW4sIChjKSA9PiBjLnN0YXRlSWQgPT09IGNoaWxkLnN0YXRlSWQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgR2VuRXJyb3IoXCJEdXBsaWNhdGUgc3RhdGVmdWwgY29tcG9uZW50IHN0YXRlIGlkZW50aWZpZXIgJ1wiICsgY2hpbGQuc3RhdGVJZCArIFwiJy5cIik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9jaGlsZHJlbi5wdXNoKGNoaWxkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVbnJlZ2lzdGVycyBhbiBleGlzdGluZyBjaGlsZCBvZiB0aGlzIHN0YXRlZnVsIGNvbXBvbmVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RhdGVmdWxDb21wb25lbnRCYXNlfSBjaGlsZCBDaGlsZCBjb21wb25lbnQgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBwcml2YXRlIF91bnJlZ2lzdGVyQ2hpbGQoY2hpbGQ6IFN0YXRlZnVsQ29tcG9uZW50QmFzZSkge1xuICAgICAgICB0aGlzLl9jaGlsZHJlbiA9IF8ud2l0aG91dCh0aGlzLl9jaGlsZHJlbiwgY2hpbGQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHBhcmVudCBzdGF0ZWZ1bCBjb21wb25lbnQuXG4gICAgICovXG4gICAgcHVibGljIHBhcmVudENvbXBvbmVudCgpOiBTdGF0ZWZ1bENvbXBvbmVudEJhc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBsaXN0IG9mIGNoaWxkIHN0YXRlZnVsIGNvbXBvbmVudHMuXG4gICAgICovXG4gICAgcHVibGljIGNoaWxkQ29tcG9uZW50cygpOiBTdGF0ZWZ1bENvbXBvbmVudEJhc2VbXSB7XG4gICAgICAgIHJldHVybiBfLmNsb25lKHRoaXMuX2NoaWxkcmVuKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kcyBhIGNoaWxkIGNvbXBvbmVudCBieSBpdHMgc3RhdGUgaWRlbnRpZmllci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0ZUlkIENoaWxkJ3Mgc3RhdGUgaWRlbnRpZmllclxuICAgICAqIEByZXR1cm4ge1N0YXRlZnVsQ29tcG9uZW50QmFzZX0gQ2hpbGQgY29tcG9uZW50IGluc3RhbmNlXG4gICAgICovXG4gICAgcHVibGljIGdldENoaWxkQ29tcG9uZW50PFQgZXh0ZW5kcyBTdGF0ZWZ1bENvbXBvbmVudEJhc2U+KHN0YXRlSWQ6IHN0cmluZyk6IFQge1xuICAgICAgICByZXR1cm4gPFQ+IF8uZmluZCh0aGlzLl9jaGlsZHJlbiwgKGNoaWxkKSA9PiBjaGlsZC5zdGF0ZUlkID09PSBzdGF0ZUlkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdWJzY3JpYmVzIHRvIHNoYXJlZCBzdGF0ZS4gVGhpcyBpcyB0aGUgc2FtZSBhcyBhIG5vcm1hbCBzdWJzY3JpYmUsIGJ1dCBpblxuICAgICAqIGFkZGl0aW9uIGl0IGFsc28gcHJvcGVybHkgaGFuZGxlcyB1bmRlcmx5aW5nIGRhdGEgc3RvcmUgY2hhbmdlcyB3aGVuXG4gICAgICogY29tcG9uZW50IHN0YXRlIGlzIHJlbG9hZGVkLlxuICAgICAqXG4gICAgICogVGhlIHZhbHVlIG9ic2VydmVkIGZyb20gdGhlIHNoYXJlZCBzdG9yZSBNVVNUIE5PVCBiZSBtdXRhdGVkIGluIGFueSB3YXkgYXNcbiAgICAgKiBkb2luZyBzbyBtYXkgY2F1c2UgdW5kZWZpbmVkIGJlaGF2aW9yLiBJZiB5b3UgbmVlZCB0byBtdXRhdGUgdGhlIG9ic2VydmVkXG4gICAgICogdmFsdWUsIHVzZSBbW3N1YnNjcmliZVNoYXJlZFN0YXRlTXV0YWJsZV1dIGluc3RlYWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBOYW1lIG9mIHNoYXJlZCBzdGF0ZVxuICAgICAqIEBwYXJhbSBjYWxsYmFjayBDYWxsYmFjayB0byBiZSBpbnZva2VkIG9uIHN1YnNjcmlwdGlvblxuICAgICAqL1xuICAgIHB1YmxpYyBzdWJzY3JpYmVTaGFyZWRTdGF0ZShuYW1lOiBzdHJpbmcsIGNhbGxiYWNrOiAodmFsdWU6IGFueSkgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICBjb25zdCBzdG9yZU1ldGFkYXRhID0gdGhpcy5fZ2V0U3RhdGVNZXRhZGF0YShuYW1lKTtcbiAgICAgICAgaWYgKCFzdG9yZU1ldGFkYXRhIHx8ICFzdG9yZU1ldGFkYXRhLnNoYXJlZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEdlbkVycm9yKFwiU2hhcmVkIHN0YXRlICdcIiArIG5hbWUgKyBcIicgbm90IGZvdW5kLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHN1YnNjcmliZXIgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzdG9yZTogU2hhcmVkU3RvcmU8YW55LCBhbnk+ID0gdGhpc1tzdG9yZU1ldGFkYXRhLnByb3BlcnR5TmFtZV07XG4gICAgICAgICAgICBpZiAoIXN0b3JlKSB7XG4gICAgICAgICAgICAgICAgLy8gQGlmbmRlZiBHRU5KU19QUk9EVUNUSU9OXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihgSWdub3JlZCBtaXNzaW5nIHN0b3JlOiAke3N0b3JlTWV0YWRhdGEucHJvcGVydHlOYW1lfSAke3RoaXMuZ2xvYmFsU3RhdGVJZH1gKTtcbiAgICAgICAgICAgICAgICAvLyBAZW5kaWZcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghc3RvcmUpIHJldHVybjtcbiAgICAgICAgICAgIHRoaXMuX3NoYXJlZFN0b3JlU3Vic2NyaXB0aW9ucy5wdXNoKHRoaXMuc3Vic2NyaWJlKGNhbGxiYWNrLCBzdG9yZS5vYnNlcnZhYmxlKCkpKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLl9zaGFyZWRTdG9yZVN1YnNjcmliZVJlcXVlc3RzLnB1c2goc3Vic2NyaWJlcik7XG4gICAgICAgIHN1YnNjcmliZXIoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBIHZlcnNpb24gb2YgW1tzdWJzY3JpYmVTaGFyZWRTdGF0ZV1dLCB3aGljaCBlbnN1cmVzIHRoYXQgdGhlIG9ic2VydmVkIHNoYXJlZFxuICAgICAqIHN0b3JlIHZhbHVlIGlzIGNvcGllZCBhbmQgY2FuIHRodXMgYmUgc2FmZWx5IG11dGF0ZWQgYWZ0ZXJ3YXJkcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE5hbWUgb2Ygc2hhcmVkIHN0YXRlXG4gICAgICogQHBhcmFtIGNhbGxiYWNrIENhbGxiYWNrIHRvIGJlIGludm9rZWQgb24gc3Vic2NyaXB0aW9uXG4gICAgICovXG4gICAgcHVibGljIHN1YnNjcmliZVNoYXJlZFN0YXRlTXV0YWJsZTxUPihuYW1lOiBzdHJpbmcsIGNhbGxiYWNrOiAodmFsdWU6IFQpID0+IHZvaWQpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5zdWJzY3JpYmVTaGFyZWRTdGF0ZShuYW1lLCAodmFsdWUpID0+IGNhbGxiYWNrKGFuZ3VsYXIuY29weSh2YWx1ZSkpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIG1ldGFkYXRhIGZvciBzcGVjaWZpYyBjb21wb25lbnQgc3RhdGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBOYW1lIG9mIHNoYXJlZCBzdGF0ZSAobm90IHByb3BlcnR5IG5hbWUpXG4gICAgICogQHJldHVybiB7U3RhdGVJdGVtTWV0YWRhdGF9IFN0YXRlIG1ldGFkYXRhXG4gICAgICovXG4gICAgcHJpdmF0ZSBfZ2V0U3RhdGVNZXRhZGF0YShuYW1lOiBzdHJpbmcpOiBTdGF0ZUl0ZW1NZXRhZGF0YSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fc3RhdGVNZXRhZGF0YVtuYW1lXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTYXZlcyB0aGlzIGNvbXBvbmVudCdzIGN1cnJlbnQgc3RhdGUgYW5kIHJldHVybnMgaXQuXG4gICAgICovXG4gICAgcHVibGljIHNhdmVTdGF0ZShzYXZlQ2hpbGRyZW46IGJvb2xlYW4gPSB0cnVlKTogYW55IHtcbiAgICAgICAgdGhpcy5vbkNvbXBvbmVudFN0YXRlUHJlU2F2ZSgpO1xuXG4gICAgICAgIGxldCByZXN1bHQgPSB7fTtcbiAgICAgICAgbGV0IHN0YXRlID0gcmVzdWx0W3RoaXMuZ2xvYmFsU3RhdGVJZF0gPSB7fTtcbiAgICAgICAgXy5mb3JPd24odGhpcy5fX3N0YXRlTWV0YWRhdGEsIChtZXRhZGF0YSwga2V5KSA9PiB7XG4gICAgICAgICAgICBsZXQgdmFsdWUgPSB0aGlzW21ldGFkYXRhLnByb3BlcnR5TmFtZV07XG5cbiAgICAgICAgICAgIGlmIChtZXRhZGF0YS5zaGFyZWQpIHtcbiAgICAgICAgICAgICAgICAvLyBJbiBjYXNlIG9mIHNoYXJlZCBzdGF0ZSwgc2F2ZSB0aGUgaWRlbnRpZmllciBvZiB0aGUgc2hhcmVkIHN0b3JlLlxuICAgICAgICAgICAgICAgIHZhbHVlID0gKDxTaGFyZWRTdG9yZTxhbnksIGFueT4+IHZhbHVlKS5zdG9yZUlkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzdGF0ZVtrZXldID0gdmFsdWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFNhdmUgY2hpbGQgc3RhdGUuXG4gICAgICAgIGlmIChzYXZlQ2hpbGRyZW4pIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5fY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICBfLmV4dGVuZChyZXN1bHQsIGNoaWxkLnNhdmVTdGF0ZSgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTG9hZHMgdGhpcyBjb21wb25lbnQncyBjdXJyZW50IHN0YXRlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHthbnl9IGdsb2JhbFN0YXRlIEdsb2JhbCBzdGF0ZVxuICAgICAqL1xuICAgIHB1YmxpYyBsb2FkU3RhdGUoZ2xvYmFsU3RhdGU6IGFueSwgbG9hZENoaWxkcmVuOiBib29sZWFuID0gdHJ1ZSk6IHZvaWQge1xuICAgICAgICBjb25zdCBzdGF0ZSA9IGdsb2JhbFN0YXRlW3RoaXMuZ2xvYmFsU3RhdGVJZF07XG4gICAgICAgIGxldCBzaGFyZWRTdGF0ZUNoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgXy5mb3JPd24odGhpcy5fX3N0YXRlTWV0YWRhdGEsIChtZXRhZGF0YSwga2V5KSA9PiB7XG4gICAgICAgICAgICBsZXQgdmFsdWUgPSBzdGF0ZVtrZXldO1xuICAgICAgICAgICAgaWYgKF8uaXNVbmRlZmluZWQodmFsdWUpKSByZXR1cm47XG5cbiAgICAgICAgICAgIGlmIChtZXRhZGF0YS5zaGFyZWQpIHtcbiAgICAgICAgICAgICAgICAvLyBHZXQgdGhlIHNoYXJlZCBzdG9yZSBmcm9tIHRoZSBzaGFyZWQgc3RvcmUgbWFuYWdlci5cbiAgICAgICAgICAgICAgICBjb25zdCBleGlzdGluZ1ZhbHVlOiBTaGFyZWRTdG9yZTxhbnksIGFueT4gPSB0aGlzW21ldGFkYXRhLnByb3BlcnR5TmFtZV07XG4gICAgICAgICAgICAgICAgaWYgKGV4aXN0aW5nVmFsdWUuc3RvcmVJZCAhPT0gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1ttZXRhZGF0YS5wcm9wZXJ0eU5hbWVdID0gdGhpcy5fc2hhcmVkU3RvcmVNYW5hZ2VyLmdldFN0b3JlPGFueT4odmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBzaGFyZWRTdGF0ZUNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpc1ttZXRhZGF0YS5wcm9wZXJ0eU5hbWVdID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIExvYWQgY2hpbGQgc3RhdGUuXG4gICAgICAgIGlmIChsb2FkQ2hpbGRyZW4pIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5fY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICBjaGlsZC5sb2FkU3RhdGUoZ2xvYmFsU3RhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNoYXJlZFN0YXRlQ2hhbmdlZCkge1xuICAgICAgICAgICAgLy8gQ2FuY2VsIGFueSBwcmV2aW91cyBzdWJzY3JpcHRpb25zIHRvIHNoYXJlZCBzdG9yZXMuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHN1YnNjcmlwdGlvbiBvZiB0aGlzLl9zaGFyZWRTdG9yZVN1YnNjcmlwdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gUmVzdWJzY3JpYmUsIHVzaW5nIHRoZSBuZXcgc3RvcmVzLlxuICAgICAgICAgICAgZm9yIChjb25zdCByZXF1ZXN0IG9mIHRoaXMuX3NoYXJlZFN0b3JlU3Vic2NyaWJlUmVxdWVzdHMpIHtcbiAgICAgICAgICAgICAgICByZXF1ZXN0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9uQ29tcG9uZW50U3RhdGVBZnRlckxvYWQoKTtcblxuICAgICAgICAvLyBQcm9wYWdhdGUgc3RhdGUgdXBkYXRlcyB0byB0aGUgdmlldy5cbiAgICAgICAgdGhpcy4kc2NvcGUuJGFwcGx5QXN5bmMoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc3RhdGljIGNvbmZpZ3VyZUNvbXBvbmVudChjb25maWc6IENvbXBvbmVudENvbmZpZ3VyYXRpb24pOiBDb21wb25lbnRDb25maWd1cmF0aW9uIHtcbiAgICAgICAgY29uc3Qgc3RhdGVNZXRhZGF0YSA9IHRoaXMucHJvdG90eXBlLl9fc3RhdGVNZXRhZGF0YTtcbiAgICAgICAgaWYgKCFjb25maWcuYmluZGluZ3MpIGNvbmZpZy5iaW5kaW5ncyA9IHt9O1xuXG4gICAgICAgIF8uZm9yT3duKHN0YXRlTWV0YWRhdGEsIChtZXRhZGF0YSwga2V5KSA9PiB7XG4gICAgICAgICAgICBpZiAobWV0YWRhdGEuc2hhcmVkKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLmJpbmRpbmdzW21ldGFkYXRhLmdldFNoYXJlZFN0b3JlTmFtZVByb3BlcnR5KCldID0gJ0BzdG9yZScgKyBfLmNhcGl0YWxpemUoa2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBjb25maWc7XG4gICAgfVxufVxuXG4vKipcbiAqIE1hcmtzIGEgcHJvcGVydHkgYXMgYmVpbmcgcGFydCBvZiB0aGUgY29tcG9uZW50J3Mgc3RhdGUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgT3B0aW9uYWwgc3RhdGUgbmFtZVxuICogQHBhcmFtIHtib29sZWFufSBzaGFyZWQgRG9lcyB0aGlzIHN0YXRlIHJlZmVyZW5jZSBhIHNoYXJlZCBzdG9yZVxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RhdGUobmFtZT86IHN0cmluZywgc2hhcmVkOiBib29sZWFuID0gZmFsc2UpIHtcbiAgICByZXR1cm4gKHRhcmdldDogU3RhdGVmdWxDb21wb25lbnRCYXNlLCBwcm9wZXJ0eUtleTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGlmICghbmFtZSkgbmFtZSA9IHByb3BlcnR5S2V5O1xuXG4gICAgICAgIGlmIChuYW1lWzBdID09PSAnXycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihcIlN0YXRlIGlkZW50aWZpZXJzIHN0YXJ0aW5nIHdpdGggYW4gdW5kZXJzY29yZSBhcmUgcmVzZXJ2ZWQuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0YXJnZXQuX19zdGF0ZU1ldGFkYXRhKSB7XG4gICAgICAgICAgICB0YXJnZXQuX19zdGF0ZU1ldGFkYXRhID0ge307XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGFyZ2V0Ll9fc3RhdGVNZXRhZGF0YVtuYW1lXSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEdlbkVycm9yKFwiRHVwbGljYXRlIHN0YXRlIGlkZW50aWZpZXIgJ1wiICsgbmFtZSArIFwiJyBvbiBzdGF0ZWZ1bCBjb21wb25lbnQgJ1wiICsgdGFyZ2V0ICsgXCInLlwiKTtcbiAgICAgICAgfVxuICAgICAgICB0YXJnZXQuX19zdGF0ZU1ldGFkYXRhW25hbWVdID0gbmV3IFN0YXRlSXRlbU1ldGFkYXRhKHByb3BlcnR5S2V5LCBzaGFyZWQpO1xuICAgIH07XG59XG5cbi8qKlxuICogTWFya3MgYSBwcm9wZXJ0eSBhcyBiZWluZyBwYXJ0IG9mIHRoZSBjb21wb25lbnQncyBzdGF0ZSwgd2hpY2ggcmVmZXJlbmNlc1xuICogYSBzaGFyZWQgc3RvcmUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgT3B0aW9uYWwgc3RhdGUgbmFtZVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2hhcmVkU3RhdGUobmFtZT86IHN0cmluZykge1xuICAgIHJldHVybiBzdGF0ZShuYW1lLCB0cnVlKTtcbn1cbiJdfQ==
