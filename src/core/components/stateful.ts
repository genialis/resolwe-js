import * as _ from 'lodash';
import * as angular from 'angular';

import {GenError} from '../errors/error';
import {SharedStore, SharedStoreManager} from '../shared_store/index';

import {ComponentBase, component, ComponentConfiguration, Subscription} from './base';
import {StateManager} from './manager';

export class StateItemMetadata {
    constructor(public propertyName: string, public shared: boolean) {
    }

    public getSharedStoreNameProperty(): string {
        return '_sharedStoreName_' + this.propertyName;
    }
}

export interface StateMetadata {
    [index: string]: StateItemMetadata;
}

interface SharedStoreSubscribeRequest {
    (): void;
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
@component({
    abstract: true,
    bindings: {
        stateId: '@stateId',
    },
})
export abstract class StatefulComponentBase extends ComponentBase {
    /// Metadata about the state defined on the component.
    public __stateMetadata: StateMetadata;
    /// This component's local state identifier.
    public stateId: string;
    /// This component's global state identifier.
    public globalStateId: string;
    /// Parent stateful component.
    private _parent: StatefulComponentBase = null;
    /// A list of child stateful components.
    private _children: StatefulComponentBase[] = [];
    /// State manager.
    private _stateManager: StateManager;
    /// Shared store manager.
    private _sharedStoreManager: SharedStoreManager;
    /// Subscription requests for shared stores.
    private _sharedStoreSubscribeRequests: SharedStoreSubscribeRequest[] = [];
    /// Subscriptions to shared stores.
    private _sharedStoreSubscriptions: Subscription[] = [];

    // @ngInject
    constructor($scope: angular.IScope, stateManager: StateManager) {
        super($scope);

        this._stateManager = stateManager;
        this._sharedStoreManager = stateManager.sharedStoreManager;
    }

    public onComponentInit() {
        super.onComponentInit();

        // When state identifier is not defined, default to directive name.
        if (_.isEmpty(this.stateId)) {
            this.stateId = this.getConfig().directive;
        }

        // Determine our parent and register ourselves with it.
        this._parent = this._findParentComponent();
        if (this._parent) {
            this._parent._registerChild(this);
            this.globalStateId = this._parent.globalStateId + '-' + this.stateId;
        } else {
            this._stateManager.addTopLevelComponent(this);
            this.globalStateId = this.stateId;
        }

        // Check if there is any pending state for us.
        this._stateManager.loadPendingComponentState(this);

        // Automatically load any configured shared state.
        const stateMetadata = this.__stateMetadata;
        _.forOwn(stateMetadata, (metadata) => {
            if (metadata.shared) {
                const sharedStoreName = this[metadata.getSharedStoreNameProperty()];
                if (!_.isEmpty(sharedStoreName)) {
                    const store = this._sharedStoreManager.getStore(sharedStoreName);
                    this[metadata.propertyName] = store;
                }

                this._setupSharedStore(metadata.propertyName);
            }
        });
    }

    /**
     * Sets up the shared store. This method may be overriden by subclasses when something
     * different should be done here.
     *
     * @param {store} Shared state
     */
    protected _setupSharedStore(store: string): void {
        // Subscribe to shared store, so that this component's scope gets updated when the
        // value in the store is updated.
        this.subscribeSharedState(store, _.noop);
    }

    /**
     * Returns the state manager.
     */
    public get stateManager(): StateManager {
        return this._stateManager;
    }

    /**
     * Returns the shared store manager.
     */
    protected get sharedStoreManager(): SharedStoreManager {
        return this._sharedStoreManager;
    }

    public onComponentDestroyed(): void {
        // Save current component state, so it will be available when this component
        // is instantiated again.
        this._stateManager.savePendingComponentState(this);

        if (this._parent) {
            this._parent._unregisterChild(this);
        } else {
            this._stateManager.removeTopLevelComponent(this);
        }

        super.onComponentDestroyed();
    }

    /**
     * This method will be called after the component's state has been loaded.
     */
    public onComponentStateAfterLoad(): void {
        // Do nothing by default.
    }

    /**
     * This method will be called before the component's state has been saved.
     */
    public onComponentStatePreSave(): void {
        // Do nothing by default.
    }

    /**
     * Discovers the parent stateful component.
     */
    private _findParentComponent(): StatefulComponentBase {
        let scope = this.$scope.$parent;
        while (scope) {
            if (scope['ctrl'] instanceof StatefulComponentBase) {
                return scope['ctrl'];
            }

            scope = scope.$parent;
        }

        return null;
    }

    /**
     * Registers a new child of this stateful component.
     *
     * @param {StatefulComponentBase} child Child component instance
     */
    private _registerChild(child: StatefulComponentBase) {
        // Ensure the child's local state id is unique.
        if (_.any(this._children, (c) => c.stateId === child.stateId)) {
            throw new GenError("Duplicate stateful component state identifier '" + child.stateId + "'.");
        }

        this._children.push(child);
    }

    /**
     * Unregisters an existing child of this stateful component.
     *
     * @param {StatefulComponentBase} child Child component instance
     */
    private _unregisterChild(child: StatefulComponentBase) {
        this._children = _.without(this._children, child);
    }

    /**
     * Returns the parent stateful component.
     */
    public parentComponent(): StatefulComponentBase {
        return this._parent;
    }

    /**
     * Returns a list of child stateful components.
     */
    public childComponents(): StatefulComponentBase[] {
        return _.clone(this._children);
    }

    /**
     * Finds a child component by its state identifier.
     *
     * @param {string} stateId Child's state identifier
     * @return {StatefulComponentBase} Child component instance
     */
    public getChildComponent<T extends StatefulComponentBase>(stateId: string): T {
        return <T> _.find(this._children, (child) => child.stateId === stateId);
    }

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
    public subscribeSharedState(name: string, callback: (value: any) => void): void {
        const storeMetadata = this._getStateMetadata(name);
        if (!storeMetadata || !storeMetadata.shared) {
            throw new GenError("Shared state '" + name + "' not found.");
        }

        const subscriber = () => {
            const store: SharedStore<any, any> = this[storeMetadata.propertyName];
            if (!store) {
                // @ifndef GENJS_PRODUCTION
                    throw new GenError(`Ignored missing store: ${storeMetadata.propertyName} ${this.globalStateId}`);
                // @endif
            }
            if (!store) return;
            this._sharedStoreSubscriptions.push(this.subscribe(callback, store.observable()));
        };

        this._sharedStoreSubscribeRequests.push(subscriber);
        subscriber();
    }

    /**
     * A version of [[subscribeSharedState]], which ensures that the observed shared
     * store value is copied and can thus be safely mutated afterwards.
     *
     * @param {string} name Name of shared state
     * @param callback Callback to be invoked on subscription
     */
    public subscribeSharedStateMutable<T>(name: string, callback: (value: T) => void): void {
        this.subscribeSharedState(name, (value) => callback(angular.copy(value)));
    }

    /**
     * Returns metadata for specific component state.
     *
     * @param {string} name Name of shared state (not property name)
     * @return {StateItemMetadata} State metadata
     */
    private _getStateMetadata(name: string): StateItemMetadata {
        return this.__stateMetadata[name];
    }

    /**
     * Saves this component's current state and returns it.
     */
    public saveState(saveChildren: boolean = true): any {
        this.onComponentStatePreSave();

        let result = {};
        let state = result[this.globalStateId] = {};
        _.forOwn(this.__stateMetadata, (metadata, key) => {
            let value = this[metadata.propertyName];

            if (metadata.shared) {
                // In case of shared state, save the identifier of the shared store.
                value = (<SharedStore<any, any>> value).storeId;
            }

            state[key] = value;
        });

        // Save child state.
        if (saveChildren) {
            for (const child of this._children) {
                _.extend(result, child.saveState());
            }
        }

        return result;
    }

    /**
     * Loads this component's current state.
     *
     * @param {any} globalState Global state
     */
    public loadState(globalState: any, loadChildren: boolean = true): void {
        const state = globalState[this.globalStateId];
        let sharedStateChanged = false;
        _.forOwn(this.__stateMetadata, (metadata, key) => {
            if (!(key in state)) return;

            const value = state[key];
            if (metadata.shared) {
                // Get the shared store from the shared store manager.
                const existingValue: SharedStore<any, any> = this[metadata.propertyName];
                if (existingValue.storeId !== value) {
                    this[metadata.propertyName] = this._sharedStoreManager.getStore<any>(value);
                    sharedStateChanged = true;
                }
            } else {
                this[metadata.propertyName] = value;
            }
        });

        // Load child state.
        if (loadChildren) {
            for (const child of this._children) {
                child.loadState(globalState);
            }
        }

        if (sharedStateChanged) {
            // Cancel any previous subscriptions to shared stores.
            for (const subscription of this._sharedStoreSubscriptions) {
                subscription.unsubscribe();
            }

            // Resubscribe, using the new stores.
            for (const request of this._sharedStoreSubscribeRequests) {
                request();
            }
        }

        this.onComponentStateAfterLoad();

        // Propagate state updates to the view.
        this.$scope.$applyAsync();
    }

    /**
     * Check if property has not been loaded from state, or isn't defined. Usually used
     * before setting a deferred default value.
     */
    public isPropertyNotLoadedFromStateOrIsUndefined<P extends keyof this>(property: P) {
        return _.isUndefined(this[property]);
    }

    public static configureComponent(config: ComponentConfiguration): ComponentConfiguration {
        const stateMetadata = this.prototype.__stateMetadata;
        if (!config.bindings) config.bindings = {};

        _.forOwn(stateMetadata, (metadata, key) => {
            if (metadata.shared) {
                config.bindings[metadata.getSharedStoreNameProperty()] = '@store' + _.capitalize(key);
            }
        });
        return config;
    }
}

/**
 * Marks a property as being part of the component's state.
 *
 * @param {string} name Optional state name
 * @param {boolean} shared Does this state reference a shared store
 */
export function state(name?: string, shared: boolean = false) {
    return (target: StatefulComponentBase, propertyKey: string) => {
        if (!name) name = propertyKey;

        if (name[0] === '_') {
            throw new GenError("State identifiers starting with an underscore are reserved.");
        }

        if (!target.__stateMetadata) {
            target.__stateMetadata = {};
        }

        if (target.__stateMetadata[name]) {
            throw new GenError("Duplicate state identifier '" + name + "' on stateful component '" + target + "'.");
        }
        target.__stateMetadata[name] = new StateItemMetadata(propertyKey, shared);
    };
}

/**
 * Marks a property as being part of the component's state, which references
 * a shared store.
 *
 * @param {string} name Optional state name
 */
export function sharedState(name?: string) {
    return state(name, true);
}
