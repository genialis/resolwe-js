import * as _ from 'lodash';
import * as angular from 'angular';

import {StatefulComponentBase} from './stateful';
import {SharedStoreManager} from '../shared_store/index';
import {makeSafelySerializable, parseSafelySerializable, verboseSerialize, SerializationError} from '../utils/serialization';

/**
 * Manager of all stateful components' state.
 */
export class StateManager {
    private _sharedStoreManager: SharedStoreManager;
    private _topLevelComponents: StatefulComponentBase[] = [];

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
     * Adds a top-level component.
     *
     * @param component Top-level component instance
     */
    public addTopLevelComponent(component: StatefulComponentBase): void {
        this._topLevelComponents.push(component);
    }

    /**
     * Removes a top-level component.
     *
     * @param component Top-level component instance
     */
    public removeTopLevelComponent(component: StatefulComponentBase): void {
        _.remove(this._topLevelComponents, component);
    }

    /**
     * Returns the current top-level component.
     */
    public topLevelComponents(): StatefulComponentBase[] {
        return this._topLevelComponents;
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
     * Returns application state by combining component.saveState of all
     * components and shared stores.
     *
     * When to use:
     *   - saving state into memory (non-serialized), e.g. like components do
     *     when they are destroyed
     *   - when you just need to collect components' saveState
     *   - if you need to store functions in state
     * When not to use:
     *   - when saving state into a serialized form; use [[saveSerializableState]].
     */
    public save(): any {
        if (_.isEmpty(this._topLevelComponents)) return null;

        const states = _.map(this._topLevelComponents, (component) => component.saveState());
        // Note: _.merge loses undefined values. `_.merge({}, {a:undefined}, {b:4})` returns {b:4}.
        const state = _.assign({}, ...states);

        state['_stores'] = this._sharedStoreManager.saveState();

        // Safeguard against incorrect usage of JSON.stringify.
        state['toJSON'] = function (this: any) {
            console.error(`stateManager.save() is not serializable. Use stateManager.saveSerializableState() when you want to stringify
                state (and loadSerializableState after parse).`);
            return this;
        };
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

        _.each(this._topLevelComponents, (component) => component.loadState(this._nextState));
    }

    /**
     * Saves this component's current state and returns it in a format that is
     * safe to serialize. Values `undefined`, `NaN`, and `Infinity` are kept
     * when stringified with JSON.stringify.
     *
     * When to use:
     *   - saving state into serialized forms, e.g. before transferring to backend
     * When not to use:
     *   - to store functions
     */
    public saveSerializableState(): any {
        const state = this.save();
        if (!_.isNull(state)) {
            delete state['toJSON']; // Remove safeguard.
        }

        try {
            return makeSafelySerializable(state);
        } catch (e) {
            if (e instanceof SerializationError) {
                throw new SerializationError(`Error saving state. ${e.message} ${e.serializedValue}`, verboseSerialize(state));
            } else {
                throw e;
            }
        }
    }

    public loadSerializableState(serializableState: any): void {
        const state = parseSafelySerializable(serializableState);
        return this.load(state);
    }

}

const angularModule: angular.IModule = angular.module('resolwe.services.state_manager', [
    'resolwe.services.shared_store',
]);

// Register the state manager as a service, so it can be used by components.
angularModule.service('stateManager', StateManager);
