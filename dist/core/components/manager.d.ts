import { StatefulComponentBase } from './stateful';
import { SharedStoreManager } from '../shared_store/index';
/**
 * Manager of all stateful components' state.
 */
export declare class StateManager {
    private _sharedStoreManager;
    private _topLevelComponent;
    private _nextState;
    constructor(sharedStoreManager: SharedStoreManager);
    /**
     * Returns the shared store manager.
     */
    readonly sharedStoreManager: SharedStoreManager;
    /**
     * Sets the top-level component.
     *
     * @param component Top-level component instance
     */
    setTopLevelComponent(component: StatefulComponentBase): void;
    /**
     * Returns the current top-level component.
     */
    topLevelComponent(): StatefulComponentBase;
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
