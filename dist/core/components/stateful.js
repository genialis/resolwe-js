"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var _ = require("lodash");
var angular = require("angular");
var base_1 = require("./base");
var error_1 = require("../errors/error");
var StateItemMetadata = (function () {
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
var StatefulComponentBase = StatefulComponentBase_1 = (function (_super) {
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
        // When state identifier is not defined, default to directive name.
        if (_.isEmpty(_this.stateId)) {
            _this.stateId = _this.getConfig().directive;
        }
        // Determine our parent and register ourselves with it.
        _this._parent = _this._findParentComponent();
        if (_this._parent) {
            _this._parent._registerChild(_this);
            _this.globalStateId = _this._parent.globalStateId + '-' + _this.stateId;
        }
        else {
            _this._stateManager.setTopLevelComponent(_this);
            _this.globalStateId = _this.stateId;
        }
        return _this;
    }
    StatefulComponentBase.prototype.onComponentInit = function () {
        var _this = this;
        _super.prototype.onComponentInit.call(this);
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
    StatefulComponentBase.prototype.onComponentDestroyed = function () {
        // Save current component state, so it will be available when this component
        // is instantiated again.
        this._stateManager.savePendingComponentState(this);
        if (this._parent) {
            this._parent._unregisterChild(this);
        }
        else if (this._stateManager.topLevelComponent() === this) {
            this._stateManager.setTopLevelComponent(null);
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
    return StatefulComponentBase;
}(base_1.ComponentBase));
StatefulComponentBase = StatefulComponentBase_1 = __decorate([
    base_1.component({
        abstract: true,
        bindings: {
            stateId: '@stateId',
        },
    })
], StatefulComponentBase);
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
var StatefulComponentBase_1;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2NvbXBvbmVudHMvc3RhdGVmdWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsMEJBQTRCO0FBQzVCLGlDQUFtQztBQUVuQywrQkFBc0Y7QUFHdEYseUNBQXlDO0FBRXpDO0lBQ0ksMkJBQW1CLFlBQW9CLEVBQVMsTUFBZTtRQUE1QyxpQkFBWSxHQUFaLFlBQVksQ0FBUTtRQUFTLFdBQU0sR0FBTixNQUFNLENBQVM7SUFDL0QsQ0FBQztJQUVNLHNEQUEwQixHQUFqQztRQUNJLE1BQU0sQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO0lBQ25ELENBQUM7SUFDTCx3QkFBQztBQUFELENBUEEsQUFPQyxJQUFBO0FBUFksOENBQWlCO0FBaUI5Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXVERztBQU9ILElBQXNCLHFCQUFxQjtJQUFTLHlDQUFhO0lBb0I3RCxZQUFZO0lBQ1osK0JBQVksTUFBc0IsRUFBRSxZQUEwQjtRQUE5RCxZQUNJLGtCQUFNLE1BQU0sQ0FBQyxTQW1CaEI7UUFsQ0QsOEJBQThCO1FBQ3RCLGFBQU8sR0FBMEIsSUFBSSxDQUFDO1FBQzlDLHdDQUF3QztRQUNoQyxlQUFTLEdBQTRCLEVBQUUsQ0FBQztRQUtoRCw0Q0FBNEM7UUFDcEMsbUNBQTZCLEdBQWtDLEVBQUUsQ0FBQztRQUMxRSxtQ0FBbUM7UUFDM0IsK0JBQXlCLEdBQW1CLEVBQUUsQ0FBQztRQU1uRCxLQUFJLENBQUMsYUFBYSxHQUFHLFlBQVksQ0FBQztRQUNsQyxLQUFJLENBQUMsbUJBQW1CLEdBQUcsWUFBWSxDQUFDLGtCQUFrQixDQUFDO1FBRTNELG1FQUFtRTtRQUNuRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUIsS0FBSSxDQUFDLE9BQU8sR0FBRyxL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QUMvQixNQUFNLElBQUksZ0JBQVEsQ0FBQyw4QkFBOEIsR0FBRyxJQUFJLEdBQUcsMkJBQTJCLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxDQUFDO1FBQzVHLENBQUM7UUFDRCxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksaUJBQWlCLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzlFLENBQUMsQ0FBQztBQUNOLENBQUM7QUFqQkQsc0JBaUJDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxxQkFBNEIsSUFBYTtJQUNyQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztBQUM3QixDQUFDO0FBRkQsa0NBRUMiLCJmaWxlIjoiY29yZS9jb21wb25lbnRzL3N0YXRlZnVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgYW5ndWxhciBmcm9tICdhbmd1bGFyJztcblxuaW1wb3J0IHtDb21wb25lbnRCYXNlLCBjb21wb25lbnQsIENvbXBvbmVudENvbmZpZ3VyYXRpb24sIFN1YnNjcmlwdGlvbn0gZnJvbSAnLi9iYXNlJztcbmltcG9ydCB7U2hhcmVkU3RvcmUsIFNoYXJlZFN0b3JlTWFuYWdlcn0gZnJvbSAnLi4vc2hhcmVkX3N0b3JlL2luZGV4JztcbmltcG9ydCB7U3RhdGVNYW5hZ2VyfSBmcm9tICcuL21hbmFnZXInO1xuaW1wb3J0IHtHZW5FcnJvcn0gZnJvbSAnLi4vZXJyb3JzL2Vycm9yJztcblxuZXhwb3J0IGNsYXNzIFN0YXRlSXRlbU1ldGFkYXRhIHtcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcHJvcGVydHlOYW1lOiBzdHJpbmcsIHB1YmxpYyBzaGFyZWQ6IGJvb2xlYW4pIHtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0U2hhcmVkU3RvcmVOYW1lUHJvcGVydHkoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuICdfc2hhcmVkU3RvcmVOYW1lXycgKyB0aGlzLnByb3BlcnR5TmFtZTtcbiAgICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RhdGVNZXRhZGF0YSB7XG4gICAgW2luZGV4OiBzdHJpbmddOiBTdGF0ZUl0ZW1NZXRhZGF0YTtcbn1cblxuaW50ZXJmYWNlIFNoYXJlZFN0b3JlU3Vic2NyaWJlUmVxdWVzdCB7XG4gICAgKCk6IHZvaWQ7XG59XG5cbi8qKlxuICogQSBjb21wb25lbnQgd2hpY2ggY29udGFpbnMgc3RhdGUgdGhhdCBtYXkgYmUgc2F2ZWQgYW5kIHJlbG9hZGVkIGxhdGVyLiBTdWNoXG4gKiBzdGF0ZWZ1bCBjb21wb25lbnRzIGFyZSBhdXRvbWF0aWNhbGx5IG9yZ2FuaXplZCBpbnRvIGEgaGllcmFyY2h5LCBzbyB0aGF0XG4gKiBwYXJlbnRzIGFsc28gc3RvcmUgc3RhdGUgZm9yIGFsbCB0aGVpciBjaGlsZHJlbi4gQ2FsbGluZyBgc2F2ZVN0YXRlYCBvbiB0aGVcbiAqIHRvcC1sZXZlbCBjb21wb25lbnQgd2lsbCB0aGVyZWZvcmUgc2F2ZSB0aGUgc3RhdGUgb2YgdGhlIGNvbXBsZXRlIGFwcGxpY2F0aW9uLlxuICpcbiAqIENvbXBvbmVudCBzdGF0ZSBpcyBkZWZpbmVkIGJ5IHVzaW5nIHByb3BlcnR5IGRlY29yYXRvcnMgYXMgZm9sbG93czpcbiAqIGBgYFxuICogZXhwb3J0IGNsYXNzIFByb2Nlc3NHcm91cHMgZXh0ZW5kcyBWaWV3Q29tcG9uZW50IHtcbiAqICAgICBAc3RhdGUoKSBwdWJsaWMgc2VsZWN0ZWRHcm91cDogbnVtYmVyO1xuICpcbiAqICAgICAvLyAuLi5cbiAqIH1cbiAqIGBgYFxuICpcbiAqIEl0IG1heSBiZSB0aGVuIHJlZmVyZW5jZWQgYW5kIHdhdGNoZWQgZnJvbSB0aGUgY29udHJvbGxlciBvciB0ZW1wbGF0ZXMgYW5kXG4gKiB3aWxsIGF1dG9tYXRpY2FsbHkgYmUgc2F2ZWQgd2hlbiBjYWxsaW5nIFtbU3RhdGVmdWxDb21wb25lbnRCYXNlLnNhdmVTdGF0ZV1dXG4gKiBhbmQgcmVsb2FkZWQgd2hlbiBjYWxsaW5nIFtbU3RhdGVmdWxDb21wb25lbnRCYXNlLmxvYWRTdGF0ZV1dLlxuICpcbiAqIEEgcmVsYXRlZCBkZWNvcmF0b3IgbWF5IGJlIHVzZWQgdG8gZGVjbGFyZSBzdGF0ZSwgd2hpY2ggaXMgc2hhcmVkIGJldHdlZW5cbiAqIG11bHRpcGxlIGNvbXBvbmVudHM6XG4gKiBgYGBcbiAqIGV4cG9ydCBjbGFzcyBXaWRnZXRSb3NlMiBleHRlbmRzIFdpZGdldEJhc2Uge1xuICogICAgIEBzaGFyZWRTdGF0ZSgpIHB1YmxpYyBzZWxlY3RlZFZhbHVlOiBTaGFyZWRTdG9yZTx0eXBlcy5EYXRhPjtcbiAqXG4gKiAgICAgLy8gLi4uXG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBTZWUgW1tTaGFyZWRTdG9yZU1hbmFnZXJdXSBhbmQgW1tTaGFyZWRTdG9yZV1dIGZvciBtb3JlIGRvY3VtZW50YXRpb24gb25cbiAqIGRlZmluaW5nIHNoYXJlZCBzdGF0ZSB1c2luZyBzaGFyZWQgc3RvcmVzLlxuICpcbiAqIEZvciBleGFtcGxlLCBpZiBhIHN0YXRlZnVsIGNvbXBvbmVudCBkZWZpbmVzIGEgc2hhcmVkIHN0YXRlIHByb3BlcnR5IGNhbGxlZFxuICogYHNlbGVjdGVkVmFsdWVgIChhcyBzaG93biBhYm92ZSkgYW5kIHlvdSB3YW50IHRvIGxpbmsgaXQgd2l0aCB0aGUgc2hhcmVkIHN0b3JlXG4gKiBuYW1lZCBgcm9zZTItc2VsZWN0ZWQtZGF0YS1pdGVtYCwgeW91IGNhbiBkbyB0aGUgZm9sbG93aW5nIGluIHlvdXIgdGVtcGxhdGU6XG4gKiBgYGBodG1sXG4gKiA8Z2VuLXdpZGdldC1yb3NlMiBzdG9yZS1zZWxlY3RlZC12YWx1ZT1cInJvc2UyLXNlbGVjdGVkLWRhdGEtaXRlbVwiPjwvZ2VuLXdpZGdldC1yb3NlMj5cbiAqIGBgYFxuICpcbiAqIE5vdGUgdGhhdCB0aGUgdGVtcGxhdGUgYXR0cmlidXRlIG5hbWUgaXMgcHJlZml4ZWQgd2l0aCBgc3RvcmVgIGV2ZW4gd2hlbiB0aGVcbiAqIHByb3BlcnR5IGlzIGNhbGxlZCBqdXN0IGBzZWxlY3RlZFZhbHVlYC4gVGhpcyBpcyBkb25lIGJlY2F1c2Ugd2hhdCB5b3UgcGFzc1xuICogaW4gdGhlIHRlbXBsYXRlIGlzIGp1c3QgYSBuYW1lIG9mIHRoZSBzdG9yZSwgd2hpY2ggbXVzdCBiZSByZXNvbHZlZCB1c2luZyB0aGVcbiAqIHNoYXJlZCBzdG9yZSBtYW5hZ2VyLlxuICpcbiAqIEluc2lkZSB0aGUgY29tcG9uZW50cyB5b3UgY2FuIHRoZW4gZGlzcGF0Y2ggYW5kIHN1YnNjcmliZSB0byB0aGUgdW5kZXJseWluZ1xuICogc3RvcmU6XG4gKiBgYGBcbiAqIC8vIFB1Ymxpc2ggc29tZXRoaW5nIGJ5IGRpc3BhdGNoaW5nIGFuIGFjdGlvbiB0byB0aGUgc2hhcmVkIHN0b3JlLlxuICogdGhpcy5zZWxlY3RlZFZhbHVlLmRpc3BhdGNoKHt0eXBlOiBBY3Rpb25zLlNFVCwgdmFsdWU6IDQyfSk7XG4gKlxuICogLy8gU3Vic2NyaWJlIHRvIHVwZGF0ZXMgb2YgdGhlIHNoYXJlZCBzdG9yZS5cbiAqIHRoaXMuc3Vic2NyaWJlU2hhcmVkU3RhdGUoJ3NlbGVjdGVkVmFsdWUnLCAoZGF0YSkgPT4ge1xuICogICAgIGNvbnNvbGUubG9nKFwiU2hhcmVkIHN0YXRlICdzZWxlY3RlZFZhbHVlJyBpcyBub3dcIiwgZGF0YSk7XG4gKiB9KTtcbiAqIGBgYFxuICovXG5AY29tcG9uZW50KHtcbiAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICBiaW5kaW5nczoge1xuICAgICAgICBzdGF0ZUlkOiAnQHN0YXRlSWQnLFxuICAgIH0sXG59KVxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFN0YXRlZnVsQ29tcG9uZW50QmFzZSBleHRlbmRzIENvbXBvbmVudEJhc2Uge1xuICAgIC8vLyBNZXRhZGF0YSBhYm91dCB0aGUgc3RhdGUgZGVmaW5lZCBvbiB0aGUgY29tcG9uZW50LlxuICAgIHB1YmxpYyBfX3N0YXRlTWV0YWRhdGE6IFN0YXRlTWV0YWRhdGE7XG4gICAgLy8vIFRoaXMgY29tcG9uZW50J3MgbG9jYWwgc3RhdGUgaWRlbnRpZmllci5cbiAgICBwdWJsaWMgc3RhdGVJZDogc3RyaW5nO1xuICAgIC8vLyBUaGlzIGNvbXBvbmVudCdzIGdsb2JhbCBzdGF0ZSBpZGVudGlmaWVyLlxuICAgIHB1YmxpYyBnbG9iYWxTdGF0ZUlkOiBzdHJpbmc7XG4gICAgLy8vIFBhcmVudCBzdGF0ZWZ1bCBjb21wb25lbnQuXG4gICAgcHJpdmF0ZSBfcGFyZW50OiBTdGF0ZWZ1bENvbXBvbmVudEJhc2UgPSBudWxsO1xuICAgIC8vLyBBIGxpc3Qgb2YgY2hpbGQgc3RhdGVmdWwgY29tcG9uZW50cy5cbiAgICBwcml2YXRlIF9jaGlsZHJlbjogU3RhdGVmdWxDb21wb25lbnRCYXNlW10gPSBbXTtcbiAgICAvLy8gU3RhdGUgbWFuYWdlci5cbiAgICBwcml2YXRlIF9zdGF0ZU1hbmFnZXI6IFN0YXRlTWFuYWdlcjtcbiAgICAvLy8gU2hhcmVkIHN0b3JlIG1hbmFnZXIuXG4gICAgcHJpdmF0ZSBfc2hhcmVkU3RvcmVNYW5hZ2VyOiBTaGFyZWRTdG9yZU1hbmFnZXI7XG4gICAgLy8vIFN1YnNjcmlwdGlvbiByZXF1ZXN0cyBmb3Igc2hhcmVkIHN0b3Jlcy5cbiAgICBwcml2YXRlIF9zaGFyZWRTdG9yZVN1YnNjcmliZVJlcXVlc3RzOiBTaGFyZWRTdG9yZVN1YnNjcmliZVJlcXVlc3RbXSA9IFtdO1xuICAgIC8vLyBTdWJzY3JpcHRpb25zIHRvIHNoYXJlZCBzdG9yZXMuXG4gICAgcHJpdmF0ZSBfc2hhcmVkU3RvcmVTdWJzY3JpcHRpb25zOiBTdWJzY3JpcHRpb25bXSA9IFtdO1xuXG4gICAgLy8gQG5nSW5qZWN0XG4gICAgY29uc3RydWN0b3IoJHNjb3BlOiBhbmd1bGFyLklTY29wZSwgc3RhdGVNYW5hZ2VyOiBTdGF0ZU1hbmFnZXIpIHtcbiAgICAgICAgc3VwZXIoJHNjb3BlKTtcblxuICAgICAgICB0aGlzLl9zdGF0ZU1hbmFnZXIgPSBzdGF0ZU1hbmFnZXI7XG4gICAgICAgIHRoaXMuX3NoYXJlZFN0b3JlTWFuYWdlciA9IHN0YXRlTWFuYWdlci5zaGFyZWRTdG9yZU1hbmFnZXI7XG5cbiAgICAgICAgLy8gV2hlbiBzdGF0ZSBpZGVudGlmaWVyIGlzIG5vdCBkZWZpbmVkLCBkZWZhdWx0IHRvIGRpcmVjdGl2ZSBuYW1lLlxuICAgICAgICBpZiAoXy5pc0VtcHR5KHRoaXMuc3RhdGVJZCkpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGVJZCA9IHRoaXMuZ2V0Q29uZmlnKCkuZGlyZWN0aXZlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGV0ZXJtaW5lIG91ciBwYXJlbnQgYW5kIHJlZ2lzdGVyIG91cnNlbHZlcyB3aXRoIGl0LlxuICAgICAgICB0aGlzLl9wYXJlbnQgPSB0aGlzLl9maW5kUGFyZW50Q29tcG9uZW50KCk7XG4gICAgICAgIGlmICh0aGlzLl9wYXJlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuX3BhcmVudC5fcmVnaXN0ZXJDaGlsZCh0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuZ2xvYmFsU3RhdGVJZCA9IHRoaXMuX3BhcmVudC5nbG9iYWxTdGF0ZUlkICsgJy0nICsgdGhpcy5zdGF0ZUlkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc3RhdGVNYW5hZ2VyLnNldFRvcExldmVsQ29tcG9uZW50KHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5nbG9iYWxTdGF0ZUlkID0gdGhpcy5zdGF0ZUlkO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIG9uQ29tcG9uZW50SW5pdCgpIHtcbiAgICAgICAgc3VwZXIub25Db21wb25lbnRJbml0KCk7XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUgaXMgYW55IHBlbmRpbmcgc3RhdGUgZm9yIHVzLlxuICAgICAgICB0aGlzLl9zdGF0ZU1hbmFnZXIubG9hZFBlbmRpbmdDb21wb25lbnRTdGF0ZSh0aGlzKTtcblxuICAgICAgICAvLyBBdXRvbWF0aWNhbGx5IGxvYWQgYW55IGNvbmZpZ3VyZWQgc2hhcmVkIHN0YXRlLlxuICAgICAgICBjb25zdCBzdGF0ZU1ldGFkYXRhID0gdGhpcy5fX3N0YXRlTWV0YWRhdGE7XG4gICAgICAgIF8uZm9yT3duKHN0YXRlTWV0YWRhdGEsIChtZXRhZGF0YSkgPT4ge1xuICAgICAgICAgICAgaWYgKG1ldGFkYXRhLnNoYXJlZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNoYXJlZFN0b3JlTmFtZSA9IHRoaXNbbWV0YWRhdGEuZ2V0U2hhcmVkU3RvcmVOYW1lUHJvcGVydHkoKV07XG4gICAgICAgICAgICAgICAgaWYgKCFfLmlzRW1wdHkoc2hhcmVkU3RvcmVOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdG9yZSA9IHRoaXMuX3NoYXJlZFN0b3JlTWFuYWdlci5nZXRTdG9yZShzaGFyZWRTdG9yZU5hbWUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzW21ldGFkYXRhLnByb3BlcnR5TmFtZV0gPSBzdG9yZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9zZXR1cFNoYXJlZFN0b3JlKG1ldGFkYXRhLnByb3BlcnR5TmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgdXAgdGhlIHNoYXJlZCBzdG9yZS4gVGhpcyBtZXRob2QgbWF5IGJlIG92ZXJyaWRlbiBieSBzdWJjbGFzc2VzIHdoZW4gc29tZXRoaW5nXG4gICAgICogZGlmZmVyZW50IHNob3VsZCBiZSBkb25lIGhlcmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0b3JlfSBTaGFyZWQgc3RhdGVcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX3NldHVwU2hhcmVkU3RvcmUoc3RvcmU6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICAvLyBTdWJzY3JpYmUgdG8gc2hhcmVkIHN0b3JlLCBzbyB0aGF0IHRoaXMgY29tcG9uZW50J3Mgc2NvcGUgZ2V0cyB1cGRhdGVkIHdoZW4gdGhlXG4gICAgICAgIC8vIHZhbHVlIGluIHRoZSBzdG9yZSBpcyB1cGRhdGVkLlxuICAgICAgICB0aGlzLnN1YnNjcmliZVNoYXJlZFN0YXRlKHN0b3JlLCBfLm5vb3ApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHN0YXRlIG1hbmFnZXIuXG4gICAgICovXG4gICAgcHVibGljIGdldCBzdGF0ZU1hbmFnZXIoKTogU3RhdGVNYW5hZ2VyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXRlTWFuYWdlcjtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25Db21wb25lbnREZXN0cm95ZWQoKTogdm9pZCB7XG4gICAgICAgIC8vIFNhdmUgY3VycmVudCBjb21wb25lbnQgc3RhdGUsIHNvIGl0IHdpbGwgYmUgYXZhaWxhYmxlIHdoZW4gdGhpcyBjb21wb25lbnRcbiAgICAgICAgLy8gaXMgaW5zdGFudGlhdGVkIGFnYWluLlxuICAgICAgICB0aGlzLl9zdGF0ZU1hbmFnZXIuc2F2ZVBlbmRpbmdDb21wb25lbnRTdGF0ZSh0aGlzKTtcblxuICAgICAgICBpZiAodGhpcy5fcGFyZW50KSB7XG4gICAgICAgICAgICB0aGlzLl9wYXJlbnQuX3VucmVnaXN0ZXJDaGlsZCh0aGlzKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9zdGF0ZU1hbmFnZXIudG9wTGV2ZWxDb21wb25lbnQoKSA9PT0gdGhpcykge1xuICAgICAgICAgICAgdGhpcy5fc3RhdGVNYW5hZ2VyLnNldFRvcExldmVsQ29tcG9uZW50KG51bGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3VwZXIub25Db21wb25lbnREZXN0cm95ZWQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCBhZnRlciB0aGUgY29tcG9uZW50J3Mgc3RhdGUgaGFzIGJlZW4gbG9hZGVkLlxuICAgICAqL1xuICAgIHB1YmxpYyBvbkNvbXBvbmVudFN0YXRlQWZ0ZXJMb2FkKCk6IHZvaWQge1xuICAgICAgICAvLyBEbyBub3RoaW5nIGJ5IGRlZmF1bHQuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgYmVmb3JlIHRoZSBjb21wb25lbnQncyBzdGF0ZSBoYXMgYmVlbiBzYXZlZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgb25Db21wb25lbnRTdGF0ZVByZVNhdmUoKTogdm9pZCB7XG4gICAgICAgIC8vIERvIG5vdGhpbmcgYnkgZGVmYXVsdC5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEaXNjb3ZlcnMgdGhlIHBhcmVudCBzdGF0ZWZ1bCBjb21wb25lbnQuXG4gICAgICovXG4gICAgcHJpdmF0ZSBfZmluZFBhcmVudENvbXBvbmVudCgpOiBTdGF0ZWZ1bENvbXBvbmVudEJhc2Uge1xuICAgICAgICBsZXQgc2NvcGUgPSB0aGlzLiRzY29wZS4kcGFyZW50O1xuICAgICAgICB3aGlsZSAoc2NvcGUpIHtcbiAgICAgICAgICAgIGlmIChzY29wZVsnY3RybCddIGluc3RhbmNlb2YgU3RhdGVmdWxDb21wb25lbnRCYXNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNjb3BlWydjdHJsJ107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNjb3BlID0gc2NvcGUuJHBhcmVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVycyBhIG5ldyBjaGlsZCBvZiB0aGlzIHN0YXRlZnVsIGNvbXBvbmVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RhdGVmdWxDb21wb25lbnRCYXNlfSBjaGlsZCBDaGlsZCBjb21wb25lbnQgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBwcml2YXRlIF9yZWdpc3RlckNoaWxkKGNoaWxkOiBTdGF0ZWZ1bENvbXBvbmVudEJhc2UpIHtcbiAgICAgICAgLy8gRW5zdXJlIHRoZSBjaGlsZCdzIGxvY2FsIHN0YXRlIGlkIGlzIHVuaXF1ZS5cbiAgICAgICAgaWYgKF8uYW55KHRoaXMuX2NoaWxkcmVuLCAoYykgPT4gYy5zdGF0ZUlkID09PSBjaGlsZC5zdGF0ZUlkKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEdlbkVycm9yKFwiRHVwbGljYXRlIHN0YXRlZnVsIGNvbXBvbmVudCBzdGF0ZSBpZGVudGlmaWVyICdcIiArIGNoaWxkLnN0YXRlSWQgKyBcIicuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY2hpbGRyZW4ucHVzaChjaGlsZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVW5yZWdpc3RlcnMgYW4gZXhpc3RpbmcgY2hpbGQgb2YgdGhpcyBzdGF0ZWZ1bCBjb21wb25lbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0YXRlZnVsQ29tcG9uZW50QmFzZX0gY2hpbGQgQ2hpbGQgY29tcG9uZW50IGluc3RhbmNlXG4gICAgICovXG4gICAgcHJpdmF0ZSBfdW5yZWdpc3RlckNoaWxkKGNoaWxkOiBTdGF0ZWZ1bENvbXBvbmVudEJhc2UpIHtcbiAgICAgICAgdGhpcy5fY2hpbGRyZW4gPSBfLndpdGhvdXQodGhpcy5fY2hpbGRyZW4sIGNoaWxkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBwYXJlbnQgc3RhdGVmdWwgY29tcG9uZW50LlxuICAgICAqL1xuICAgIHB1YmxpYyBwYXJlbnRDb21wb25lbnQoKTogU3RhdGVmdWxDb21wb25lbnRCYXNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgbGlzdCBvZiBjaGlsZCBzdGF0ZWZ1bCBjb21wb25lbnRzLlxuICAgICAqL1xuICAgIHB1YmxpYyBjaGlsZENvbXBvbmVudHMoKTogU3RhdGVmdWxDb21wb25lbnRCYXNlW10ge1xuICAgICAgICByZXR1cm4gXy5jbG9uZSh0aGlzLl9jaGlsZHJlbik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZHMgYSBjaGlsZCBjb21wb25lbnQgYnkgaXRzIHN0YXRlIGlkZW50aWZpZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdGVJZCBDaGlsZCdzIHN0YXRlIGlkZW50aWZpZXJcbiAgICAgKiBAcmV0dXJuIHtTdGF0ZWZ1bENvbXBvbmVudEJhc2V9IENoaWxkIGNvbXBvbmVudCBpbnN0YW5jZVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXRDaGlsZENvbXBvbmVudDxUIGV4dGVuZHMgU3RhdGVmdWxDb21wb25lbnRCYXNlPihzdGF0ZUlkOiBzdHJpbmcpOiBUIHtcbiAgICAgICAgcmV0dXJuIDxUPiBfLmZpbmQodGhpcy5fY2hpbGRyZW4sIChjaGlsZCkgPT4gY2hpbGQuc3RhdGVJZCA9PT0gc3RhdGVJZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3Vic2NyaWJlcyB0byBzaGFyZWQgc3RhdGUuIFRoaXMgaXMgdGhlIHNhbWUgYXMgYSBub3JtYWwgc3Vic2NyaWJlLCBidXQgaW5cbiAgICAgKiBhZGRpdGlvbiBpdCBhbHNvIHByb3Blcmx5IGhhbmRsZXMgdW5kZXJseWluZyBkYXRhIHN0b3JlIGNoYW5nZXMgd2hlblxuICAgICAqIGNvbXBvbmVudCBzdGF0ZSBpcyByZWxvYWRlZC5cbiAgICAgKlxuICAgICAqIFRoZSB2YWx1ZSBvYnNlcnZlZCBmcm9tIHRoZSBzaGFyZWQgc3RvcmUgTVVTVCBOT1QgYmUgbXV0YXRlZCBpbiBhbnkgd2F5IGFzXG4gICAgICogZG9pbmcgc28gbWF5IGNhdXNlIHVuZGVmaW5lZCBiZWhhdmlvci4gSWYgeW91IG5lZWQgdG8gbXV0YXRlIHRoZSBvYnNlcnZlZFxuICAgICAqIHZhbHVlLCB1c2UgW1tzdWJzY3JpYmVTaGFyZWRTdGF0ZU11dGFibGVdXSBpbnN0ZWFkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgTmFtZSBvZiBzaGFyZWQgc3RhdGVcbiAgICAgKiBAcGFyYW0gY2FsbGJhY2sgQ2FsbGJhY2sgdG8gYmUgaW52b2tlZCBvbiBzdWJzY3JpcHRpb25cbiAgICAgKi9cbiAgICBwdWJsaWMgc3Vic2NyaWJlU2hhcmVkU3RhdGUobmFtZTogc3RyaW5nLCBjYWxsYmFjazogKHZhbHVlOiBhbnkpID0+IHZvaWQpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgc3RvcmVNZXRhZGF0YSA9IHRoaXMuX2dldFN0YXRlTWV0YWRhdGEobmFtZSk7XG4gICAgICAgIGlmICghc3RvcmVNZXRhZGF0YSB8fCAhc3RvcmVNZXRhZGF0YS5zaGFyZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihcIlNoYXJlZCBzdGF0ZSAnXCIgKyBuYW1lICsgXCInIG5vdCBmb3VuZC5cIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzdWJzY3JpYmVyID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc3RvcmU6IFNoYXJlZFN0b3JlPGFueSwgYW55PiA9IHRoaXNbc3RvcmVNZXRhZGF0YS5wcm9wZXJ0eU5hbWVdO1xuICAgICAgICAgICAgaWYgKCFzdG9yZSkge1xuICAgICAgICAgICAgICAgIC8vIEBpZm5kZWYgR0VOSlNfUFJPRFVDVElPTlxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgR2VuRXJyb3IoYElnbm9yZWQgbWlzc2luZyBzdG9yZTogJHtzdG9yZU1ldGFkYXRhLnByb3BlcnR5TmFtZX0gJHt0aGlzLmdsb2JhbFN0YXRlSWR9YCk7XG4gICAgICAgICAgICAgICAgLy8gQGVuZGlmXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXN0b3JlKSByZXR1cm47XG4gICAgICAgICAgICB0aGlzLl9zaGFyZWRTdG9yZVN1YnNjcmlwdGlvbnMucHVzaCh0aGlzLnN1YnNjcmliZShjYWxsYmFjaywgc3RvcmUub2JzZXJ2YWJsZSgpKSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5fc2hhcmVkU3RvcmVTdWJzY3JpYmVSZXF1ZXN0cy5wdXNoKHN1YnNjcmliZXIpO1xuICAgICAgICBzdWJzY3JpYmVyKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSB2ZXJzaW9uIG9mIFtbc3Vic2NyaWJlU2hhcmVkU3RhdGVdXSwgd2hpY2ggZW5zdXJlcyB0aGF0IHRoZSBvYnNlcnZlZCBzaGFyZWRcbiAgICAgKiBzdG9yZSB2YWx1ZSBpcyBjb3BpZWQgYW5kIGNhbiB0aHVzIGJlIHNhZmVseSBtdXRhdGVkIGFmdGVyd2FyZHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBOYW1lIG9mIHNoYXJlZCBzdGF0ZVxuICAgICAqIEBwYXJhbSBjYWxsYmFjayBDYWxsYmFjayB0byBiZSBpbnZva2VkIG9uIHN1YnNjcmlwdGlvblxuICAgICAqL1xuICAgIHB1YmxpYyBzdWJzY3JpYmVTaGFyZWRTdGF0ZU11dGFibGU8VD4obmFtZTogc3RyaW5nLCBjYWxsYmFjazogKHZhbHVlOiBUKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgICAgIHRoaXMuc3Vic2NyaWJlU2hhcmVkU3RhdGUobmFtZSwgKHZhbHVlKSA9PiBjYWxsYmFjayhhbmd1bGFyLmNvcHkodmFsdWUpKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBtZXRhZGF0YSBmb3Igc3BlY2lmaWMgY29tcG9uZW50IHN0YXRlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgTmFtZSBvZiBzaGFyZWQgc3RhdGUgKG5vdCBwcm9wZXJ0eSBuYW1lKVxuICAgICAqIEByZXR1cm4ge1N0YXRlSXRlbU1ldGFkYXRhfSBTdGF0ZSBtZXRhZGF0YVxuICAgICAqL1xuICAgIHByaXZhdGUgX2dldFN0YXRlTWV0YWRhdGEobmFtZTogc3RyaW5nKTogU3RhdGVJdGVtTWV0YWRhdGEge1xuICAgICAgICByZXR1cm4gdGhpcy5fX3N0YXRlTWV0YWRhdGFbbmFtZV07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2F2ZXMgdGhpcyBjb21wb25lbnQncyBjdXJyZW50IHN0YXRlIGFuZCByZXR1cm5zIGl0LlxuICAgICAqL1xuICAgIHB1YmxpYyBzYXZlU3RhdGUoc2F2ZUNoaWxkcmVuOiBib29sZWFuID0gdHJ1ZSk6IGFueSB7XG4gICAgICAgIHRoaXMub25Db21wb25lbnRTdGF0ZVByZVNhdmUoKTtcblxuICAgICAgICBsZXQgcmVzdWx0ID0ge307XG4gICAgICAgIGxldCBzdGF0ZSA9IHJlc3VsdFt0aGlzLmdsb2JhbFN0YXRlSWRdID0ge307XG4gICAgICAgIF8uZm9yT3duKHRoaXMuX19zdGF0ZU1ldGFkYXRhLCAobWV0YWRhdGEsIGtleSkgPT4ge1xuICAgICAgICAgICAgbGV0IHZhbHVlID0gdGhpc1ttZXRhZGF0YS5wcm9wZXJ0eU5hbWVdO1xuXG4gICAgICAgICAgICBpZiAobWV0YWRhdGEuc2hhcmVkKSB7XG4gICAgICAgICAgICAgICAgLy8gSW4gY2FzZSBvZiBzaGFyZWQgc3RhdGUsIHNhdmUgdGhlIGlkZW50aWZpZXIgb2YgdGhlIHNoYXJlZCBzdG9yZS5cbiAgICAgICAgICAgICAgICB2YWx1ZSA9ICg8U2hhcmVkU3RvcmU8YW55LCBhbnk+PiB2YWx1ZSkuc3RvcmVJZDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RhdGVba2V5XSA9IHZhbHVlO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBTYXZlIGNoaWxkIHN0YXRlLlxuICAgICAgICBpZiAoc2F2ZUNoaWxkcmVuKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHRoaXMuX2NoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgXy5leHRlbmQocmVzdWx0LCBjaGlsZC5zYXZlU3RhdGUoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExvYWRzIHRoaXMgY29tcG9uZW50J3MgY3VycmVudCBzdGF0ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7YW55fSBnbG9iYWxTdGF0ZSBHbG9iYWwgc3RhdGVcbiAgICAgKi9cbiAgICBwdWJsaWMgbG9hZFN0YXRlKGdsb2JhbFN0YXRlOiBhbnksIGxvYWRDaGlsZHJlbjogYm9vbGVhbiA9IHRydWUpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBnbG9iYWxTdGF0ZVt0aGlzLmdsb2JhbFN0YXRlSWRdO1xuICAgICAgICBsZXQgc2hhcmVkU3RhdGVDaGFuZ2VkID0gZmFsc2U7XG4gICAgICAgIF8uZm9yT3duKHRoaXMuX19zdGF0ZU1ldGFkYXRhLCAobWV0YWRhdGEsIGtleSkgPT4ge1xuICAgICAgICAgICAgbGV0IHZhbHVlID0gc3RhdGVba2V5XTtcbiAgICAgICAgICAgIGlmIChfLmlzVW5kZWZpbmVkKHZhbHVlKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAobWV0YWRhdGEuc2hhcmVkKSB7XG4gICAgICAgICAgICAgICAgLy8gR2V0IHRoZSBzaGFyZWQgc3RvcmUgZnJvbSB0aGUgc2hhcmVkIHN0b3JlIG1hbmFnZXIuXG4gICAgICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdWYWx1ZTogU2hhcmVkU3RvcmU8YW55LCBhbnk+ID0gdGhpc1ttZXRhZGF0YS5wcm9wZXJ0eU5hbWVdO1xuICAgICAgICAgICAgICAgIGlmIChleGlzdGluZ1ZhbHVlLnN0b3JlSWQgIT09IHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNbbWV0YWRhdGEucHJvcGVydHlOYW1lXSA9IHRoaXMuX3NoYXJlZFN0b3JlTWFuYWdlci5nZXRTdG9yZTxhbnk+KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgc2hhcmVkU3RhdGVDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXNbbWV0YWRhdGEucHJvcGVydHlOYW1lXSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBMb2FkIGNoaWxkIHN0YXRlLlxuICAgICAgICBpZiAobG9hZENoaWxkcmVuKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHRoaXMuX2NoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgY2hpbGQubG9hZFN0YXRlKGdsb2JhbFN0YXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzaGFyZWRTdGF0ZUNoYW5nZWQpIHtcbiAgICAgICAgICAgIC8vIENhbmNlbCBhbnkgcHJldmlvdXMgc3Vic2NyaXB0aW9ucyB0byBzaGFyZWQgc3RvcmVzLlxuICAgICAgICAgICAgZm9yIChjb25zdCBzdWJzY3JpcHRpb24gb2YgdGhpcy5fc2hhcmVkU3RvcmVTdWJzY3JpcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFJlc3Vic2NyaWJlLCB1c2luZyB0aGUgbmV3IHN0b3Jlcy5cbiAgICAgICAgICAgIGZvciAoY29uc3QgcmVxdWVzdCBvZiB0aGlzLl9zaGFyZWRTdG9yZVN1YnNjcmliZVJlcXVlc3RzKSB7XG4gICAgICAgICAgICAgICAgcmVxdWVzdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vbkNvbXBvbmVudFN0YXRlQWZ0ZXJMb2FkKCk7XG5cbiAgICAgICAgLy8gUHJvcGFnYXRlIHN0YXRlIHVwZGF0ZXMgdG8gdGhlIHZpZXcuXG4gICAgICAgIHRoaXMuJHNjb3BlLiRhcHBseUFzeW5jKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBjb25maWd1cmVDb21wb25lbnQoY29uZmlnOiBDb21wb25lbnRDb25maWd1cmF0aW9uKTogQ29tcG9uZW50Q29uZmlndXJhdGlvbiB7XG4gICAgICAgIGNvbnN0IHN0YXRlTWV0YWRhdGEgPSB0aGlzLnByb3RvdHlwZS5fX3N0YXRlTWV0YWRhdGE7XG4gICAgICAgIGlmICghY29uZmlnLmJpbmRpbmdzKSBjb25maWcuYmluZGluZ3MgPSB7fTtcblxuICAgICAgICBfLmZvck93bihzdGF0ZU1ldGFkYXRhLCAobWV0YWRhdGEsIGtleSkgPT4ge1xuICAgICAgICAgICAgaWYgKG1ldGFkYXRhLnNoYXJlZCkge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5iaW5kaW5nc1ttZXRhZGF0YS5nZXRTaGFyZWRTdG9yZU5hbWVQcm9wZXJ0eSgpXSA9ICdAc3RvcmUnICsgXy5jYXBpdGFsaXplKGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gY29uZmlnO1xuICAgIH1cbn1cblxuLyoqXG4gKiBNYXJrcyBhIHByb3BlcnR5IGFzIGJlaW5nIHBhcnQgb2YgdGhlIGNvbXBvbmVudCdzIHN0YXRlLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE9wdGlvbmFsIHN0YXRlIG5hbWVcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gc2hhcmVkIERvZXMgdGhpcyBzdGF0ZSByZWZlcmVuY2UgYSBzaGFyZWQgc3RvcmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0YXRlKG5hbWU/OiBzdHJpbmcsIHNoYXJlZDogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgcmV0dXJuICh0YXJnZXQ6IFN0YXRlZnVsQ29tcG9uZW50QmFzZSwgcHJvcGVydHlLZXk6IHN0cmluZykgPT4ge1xuICAgICAgICBpZiAoIW5hbWUpIG5hbWUgPSBwcm9wZXJ0eUtleTtcblxuICAgICAgICBpZiAobmFtZVswXSA9PT0gJ18nKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgR2VuRXJyb3IoXCJTdGF0ZSBpZGVudGlmaWVycyBzdGFydGluZyB3aXRoIGFuIHVuZGVyc2NvcmUgYXJlIHJlc2VydmVkLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGFyZ2V0Ll9fc3RhdGVNZXRhZGF0YSkge1xuICAgICAgICAgICAgdGFyZ2V0Ll9fc3RhdGVNZXRhZGF0YSA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRhcmdldC5fX3N0YXRlTWV0YWRhdGFbbmFtZV0pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihcIkR1cGxpY2F0ZSBzdGF0ZSBpZGVudGlmaWVyICdcIiArIG5hbWUgKyBcIicgb24gc3RhdGVmdWwgY29tcG9uZW50ICdcIiArIHRhcmdldCArIFwiJy5cIik7XG4gICAgICAgIH1cbiAgICAgICAgdGFyZ2V0Ll9fc3RhdGVNZXRhZGF0YVtuYW1lXSA9IG5ldyBTdGF0ZUl0ZW1NZXRhZGF0YShwcm9wZXJ0eUtleSwgc2hhcmVkKTtcbiAgICB9O1xufVxuXG4vKipcbiAqIE1hcmtzIGEgcHJvcGVydHkgYXMgYmVpbmcgcGFydCBvZiB0aGUgY29tcG9uZW50J3Mgc3RhdGUsIHdoaWNoIHJlZmVyZW5jZXNcbiAqIGEgc2hhcmVkIHN0b3JlLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE9wdGlvbmFsIHN0YXRlIG5hbWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNoYXJlZFN0YXRlKG5hbWU/OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RhdGUobmFtZSwgdHJ1ZSk7XG59XG4iXX0=
