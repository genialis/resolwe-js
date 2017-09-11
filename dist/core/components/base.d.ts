/// <reference types="angular" />
/// <reference types="lodash" />
import * as angular from 'angular';
import * as _ from 'lodash';
import * as Rx from 'rx';
/**
 * Component configuration. Directive name should be in dash-case.
 */
export interface ComponentConfiguration {
    abstract?: boolean;
    module?: angular.IModule;
    directive?: string;
    bindings?: _.Dictionary<string>;
    controllerAs?: string;
    templateUrl?: string;
    template?: string;
    require?: string | string[];
}
export interface ComponentViewOptions {
    inputs?: Object;
    parent?: ComponentBase;
    attributes?: Object;
    extendWith?: Object;
}
export interface ComputationFunction {
    (computation: Computation): void;
}
export interface Subscription {
    unsubscribe(): void;
}
export interface SubscribeComponentOptions {
    oneShot?: boolean;
    onError?: (exception: any) => void;
    ignoreReady?: boolean;
}
/**
 * Abstraction of a computation with dependencies to observables.
 */
export declare class Computation {
    component: ComponentBase;
    content: ComputationFunction;
    private _subscriptions;
    private _pendingSubscriptions;
    private _dispose;
    private _done;
    /**
     * Constructs a new computation.
     *
     * @param component Owning component
     * @param content Computation content
     */
    constructor(component: ComponentBase, content: ComputationFunction);
    /**
     * Return true if this computation has finished.
     */
    isDone(): boolean;
    /**
     * Sets an alternative dispose callback for this computation. This callback
     * is invoked when [[unsubscribe]] is called.
     */
    setDisposeCallback(callback: () => void): void;
    /**
     * Subscribes to an observable, registering the subscription as a dependency
     * of this component. The subscription is automatically stopped when the
     * component is destroyed.
     *
     * For the target argument, you can either specify a string, in which case
     * it represents the name of the component member variable that will be
     * populated with the result ite. Or you can specify a function with one
     * argument, which will be called when query results change and can do
     * anything.
     *
     * @param target Target component member atribute name or callback
     * @param observable Observable or promise to subscribe to
     * @return Underlying subscription disposable
     */
    subscribe<T>(target: string | ((data: T) => any), observable: Rx.Observable<T> | Promise<any>, options?: SubscribeComponentOptions): Rx.IDisposable;
    /**
     * Returns true if all subscriptions created by calling `subscribe` are ready.
     * A subscription is ready when it has received its first batch of data after
     * subscribing.
     */
    subscriptionsReady(): boolean;
    /**
     * Runs the computation.
     */
    compute(): void;
    /**
     * Disposes of all registered subscriptions.
     */
    stop(): void;
    /**
     * Stops all subscriptions currently registered in this computation and removes
     * this computation from the parent component. If a dispose handler has been
     * configured, it is invoked.
     */
    unsubscribe(): void;
}
export interface WatchExpressionOf<T> {
    (): T;
}
export declare type WatchExpression = WatchExpressionOf<{}>;
/**
 * An abstract base class for all components.
 */
export declare abstract class ComponentBase {
    $scope: angular.IScope;
    static __componentConfig: ComponentConfiguration;
    private _computations;
    private _ready;
    constructor($scope: angular.IScope);
    /**
     * This method will be called after the whole chain of constructors is executed,
     * via angular component $onInit. Use it if you have an abstract component that
     * manipulates class properties and, as a result, needs to wait for all child
     * class properties to be assigned and constructors to finish. (Class properties
     * defined in child components are assigned before child's constructor).
     *
     * Value of `$compileProvider.preAssignBindingsEnabled` (false by default since angular 1.6.0)
     * determines if bindings are to be present in `onComponentInit` method (false) or pre-assigned
     * in constructor (true).
     *
     * Order of execution:
     * ```ts
     * class Child extends Middle {
     *     public propertyA = 'c'    // 5
     *     constructor() { super() } // 6
     * }
     * class Middle extends Abstract {
     *     public propertyB = 'b'    // 3
     *     constructor() { super() } // 4
     * }
     * class Abstract {
     *     public propertyA = 'a'    // 1
     *     constructor() {}          // 2
     *     onComponentInit() {}    // 7
     * }
     * ```
     */
    onComponentInit(...args: any[]): void;
    /**
     * Destroys the component.
     */
    destroy(): void;
    /**
     * This method will be called in the compile phase of the directive and may
     * be overriden by component implementations.
     */
    static onComponentCompile(element: angular.IAugmentedJQuery, attributes: angular.IAttributes): void;
    /**
     * @internal
     */
    _onComponentLink(scope: angular.IScope, element: angular.IAugmentedJQuery, attributes: angular.IAttributes, ...args: any[]): void;
    /**
     * This method will be called in the post-link phase of the directive and may
     * be overriden by component implementations.
     */
    onComponentLink(scope: angular.IScope, element: angular.IAugmentedJQuery, attributes: angular.IAttributes, ...args: any[]): void;
    /**
     * This method will be called after the component scope has been destroyed.
     */
    onComponentDestroyed(): void;
    /**
     * Returns true if the component has been created.
     */
    isReady(): boolean;
    /**
     * Returns true if all subscriptions created by calling `subscribe` are ready.
     * A subscription is ready when it has received its first batch of data after
     * subscribing.
     */
    subscriptionsReady(): boolean;
    private _createComputation(content?);
    /**
     * Watch component scope and run a computation on changes. The computation is
     * executed once immediately prior to watching.
     *
     * Returned computation instance may be used to stop the watch by calling its
     * [[Computation.unsubscribe]] method.
     *
     * @param context Function which returns the context to watch
     * @param content Function to run on changes
     * @param objectEquality Should `angular.equals` be used for comparisons
     * @returns Computation instance
     */
    watch(context: WatchExpression | WatchExpression[], content: ComputationFunction, objectEquality?: boolean): Computation;
    /**
     * Watch component scope and run a computation on changes. This version uses Angular's
     * collection watch. The computation is executed once immediately prior to watching.
     *
     * Returned computation instance may be used to stop the watch by calling its
     * [[Computation.unsubscribe]] method.
     *
     * @param context Function which returns the context to watch
     * @param content Function to run on changes
     * @returns Computation instance
     */
    watchCollection(context: WatchExpression, content: ComputationFunction): Computation;
    /**
     * Subscribes to an observable, registering the subscription as a dependency
     * of this component. The subscription is automatically stopped when the
     * component is destroyed.
     *
     * For the target argument, you can either specify a string, in which case
     * it represents the name of the component member variable that will be
     * populated with the result ite. Or you can specify a function with one
     * argument, which will be called when query results change and can do
     * anything.
     *
     * @param target Target component member atribute name or callback
     * @param observable Observable to subscribe to
     * @return Underlying subscription
     */
    subscribe<T>(target: string | ((data: T) => any), observable: Rx.Observable<T> | Promise<any>, options?: SubscribeComponentOptions): Subscription;
    /**
     * Unsubscribes the given computation from this component.
     *
     * @param computation Computation instance
     */
    unsubscribe(computation: Computation): void;
    /**
     * Helper function to create a wrapper observable around watch.
     *
     * @param context Function which returns the context to watch
     * @param objectEquality Should `angular.equals` be used for comparisons
     * @returns Watch observable
     */
    createWatchObservable<T>(context: WatchExpressionOf<T>, objectEquality?: boolean): Rx.Observable<T>;
    /**
     * Returns component configuration.
     */
    static getConfig(): ComponentConfiguration;
    /**
     * Returns component configuration.
     */
    getConfig(): ComponentConfiguration;
    /**
     * Returns true if the component has a specified attribute configured as
     * a binding.
     *
     * @param name Name of the bound attribute
     */
    static hasBinding(name: string): boolean;
    /**
     * Returns a view configuration that renders this component. This method can be
     * used when configuring the Angular UI router as follows:
     *
     *     $stateProvider.state('foo', {
     *         url: '/foo',
     *         views: { application: MyComponent.asView() },
     *     });
     */
    static asView(options?: ComponentViewOptions): any;
    /**
     * Performs any modifications of the component configuration. This method is
     * invoked during component class decoration and may arbitrarily modify the
     * passed component configuration, before the component is registered with
     * Angular.
     *
     * @param config Component configuration
     * @return Modified component configuration
     */
    static configureComponent(config: ComponentConfiguration): ComponentConfiguration;
}
/**
 * A decorator that transforms the decorated class into an AngularJS
 * component directive with proper dependency injection.
 */
export declare function component(config: ComponentConfiguration): ClassDecorator;
/**
 * A decorator that transforms the decorated class into an AngularJS
 * attribute directive with proper dependency injection.
 */
export declare function directive(config: ComponentConfiguration): ClassDecorator;
