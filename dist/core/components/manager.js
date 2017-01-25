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
        this._topLevelComponents = [];
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
     * Adds a top-level component.
     *
     * @param component Top-level component instance
     */
    StateManager.prototype.addTopLevelComponent = function (component) {
        this._topLevelComponents.push(component);
    };
    /**
     * Removes a top-level component.
     *
     * @param component Top-level component instance
     */
    StateManager.prototype.removeTopLevelComponent = function (component) {
        _.remove(this._topLevelComponents, component);
    };
    /**
     * Returns the current top-level component.
     */
    StateManager.prototype.topLevelComponents = function () {
        return this._topLevelComponents;
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
        if (_.isEmpty(this._topLevelComponents))
            return null;
        var states = _.map(this._topLevelComponents, function (component) { return component.saveState(); });
        var state = _.merge.apply(_, [{}].concat(states));
        state['_stores'] = this._sharedStoreManager.saveState();
        return state;
    };
    /**
     * Loads existing application state.
     *
     * @param state Application state
     */
    StateManager.prototype.load = function (state) {
        var _this = this;
        this._sharedStoreManager.loadState(state['_stores'] || {});
        delete state['_stores'];
        this._nextState = state;
        _.each(this._topLevelComponents, function (component) { return component.loadState(_this._nextState); });
    };
    return StateManager;
}());
exports.StateManager = StateManager;
var angularModule = angular.module('resolwe.services.state_manager', [
    'resolwe.services.shared_store',
]);
// Register the state manager as a service, so it can be used by components.
angularModule.service('stateManager', StateManager);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2NvbXBvbmVudHMvbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsMEJBQTRCO0FBQzVCLGlDQUFtQztBQUtuQzs7R0FFRztBQUNIO0lBTUksWUFBWTtJQUNaLHNCQUFZLGtCQUFzQztRQUwxQyx3QkFBbUIsR0FBNEIsRUFBRSxDQUFDO1FBRWxELGVBQVUsR0FBUSxFQUFFLENBQUM7UUFJekIsSUFBSSxDQUFDLG1CQUFtQixHQUFHLGtCQUFrQixDQUFDO0lBQ2xELENBQUM7SUFLRCxzQkFBVyw0Q0FBa0I7UUFIN0I7O1dBRUc7YUFDSDtZQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUM7UUFDcEMsQ0FBQzs7O09BQUE7SUFFRDs7OztPQUlHO0lBQ0ksMkNBQW9CLEdBQTNCLFVBQTRCLFNBQWdDO1FBQ3hELElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSw4Q0FBdUIsR0FBOUIsVUFBK0IsU0FBZ0M7UUFDM0QsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDbEQsQ0FBQztJQUVEOztPQUVHO0lBQ0kseUNBQWtCLEdBQXpCO1FBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztJQUNwQyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSSxnREFBeUIsR0FBaEMsVUFBaUMsU0FBZ0M7UUFDN0QsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUMxRCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0ksZ0RBQXlCLEdBQWhDLFVBQWlDLFNBQWdDO1FBQzdELElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3ZELEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBQUMsTUFBTSxDQUFDO1FBRW5CLFNBQVMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM1QyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFRDs7OztPQUlHO0lBQ0ksMkJBQUksR0FBWDtRQUNJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBRXJELElBQU0sTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLFVBQUMsU0FBUyxJQUFLLE9BQUEsU0FBUyxDQUFDLFNBQVMsRUFBRSxFQUFyQixDQUFxQixDQUFDLENBQUM7UUFDckYsSUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssT0FBUCxDQUFDLEdBQU8sRUFBRSxTQUFLLE1BQU0sRUFBQyxDQUFDO1FBRXJDLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDeEQsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNJLDJCQUFJLEdBQVgsVUFBWSxLQUFVO1FBQXRCLGlCQU1DO1FBTEcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDM0QsT0FBTyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDeEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7UUFFeEIsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsVUFBQyxTQUFTLElBQUssT0FBQSxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUksQ0FBQyxVQUFVLENBQUMsRUFBcEMsQ0FBb0MsQ0FBQyxDQUFDO0lBQzFGLENBQUM7SUFDTCxtQkFBQztBQUFELENBL0ZBLEFBK0ZDLElBQUE7QUEvRlksb0NBQVk7QUFpR3pCLElBQU0sYUFBYSxHQUFvQixPQUFPLENBQUMsTUFBTSxDQUFDLGdDQUFnQyxFQUFFO0lBQ3BGLCtCQUErQjtDQUNsQyxDQUFDLENBQUM7QUFFSCw0RUFBNEU7QUFDNUUsYUFBYSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsWUFBWSxDQUFDLENBQUMiLCJmaWxlIjoiY29yZS9jb21wb25lbnRzL21hbmFnZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgKiBhcyBhbmd1bGFyIGZyb20gJ2FuZ3VsYXInO1xuXG5pbXBvcnQge1N0YXRlZnVsQ29tcG9uZW50QmFzZX0gZnJvbSAnLi9zdGF0ZWZ1bCc7XG5pbXBvcnQge1NoYXJlZFN0b3JlTWFuYWdlcn0gZnJvbSAnLi4vc2hhcmVkX3N0b3JlL2luZGV4JztcblxuLyoqXG4gKiBNYW5hZ2VyIG9mIGFsbCBzdGF0ZWZ1bCBjb21wb25lbnRzJyBzdGF0ZS5cbiAqL1xuZXhwb3J0IGNsYXNzIFN0YXRlTWFuYWdlciB7XG4gICAgcHJpdmF0ZSBfc2hhcmVkU3RvcmVNYW5hZ2VyOiBTaGFyZWRTdG9yZU1hbmFnZXI7XG4gICAgcHJpdmF0ZSBfdG9wTGV2ZWxDb21wb25lbnRzOiBTdGF0ZWZ1bENvbXBvbmVudEJhc2VbXSA9IFtdO1xuXG4gICAgcHJpdmF0ZSBfbmV4dFN0YXRlOiBhbnkgPSB7fTtcblxuICAgIC8vIEBuZ0luamVjdFxuICAgIGNvbnN0cnVjdG9yKHNoYXJlZFN0b3JlTWFuYWdlcjogU2hhcmVkU3RvcmVNYW5hZ2VyKSB7XG4gICAgICAgIHRoaXMuX3NoYXJlZFN0b3JlTWFuYWdlciA9IHNoYXJlZFN0b3JlTWFuYWdlcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBzaGFyZWQgc3RvcmUgbWFuYWdlci5cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IHNoYXJlZFN0b3JlTWFuYWdlcigpOiBTaGFyZWRTdG9yZU1hbmFnZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2hhcmVkU3RvcmVNYW5hZ2VyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSB0b3AtbGV2ZWwgY29tcG9uZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbXBvbmVudCBUb3AtbGV2ZWwgY29tcG9uZW50IGluc3RhbmNlXG4gICAgICovXG4gICAgcHVibGljIGFkZFRvcExldmVsQ29tcG9uZW50KGNvbXBvbmVudDogU3RhdGVmdWxDb21wb25lbnRCYXNlKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX3RvcExldmVsQ29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBhIHRvcC1sZXZlbCBjb21wb25lbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29tcG9uZW50IFRvcC1sZXZlbCBjb21wb25lbnQgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgcmVtb3ZlVG9wTGV2ZWxDb21wb25lbnQoY29tcG9uZW50OiBTdGF0ZWZ1bENvbXBvbmVudEJhc2UpOiB2b2lkIHtcbiAgICAgICAgXy5yZW1vdmUodGhpcy5fdG9wTGV2ZWxDb21wb25lbnRzLCBjb21wb25lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgdG9wLWxldmVsIGNvbXBvbmVudC5cbiAgICAgKi9cbiAgICBwdWJsaWMgdG9wTGV2ZWxDb21wb25lbnRzKCk6IFN0YXRlZnVsQ29tcG9uZW50QmFzZVtdIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3RvcExldmVsQ29tcG9uZW50cztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTYXZlcyBhIGNvbXBvbmVudCdzIGN1cnJlbnQgc3RhdGUgc28gaXQgd2lsbCBiZSByZWxvYWRlZCB3aGVuIHRoZSBjb21wb25lbnRcbiAgICAgKiBpcyBuZXh0IGNvbnN0cnVjdGVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbXBvbmVudCBUYXJnZXQgY29tcG9uZW50XG4gICAgICovXG4gICAgcHVibGljIHNhdmVQZW5kaW5nQ29tcG9uZW50U3RhdGUoY29tcG9uZW50OiBTdGF0ZWZ1bENvbXBvbmVudEJhc2UpOiB2b2lkIHtcbiAgICAgICAgXy5hc3NpZ24odGhpcy5fbmV4dFN0YXRlLCBjb21wb25lbnQuc2F2ZVN0YXRlKGZhbHNlKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTG9hZHMgYW55IHBlbmRpbmcgc3RhdGUgZm9yIGEgc3BlY2lmaWVkIGNvbXBvbmVudC4gU3RhdGUgbWF5IGJlIHBlbmRpbmcgaWZcbiAgICAgKiBpdCBnZXRzIGxvYWRlZCBiZWZvcmUgdGhlIHRhcmdldCBjb21wb25lbnQgaGFzIGJlZW4gY29uc3RydWN0ZWQuIEluIHRoaXNcbiAgICAgKiBjYXNlIGl0IHdpbGwgZ2V0IGxvYWRlZCBhcyBzb29uIGFzIHRoZSB0YXJnZXQgY29tcG9uZW50IGdldHMgY29uc3RydWN0ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29tcG9uZW50IFRhcmdldCBjb21wb25lbnRcbiAgICAgKi9cbiAgICBwdWJsaWMgbG9hZFBlbmRpbmdDb21wb25lbnRTdGF0ZShjb21wb25lbnQ6IFN0YXRlZnVsQ29tcG9uZW50QmFzZSk6IHZvaWQge1xuICAgICAgICBjb25zdCBzdGF0ZSA9IHRoaXMuX25leHRTdGF0ZVtjb21wb25lbnQuZ2xvYmFsU3RhdGVJZF07XG4gICAgICAgIGlmICghc3RhdGUpIHJldHVybjtcblxuICAgICAgICBjb21wb25lbnQubG9hZFN0YXRlKHRoaXMuX25leHRTdGF0ZSwgZmFsc2UpO1xuICAgICAgICBkZWxldGUgdGhpcy5fbmV4dFN0YXRlW2NvbXBvbmVudC5nbG9iYWxTdGF0ZUlkXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTYXZlcyBhcHBsaWNhdGlvbiBzdGF0ZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm4gQXBwbGljYXRpb24gc3RhdGVcbiAgICAgKi9cbiAgICBwdWJsaWMgc2F2ZSgpOiBhbnkge1xuICAgICAgICBpZiAoXy5pc0VtcHR5KHRoaXMuX3RvcExldmVsQ29tcG9uZW50cykpIHJldHVybiBudWxsO1xuXG4gICAgICAgIGNvbnN0IHN0YXRlcyA9IF8ubWFwKHRoaXMuX3RvcExldmVsQ29tcG9uZW50cywgKGNvbXBvbmVudCkgPT4gY29tcG9uZW50LnNhdmVTdGF0ZSgpKTtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBfLm1lcmdlKHt9LCAuLi5zdGF0ZXMpO1xuXG4gICAgICAgIHN0YXRlWydfc3RvcmVzJ10gPSB0aGlzLl9zaGFyZWRTdG9yZU1hbmFnZXIuc2F2ZVN0YXRlKCk7XG4gICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb2FkcyBleGlzdGluZyBhcHBsaWNhdGlvbiBzdGF0ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzdGF0ZSBBcHBsaWNhdGlvbiBzdGF0ZVxuICAgICAqL1xuICAgIHB1YmxpYyBsb2FkKHN0YXRlOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fc2hhcmVkU3RvcmVNYW5hZ2VyLmxvYWRTdGF0ZShzdGF0ZVsnX3N0b3JlcyddIHx8IHt9KTtcbiAgICAgICAgZGVsZXRlIHN0YXRlWydfc3RvcmVzJ107XG4gICAgICAgIHRoaXMuX25leHRTdGF0ZSA9IHN0YXRlO1xuXG4gICAgICAgIF8uZWFjaCh0aGlzLl90b3BMZXZlbENvbXBvbmVudHMsIChjb21wb25lbnQpID0+IGNvbXBvbmVudC5sb2FkU3RhdGUodGhpcy5fbmV4dFN0YXRlKSk7XG4gICAgfVxufVxuXG5jb25zdCBhbmd1bGFyTW9kdWxlOiBhbmd1bGFyLklNb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgncmVzb2x3ZS5zZXJ2aWNlcy5zdGF0ZV9tYW5hZ2VyJywgW1xuICAgICdyZXNvbHdlLnNlcnZpY2VzLnNoYXJlZF9zdG9yZScsXG5dKTtcblxuLy8gUmVnaXN0ZXIgdGhlIHN0YXRlIG1hbmFnZXIgYXMgYSBzZXJ2aWNlLCBzbyBpdCBjYW4gYmUgdXNlZCBieSBjb21wb25lbnRzLlxuYW5ndWxhck1vZHVsZS5zZXJ2aWNlKCdzdGF0ZU1hbmFnZXInLCBTdGF0ZU1hbmFnZXIpO1xuIl19
