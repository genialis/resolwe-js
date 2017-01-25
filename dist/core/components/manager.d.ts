import { StatefulComponentBase } from './stateful';
import { SharedStoreManager } from '../shared_store/index';
/**
 * Manager of all stateful components' state.
 */
export declare class StateManager {
    private _sharedStoreManager;
    private _topLevelComponents;
    private _nextState;
    constructor(sharedStoreManager: SharedStoreManager);
    /**
     * Returns the shared store manager.
     */
    readonly sharedStoreManager: SharedStoreManager;
    /**
     * Adds a top-level component.
     *
     * @param component Top-level component instance
     */
    addTopLevelComponent(component: StatefulComponentBase): void;
    /**
     * Removes a top-level component.
     *
     * @param component Top-level component instance
     */
    removeTopLevelComponent(component: StatefulComponentBase): void;
    /**
     * Returns the current top-level component.
     */
    topLevelComponents(): StatefulComponentBase[];
    /**
     * Saves a component's current state so it will be reloaded when the component
     * is next constructed.
     *
     * @param component Target component
     */
    savePendingComponentState(component: StatefulComponentBase): void;
    /**
     * Loads any pending state for a specified component. State may be pending if
     * it gets loaded before the target component has been constructed. In this
     * case it will get loaded as soon as the target component gets constructed.
     *
     * @param component Target component
     */
    loadPendingComponentState(component: StatefulComponentBase): void;
    /**
     * Saves application state.
     *
     * @return Application state
     */
    save(): any;
    /**
     * Loads existing application state.
     *
     * @param state Application state
     */
    load(state: any): void;
}
