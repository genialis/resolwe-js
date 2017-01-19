"use strict";
var _ = require("lodash");
var angular = require("angular");
/**
 * Manager of all stateful components' state.
 */
var StateManager = (function () {
    // @ngInject
    StateManager.$inject = ["sharedStoreManager"];
    function StateManager(sharedStoreManager) {
        this._topLevelComponent = null;
        this._nextState = {};
        this._sharedStoreManager = sharedStoreManager;
    }
    Object.defineProperty(StateManager.prototype, "sharedStoreManager", {
        /**
         * Returns the shared store manager.
         */
        get: function () {
            return this._sharedStoreManager;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Sets the top-level component.
     *
     * @param component Top-level component instance
     */
    StateManager.prototype.setTopLevelComponent = function (component) {
        this._topLevelComponent = component;
    };
    /**
     * Returns the current top-level component.
     */
    StateManager.prototype.topLevelComponent = function () {
        return this._topLevelComponent;
    };
    /**
     * Saves a component's current state so it will be reloaded when the component
     * is next constructed.
     *
     * @param component Target component
     */
    StateManager.prototype.savePendingComponentState = function (component) {
        _.assign(this._nextState, component.saveState(false));
    };
    /**
     * Loads any pending state for a specified component. State may be pending if
     * it gets loaded before the target component has been constructed. In this
     * case it will get loaded as soon as the target component gets constructed.
     *
     * @param component Target component
     */
    StateManager.prototype.loadPendingComponentState = function (component) {
        var state = this._nextState[component.globalStateId];
        if (!state)
            return;
        component.loadState(this._nextState, false);
        delete this._nextState[component.globalStateId];
    };
    /**
     * Saves application state.
     *
     * @return Application state
     */
    StateManager.prototype.save = function () {
        if (!this._topLevelComponent)
            return null;
        var state = this._topLevelComponent.saveState();
        state['_stores'] = this._sharedStoreManager.saveState();
        return state;
    };
    /**
     * Loads existing application state.
     *
     * @param state Application state
     */
    StateManager.prototype.load = function (state) {
        this._sharedStoreManager.loadState(state['_stores'] || {});
        delete state['_stores'];
        this._nextState = state;
        if (this._topLevelComponent) {
            this._topLevelComponent.loadState(this._nextState);
        }
    };
    return StateManager;
}());
exports.StateManager = StateManager;
var angularModule = angular.module('resolwe.services.state_manager', [
    'resolwe.services.shared_store',
]);
// Register the state manager as a service, so it can be used by components.
angularModule.service('stateManager', StateManager);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2NvbXBvbmVudHMvbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsMEJBQTRCO0FBQzVCLGlDQUFtQztBQUtuQzs7R0FFRztBQUNIO0lBTUksWUFBWTtJQUNaLHNCQUFZLGtCQUFzQztRQUwxQyx1QkFBa0IsR0FBMEIsSUFBSSxDQUFDO1FBRWpELGVBQVUsR0FBUSxFQUFFLENBQUM7UUFJekIsSUFBSSxDQUFDLG1CQUFtQixHQUFHLGtCQUFrQixDQUFDO0lBQ2xELENBQUM7SUFLRCxzQkFBVyw0Q0FBa0I7UUFIN0I7O1dBRUc7YUFDSDtZQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUM7UUFDcEMsQ0FBQzs7O09BQUE7SUFFRDs7OztPQUlHO0lBQ0ksMkNBQW9CLEdBQTNCLFVBQTRCLFNBQWdDO1FBQ3hELElBQUksQ0FBQyxrQkFBa0IsR0FBRyxTQUFTLENBQUM7SUFDeEMsQ0FBQztJQUVEOztPQUVHO0lBQ0ksd0NBQWlCLEdBQXhCO1FBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztJQUNuQyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSSxnREFBeUIsR0FBaEMsVUFBaUMsU0FBZ0M7UUFDN0QsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUMxRCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0ksZ0RBQXlCLEdBQWhDLFVBQWlDLFNBQWdDO1FBQzdELElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3ZELEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBQUMsTUFBTSxDQUFDO1FBRW5CLFNBQVMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM1QyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFRDs7OztPQUlHO0lBQ0ksMkJBQUksR0FBWDtRQUNJLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDO1lBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztRQUUxQyxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDbEQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUN4RCxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFFRDs7OztPQUlHO0lBQ0ksMkJBQUksR0FBWCxVQUFZLEtBQVU7UUFDbEIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDM0QsT0FBTyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDeEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7UUFFeEIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztZQUMxQixJQUFJLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN2RCxDQUFDO0lBQ0wsQ0FBQztJQUNMLG1CQUFDO0FBQUQsQ0F0RkEsQUFzRkMsSUFBQTtBQXRGWSxvQ0FBWTtBQXdGekIsSUFBTSxhQUFhLEdBQW9CLE9BQU8sQ0FBQyxNQUFNLENBQUMsZ0NBQWdDLEVBQUU7SUFDcEYsK0JBQStCO0NBQ2xDLENBQUMsQ0FBQztBQUVILDRFQUE0RTtBQUM1RSxhQUFhLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsQ0FBQyIsImZpbGUiOiJjb3JlL2NvbXBvbmVudHMvbWFuYWdlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIGFuZ3VsYXIgZnJvbSAnYW5ndWxhcic7XG5cbmltcG9ydCB7U3RhdGVmdWxDb21wb25lbnRCYXNlfSBmcm9tICcuL3N0YXRlZnVsJztcbmltcG9ydCB7U2hhcmVkU3RvcmVNYW5hZ2VyfSBmcm9tICcuLi9zaGFyZWRfc3RvcmUvaW5kZXgnO1xuXG4vKipcbiAqIE1hbmFnZXIgb2YgYWxsIHN0YXRlZnVsIGNvbXBvbmVudHMnIHN0YXRlLlxuICovXG5leHBvcnQgY2xhc3MgU3RhdGVNYW5hZ2VyIHtcbiAgICBwcml2YXRlIF9zaGFyZWRTdG9yZU1hbmFnZXI6IFNoYXJlZFN0b3JlTWFuYWdlcjtcbiAgICBwcml2YXRlIF90b3BMZXZlbENvbXBvbmVudDogU3RhdGVmdWxDb21wb25lbnRCYXNlID0gbnVsbDtcblxuICAgIHByaXZhdGUgX25leHRTdGF0ZTogYW55ID0ge307XG5cbiAgICAvLyBAbmdJbmplY3RcbiAgICBjb25zdHJ1Y3RvcihzaGFyZWRTdG9yZU1hbmFnZXI6IFNoYXJlZFN0b3JlTWFuYWdlcikge1xuICAgICAgICB0aGlzLl9zaGFyZWRTdG9yZU1hbmFnZXIgPSBzaGFyZWRTdG9yZU1hbmFnZXI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgc2hhcmVkIHN0b3JlIG1hbmFnZXIuXG4gICAgICovXG4gICAgcHVibGljIGdldCBzaGFyZWRTdG9yZU1hbmFnZXIoKTogU2hhcmVkU3RvcmVNYW5hZ2VyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NoYXJlZFN0b3JlTWFuYWdlcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSB0b3AtbGV2ZWwgY29tcG9uZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbXBvbmVudCBUb3AtbGV2ZWwgY29tcG9uZW50IGluc3RhbmNlXG4gICAgICovXG4gICAgcHVibGljIHNldFRvcExldmVsQ29tcG9uZW50KGNvbXBvbmVudDogU3RhdGVmdWxDb21wb25lbnRCYXNlKSB7XG4gICAgICAgIHRoaXMuX3RvcExldmVsQ29tcG9uZW50ID0gY29tcG9uZW50O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgdG9wLWxldmVsIGNvbXBvbmVudC5cbiAgICAgKi9cbiAgICBwdWJsaWMgdG9wTGV2ZWxDb21wb25lbnQoKTogU3RhdGVmdWxDb21wb25lbnRCYXNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3RvcExldmVsQ29tcG9uZW50O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNhdmVzIGEgY29tcG9uZW50J3MgY3VycmVudCBzdGF0ZSBzbyBpdCB3aWxsIGJlIHJlbG9hZGVkIHdoZW4gdGhlIGNvbXBvbmVudFxuICAgICAqIGlzIG5leHQgY29uc3RydWN0ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29tcG9uZW50IFRhcmdldCBjb21wb25lbnRcbiAgICAgKi9cbiAgICBwdWJsaWMgc2F2ZVBlbmRpbmdDb21wb25lbnRTdGF0ZShjb21wb25lbnQ6IFN0YXRlZnVsQ29tcG9uZW50QmFzZSk6IHZvaWQge1xuICAgICAgICBfLmFzc2lnbih0aGlzLl9uZXh0U3RhdGUsIGNvbXBvbmVudC5zYXZlU3RhdGUoZmFsc2UpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb2FkcyBhbnkgcGVuZGluZyBzdGF0ZSBmb3IgYSBzcGVjaWZpZWQgY29tcG9uZW50LiBTdGF0ZSBtYXkgYmUgcGVuZGluZyBpZlxuICAgICAqIGl0IGdldHMgbG9hZGVkIGJlZm9yZSB0aGUgdGFyZ2V0IGNvbXBvbmVudCBoYXMgYmVlbiBjb25zdHJ1Y3RlZC4gSW4gdGhpc1xuICAgICAqIGNhc2UgaXQgd2lsbCBnZXQgbG9hZGVkIGFzIHNvb24gYXMgdGhlIHRhcmdldCBjb21wb25lbnQgZ2V0cyBjb25zdHJ1Y3RlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb21wb25lbnQgVGFyZ2V0IGNvbXBvbmVudFxuICAgICAqL1xuICAgIHB1YmxpYyBsb2FkUGVuZGluZ0NvbXBvbmVudFN0YXRlKGNvbXBvbmVudDogU3RhdGVmdWxDb21wb25lbnRCYXNlKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gdGhpcy5fbmV4dFN0YXRlW2NvbXBvbmVudC5nbG9iYWxTdGF0ZUlkXTtcbiAgICAgICAgaWYgKCFzdGF0ZSkgcmV0dXJuO1xuXG4gICAgICAgIGNvbXBvbmVudC5sb2FkU3RhdGUodGhpcy5fbmV4dFN0YXRlLCBmYWxzZSk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLl9uZXh0U3RhdGVbY29tcG9uZW50Lmdsb2JhbFN0YXRlSWRdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNhdmVzIGFwcGxpY2F0aW9uIHN0YXRlLlxuICAgICAqXG4gICAgICogQHJldHVybiBBcHBsaWNhdGlvbiBzdGF0ZVxuICAgICAqL1xuICAgIHB1YmxpYyBzYXZlKCk6IGFueSB7XG4gICAgICAgIGlmICghdGhpcy5fdG9wTGV2ZWxDb21wb25lbnQpIHJldHVybiBudWxsO1xuXG4gICAgICAgIGNvbnN0IHN0YXRlID0gdGhpcy5fdG9wTGV2ZWxDb21wb25lbnQuc2F2ZVN0YXRlKCk7XG4gICAgICAgIHN0YXRlWydfc3RvcmVzJ10gPSB0aGlzLl9zaGFyZWRTdG9yZU1hbmFnZXIuc2F2ZVN0YXRlKCk7XG4gICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb2FkcyBleGlzdGluZyBhcHBsaWNhdGlvbiBzdGF0ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzdGF0ZSBBcHBsaWNhdGlvbiBzdGF0ZVxuICAgICAqL1xuICAgIHB1YmxpYyBsb2FkKHN0YXRlOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fc2hhcmVkU3RvcmVNYW5hZ2VyLmxvYWRTdGF0ZShzdGF0ZVsnX3N0b3JlcyddIHx8IHt9KTtcbiAgICAgICAgZGVsZXRlIHN0YXRlWydfc3RvcmVzJ107XG4gICAgICAgIHRoaXMuX25leHRTdGF0ZSA9IHN0YXRlO1xuXG4gICAgICAgIGlmICh0aGlzLl90b3BMZXZlbENvbXBvbmVudCkge1xuICAgICAgICAgICAgdGhpcy5fdG9wTGV2ZWxDb21wb25lbnQubG9hZFN0YXRlKHRoaXMuX25leHRTdGF0ZSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmNvbnN0IGFuZ3VsYXJNb2R1bGU6IGFuZ3VsYXIuSU1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCdyZXNvbHdlLnNlcnZpY2VzLnN0YXRlX21hbmFnZXInLCBbXG4gICAgJ3Jlc29sd2Uuc2VydmljZXMuc2hhcmVkX3N0b3JlJyxcbl0pO1xuXG4vLyBSZWdpc3RlciB0aGUgc3RhdGUgbWFuYWdlciBhcyBhIHNlcnZpY2UsIHNvIGl0IGNhbiBiZSB1c2VkIGJ5IGNvbXBvbmVudHMuXG5hbmd1bGFyTW9kdWxlLnNlcnZpY2UoJ3N0YXRlTWFuYWdlcicsIFN0YXRlTWFuYWdlcik7XG4iXX0=
