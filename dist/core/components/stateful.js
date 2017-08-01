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
            _this._stateManager.addTopLevelComponent(_this);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2NvbXBvbmVudHMvc3RhdGVmdWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsMEJBQTRCO0FBQzVCLGlDQUFtQztBQUVuQywrQkFBc0Y7QUFHdEYseUNBQXlDO0FBRXpDO0lBQ0ksMkJBQW1CLFlBQW9CLEVBQVMsTUFBZTtRQUE1QyxpQkFBWSxHQUFaLFlBQVksQ0FBUTtRQUFTLFdBQU0sR0FBTixNQUFNLENBQVM7SUFDL0QsQ0FBQztJQUVNLHNEQUEwQixHQUFqQztRQUNJLE1BQU0sQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO0lBQ25ELENBQUM7SUFDTCx3QkFBQztBQUFELENBUEEsQUFPQyxJQUFBO0FBUFksOENBQWlCO0FBaUI5Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXVERztBQU9ILElBQXNCLHFCQUFxQjtJQUFTLHlDQUFhO0lBb0I3RCxZQUFZO0lBQ1osK0JBQVksTUFBc0IsRUFBRSxZQUEwQjtRQUE5RCxZQUNJLGtCQUFNLE1BQU0sQ0FBQyxTQW1CaEI7UUFsQ0QsOEJBQThCO1FBQ3RCLGFBQU8sR0FBMEIsSUFBSSxDQUFDO1FBQzlDLHdDQUF3QztRQUNoQyxlQUFTLEdBQTRCLEVBQUUsQ0FBQztRQUtoRCw0Q0FBNEM7UUFDcEMsbUNBQTZCLEdBQWtDLEVBQUUsQ0FBQztRQUMxRSxtQ0FBbUM7UUFDM0IsK0JBQXlCLEdBQW1CLEVBQUUsQ0FBQztRQU1uRCxLQUFJLENBQUMsYUFBYSxHQUFHLFlBQVksQ0FBQztRQUNsQyxLQUFJLENBQUMsbUJBQW1CLEdBQUcsWUFBWSxDQUFDLGtCQUFrQixDQUFDO1FBRTNELG1FQUFtRTtRQUNuRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUIsS0FBSSxDQUFDLE9BQU8sR0FBRyxL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LENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0IsTUFBTSxJQUFJLGdCQUFRLENBQUMsOEJBQThCLEdBQUcsSUFBSSxHQUFHLDJCQUEyQixHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsQ0FBQztRQUM1RyxDQUFDO1FBQ0QsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLGlCQUFpQixDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUM5RSxDQUFDLENBQUM7QUFDTixDQUFDO0FBakJELHNCQWlCQztBQUVEOzs7OztHQUtHO0FBQ0gscUJBQTRCLElBQWE7SUFDckMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDN0IsQ0FBQztBQUZELGtDQUVDIiwiZmlsZSI6ImNvcmUvY29tcG9uZW50cy9zdGF0ZWZ1bC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIGFuZ3VsYXIgZnJvbSAnYW5ndWxhcic7XG5cbmltcG9ydCB7Q29tcG9uZW50QmFzZSwgY29tcG9uZW50LCBDb21wb25lbnRDb25maWd1cmF0aW9uLCBTdWJzY3JpcHRpb259IGZyb20gJy4vYmFzZSc7XG5pbXBvcnQge1NoYXJlZFN0b3JlLCBTaGFyZWRTdG9yZU1hbmFnZXJ9IGZyb20gJy4uL3NoYXJlZF9zdG9yZS9pbmRleCc7XG5pbXBvcnQge1N0YXRlTWFuYWdlcn0gZnJvbSAnLi9tYW5hZ2VyJztcbmltcG9ydCB7R2VuRXJyb3J9IGZyb20gJy4uL2Vycm9ycy9lcnJvcic7XG5cbmV4cG9ydCBjbGFzcyBTdGF0ZUl0ZW1NZXRhZGF0YSB7XG4gICAgY29uc3RydWN0b3IocHVibGljIHByb3BlcnR5TmFtZTogc3RyaW5nLCBwdWJsaWMgc2hhcmVkOiBib29sZWFuKSB7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFNoYXJlZFN0b3JlTmFtZVByb3BlcnR5KCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiAnX3NoYXJlZFN0b3JlTmFtZV8nICsgdGhpcy5wcm9wZXJ0eU5hbWU7XG4gICAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN0YXRlTWV0YWRhdGEge1xuICAgIFtpbmRleDogc3RyaW5nXTogU3RhdGVJdGVtTWV0YWRhdGE7XG59XG5cbmludGVyZmFjZSBTaGFyZWRTdG9yZVN1YnNjcmliZVJlcXVlc3Qge1xuICAgICgpOiB2b2lkO1xufVxuXG4vKipcbiAqIEEgY29tcG9uZW50IHdoaWNoIGNvbnRhaW5zIHN0YXRlIHRoYXQgbWF5IGJlIHNhdmVkIGFuZCByZWxvYWRlZCBsYXRlci4gU3VjaFxuICogc3RhdGVmdWwgY29tcG9uZW50cyBhcmUgYXV0b21hdGljYWxseSBvcmdhbml6ZWQgaW50byBhIGhpZXJhcmNoeSwgc28gdGhhdFxuICogcGFyZW50cyBhbHNvIHN0b3JlIHN0YXRlIGZvciBhbGwgdGhlaXIgY2hpbGRyZW4uIENhbGxpbmcgYHNhdmVTdGF0ZWAgb24gdGhlXG4gKiB0b3AtbGV2ZWwgY29tcG9uZW50IHdpbGwgdGhlcmVmb3JlIHNhdmUgdGhlIHN0YXRlIG9mIHRoZSBjb21wbGV0ZSBhcHBsaWNhdGlvbi5cbiAqXG4gKiBDb21wb25lbnQgc3RhdGUgaXMgZGVmaW5lZCBieSB1c2luZyBwcm9wZXJ0eSBkZWNvcmF0b3JzIGFzIGZvbGxvd3M6XG4gKiBgYGBcbiAqIGV4cG9ydCBjbGFzcyBQcm9jZXNzR3JvdXBzIGV4dGVuZHMgVmlld0NvbXBvbmVudCB7XG4gKiAgICAgQHN0YXRlKCkgcHVibGljIHNlbGVjdGVkR3JvdXA6IG51bWJlcjtcbiAqXG4gKiAgICAgLy8gLi4uXG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBJdCBtYXkgYmUgdGhlbiByZWZlcmVuY2VkIGFuZCB3YXRjaGVkIGZyb20gdGhlIGNvbnRyb2xsZXIgb3IgdGVtcGxhdGVzIGFuZFxuICogd2lsbCBhdXRvbWF0aWNhbGx5IGJlIHNhdmVkIHdoZW4gY2FsbGluZyBbW1N0YXRlZnVsQ29tcG9uZW50QmFzZS5zYXZlU3RhdGVdXVxuICogYW5kIHJlbG9hZGVkIHdoZW4gY2FsbGluZyBbW1N0YXRlZnVsQ29tcG9uZW50QmFzZS5sb2FkU3RhdGVdXS5cbiAqXG4gKiBBIHJlbGF0ZWQgZGVjb3JhdG9yIG1heSBiZSB1c2VkIHRvIGRlY2xhcmUgc3RhdGUsIHdoaWNoIGlzIHNoYXJlZCBiZXR3ZWVuXG4gKiBtdWx0aXBsZSBjb21wb25lbnRzOlxuICogYGBgXG4gKiBleHBvcnQgY2xhc3MgV2lkZ2V0Um9zZTIgZXh0ZW5kcyBXaWRnZXRCYXNlIHtcbiAqICAgICBAc2hhcmVkU3RhdGUoKSBwdWJsaWMgc2VsZWN0ZWRWYWx1ZTogU2hhcmVkU3RvcmU8dHlwZXMuRGF0YT47XG4gKlxuICogICAgIC8vIC4uLlxuICogfVxuICogYGBgXG4gKlxuICogU2VlIFtbU2hhcmVkU3RvcmVNYW5hZ2VyXV0gYW5kIFtbU2hhcmVkU3RvcmVdXSBmb3IgbW9yZSBkb2N1bWVudGF0aW9uIG9uXG4gKiBkZWZpbmluZyBzaGFyZWQgc3RhdGUgdXNpbmcgc2hhcmVkIHN0b3Jlcy5cbiAqXG4gKiBGb3IgZXhhbXBsZSwgaWYgYSBzdGF0ZWZ1bCBjb21wb25lbnQgZGVmaW5lcyBhIHNoYXJlZCBzdGF0ZSBwcm9wZXJ0eSBjYWxsZWRcbiAqIGBzZWxlY3RlZFZhbHVlYCAoYXMgc2hvd24gYWJvdmUpIGFuZCB5b3Ugd2FudCB0byBsaW5rIGl0IHdpdGggdGhlIHNoYXJlZCBzdG9yZVxuICogbmFtZWQgYHJvc2UyLXNlbGVjdGVkLWRhdGEtaXRlbWAsIHlvdSBjYW4gZG8gdGhlIGZvbGxvd2luZyBpbiB5b3VyIHRlbXBsYXRlOlxuICogYGBgaHRtbFxuICogPGdlbi13aWRnZXQtcm9zZTIgc3RvcmUtc2VsZWN0ZWQtdmFsdWU9XCJyb3NlMi1zZWxlY3RlZC1kYXRhLWl0ZW1cIj48L2dlbi13aWRnZXQtcm9zZTI+XG4gKiBgYGBcbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHRlbXBsYXRlIGF0dHJpYnV0ZSBuYW1lIGlzIHByZWZpeGVkIHdpdGggYHN0b3JlYCBldmVuIHdoZW4gdGhlXG4gKiBwcm9wZXJ0eSBpcyBjYWxsZWQganVzdCBgc2VsZWN0ZWRWYWx1ZWAuIFRoaXMgaXMgZG9uZSBiZWNhdXNlIHdoYXQgeW91IHBhc3NcbiAqIGluIHRoZSB0ZW1wbGF0ZSBpcyBqdXN0IGEgbmFtZSBvZiB0aGUgc3RvcmUsIHdoaWNoIG11c3QgYmUgcmVzb2x2ZWQgdXNpbmcgdGhlXG4gKiBzaGFyZWQgc3RvcmUgbWFuYWdlci5cbiAqXG4gKiBJbnNpZGUgdGhlIGNvbXBvbmVudHMgeW91IGNhbiB0aGVuIGRpc3BhdGNoIGFuZCBzdWJzY3JpYmUgdG8gdGhlIHVuZGVybHlpbmdcbiAqIHN0b3JlOlxuICogYGBgXG4gKiAvLyBQdWJsaXNoIHNvbWV0aGluZyBieSBkaXNwYXRjaGluZyBhbiBhY3Rpb24gdG8gdGhlIHNoYXJlZCBzdG9yZS5cbiAqIHRoaXMuc2VsZWN0ZWRWYWx1ZS5kaXNwYXRjaCh7dHlwZTogQWN0aW9ucy5TRVQsIHZhbHVlOiA0Mn0pO1xuICpcbiAqIC8vIFN1YnNjcmliZSB0byB1cGRhdGVzIG9mIHRoZSBzaGFyZWQgc3RvcmUuXG4gKiB0aGlzLnN1YnNjcmliZVNoYXJlZFN0YXRlKCdzZWxlY3RlZFZhbHVlJywgKGRhdGEpID0+IHtcbiAqICAgICBjb25zb2xlLmxvZyhcIlNoYXJlZCBzdGF0ZSAnc2VsZWN0ZWRWYWx1ZScgaXMgbm93XCIsIGRhdGEpO1xuICogfSk7XG4gKiBgYGBcbiAqL1xuQGNvbXBvbmVudCh7XG4gICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgYmluZGluZ3M6IHtcbiAgICAgICAgc3RhdGVJZDogJ0BzdGF0ZUlkJyxcbiAgICB9LFxufSlcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTdGF0ZWZ1bENvbXBvbmVudEJhc2UgZXh0ZW5kcyBDb21wb25lbnRCYXNlIHtcbiAgICAvLy8gTWV0YWRhdGEgYWJvdXQgdGhlIHN0YXRlIGRlZmluZWQgb24gdGhlIGNvbXBvbmVudC5cbiAgICBwdWJsaWMgX19zdGF0ZU1ldGFkYXRhOiBTdGF0ZU1ldGFkYXRhO1xuICAgIC8vLyBUaGlzIGNvbXBvbmVudCdzIGxvY2FsIHN0YXRlIGlkZW50aWZpZXIuXG4gICAgcHVibGljIHN0YXRlSWQ6IHN0cmluZztcbiAgICAvLy8gVGhpcyBjb21wb25lbnQncyBnbG9iYWwgc3RhdGUgaWRlbnRpZmllci5cbiAgICBwdWJsaWMgZ2xvYmFsU3RhdGVJZDogc3RyaW5nO1xuICAgIC8vLyBQYXJlbnQgc3RhdGVmdWwgY29tcG9uZW50LlxuICAgIHByaXZhdGUgX3BhcmVudDogU3RhdGVmdWxDb21wb25lbnRCYXNlID0gbnVsbDtcbiAgICAvLy8gQSBsaXN0IG9mIGNoaWxkIHN0YXRlZnVsIGNvbXBvbmVudHMuXG4gICAgcHJpdmF0ZSBfY2hpbGRyZW46IFN0YXRlZnVsQ29tcG9uZW50QmFzZVtdID0gW107XG4gICAgLy8vIFN0YXRlIG1hbmFnZXIuXG4gICAgcHJpdmF0ZSBfc3RhdGVNYW5hZ2VyOiBTdGF0ZU1hbmFnZXI7XG4gICAgLy8vIFNoYXJlZCBzdG9yZSBtYW5hZ2VyLlxuICAgIHByaXZhdGUgX3NoYXJlZFN0b3JlTWFuYWdlcjogU2hhcmVkU3RvcmVNYW5hZ2VyO1xuICAgIC8vLyBTdWJzY3JpcHRpb24gcmVxdWVzdHMgZm9yIHNoYXJlZCBzdG9yZXMuXG4gICAgcHJpdmF0ZSBfc2hhcmVkU3RvcmVTdWJzY3JpYmVSZXF1ZXN0czogU2hhcmVkU3RvcmVTdWJzY3JpYmVSZXF1ZXN0W10gPSBbXTtcbiAgICAvLy8gU3Vic2NyaXB0aW9ucyB0byBzaGFyZWQgc3RvcmVzLlxuICAgIHByaXZhdGUgX3NoYXJlZFN0b3JlU3Vic2NyaXB0aW9uczogU3Vic2NyaXB0aW9uW10gPSBbXTtcblxuICAgIC8vIEBuZ0luamVjdFxuICAgIGNvbnN0cnVjdG9yKCRzY29wZTogYW5ndWxhci5JU2NvcGUsIHN0YXRlTWFuYWdlcjogU3RhdGVNYW5hZ2VyKSB7XG4gICAgICAgIHN1cGVyKCRzY29wZSk7XG5cbiAgICAgICAgdGhpcy5fc3RhdGVNYW5hZ2VyID0gc3RhdGVNYW5hZ2VyO1xuICAgICAgICB0aGlzLl9zaGFyZWRTdG9yZU1hbmFnZXIgPSBzdGF0ZU1hbmFnZXIuc2hhcmVkU3RvcmVNYW5hZ2VyO1xuXG4gICAgICAgIC8vIFdoZW4gc3RhdGUgaWRlbnRpZmllciBpcyBub3QgZGVmaW5lZCwgZGVmYXVsdCB0byBkaXJlY3RpdmUgbmFtZS5cbiAgICAgICAgaWYgKF8uaXNFbXB0eSh0aGlzLnN0YXRlSWQpKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlSWQgPSB0aGlzLmdldENvbmZpZygpLmRpcmVjdGl2ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERldGVybWluZSBvdXIgcGFyZW50IGFuZCByZWdpc3RlciBvdXJzZWx2ZXMgd2l0aCBpdC5cbiAgICAgICAgdGhpcy5fcGFyZW50ID0gdGhpcy5fZmluZFBhcmVudENvbXBvbmVudCgpO1xuICAgICAgICBpZiAodGhpcy5fcGFyZW50KSB7XG4gICAgICAgICAgICB0aGlzLl9wYXJlbnQuX3JlZ2lzdGVyQ2hpbGQodGhpcyk7XG4gICAgICAgICAgICB0aGlzLmdsb2JhbFN0YXRlSWQgPSB0aGlzLl9wYXJlbnQuZ2xvYmFsU3RhdGVJZCArICctJyArIHRoaXMuc3RhdGVJZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlTWFuYWdlci5hZGRUb3BMZXZlbENvbXBvbmVudCh0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuZ2xvYmFsU3RhdGVJZCA9IHRoaXMuc3RhdGVJZDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBvbkNvbXBvbmVudEluaXQoKSB7XG4gICAgICAgIHN1cGVyLm9uQ29tcG9uZW50SW5pdCgpO1xuXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZXJlIGlzIGFueSBwZW5kaW5nIHN0YXRlIGZvciB1cy5cbiAgICAgICAgdGhpcy5fc3RhdGVNYW5hZ2VyLmxvYWRQZW5kaW5nQ29tcG9uZW50U3RhdGUodGhpcyk7XG5cbiAgICAgICAgLy8gQXV0b21hdGljYWxseSBsb2FkIGFueSBjb25maWd1cmVkIHNoYXJlZCBzdGF0ZS5cbiAgICAgICAgY29uc3Qgc3RhdGVNZXRhZGF0YSA9IHRoaXMuX19zdGF0ZU1ldGFkYXRhO1xuICAgICAgICBfLmZvck93bihzdGF0ZU1ldGFkYXRhLCAobWV0YWRhdGEpID0+IHtcbiAgICAgICAgICAgIGlmIChtZXRhZGF0YS5zaGFyZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzaGFyZWRTdG9yZU5hbWUgPSB0aGlzW21ldGFkYXRhLmdldFNoYXJlZFN0b3JlTmFtZVByb3BlcnR5KCldO1xuICAgICAgICAgICAgICAgIGlmICghXy5pc0VtcHR5KHNoYXJlZFN0b3JlTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RvcmUgPSB0aGlzLl9zaGFyZWRTdG9yZU1hbmFnZXIuZ2V0U3RvcmUoc2hhcmVkU3RvcmVOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1ttZXRhZGF0YS5wcm9wZXJ0eU5hbWVdID0gc3RvcmU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0dXBTaGFyZWRTdG9yZShtZXRhZGF0YS5wcm9wZXJ0eU5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHVwIHRoZSBzaGFyZWQgc3RvcmUuIFRoaXMgbWV0aG9kIG1heSBiZSBvdmVycmlkZW4gYnkgc3ViY2xhc3NlcyB3aGVuIHNvbWV0aGluZ1xuICAgICAqIGRpZmZlcmVudCBzaG91bGQgYmUgZG9uZSBoZXJlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdG9yZX0gU2hhcmVkIHN0YXRlXG4gICAgICovXG4gICAgcHJvdGVjdGVkIF9zZXR1cFNoYXJlZFN0b3JlKHN0b3JlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgLy8gU3Vic2NyaWJlIHRvIHNoYXJlZCBzdG9yZSwgc28gdGhhdCB0aGlzIGNvbXBvbmVudCdzIHNjb3BlIGdldHMgdXBkYXRlZCB3aGVuIHRoZVxuICAgICAgICAvLyB2YWx1ZSBpbiB0aGUgc3RvcmUgaXMgdXBkYXRlZC5cbiAgICAgICAgdGhpcy5zdWJzY3JpYmVTaGFyZWRTdGF0ZShzdG9yZSwgXy5ub29wKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBzdGF0ZSBtYW5hZ2VyLlxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQgc3RhdGVNYW5hZ2VyKCk6IFN0YXRlTWFuYWdlciB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0ZU1hbmFnZXI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgc2hhcmVkIHN0b3JlIG1hbmFnZXIuXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGdldCBzaGFyZWRTdG9yZU1hbmFnZXIoKTogU2hhcmVkU3RvcmVNYW5hZ2VyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NoYXJlZFN0b3JlTWFuYWdlcjtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25Db21wb25lbnREZXN0cm95ZWQoKTogdm9pZCB7XG4gICAgICAgIC8vIFNhdmUgY3VycmVudCBjb21wb25lbnQgc3RhdGUsIHNvIGl0IHdpbGwgYmUgYXZhaWxhYmxlIHdoZW4gdGhpcyBjb21wb25lbnRcbiAgICAgICAgLy8gaXMgaW5zdGFudGlhdGVkIGFnYWluLlxuICAgICAgICB0aGlzLl9zdGF0ZU1hbmFnZXIuc2F2ZVBlbmRpbmdDb21wb25lbnRTdGF0ZSh0aGlzKTtcblxuICAgICAgICBpZiAodGhpcy5fcGFyZW50KSB7XG4gICAgICAgICAgICB0aGlzLl9wYXJlbnQuX3VucmVnaXN0ZXJDaGlsZCh0aGlzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlTWFuYWdlci5yZW1vdmVUb3BMZXZlbENvbXBvbmVudCh0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1cGVyLm9uQ29tcG9uZW50RGVzdHJveWVkKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgdGhlIGNvbXBvbmVudCdzIHN0YXRlIGhhcyBiZWVuIGxvYWRlZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgb25Db21wb25lbnRTdGF0ZUFmdGVyTG9hZCgpOiB2b2lkIHtcbiAgICAgICAgLy8gRG8gbm90aGluZyBieSBkZWZhdWx0LlxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkIGJlZm9yZSB0aGUgY29tcG9uZW50J3Mgc3RhdGUgaGFzIGJlZW4gc2F2ZWQuXG4gICAgICovXG4gICAgcHVibGljIG9uQ29tcG9uZW50U3RhdGVQcmVTYXZlKCk6IHZvaWQge1xuICAgICAgICAvLyBEbyBub3RoaW5nIGJ5IGRlZmF1bHQuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGlzY292ZXJzIHRoZSBwYXJlbnQgc3RhdGVmdWwgY29tcG9uZW50LlxuICAgICAqL1xuICAgIHByaXZhdGUgX2ZpbmRQYXJlbnRDb21wb25lbnQoKTogU3RhdGVmdWxDb21wb25lbnRCYXNlIHtcbiAgICAgICAgbGV0IHNjb3BlID0gdGhpcy4kc2NvcGUuJHBhcmVudDtcbiAgICAgICAgd2hpbGUgKHNjb3BlKSB7XG4gICAgICAgICAgICBpZiAoc2NvcGVbJ2N0cmwnXSBpbnN0YW5jZW9mIFN0YXRlZnVsQ29tcG9uZW50QmFzZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzY29wZVsnY3RybCddO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzY29wZSA9IHNjb3BlLiRwYXJlbnQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlcnMgYSBuZXcgY2hpbGQgb2YgdGhpcyBzdGF0ZWZ1bCBjb21wb25lbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0YXRlZnVsQ29tcG9uZW50QmFzZX0gY2hpbGQgQ2hpbGQgY29tcG9uZW50IGluc3RhbmNlXG4gICAgICovXG4gICAgcHJpdmF0ZSBfcmVnaXN0ZXJDaGlsZChjaGlsZDogU3RhdGVmdWxDb21wb25lbnRCYXNlKSB7XG4gICAgICAgIC8vIEVuc3VyZSB0aGUgY2hpbGQncyBsb2NhbCBzdGF0ZSBpZCBpcyB1bmlxdWUuXG4gICAgICAgIGlmIChfLmFueSh0aGlzLl9jaGlsZHJlbiwgKGMpID0+IGMuc3RhdGVJZCA9PT0gY2hpbGQuc3RhdGVJZCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihcIkR1cGxpY2F0ZSBzdGF0ZWZ1bCBjb21wb25lbnQgc3RhdGUgaWRlbnRpZmllciAnXCIgKyBjaGlsZC5zdGF0ZUlkICsgXCInLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NoaWxkcmVuLnB1c2goY2hpbGQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVucmVnaXN0ZXJzIGFuIGV4aXN0aW5nIGNoaWxkIG9mIHRoaXMgc3RhdGVmdWwgY29tcG9uZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdGF0ZWZ1bENvbXBvbmVudEJhc2V9IGNoaWxkIENoaWxkIGNvbXBvbmVudCBpbnN0YW5jZVxuICAgICAqL1xuICAgIHByaXZhdGUgX3VucmVnaXN0ZXJDaGlsZChjaGlsZDogU3RhdGVmdWxDb21wb25lbnRCYXNlKSB7XG4gICAgICAgIHRoaXMuX2NoaWxkcmVuID0gXy53aXRob3V0KHRoaXMuX2NoaWxkcmVuLCBjaGlsZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgcGFyZW50IHN0YXRlZnVsIGNvbXBvbmVudC5cbiAgICAgKi9cbiAgICBwdWJsaWMgcGFyZW50Q29tcG9uZW50KCk6IFN0YXRlZnVsQ29tcG9uZW50QmFzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGxpc3Qgb2YgY2hpbGQgc3RhdGVmdWwgY29tcG9uZW50cy5cbiAgICAgKi9cbiAgICBwdWJsaWMgY2hpbGRDb21wb25lbnRzKCk6IFN0YXRlZnVsQ29tcG9uZW50QmFzZVtdIHtcbiAgICAgICAgcmV0dXJuIF8uY2xvbmUodGhpcy5fY2hpbGRyZW4pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmRzIGEgY2hpbGQgY29tcG9uZW50IGJ5IGl0cyBzdGF0ZSBpZGVudGlmaWVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlSWQgQ2hpbGQncyBzdGF0ZSBpZGVudGlmaWVyXG4gICAgICogQHJldHVybiB7U3RhdGVmdWxDb21wb25lbnRCYXNlfSBDaGlsZCBjb21wb25lbnQgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0Q2hpbGRDb21wb25lbnQ8VCBleHRlbmRzIFN0YXRlZnVsQ29tcG9uZW50QmFzZT4oc3RhdGVJZDogc3RyaW5nKTogVCB7XG4gICAgICAgIHJldHVybiA8VD4gXy5maW5kKHRoaXMuX2NoaWxkcmVuLCAoY2hpbGQpID0+IGNoaWxkLnN0YXRlSWQgPT09IHN0YXRlSWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN1YnNjcmliZXMgdG8gc2hhcmVkIHN0YXRlLiBUaGlzIGlzIHRoZSBzYW1lIGFzIGEgbm9ybWFsIHN1YnNjcmliZSwgYnV0IGluXG4gICAgICogYWRkaXRpb24gaXQgYWxzbyBwcm9wZXJseSBoYW5kbGVzIHVuZGVybHlpbmcgZGF0YSBzdG9yZSBjaGFuZ2VzIHdoZW5cbiAgICAgKiBjb21wb25lbnQgc3RhdGUgaXMgcmVsb2FkZWQuXG4gICAgICpcbiAgICAgKiBUaGUgdmFsdWUgb2JzZXJ2ZWQgZnJvbSB0aGUgc2hhcmVkIHN0b3JlIE1VU1QgTk9UIGJlIG11dGF0ZWQgaW4gYW55IHdheSBhc1xuICAgICAqIGRvaW5nIHNvIG1heSBjYXVzZSB1bmRlZmluZWQgYmVoYXZpb3IuIElmIHlvdSBuZWVkIHRvIG11dGF0ZSB0aGUgb2JzZXJ2ZWRcbiAgICAgKiB2YWx1ZSwgdXNlIFtbc3Vic2NyaWJlU2hhcmVkU3RhdGVNdXRhYmxlXV0gaW5zdGVhZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE5hbWUgb2Ygc2hhcmVkIHN0YXRlXG4gICAgICogQHBhcmFtIGNhbGxiYWNrIENhbGxiYWNrIHRvIGJlIGludm9rZWQgb24gc3Vic2NyaXB0aW9uXG4gICAgICovXG4gICAgcHVibGljIHN1YnNjcmliZVNoYXJlZFN0YXRlKG5hbWU6IHN0cmluZywgY2FsbGJhY2s6ICh2YWx1ZTogYW55KSA9PiB2b2lkKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHN0b3JlTWV0YWRhdGEgPSB0aGlzLl9nZXRTdGF0ZU1ldGFkYXRhKG5hbWUpO1xuICAgICAgICBpZiAoIXN0b3JlTWV0YWRhdGEgfHwgIXN0b3JlTWV0YWRhdGEuc2hhcmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgR2VuRXJyb3IoXCJTaGFyZWQgc3RhdGUgJ1wiICsgbmFtZSArIFwiJyBub3QgZm91bmQuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc3Vic2NyaWJlciA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHN0b3JlOiBTaGFyZWRTdG9yZTxhbnksIGFueT4gPSB0aGlzW3N0b3JlTWV0YWRhdGEucHJvcGVydHlOYW1lXTtcbiAgICAgICAgICAgIGlmICghc3RvcmUpIHtcbiAgICAgICAgICAgICAgICAvLyBAaWZuZGVmIEdFTkpTX1BST0RVQ1RJT05cbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEdlbkVycm9yKGBJZ25vcmVkIG1pc3Npbmcgc3RvcmU6ICR7c3RvcmVNZXRhZGF0YS5wcm9wZXJ0eU5hbWV9ICR7dGhpcy5nbG9iYWxTdGF0ZUlkfWApO1xuICAgICAgICAgICAgICAgIC8vIEBlbmRpZlxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFzdG9yZSkgcmV0dXJuO1xuICAgICAgICAgICAgdGhpcy5fc2hhcmVkU3RvcmVTdWJzY3JpcHRpb25zLnB1c2godGhpcy5zdWJzY3JpYmUoY2FsbGJhY2ssIHN0b3JlLm9ic2VydmFibGUoKSkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuX3NoYXJlZFN0b3JlU3Vic2NyaWJlUmVxdWVzdHMucHVzaChzdWJzY3JpYmVyKTtcbiAgICAgICAgc3Vic2NyaWJlcigpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEEgdmVyc2lvbiBvZiBbW3N1YnNjcmliZVNoYXJlZFN0YXRlXV0sIHdoaWNoIGVuc3VyZXMgdGhhdCB0aGUgb2JzZXJ2ZWQgc2hhcmVkXG4gICAgICogc3RvcmUgdmFsdWUgaXMgY29waWVkIGFuZCBjYW4gdGh1cyBiZSBzYWZlbHkgbXV0YXRlZCBhZnRlcndhcmRzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgTmFtZSBvZiBzaGFyZWQgc3RhdGVcbiAgICAgKiBAcGFyYW0gY2FsbGJhY2sgQ2FsbGJhY2sgdG8gYmUgaW52b2tlZCBvbiBzdWJzY3JpcHRpb25cbiAgICAgKi9cbiAgICBwdWJsaWMgc3Vic2NyaWJlU2hhcmVkU3RhdGVNdXRhYmxlPFQ+KG5hbWU6IHN0cmluZywgY2FsbGJhY2s6ICh2YWx1ZTogVCkgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICB0aGlzLnN1YnNjcmliZVNoYXJlZFN0YXRlKG5hbWUsICh2YWx1ZSkgPT4gY2FsbGJhY2soYW5ndWxhci5jb3B5KHZhbHVlKSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgbWV0YWRhdGEgZm9yIHNwZWNpZmljIGNvbXBvbmVudCBzdGF0ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIE5hbWUgb2Ygc2hhcmVkIHN0YXRlIChub3QgcHJvcGVydHkgbmFtZSlcbiAgICAgKiBAcmV0dXJuIHtTdGF0ZUl0ZW1NZXRhZGF0YX0gU3RhdGUgbWV0YWRhdGFcbiAgICAgKi9cbiAgICBwcml2YXRlIF9nZXRTdGF0ZU1ldGFkYXRhKG5hbWU6IHN0cmluZyk6IFN0YXRlSXRlbU1ldGFkYXRhIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19zdGF0ZU1ldGFkYXRhW25hbWVdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNhdmVzIHRoaXMgY29tcG9uZW50J3MgY3VycmVudCBzdGF0ZSBhbmQgcmV0dXJucyBpdC5cbiAgICAgKi9cbiAgICBwdWJsaWMgc2F2ZVN0YXRlKHNhdmVDaGlsZHJlbjogYm9vbGVhbiA9IHRydWUpOiBhbnkge1xuICAgICAgICB0aGlzLm9uQ29tcG9uZW50U3RhdGVQcmVTYXZlKCk7XG5cbiAgICAgICAgbGV0IHJlc3VsdCA9IHt9O1xuICAgICAgICBsZXQgc3RhdGUgPSByZXN1bHRbdGhpcy5nbG9iYWxTdGF0ZUlkXSA9IHt9O1xuICAgICAgICBfLmZvck93bih0aGlzLl9fc3RhdGVNZXRhZGF0YSwgKG1ldGFkYXRhLCBrZXkpID0+IHtcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHRoaXNbbWV0YWRhdGEucHJvcGVydHlOYW1lXTtcblxuICAgICAgICAgICAgaWYgKG1ldGFkYXRhLnNoYXJlZCkge1xuICAgICAgICAgICAgICAgIC8vIEluIGNhc2Ugb2Ygc2hhcmVkIHN0YXRlLCBzYXZlIHRoZSBpZGVudGlmaWVyIG9mIHRoZSBzaGFyZWQgc3RvcmUuXG4gICAgICAgICAgICAgICAgdmFsdWUgPSAoPFNoYXJlZFN0b3JlPGFueSwgYW55Pj4gdmFsdWUpLnN0b3JlSWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0YXRlW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gU2F2ZSBjaGlsZCBzdGF0ZS5cbiAgICAgICAgaWYgKHNhdmVDaGlsZHJlbikge1xuICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLl9jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIF8uZXh0ZW5kKHJlc3VsdCwgY2hpbGQuc2F2ZVN0YXRlKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb2FkcyB0aGlzIGNvbXBvbmVudCdzIGN1cnJlbnQgc3RhdGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2FueX0gZ2xvYmFsU3RhdGUgR2xvYmFsIHN0YXRlXG4gICAgICovXG4gICAgcHVibGljIGxvYWRTdGF0ZShnbG9iYWxTdGF0ZTogYW55LCBsb2FkQ2hpbGRyZW46IGJvb2xlYW4gPSB0cnVlKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gZ2xvYmFsU3RhdGVbdGhpcy5nbG9iYWxTdGF0ZUlkXTtcbiAgICAgICAgbGV0IHNoYXJlZFN0YXRlQ2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICBfLmZvck93bih0aGlzLl9fc3RhdGVNZXRhZGF0YSwgKG1ldGFkYXRhLCBrZXkpID0+IHtcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHN0YXRlW2tleV07XG4gICAgICAgICAgICBpZiAoXy5pc1VuZGVmaW5lZCh2YWx1ZSkpIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKG1ldGFkYXRhLnNoYXJlZCkge1xuICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgc2hhcmVkIHN0b3JlIGZyb20gdGhlIHNoYXJlZCBzdG9yZSBtYW5hZ2VyLlxuICAgICAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nVmFsdWU6IFNoYXJlZFN0b3JlPGFueSwgYW55PiA9IHRoaXNbbWV0YWRhdGEucHJvcGVydHlOYW1lXTtcbiAgICAgICAgICAgICAgICBpZiAoZXhpc3RpbmdWYWx1ZS5zdG9yZUlkICE9PSB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzW21ldGFkYXRhLnByb3BlcnR5TmFtZV0gPSB0aGlzLl9zaGFyZWRTdG9yZU1hbmFnZXIuZ2V0U3RvcmU8YW55Pih2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHNoYXJlZFN0YXRlQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzW21ldGFkYXRhLnByb3BlcnR5TmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gTG9hZCBjaGlsZCBzdGF0ZS5cbiAgICAgICAgaWYgKGxvYWRDaGlsZHJlbikge1xuICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLl9jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIGNoaWxkLmxvYWRTdGF0ZShnbG9iYWxTdGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2hhcmVkU3RhdGVDaGFuZ2VkKSB7XG4gICAgICAgICAgICAvLyBDYW5jZWwgYW55IHByZXZpb3VzIHN1YnNjcmlwdGlvbnMgdG8gc2hhcmVkIHN0b3Jlcy5cbiAgICAgICAgICAgIGZvciAoY29uc3Qgc3Vic2NyaXB0aW9uIG9mIHRoaXMuX3NoYXJlZFN0b3JlU3Vic2NyaXB0aW9ucykge1xuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBSZXN1YnNjcmliZSwgdXNpbmcgdGhlIG5ldyBzdG9yZXMuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHJlcXVlc3Qgb2YgdGhpcy5fc2hhcmVkU3RvcmVTdWJzY3JpYmVSZXF1ZXN0cykge1xuICAgICAgICAgICAgICAgIHJlcXVlc3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMub25Db21wb25lbnRTdGF0ZUFmdGVyTG9hZCgpO1xuXG4gICAgICAgIC8vIFByb3BhZ2F0ZSBzdGF0ZSB1cGRhdGVzIHRvIHRoZSB2aWV3LlxuICAgICAgICB0aGlzLiRzY29wZS4kYXBwbHlBc3luYygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdGF0aWMgY29uZmlndXJlQ29tcG9uZW50KGNvbmZpZzogQ29tcG9uZW50Q29uZmlndXJhdGlvbik6IENvbXBvbmVudENvbmZpZ3VyYXRpb24ge1xuICAgICAgICBjb25zdCBzdGF0ZU1ldGFkYXRhID0gdGhpcy5wcm90b3R5cGUuX19zdGF0ZU1ldGFkYXRhO1xuICAgICAgICBpZiAoIWNvbmZpZy5iaW5kaW5ncykgY29uZmlnLmJpbmRpbmdzID0ge307XG5cbiAgICAgICAgXy5mb3JPd24oc3RhdGVNZXRhZGF0YSwgKG1ldGFkYXRhLCBrZXkpID0+IHtcbiAgICAgICAgICAgIGlmIChtZXRhZGF0YS5zaGFyZWQpIHtcbiAgICAgICAgICAgICAgICBjb25maWcuYmluZGluZ3NbbWV0YWRhdGEuZ2V0U2hhcmVkU3RvcmVOYW1lUHJvcGVydHkoKV0gPSAnQHN0b3JlJyArIF8uY2FwaXRhbGl6ZShrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICB9XG59XG5cbi8qKlxuICogTWFya3MgYSBwcm9wZXJ0eSBhcyBiZWluZyBwYXJ0IG9mIHRoZSBjb21wb25lbnQncyBzdGF0ZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBPcHRpb25hbCBzdGF0ZSBuYW1lXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHNoYXJlZCBEb2VzIHRoaXMgc3RhdGUgcmVmZXJlbmNlIGEgc2hhcmVkIHN0b3JlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdGF0ZShuYW1lPzogc3RyaW5nLCBzaGFyZWQ6IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgIHJldHVybiAodGFyZ2V0OiBTdGF0ZWZ1bENvbXBvbmVudEJhc2UsIHByb3BlcnR5S2V5OiBzdHJpbmcpID0+IHtcbiAgICAgICAgaWYgKCFuYW1lKSBuYW1lID0gcHJvcGVydHlLZXk7XG5cbiAgICAgICAgaWYgKG5hbWVbMF0gPT09ICdfJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEdlbkVycm9yKFwiU3RhdGUgaWRlbnRpZmllcnMgc3RhcnRpbmcgd2l0aCBhbiB1bmRlcnNjb3JlIGFyZSByZXNlcnZlZC5cIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRhcmdldC5fX3N0YXRlTWV0YWRhdGEpIHtcbiAgICAgICAgICAgIHRhcmdldC5fX3N0YXRlTWV0YWRhdGEgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0YXJnZXQuX19zdGF0ZU1ldGFkYXRhW25hbWVdKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgR2VuRXJyb3IoXCJEdXBsaWNhdGUgc3RhdGUgaWRlbnRpZmllciAnXCIgKyBuYW1lICsgXCInIG9uIHN0YXRlZnVsIGNvbXBvbmVudCAnXCIgKyB0YXJnZXQgKyBcIicuXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRhcmdldC5fX3N0YXRlTWV0YWRhdGFbbmFtZV0gPSBuZXcgU3RhdGVJdGVtTWV0YWRhdGEocHJvcGVydHlLZXksIHNoYXJlZCk7XG4gICAgfTtcbn1cblxuLyoqXG4gKiBNYXJrcyBhIHByb3BlcnR5IGFzIGJlaW5nIHBhcnQgb2YgdGhlIGNvbXBvbmVudCdzIHN0YXRlLCB3aGljaCByZWZlcmVuY2VzXG4gKiBhIHNoYXJlZCBzdG9yZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBPcHRpb25hbCBzdGF0ZSBuYW1lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzaGFyZWRTdGF0ZShuYW1lPzogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0YXRlKG5hbWUsIHRydWUpO1xufVxuIl19
