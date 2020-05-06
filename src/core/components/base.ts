import * as angular from 'angular';
import * as _ from 'lodash';
import * as Rx from 'rx';

import {isPromiseLike} from '../utils/lang';
import {GenError} from '../errors/error';

enum DirectiveType {
    COMPONENT,
    ATTRIBUTE,
}

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
    transclude?: boolean | {[slot: string]: string};
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

    // Set this to true to make the subscription be ignored when determining
    // whether the component is done waiting for subscriptions.
    ignoreReady?: boolean;
}

type SubscriptionGuard = {};

function safeCallbackApply($scope: angular.IScope, callback: () => void): void {
    if ((<any> $scope).$$destroyed) {
        return;
    }

    callback();
    $scope.$evalAsync();
}

function safeApply<T>(observable: Rx.Observable<T>, scope: angular.IScope, callback: (data: T) => void) {
    callback = angular.isFunction(callback) ? callback : _.noop;

    return observable.takeWhile(() => {
        return !scope['$$destroyed'];
    }).tap((data) => {
        safeCallbackApply(scope, () => { callback(data); });
    });
}

/**
 * Abstraction of a computation with dependencies to observables.
 */
export class Computation {
    private _subscriptions: Rx.Disposable[];
    private _pendingSubscriptions: SubscriptionGuard[];
    private _dispose: () => void;
    private _done: boolean;

    /**
     * Constructs a new computation.
     *
     * @param component Owning component
     * @param content Computation content
     */
    constructor(public component: ComponentBase, public content: ComputationFunction) { // tslint:disable-line:no-shadowed-variable
        this._subscriptions = [];
        this._pendingSubscriptions = [];
        this._dispose = () => { /* Do nothing by default. */ };
        this._done = false;
    }

    /**
     * Return true if this computation has finished.
     */
    public isDone(): boolean {
        return this._done;
    }

    /**
     * Sets an alternative dispose callback for this computation. This callback
     * is invoked when [[unsubscribe]] is called.
     */
    public setDisposeCallback(callback: () => void) {
        this._dispose = callback;
    }

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
    public subscribe<T>(target: string | ((data: T) => any),
                        observable: Rx.Observable<T> | Promise<any> | angular.IPromise<any>,
                        options: SubscribeComponentOptions = {}) {
        // Create a guard object that can be removed when a subscription is done. We need
        // to use guard objects instead of a simple reference counter because the pending
        // subscriptions array may be cleared while callbacks are still outstanding.
        const guard = new Object();
        if (!options.ignoreReady) {
            this._pendingSubscriptions.push(guard);
        }

        let convertedObservable: Rx.Observable<T>;
        if (isPromiseLike(observable)) {
            convertedObservable = Rx.Observable.fromPromise(observable);
        } else {
            convertedObservable = observable;
        }

        const releaseGuard = () => {
            this._pendingSubscriptions = _.without(this._pendingSubscriptions, guard);
        };
        convertedObservable = convertedObservable.tap(releaseGuard, releaseGuard);

        const subscription = safeApply(
            convertedObservable,
            this.component.$scope,
            (item) => {
                try {
                    if (_.isFunction(target)) {
                        target(item);
                    } else {
                        this.component[target] = item;
                    }
                } catch (exception) {
                    console.warn('Ignored error in ' + this.component.getConfig().directive, exception);
                } finally {
                    // Dispose of the subscription immediately if this is a one shot subscription.
                    if (options.oneShot && subscription) {
                        subscription.dispose();
                    }
                }
            }
        ).subscribe(
            // Success handler.
            _.noop,
            // Error handler.
            (exception) => {
                if (options.onError) {
                    // @ifndef RESOLWE_PRODUCTION
                        console.log('Handled error in ' + this.component.getConfig().directive, exception);
                    // @endif
                    safeCallbackApply(this.component.$scope, () => { options.onError(exception); });
                } else {
                    console.warn('Unhandled error in ' + this.component.getConfig().directive, exception);
                }
            }
        );

        this._subscriptions.push(subscription);
        return subscription;
    }

    /**
     * Returns true if all subscriptions created by calling `subscribe` are ready.
     * A subscription is ready when it has received its first batch of data after
     * subscribing.
     */
    public subscriptionsReady(): boolean {
        return this._pendingSubscriptions.length === 0;
    }

    /**
     * Runs the computation.
     */
    public compute() {
        // Stop all subscriptions before running again.
        this.stop();
        this.content(this);
    }

    /**
     * Disposes of all registered subscriptions.
     */
    public stop() {
        for (let subscription of this._subscriptions) {
            subscription.dispose();
        }
        this._subscriptions = [];
        this._pendingSubscriptions = [];
    }

    /**
     * Stops all subscriptions currently registered in this computation and removes
     * this computation from the parent component. If a dispose handler has been
     * configured, it is invoked.
     */
    public unsubscribe() {
        this.component.unsubscribe(this);
        if (this._dispose) this._dispose();
        this._done = true;
    }
}

export interface WatchExpressionOf<T> {
    (): T;
}
export type WatchExpression = WatchExpressionOf<{}>;

/**
 * An abstract base class for all components.
 */
export abstract class ComponentBase {
    // Component configuration.
    public static __componentConfig: ComponentConfiguration;
    // Computations.
    private _computations: Computation[] = [];
    // Component state.
    private _ready: boolean = false;

    // @ngInject
    constructor(public $scope: angular.IScope) {
        $scope.$on('$destroy', () => {
            this._ready = false;

            // Ensure that all computations get stopped when the component is destroyed.
            for (let computation of this._computations) {
                computation.stop();
            }
            this._computations = [];

            // Call destroyed hook.
            this.onComponentDestroyed();
        });

        // Angular calls $onInit after constructor and bindings initialization.
        this['$onInit'] = () => {
            this.onComponentInit();
        };
    }

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
    public onComponentInit(...args: any[]): void {
        // Default implementation does nothing.
    }

    /**
     * Destroys the component.
     */
    public destroy(): void {
        this.$scope.$destroy();
    }

    /**
     * This method will be called in the compile phase of the directive and may
     * be overriden by component implementations.
     */
    public static onComponentCompile(element: angular.IAugmentedJQuery, attributes: angular.IAttributes): void {
        // Default implementation does nothing.
    }

    /**
     * @internal
     */
    public _onComponentLink(scope: angular.IScope, element: angular.IAugmentedJQuery, attributes: angular.IAttributes, ...args): void {
        try {
            // Call the public method that can be overriden by the user.
            this.onComponentLink(scope, element, attributes, ...args);
        } finally {
            this._ready = true;
        }
    }

    /**
     * This method will be called in the post-link phase of the directive and may
     * be overriden by component implementations.
     */
    public onComponentLink(scope: angular.IScope, element: angular.IAugmentedJQuery, attributes: angular.IAttributes, ...args): void {
        // Default implementation does nothing.
    }

    /**
     * This method will be called after the component scope has been destroyed.
     */
    public onComponentDestroyed(): void {
        // Default implementation does nothing.
    }

    /**
     * Returns true if the component has been created.
     */
    public isReady(): boolean {
        return this._ready;
    }

    /**
     * Returns true if all subscriptions created by calling `subscribe` are ready.
     * A subscription is ready when it has received its first batch of data after
     * subscribing.
     */
    public subscriptionsReady(): boolean {
        // Wait until the component has been created.
        if (!this.isReady()) return false;

        return _.every(this._computations, (computation) => computation.subscriptionsReady());
    }

    private _createComputation(content: ComputationFunction = _.noop): Computation {
        let computation = new Computation(this, content);
        this._computations.push(computation);
        return computation;
    }

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
    public watch(context: WatchExpression | WatchExpression[],
                 content: ComputationFunction,
                 objectEquality?: boolean): Computation {
        let computation = this._createComputation(content);
        computation.compute();

        // Initial evaluation may stop the computation. In this case, don't
        // even create a watch and just return the (done) computation.
        if (computation.isDone()) return computation;

        let expressions = Array.isArray(context) ? context : [context];

        if (!objectEquality) {
            const unwatch = this.$scope.$watchGroup(expressions, computation.compute.bind(computation));
            computation.setDisposeCallback(unwatch);
            return computation;
        } else {
            let watchedExpression: WatchExpression = () => _.map(expressions, fn => fn());
            if (expressions.length === 1) { // optimize
                watchedExpression = expressions[0];
            }

            const unwatch = this.$scope.$watch(watchedExpression, computation.compute.bind(computation), true);
            computation.setDisposeCallback(unwatch);
            return computation;
        }
    }

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
    public watchCollection(context: WatchExpression,
                           content: ComputationFunction): Computation {
        let computation = this._createComputation(content);
        computation.compute();

        // Initial evaluation may stop the computation. In this case, don't
        // even create a watch and just return the (done) computation.
        if (computation.isDone()) return computation;

        const unwatch = this.$scope.$watchCollection(context, computation.compute.bind(computation));
        computation.setDisposeCallback(unwatch);
        return computation;
    }

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
    public subscribe<T>(target: string | ((data: T) => any),
                        observable: Rx.Observable<T> | Promise<any>,
                        options: SubscribeComponentOptions = {}): Subscription {
        let computation = this._createComputation();
        computation.subscribe(target, observable, options);
        return computation;
    }

    /**
     * Unsubscribes the given computation from this component.
     *
     * @param computation Computation instance
     */
    public unsubscribe(computation: Computation): void {
        computation.stop();
        _.pull(this._computations, computation);
    }

    /**
     * Helper function to create a wrapper observable around watch.
     *
     * @param context Function which returns the context to watch
     * @param objectEquality Should `angular.equals` be used for comparisons
     * @returns Watch observable
     */
    public createWatchObservable<T>(context: WatchExpressionOf<T>, objectEquality?: boolean): Rx.Observable<T> {
        const notifyObserver = (observer: Rx.Observer<T>) => {
            observer.onNext(context());
        };

        return Rx.Observable.create<T>((observer) => {
            notifyObserver(observer);

            const computation = this.watch(
                context,
                () => notifyObserver(observer),
                objectEquality
            );
            return () => { computation.unsubscribe(); };
        });
    }

    /**
     * Returns component configuration.
     */
    public static getConfig(): ComponentConfiguration {
        return this.__componentConfig;
    }

    /**
     * Returns component configuration.
     */
    public getConfig(): ComponentConfiguration {
        return (<typeof ComponentBase> this.constructor).getConfig();
    }

    /**
     * Returns true if the component has a specified attribute configured as
     * a binding.
     *
     * @param name Name of the bound attribute
     */
    public static hasBinding(name: string): boolean {
        return _.some(this.__componentConfig.bindings, (value, key) => {
            // In case no attribute name is specified, compare the binding key,
            // otherwise compare the attribute name.
            const matchedName = value.replace(/^[=@&<]\??/, '');
            const boundAttribute = matchedName || key;
            return boundAttribute === name;
        });
    }

    /**
     * Returns a view configuration that renders this component. This method can be
     * used when configuring the Angular UI router as follows:
     *
     *     $stateProvider.state('foo', {
     *         url: '/foo',
     *         views: { application: MyComponent.asView() },
     *     });
     */
    public static asView(options: ComponentViewOptions = {}): any {
        let template = '<' + this.__componentConfig.directive;
        let attributes = options.attributes || {};

        // Setup input bindings.
        if (!_.isEmpty(options.inputs)) {
            _.forOwn(options.inputs, (input, key) => {
                // @ifndef RESOLWE_PRODUCTION
                if (!this.hasBinding(key)) {
                    throw new GenError(`Input '${key}' is not defined on component.`);
                }
                // @endif

                attributes[key] = input;
            });
        }

        // Generate attributes.
        if (!_.isEmpty(attributes)) {
            _.forOwn(attributes, (attribute, attributeName) => {
                if (_.contains(attribute, '"')) {
                    throw new GenError(`asView attribute '${attribute}' is currently not supported.`);
                }
                // TODO: Properly escape attribute values.
                template += ' ' + _.kebabCase(attributeName) + '="' + attribute + '"';
            });
        }
        template += '></' + this.__componentConfig.directive + '>';

        let result: any = {
            template: template,
        };

        // Setup parent scope for the intermediate template.
        if (options.parent) {
            result.scope = options.parent.$scope;
        }

        return _.extend(result, options.extendWith || {});
    }

    /**
     * Performs any modifications of the component configuration. This method is
     * invoked during component class decoration and may arbitrarily modify the
     * passed component configuration, before the component is registered with
     * Angular.
     *
     * @param config Component configuration
     * @return Modified component configuration
     */
    public static configureComponent(config: ComponentConfiguration): ComponentConfiguration {
        return config;
    }
}

function directiveFactory(config: ComponentConfiguration, type: DirectiveType) {
    return (target: typeof ComponentBase): Function => {
        // Store component configuration on the component, extending configuration obtained from base class.
        if (target.__componentConfig) {
            target.__componentConfig = _.cloneDeep(target.__componentConfig);
            // Don't inherit the abstract flag as otherwise you would be required to explicitly
            // set it to false in all subclasses.
            delete target.__componentConfig.abstract;

            _.merge(target.__componentConfig, config);
        } else {
            target.__componentConfig = config;
        }

        config = target.configureComponent(target.__componentConfig);

        if (!config.abstract) {
            // If module or directive is not defined for a non-abstract component, this is an error.
            if (!config.directive) {
                throw new GenError("Directive not defined for component.");
            }

            if (!_.startsWith(config.directive, 'gen-')) {
                throw new GenError("Directive not prefixed with \"gen-\": " + config.directive);
            }

            if (!config.module) {
                throw new GenError("Module not defined for component '" + config.directive + "'.");
            }

            if (_.any(config.bindings, (value, key) => _.startsWith(value.substring(1) || key, 'data'))) {
                throw new Error("Bindings should not start with 'data'");
            }

            config.module.directive(_.camelCase(config.directive), () => {
                const controllerBinding = config.controllerAs || 'ctrl';

                let result: angular.IDirective = {
                    scope: {},
                    bindToController: config.bindings || {},
                    controller: <any> target,
                    controllerAs: controllerBinding,
                    compile: (element, attributes) => {
                        // Call the compile life-cycle static method.
                        target.onComponentCompile(element, attributes);

                        return (scope, element, attributes, ...args) => { // tslint:disable-line:no-shadowed-variable
                            // Get controller from the scope and call the link life-cycle method.
                            (<ComponentBase> scope[controllerBinding])._onComponentLink(scope, element, attributes, ...args);
                        };
                    },
                    templateUrl: config.templateUrl,
                    template: config.template,
                    transclude: config.transclude,
                    require: config.require,
                };

                switch (type) {
                    case DirectiveType.COMPONENT: {
                        result.restrict = 'E';
                        break;
                    }
                    case DirectiveType.ATTRIBUTE: {
                        result.restrict = 'A';
                        break;
                    }
                    default: {
                        // TODO: use error handler
                        throw new GenError(`Unknown type ${type}`);
                    }
                }

                return result;
            });
        }

        return target;
    };
}

/**
 * A decorator that transforms the decorated class into an AngularJS
 * component directive with proper dependency injection.
 */
export function component(config: ComponentConfiguration): ClassDecorator {
    return <ClassDecorator> directiveFactory(config, DirectiveType.COMPONENT);
}

/**
 * A decorator that transforms the decorated class into an AngularJS
 * attribute directive with proper dependency injection.
 */
export function directive(config: ComponentConfiguration): ClassDecorator {
    return <ClassDecorator> directiveFactory(config, DirectiveType.ATTRIBUTE);
}
