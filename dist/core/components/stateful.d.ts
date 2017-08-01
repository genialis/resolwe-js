/// <reference types="angular" />
import * as angular from 'angular';
import { ComponentBase, ComponentConfiguration } from './base';
import { SharedStoreManager } from '../shared_store/index';
import { StateManager } from './manager';
export declare class StateItemMetadata {
    propertyName: string;
    shared: boolean;
    constructor(propertyName: string, shared: boolean);
    getSharedStoreNameProperty(): string;
}
export interface StateMetadata {
    [index: string]: StateItemMetadata;
}
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
export declare abstract class StatefulComponentBase extends ComponentBase {
    __stateMetadata: StateMetadata;
    stateId: string;
    globalStateId: string;
    private _parent;
    private _children;
    private _stateManager;
    private _sharedStoreManager;
    private _sharedStoreSubscribeRequests;
    private _sharedStoreSubscriptions;
    constructor($scope: angular.IScope, stateManager: StateManager);
    onComponentInit(): void;
    /**
     * Sets up the shared store. This method may be overriden by subclasses when something
     * different should be done here.
     *
     * @param {store} Shared state
     */
    protected _setupSharedStore(store: string): void;
    /**
     * Returns the state manager.
     */
    readonly stateManager: StateManager;
    /**
     * Returns the shared store manager.
     */
    protected readonly sharedStoreManager: SharedStoreManager;
    onComponentDestroyed(): void;
    /**
     * This method will be called after the component's state has been loaded.
     */
    onComponentStateAfterLoad(): void;
    /**
     * This method will be called before the component's state has been saved.
     */
    onComponentStatePreSave(): void;
    /**
     * Discovers the parent stateful component.
     */
    private _findParentComponent();
    /**
     * Registers a new child of this stateful component.
     *
     * @param {StatefulComponentBase} child Child component instance
     */
    private _registerChild(child);
    /**
     * Unregisters an existing child of this stateful component.
     *
     * @param {StatefulComponentBase} child Child component instance
     */
    private _unregisterChild(child);
    /**
     * Returns the parent stateful component.
     */
    parentComponent(): StatefulComponentBase;
    /**
     * Returns a list of child stateful components.
     */
    childComponents(): StatefulComponentBase[];
    /**
     * Finds a child component by its state identifier.
     *
     * @param {string} stateId Child's state identifier
     * @return {StatefulComponentBase} Child component instance
     */
    getChildComponent<T extends StatefulComponentBase>(stateId: string): T;
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
    subscribeSharedState(name: string, callback: (value: any) => void): void;
    /**
     * A version of [[subscribeSharedState]], which ensures that the observed shared
     * store value is copied and can thus be safely mutated afterwards.
     *
     * @param {string} name Name of shared state
     * @param callback Callback to be invoked on subscription
     */
    subscribeSharedStateMutable<T>(name: string, callback: (value: T) => void): void;
    /**
     * Returns metadata for specific component state.
     *
     * @param {string} name Name of shared state (not property name)
     * @return {StateItemMetadata} State metadata
     */
    private _getStateMetadata(name);
    /**
     * Saves this component's current state and returns it.
     */
    saveState(saveChildren?: boolean): any;
    /**
     * Loads this component's current state.
     *
     * @param {any} globalState Global state
     */
    loadState(globalState: any, loadChildren?: boolean): void;
    static configureComponent(config: ComponentConfiguration): ComponentConfiguration;
}
/**
 * Marks a property as being part of the component's state.
 *
 * @param {string} name Optional state name
 * @param {boolean} shared Does this state reference a shared store
 */
export declare function state(name?: string, shared?: boolean): (target: StatefulComponentBase, propertyKey: string) => void;
/**
 * Marks a property as being part of the component's state, which references
 * a shared store.
 *
 * @param {string} name Optional state name
 */
export declare function sharedState(name?: string): (target: StatefulComponentBase, propertyKey: string) => void;
