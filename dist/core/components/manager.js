"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var angular = require("angular");
/**
 * Manager of all stateful components' state.
 */
var StateManager = /** @class */ (function () {
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2NvbXBvbmVudHMvbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDBCQUE0QjtBQUM1QixpQ0FBbUM7QUFLbkM7O0dBRUc7QUFDSDtJQU1JLFlBQVk7SUFDWixzQkFBWSxrQkFBc0M7UUFMMUMsd0JBQW1CLEdBQTRCLEVBQUUsQ0FBQztRQUVsRCxlQUFVLEdBQVEsRUFBRSxDQUFDO1FBSXpCLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxrQkFBa0IsQ0FBQztJQUNsRCxDQUFDO0lBS0Qsc0JBQVcsNENBQWtCO1FBSDdCOztXQUVHO2FBQ0g7WUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDO1FBQ3BDLENBQUM7OztPQUFBO0lBRUQ7Ozs7T0FJRztJQUNJLDJDQUFvQixHQUEzQixVQUE0QixTQUFnQztRQUN4RCxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFRDs7OztPQUlHO0lBQ0ksOENBQXVCLEdBQTlCLFVBQStCLFNBQWdDO1FBQzNELENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFFRDs7T0FFRztJQUNJLHlDQUFrQixHQUF6QjtRQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUM7SUFDcEMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ksZ0RBQXlCLEdBQWhDLFVBQWlDLFNBQWdDO1FBQzdELENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDMUQsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNJLGdEQUF5QixHQUFoQyxVQUFpQyxTQUFnQztRQUM3RCxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUN2RCxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUFDLE1BQU0sQ0FBQztRQUVuQixTQUFTLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDNUMsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNJLDJCQUFJLEdBQVg7UUFDSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztRQUVyRCxJQUFNLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxVQUFDLFNBQVMsSUFBSyxPQUFBLFNBQVMsQ0FBQyxTQUFTLEVBQUUsRUFBckIsQ0FBcUIsQ0FBQyxDQUFDO1FBQ3JGLElBQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLE9BQVAsQ0FBQyxHQUFPLEVBQUUsU0FBSyxNQUFNLEVBQUMsQ0FBQztRQUVyQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ3hELE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSwyQkFBSSxHQUFYLFVBQVksS0FBVTtRQUF0QixpQkFNQztRQUxHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzNELE9BQU8sS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3hCLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO1FBRXhCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLFVBQUMsU0FBUyxJQUFLLE9BQUEsU0FBUyxDQUFDLFNBQVMsQ0FBQyxLQUFJLENBQUMsVUFBVSxDQUFDLEVBQXBDLENBQW9DLENBQUMsQ0FBQztJQUMxRixDQUFDO0lBQ0wsbUJBQUM7QUFBRCxDQS9GQSxBQStGQyxJQUFBO0FBL0ZZLG9DQUFZO0FBaUd6QixJQUFNLGFBQWEsR0FBb0IsT0FBTyxDQUFDLE1BQU0sQ0FBQyxnQ0FBZ0MsRUFBRTtJQUNwRiwrQkFBK0I7Q0FDbEMsQ0FBQyxDQUFDO0FBRUgsNEVBQTRFO0FBQzVFLGFBQWEsQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLFlBQVksQ0FBQyxDQUFDIiwiZmlsZSI6ImNvcmUvY29tcG9uZW50cy9tYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgYW5ndWxhciBmcm9tICdhbmd1bGFyJztcblxuaW1wb3J0IHtTdGF0ZWZ1bENvbXBvbmVudEJhc2V9IGZyb20gJy4vc3RhdGVmdWwnO1xuaW1wb3J0IHtTaGFyZWRTdG9yZU1hbmFnZXJ9IGZyb20gJy4uL3NoYXJlZF9zdG9yZS9pbmRleCc7XG5cbi8qKlxuICogTWFuYWdlciBvZiBhbGwgc3RhdGVmdWwgY29tcG9uZW50cycgc3RhdGUuXG4gKi9cbmV4cG9ydCBjbGFzcyBTdGF0ZU1hbmFnZXIge1xuICAgIHByaXZhdGUgX3NoYXJlZFN0b3JlTWFuYWdlcjogU2hhcmVkU3RvcmVNYW5hZ2VyO1xuICAgIHByaXZhdGUgX3RvcExldmVsQ29tcG9uZW50czogU3RhdGVmdWxDb21wb25lbnRCYXNlW10gPSBbXTtcblxuICAgIHByaXZhdGUgX25leHRTdGF0ZTogYW55ID0ge307XG5cbiAgICAvLyBAbmdJbmplY3RcbiAgICBjb25zdHJ1Y3RvcihzaGFyZWRTdG9yZU1hbmFnZXI6IFNoYXJlZFN0b3JlTWFuYWdlcikge1xuICAgICAgICB0aGlzLl9zaGFyZWRTdG9yZU1hbmFnZXIgPSBzaGFyZWRTdG9yZU1hbmFnZXI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgc2hhcmVkIHN0b3JlIG1hbmFnZXIuXG4gICAgICovXG4gICAgcHVibGljIGdldCBzaGFyZWRTdG9yZU1hbmFnZXIoKTogU2hhcmVkU3RvcmVNYW5hZ2VyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NoYXJlZFN0b3JlTWFuYWdlcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgdG9wLWxldmVsIGNvbXBvbmVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb21wb25lbnQgVG9wLWxldmVsIGNvbXBvbmVudCBpbnN0YW5jZVxuICAgICAqL1xuICAgIHB1YmxpYyBhZGRUb3BMZXZlbENvbXBvbmVudChjb21wb25lbnQ6IFN0YXRlZnVsQ29tcG9uZW50QmFzZSk6IHZvaWQge1xuICAgICAgICB0aGlzLl90b3BMZXZlbENvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgYSB0b3AtbGV2ZWwgY29tcG9uZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbXBvbmVudCBUb3AtbGV2ZWwgY29tcG9uZW50IGluc3RhbmNlXG4gICAgICovXG4gICAgcHVibGljIHJlbW92ZVRvcExldmVsQ29tcG9uZW50KGNvbXBvbmVudDogU3RhdGVmdWxDb21wb25lbnRCYXNlKTogdm9pZCB7XG4gICAgICAgIF8ucmVtb3ZlKHRoaXMuX3RvcExldmVsQ29tcG9uZW50cywgY29tcG9uZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IHRvcC1sZXZlbCBjb21wb25lbnQuXG4gICAgICovXG4gICAgcHVibGljIHRvcExldmVsQ29tcG9uZW50cygpOiBTdGF0ZWZ1bENvbXBvbmVudEJhc2VbXSB7XG4gICAgICAgIHJldHVybiB0aGlzLl90b3BMZXZlbENvbXBvbmVudHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2F2ZXMgYSBjb21wb25lbnQncyBjdXJyZW50IHN0YXRlIHNvIGl0IHdpbGwgYmUgcmVsb2FkZWQgd2hlbiB0aGUgY29tcG9uZW50XG4gICAgICogaXMgbmV4dCBjb25zdHJ1Y3RlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb21wb25lbnQgVGFyZ2V0IGNvbXBvbmVudFxuICAgICAqL1xuICAgIHB1YmxpYyBzYXZlUGVuZGluZ0NvbXBvbmVudFN0YXRlKGNvbXBvbmVudDogU3RhdGVmdWxDb21wb25lbnRCYXNlKTogdm9pZCB7XG4gICAgICAgIF8uYXNzaWduKHRoaXMuX25leHRTdGF0ZSwgY29tcG9uZW50LnNhdmVTdGF0ZShmYWxzZSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExvYWRzIGFueSBwZW5kaW5nIHN0YXRlIGZvciBhIHNwZWNpZmllZCBjb21wb25lbnQuIFN0YXRlIG1heSBiZSBwZW5kaW5nIGlmXG4gICAgICogaXQgZ2V0cyBsb2FkZWQgYmVmb3JlIHRoZSB0YXJnZXQgY29tcG9uZW50IGhhcyBiZWVuIGNvbnN0cnVjdGVkLiBJbiB0aGlzXG4gICAgICogY2FzZSBpdCB3aWxsIGdldCBsb2FkZWQgYXMgc29vbiBhcyB0aGUgdGFyZ2V0IGNvbXBvbmVudCBnZXRzIGNvbnN0cnVjdGVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbXBvbmVudCBUYXJnZXQgY29tcG9uZW50XG4gICAgICovXG4gICAgcHVibGljIGxvYWRQZW5kaW5nQ29tcG9uZW50U3RhdGUoY29tcG9uZW50OiBTdGF0ZWZ1bENvbXBvbmVudEJhc2UpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSB0aGlzLl9uZXh0U3RhdGVbY29tcG9uZW50Lmdsb2JhbFN0YXRlSWRdO1xuICAgICAgICBpZiAoIXN0YXRlKSByZXR1cm47XG5cbiAgICAgICAgY29tcG9uZW50LmxvYWRTdGF0ZSh0aGlzLl9uZXh0U3RhdGUsIGZhbHNlKTtcbiAgICAgICAgZGVsZXRlIHRoaXMuX25leHRTdGF0ZVtjb21wb25lbnQuZ2xvYmFsU3RhdGVJZF07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2F2ZXMgYXBwbGljYXRpb24gc3RhdGUuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIEFwcGxpY2F0aW9uIHN0YXRlXG4gICAgICovXG4gICAgcHVibGljIHNhdmUoKTogYW55IHtcbiAgICAgICAgaWYgKF8uaXNFbXB0eSh0aGlzLl90b3BMZXZlbENvbXBvbmVudHMpKSByZXR1cm4gbnVsbDtcblxuICAgICAgICBjb25zdCBzdGF0ZXMgPSBfLm1hcCh0aGlzLl90b3BMZXZlbENvbXBvbmVudHMsIChjb21wb25lbnQpID0+IGNvbXBvbmVudC5zYXZlU3RhdGUoKSk7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gXy5tZXJnZSh7fSwgLi4uc3RhdGVzKTtcblxuICAgICAgICBzdGF0ZVsnX3N0b3JlcyddID0gdGhpcy5fc2hhcmVkU3RvcmVNYW5hZ2VyLnNhdmVTdGF0ZSgpO1xuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTG9hZHMgZXhpc3RpbmcgYXBwbGljYXRpb24gc3RhdGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc3RhdGUgQXBwbGljYXRpb24gc3RhdGVcbiAgICAgKi9cbiAgICBwdWJsaWMgbG9hZChzdGF0ZTogYW55KTogdm9pZCB7XG4gICAgICAgIHRoaXMuX3NoYXJlZFN0b3JlTWFuYWdlci5sb2FkU3RhdGUoc3RhdGVbJ19zdG9yZXMnXSB8fCB7fSk7XG4gICAgICAgIGRlbGV0ZSBzdGF0ZVsnX3N0b3JlcyddO1xuICAgICAgICB0aGlzLl9uZXh0U3RhdGUgPSBzdGF0ZTtcblxuICAgICAgICBfLmVhY2godGhpcy5fdG9wTGV2ZWxDb21wb25lbnRzLCAoY29tcG9uZW50KSA9PiBjb21wb25lbnQubG9hZFN0YXRlKHRoaXMuX25leHRTdGF0ZSkpO1xuICAgIH1cbn1cblxuY29uc3QgYW5ndWxhck1vZHVsZTogYW5ndWxhci5JTW9kdWxlID0gYW5ndWxhci5tb2R1bGUoJ3Jlc29sd2Uuc2VydmljZXMuc3RhdGVfbWFuYWdlcicsIFtcbiAgICAncmVzb2x3ZS5zZXJ2aWNlcy5zaGFyZWRfc3RvcmUnLFxuXSk7XG5cbi8vIFJlZ2lzdGVyIHRoZSBzdGF0ZSBtYW5hZ2VyIGFzIGEgc2VydmljZSwgc28gaXQgY2FuIGJlIHVzZWQgYnkgY29tcG9uZW50cy5cbmFuZ3VsYXJNb2R1bGUuc2VydmljZSgnc3RhdGVNYW5hZ2VyJywgU3RhdGVNYW5hZ2VyKTtcbiJdfQ==
