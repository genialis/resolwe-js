import * as _ from 'lodash';
import * as angular from 'angular';

import {StatefulComponentBase} from './stateful';
import {SharedStoreManager} from '../shared_store/index';

/**
 * Manager of all stateful components' state.
 */
export class StateManager {
    private _sharedStoreManager: SharedStoreManager;
    private _topLevelComponent: StatefulComponentBase = null;

    private _nextState: any = {};

    // @ngInject
    constructor(sharedStoreManager: SharedStoreManager) {
        this._sharedStoreManager = sharedStoreManager;
    }

    /**
     * Returns the shared store manager.
     */
    public get sharedStoreManager(): SharedStoreManager {
        return this._sharedStoreManager;
    }

    /**
     * Sets the top-level component.
     *
     * @param component Top-level component instance
     */
    public setTopLevelComponent(component: StatefulComponentBase) {
        this._topLevelComponent = component;
    }

    /**
     * Returns the current top-level component.
     */
    public topLevelComponent(): StatefulComponentBase {
        return this._topLevelComponent;
    }

    /**
     * Saves a component's current state so it will be reloaded when the component
     * is next constructed.
     *
     * @param component Target component
     */
    public savePendingComponentState(component: StatefulComponentBase): void {
        _.assign(this._nextState, component.saveState(false));
    }

    /**
     * Loads any pending state for a specified component. State may be pending if
     * it gets loaded before the target component has been constructed. In this
     * case it will get loaded as soon as the target component gets constructed.
     *
     * @param component Target component
     */
    public loadPendingComponentState(component: StatefulComponentBase): void {
        const state = this._nextState[component.globalStateId];
        if (!state) return;

        component.loadState(this._nextState, false);
        delete this._nextState[component.globalStateId];
    }

    /**
     * Saves application state.
     *
     * @return Application state
     */
    public save(): any {
        if (!this._topLevelComponent) return null;

        const state = this._topLevelComponent.saveState();
        state['_stores'] = this._sharedStoreManager.saveState();
        return state;
    }

    /**
     * Loads existing application state.
     *
     * @param state Application state
     */
    public load(state: any): void {
        this._sharedStoreManager.loadState(state['_stores'] || {});
        delete state['_stores'];
        this._nextState = state;

        if (this._topLevelComponent) {
            this._topLevelComponent.loadState(this._nextState);
        }
    }
}

const angularModule: angular.IModule = angular.module('resolwe.services.state_manager', [
    'resolwe.services.shared_store',
]);

// Register the state manager as a service, so it can be used by components.
angularModule.service('stateManager', StateManager);
