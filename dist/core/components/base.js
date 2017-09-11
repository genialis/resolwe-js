"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var angular = require("angular");
var _ = require("lodash");
var Rx = require("rx");
var lang_1 = require("../utils/lang");
var error_1 = require("../errors/error");
var DirectiveType;
(function (DirectiveType) {
    DirectiveType[DirectiveType["COMPONENT"] = 0] = "COMPONENT";
    DirectiveType[DirectiveType["ATTRIBUTE"] = 1] = "ATTRIBUTE";
})(DirectiveType || (DirectiveType = {}));
function safeCallbackApply($scope, callback) {
    if ($scope.$$destroyed) {
        return;
    }
    if ($scope.$$phase || $scope.$root.$$phase) {
        callback();
    }
    else {
        $scope.$apply(function () { callback(); });
    }
}
function safeApply(observable, scope, callback) {
    callback = angular.isFunction(callback) ? callback : _.noop;
    return observable.takeWhile(function () {
        return !scope['$$destroyed'];
    }).tap(function (data) {
        safeCallbackApply(scope, function () { callback(data); });
    });
}
/**
 * Abstraction of a computation with dependencies to observables.
 */
var Computation = /** @class */ (function () {
    /**
     * Constructs a new computation.
     *
     * @param component Owning component
     * @param content Computation content
     */
    function Computation(component, content) {
        this.component = component;
        this.content = content;
        this._subscriptions = [];
        this._pendingSubscriptions = [];
        this._dispose = function () { };
        this._done = false;
    }
    /**
     * Return true if this computation has finished.
     */
    Computation.prototype.isDone = function () {
        return this._done;
    };
    /**
     * Sets an alternative dispose callback for this computation. This callback
     * is invoked when [[unsubscribe]] is called.
     */
    Computation.prototype.setDisposeCallback = function (callback) {
        this._dispose = callback;
    };
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
    Computation.prototype.subscribe = function (target, observable, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        // Create a guard object that can be removed when a subscription is done. We need
        // to use guard objects instead of a simple reference counter because the pending
        // subscriptions array may be cleared while callbacks are still outstanding.
        var guard = new Object();
        if (!options.ignoreReady) {
            this._pendingSubscriptions.push(guard);
        }
        var convertedObservable;
        if (lang_1.isPromise(observable)) {
            convertedObservable = Rx.Observable.fromPromise(observable);
        }
        else {
            convertedObservable = observable;
        }
        var releaseGuard = function () {
            _this._pendingSubscriptions = _.without(_this._pendingSubscriptions, guard);
        };
        convertedObservable = convertedObservable.tap(releaseGuard, releaseGuard);
        var subscription = safeApply(convertedObservable, this.component.$scope, function (item) {
            try {
                if (_.isFunction(target)) {
                    target(item);
                }
                else {
                    _this.component[target] = item;
                }
            }
            catch (exception) {
                console.warn('Ignored error', exception);
            }
            finally {
                // Dispose of the subscription immediately if this is a one shot subscription.
                if (options.oneShot && subscription) {
                    subscription.dispose();
                }
            }
        }).subscribe(
        // Success handler.
        _.noop, 
        // Error handler.
        function (exception) {
            if (options.onError) {
                safeCallbackApply(_this.component.$scope, function () { options.onError(exception); });
            }
            else {
                console.warn('Unhandled error', exception);
            }
        });
        this._subscriptions.push(subscription);
        return subscription;
    };
    /**
     * Returns true if all subscriptions created by calling `subscribe` are ready.
     * A subscription is ready when it has received its first batch of data after
     * subscribing.
     */
    Computation.prototype.subscriptionsReady = function () {
        return this._pendingSubscriptions.length === 0;
    };
    /**
     * Runs the computation.
     */
    Computation.prototype.compute = function () {
        // Stop all subscriptions before running again.
        this.stop();
        this.content(this);
    };
    /**
     * Disposes of all registered subscriptions.
     */
    Computation.prototype.stop = function () {
        for (var _i = 0, _a = this._subscriptions; _i < _a.length; _i++) {
            var subscription = _a[_i];
            subscription.dispose();
        }
        this._subscriptions = [];
        this._pendingSubscriptions = [];
    };
    /**
     * Stops all subscriptions currently registered in this computation and removes
     * this computation from the parent component. If a dispose handler has been
     * configured, it is invoked.
     */
    Computation.prototype.unsubscribe = function () {
        this.component.unsubscribe(this);
        if (this._dispose)
            this._dispose();
        this._done = true;
    };
    return Computation;
}());
exports.Computation = Computation;
/**
 * An abstract base class for all components.
 */
var ComponentBase = /** @class */ (function () {
    // @ngInject
    ComponentBase.$inject = ["$scope"];
    function ComponentBase($scope) {
        var _this = this;
        this.$scope = $scope;
        // Computations.
        this._computations = [];
        // Component state.
        this._ready = false;
        $scope.$on('$destroy', function () {
            _this._ready = false;
            // Ensure that all computations get stopped when the component is destroyed.
            for (var _i = 0, _a = _this._computations; _i < _a.length; _i++) {
                var computation = _a[_i];
                computation.stop();
            }
            _this._computations = [];
            // Call destroyed hook.
            _this.onComponentDestroyed();
        });
        // Angular calls $onInit after constructor and bindings initialization.
        this['$onInit'] = function () {
            _this.onComponentInit();
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
    ComponentBase.prototype.onComponentInit = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        // Default implementation does nothing.
    };
    /**
     * Destroys the component.
     */
    ComponentBase.prototype.destroy = function () {
        this.$scope.$destroy();
    };
    /**
     * This method will be called in the compile phase of the directive and may
     * be overriden by component implementations.
     */
    ComponentBase.onComponentCompile = function (element, attributes) {
        // Default implementation does nothing.
    };
    /**
     * @internal
     */
    ComponentBase.prototype._onComponentLink = function (scope, element, attributes) {
        var args = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            args[_i - 3] = arguments[_i];
        }
        try {
            // Call the public method that can be overriden by the user.
            this.onComponentLink.apply(this, [scope, element, attributes].concat(args));
        }
        finally {
            this._ready = true;
        }
    };
    /**
     * This method will be called in the post-link phase of the directive and may
     * be overriden by component implementations.
     */
    ComponentBase.prototype.onComponentLink = function (scope, element, attributes) {
        var args = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            args[_i - 3] = arguments[_i];
        }
        // Default implementation does nothing.
    };
    /**
     * This method will be called after the component scope has been destroyed.
     */
    ComponentBase.prototype.onComponentDestroyed = function () {
        // Default implementation does nothing.
    };
    /**
     * Returns true if the component has been created.
     */
    ComponentBase.prototype.isReady = function () {
        return this._ready;
    };
    /**
     * Returns true if all subscriptions created by calling `subscribe` are ready.
     * A subscription is ready when it has received its first batch of data after
     * subscribing.
     */
    ComponentBase.prototype.subscriptionsReady = function () {
        // Wait until the component has been created.
        if (!this.isReady())
            return false;
        return _.every(this._computations, function (computation) { return computation.subscriptionsReady(); });
    };
    ComponentBase.prototype._createComputation = function (content) {
        if (content === void 0) { content = _.noop; }
        var computation = new Computation(this, content);
        this._computations.push(computation);
        return computation;
    };
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
    ComponentBase.prototype.watch = function (context, content, objectEquality) {
        var computation = this._createComputation(content);
        computation.compute();
        // Initial evaluation may stop the computation. In this case, don't
        // even create a watch and just return the (done) computation.
        if (computation.isDone())
            return computation;
        var expressions = Array.isArray(context) ? context : [context];
        if (!objectEquality) {
            var unwatch_1 = this.$scope.$watchGroup(expressions, computation.compute.bind(computation));
            computation.setDisposeCallback(unwatch_1);
            return computation;
        }
        var watchedExpression = function () { return _.map(expressions, function (fn) { return fn(); }); };
        if (expressions.length === 1) {
            watchedExpression = expressions[0];
        }
        var unwatch = this.$scope.$watch(watchedExpression, computation.compute.bind(computation), true);
        computation.setDisposeCallback(unwatch);
        return computation;
    };
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
    ComponentBase.prototype.watchCollection = function (context, content) {
        var computation = this._createComputation(content);
        computation.compute();
        // Initial evaluation may stop the computation. In this case, don't
        // even create a watch and just return the (done) computation.
        if (computation.isDone())
            return computation;
        var unwatch = this.$scope.$watchCollection(context, computation.compute.bind(computation));
        computation.setDisposeCallback(unwatch);
        return computation;
    };
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
    ComponentBase.prototype.subscribe = function (target, observable, options) {
        if (options === void 0) { options = {}; }
        var computation = this._createComputation();
        computation.subscribe(target, observable, options);
        return computation;
    };
    /**
     * Unsubscribes the given computation from this component.
     *
     * @param computation Computation instance
     */
    ComponentBase.prototype.unsubscribe = function (computation) {
        computation.stop();
        _.pull(this._computations, computation);
    };
    /**
     * Helper function to create a wrapper observable around watch.
     *
     * @param context Function which returns the context to watch
     * @param objectEquality Should `angular.equals` be used for comparisons
     * @returns Watch observable
     */
    ComponentBase.prototype.createWatchObservable = function (context, objectEquality) {
        var _this = this;
        var notifyObserver = function (observer) {
            observer.onNext(context());
        };
        return Rx.Observable.create(function (observer) {
            notifyObserver(observer);
            var computation = _this.watch(context, function () { return notifyObserver(observer); }, objectEquality);
            return function () { computation.unsubscribe(); };
        });
    };
    /**
     * Returns component configuration.
     */
    ComponentBase.getConfig = function () {
        return this.__componentConfig;
    };
    /**
     * Returns component configuration.
     */
    ComponentBase.prototype.getConfig = function () {
        return this.constructor.getConfig();
    };
    /**
     * Returns true if the component has a specified attribute configured as
     * a binding.
     *
     * @param name Name of the bound attribute
     */
    ComponentBase.hasBinding = function (name) {
        return _.some(this.__componentConfig.bindings, function (value, key) {
            // In case no attribute name is specified, compare the binding key,
            // otherwise compare the attribute name.
            var matchedName = value.replace(/^[=@&<]\??/, '');
            var boundAttribute = matchedName || key;
            return boundAttribute === name;
        });
    };
    /**
     * Returns a view configuration that renders this component. This method can be
     * used when configuring the Angular UI router as follows:
     *
     *     $stateProvider.state('foo', {
     *         url: '/foo',
     *         views: { application: MyComponent.asView() },
     *     });
     */
    ComponentBase.asView = function (options) {
        if (options === void 0) { options = {}; }
        var template = '<' + this.__componentConfig.directive;
        var attributes = options.attributes || {};
        // Setup input bindings.
        if (!_.isEmpty(options.inputs)) {
            _.forOwn(options.inputs, function (input, key) {
                attributes[key] = input;
            });
        }
        // Generate attributes.
        if (!_.isEmpty(attributes)) {
            _.forOwn(attributes, function (attribute, attributeName) {
                // TODO: Properly escape attribute values.
                template += ' ' + _.kebabCase(attributeName) + '="' + attribute + '"';
            });
        }
        template += '></' + this.__componentConfig.directive + '>';
        var result = {
            template: template,
        };
        // Setup parent scope for the intermediate template.
        if (options.parent) {
            result.scope = options.parent.$scope;
        }
        return _.extend(result, options.extendWith || {});
    };
    /**
     * Performs any modifications of the component configuration. This method is
     * invoked during component class decoration and may arbitrarily modify the
     * passed component configuration, before the component is registered with
     * Angular.
     *
     * @param config Component configuration
     * @return Modified component configuration
     */
    ComponentBase.configureComponent = function (config) {
        return config;
    };
    return ComponentBase;
}());
exports.ComponentBase = ComponentBase;
function directiveFactory(config, type) {
    return function (target) {
        // Store component configuration on the component, extending configuration obtained from base class.
        if (target.__componentConfig) {
            target.__componentConfig = _.cloneDeep(target.__componentConfig);
            // Don't inherit the abstract flag as otherwise you would be required to explicitly
            // set it to false in all subclasses.
            delete target.__componentConfig.abstract;
            _.merge(target.__componentConfig, config);
        }
        else {
            target.__componentConfig = config;
        }
        config = target.configureComponent(target.__componentConfig);
        if (!config.abstract) {
            // If module or directive is not defined for a non-abstract component, this is an error.
            if (!config.directive) {
                throw new error_1.GenError("Directive not defined for component.");
            }
            if (!_.startsWith(config.directive, 'gen-')) {
                throw new error_1.GenError("Directive not prefixed with \"gen-\": " + config.directive);
            }
            if (!config.module) {
                throw new error_1.GenError("Module not defined for component '" + config.directive + "'.");
            }
            if (_.any(config.bindings, function (value, key) { return _.startsWith(value.substring(1) || key, 'data'); })) {
                throw new Error("Bindings should not start with 'data'");
            }
            config.module.directive(_.camelCase(config.directive), function () {
                var controllerBinding = config.controllerAs || 'ctrl';
                var result = {
                    scope: {},
                    bindToController: config.bindings || {},
                    controller: target,
                    controllerAs: controllerBinding,
                    compile: function (element, attributes) {
                        // Call the compile life-cycle static method.
                        target.onComponentCompile(element, attributes);
                        return function (scope, element, attributes) {
                            var args = [];
                            for (var _i = 3; _i < arguments.length; _i++) {
                                args[_i - 3] = arguments[_i];
                            }
                            // Get controller from the scope and call the link life-cycle method.
                            (_a = scope[controllerBinding])._onComponentLink.apply(_a, [scope, element, attributes].concat(args));
                            var _a;
                        };
                    },
                    templateUrl: config.templateUrl,
                    template: config.template,
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
                        throw new error_1.GenError("Unknown type " + type);
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
function component(config) {
    return directiveFactory(config, DirectiveType.COMPONENT);
}
exports.component = component;
/**
 * A decorator that transforms the decorated class into an AngularJS
 * attribute directive with proper dependency injection.
 */
function directive(config) {
    return directiveFactory(config, DirectiveType.ATTRIBUTE);
}
exports.directive = directive;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2NvbXBvbmVudHMvYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlDQUFtQztBQUNuQywwQkFBNEI7QUFDNUIsdUJBQXlCO0FBRXpCLHNDQUF3QztBQUN4Qyx5Q0FBeUM7QUFFekMsSUFBSyxhQUdKO0FBSEQsV0FBSyxhQUFhO0lBQ2QsMkRBQVMsQ0FBQTtJQUNULDJEQUFTLENBQUE7QUFDYixDQUFDLEVBSEksYUFBYSxLQUFiLGFBQWEsUUFHakI7QUE4Q0QsMkJBQTJCLE1BQXNCLEVBQUUsUUFBb0I7SUFDbkUsRUFBRSxDQUFDLENBQVEsTUFBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDN0IsTUFBTSxDQUFDO0lBQ1gsQ0FBQztJQUVELEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ3pDLFFBQVEsRUFBRSxDQUFDO0lBQ2YsQ0FBQztJQUFDLElBQUksQ0FBQyxDQUFDO1FBQ0osTUFBTSxDQUFDLE1BQU0sQ0FBQyxjQUFRLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekMsQ0FBQztBQUNMLENBQUM7QUFFRCxtQkFBc0IsVUFBNEIsRUFBRSxLQUFxQixFQUFFLFFBQTJCO0lBQ2xHLFFBQVEsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxHQUFHLFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBRTVELE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDO1FBQ3hCLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUNqQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQyxJQUFJO1FBQ1IsaUJBQWlCLENBQUMsS0FBSyxFQUFFLGNBQVEsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDeEQsQ0FB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QUN0QixLQUFLLENBQUM7b0JBQ1YsQ0FBQztvQkFDRCxLQUFLLGFBQWEsQ0FBQyxTQUFTLEVBQUUsQ0FBQzt3QkFDM0IsTUFBTSxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUM7d0JBQ3RCLEtBQUssQ0FBQztvQkFDVixDQUFDO29CQUNELFNBQVMsQ0FBQzt3QkFDTiwwQkFBMEI7d0JBQzFCLE1BQU0sSUFBSSxnQkFBUSxDQUFDLGtCQUFnQixJQUFNLENBQUMsQ0FBQztvQkFDL0MsQ0FBQztnQkFDTCxDQUFDO2dCQUVELE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDbEIsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO1FBRUQsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNsQixDQUFDLENBQUM7QUFDTixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsbUJBQTBCLE1BQThCO0lBQ3BELE1BQU0sQ0FBa0IsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUM5RSxDQUFDO0FBRkQsOEJBRUM7QUFFRDs7O0dBR0c7QUFDSCxtQkFBMEIsTUFBOEI7SUFDcEQsTUFBTSxDQUFrQixnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzlFLENBQUM7QUFGRCw4QkFFQyIsImZpbGUiOiJjb3JlL2NvbXBvbmVudHMvYmFzZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFuZ3VsYXIgZnJvbSAnYW5ndWxhcic7XG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgKiBhcyBSeCBmcm9tICdyeCc7XG5cbmltcG9ydCB7aXNQcm9taXNlfSBmcm9tICcuLi91dGlscy9sYW5nJztcbmltcG9ydCB7R2VuRXJyb3J9IGZyb20gJy4uL2Vycm9ycy9lcnJvcic7XG5cbmVudW0gRGlyZWN0aXZlVHlwZSB7XG4gICAgQ09NUE9ORU5ULFxuICAgIEFUVFJJQlVURVxufVxuXG4vKipcbiAqIENvbXBvbmVudCBjb25maWd1cmF0aW9uLiBEaXJlY3RpdmUgbmFtZSBzaG91bGQgYmUgaW4gZGFzaC1jYXNlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbXBvbmVudENvbmZpZ3VyYXRpb24ge1xuICAgIGFic3RyYWN0PzogYm9vbGVhbjtcbiAgICBtb2R1bGU/OiBhbmd1bGFyLklNb2R1bGU7XG4gICAgZGlyZWN0aXZlPzogc3RyaW5nO1xuICAgIGJpbmRpbmdzPzogXy5EaWN0aW9uYXJ5PHN0cmluZz47XG4gICAgY29udHJvbGxlckFzPzogc3RyaW5nO1xuICAgIHRlbXBsYXRlVXJsPzogc3RyaW5nO1xuICAgIHRlbXBsYXRlPzogc3RyaW5nO1xuICAgIHJlcXVpcmU/OiBzdHJpbmcgfCBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb21wb25lbnRWaWV3T3B0aW9ucyB7XG4gICAgaW5wdXRzPzogT2JqZWN0O1xuICAgIHBhcmVudD86IENvbXBvbmVudEJhc2U7XG4gICAgYXR0cmlidXRlcz86IE9iamVjdDtcbiAgICBleHRlbmRXaXRoPzogT2JqZWN0O1xufVxuXG5pbnRlcmZhY2UgU3Vic2NyaXB0aW9uTWFwIHtcbiAgICBba2V5OiBzdHJpbmddOiBSeC5EaXNwb3NhYmxlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbXB1dGF0aW9uRnVuY3Rpb24ge1xuICAgIChjb21wdXRhdGlvbjogQ29tcHV0YXRpb24pOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN1YnNjcmlwdGlvbiB7XG4gICAgdW5zdWJzY3JpYmUoKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdWJzY3JpYmVDb21wb25lbnRPcHRpb25zIHtcbiAgICBvbmVTaG90PzogYm9vbGVhbjtcbiAgICBvbkVycm9yPzogKGV4Y2VwdGlvbjogYW55KSA9PiB2b2lkO1xuXG4gICAgLy8gU2V0IHRoaXMgdG8gdHJ1ZSB0byBtYWtlIHRoZSBzdWJzY3JpcHRpb24gYmUgaWdub3JlZCB3aGVuIGRldGVybWluaW5nXG4gICAgLy8gd2hldGhlciB0aGUgY29tcG9uZW50IGlzIGRvbmUgd2FpdGluZyBmb3Igc3Vic2NyaXB0aW9ucy5cbiAgICBpZ25vcmVSZWFkeT86IGJvb2xlYW47XG59XG5cbnR5cGUgU3Vic2NyaXB0aW9uR3VhcmQgPSB7fTtcblxuZnVuY3Rpb24gc2FmZUNhbGxiYWNrQXBwbHkoJHNjb3BlOiBhbmd1bGFyLklTY29wZSwgY2FsbGJhY2s6ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgICBpZiAoKDxhbnk+ICRzY29wZSkuJCRkZXN0cm95ZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICgkc2NvcGUuJCRwaGFzZSB8fCAkc2NvcGUuJHJvb3QuJCRwaGFzZSkge1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICRzY29wZS4kYXBwbHkoKCkgPT4geyBjYWxsYmFjaygpOyB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNhZmVBcHBseTxUPihvYnNlcnZhYmxlOiBSeC5PYnNlcnZhYmxlPFQ+LCBzY29wZTogYW5ndWxhci5JU2NvcGUsIGNhbGxiYWNrOiAoZGF0YTogVCkgPT4gdm9pZCkge1xuICAgIGNhbGxiYWNrID0gYW5ndWxhci5pc0Z1bmN0aW9uKGNhbGxiYWNrKSA/IGNhbGxiYWNrIDogXy5ub29wO1xuXG4gICAgcmV0dXJuIG9ic2VydmFibGUudGFrZVdoaWxlKCgpID0+IHtcbiAgICAgICAgcmV0dXJuICFzY29wZVsnJCRkZXN0cm95ZWQnXTtcbiAgICB9KS50YXAoKGRhdGEpID0+IHtcbiAgICAgICAgc2FmZUNhbGxiYWNrQXBwbHkoc2NvcGUsICgpID0+IHsgY2FsbGJhY2soZGF0YSk7IH0pO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIEFic3RyYWN0aW9uIG9mIGEgY29tcHV0YXRpb24gd2l0aCBkZXBlbmRlbmNpZXMgdG8gb2JzZXJ2YWJsZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wdXRhdGlvbiB7XG4gICAgcHJpdmF0ZSBfc3Vic2NyaXB0aW9uczogUnguRGlzcG9zYWJsZVtdO1xuICAgIHByaXZhdGUgX3BlbmRpbmdTdWJzY3JpcHRpb25zOiBTdWJzY3JpcHRpb25HdWFyZFtdO1xuICAgIHByaXZhdGUgX2Rpc3Bvc2U6ICgpID0+IHZvaWQ7XG4gICAgcHJpdmF0ZSBfZG9uZTogYm9vbGVhbjtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdHMgYSBuZXcgY29tcHV0YXRpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29tcG9uZW50IE93bmluZyBjb21wb25lbnRcbiAgICAgKiBAcGFyYW0gY29udGVudCBDb21wdXRhdGlvbiBjb250ZW50XG4gICAgICovXG4gICAgY29uc3RydWN0b3IocHVibGljIGNvbXBvbmVudDogQ29tcG9uZW50QmFzZSwgcHVibGljIGNvbnRlbnQ6IENvbXB1dGF0aW9uRnVuY3Rpb24pIHtcbiAgICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IFtdO1xuICAgICAgICB0aGlzLl9wZW5kaW5nU3Vic2NyaXB0aW9ucyA9IFtdO1xuICAgICAgICB0aGlzLl9kaXNwb3NlID0gKCkgPT4geyAvKiBEbyBub3RoaW5nIGJ5IGRlZmF1bHQuICovIH07XG4gICAgICAgIHRoaXMuX2RvbmUgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGlzIGNvbXB1dGF0aW9uIGhhcyBmaW5pc2hlZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgaXNEb25lKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fZG9uZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIGFuIGFsdGVybmF0aXZlIGRpc3Bvc2UgY2FsbGJhY2sgZm9yIHRoaXMgY29tcHV0YXRpb24uIFRoaXMgY2FsbGJhY2tcbiAgICAgKiBpcyBpbnZva2VkIHdoZW4gW1t1bnN1YnNjcmliZV1dIGlzIGNhbGxlZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgc2V0RGlzcG9zZUNhbGxiYWNrKGNhbGxiYWNrOiAoKSA9PiB2b2lkKSB7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2UgPSBjYWxsYmFjaztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdWJzY3JpYmVzIHRvIGFuIG9ic2VydmFibGUsIHJlZ2lzdGVyaW5nIHRoZSBzdWJzY3JpcHRpb24gYXMgYSBkZXBlbmRlbmN5XG4gICAgICogb2YgdGhpcyBjb21wb25lbnQuIFRoZSBzdWJzY3JpcHRpb24gaXMgYXV0b21hdGljYWxseSBzdG9wcGVkIHdoZW4gdGhlXG4gICAgICogY29tcG9uZW50IGlzIGRlc3Ryb3llZC5cbiAgICAgKlxuICAgICAqIEZvciB0aGUgdGFyZ2V0IGFyZ3VtZW50LCB5b3UgY2FuIGVpdGhlciBzcGVjaWZ5IGEgc3RyaW5nLCBpbiB3aGljaCBjYXNlXG4gICAgICogaXQgcmVwcmVzZW50cyB0aGUgbmFtZSBvZiB0aGUgY29tcG9uZW50IG1lbWJlciB2YXJpYWJsZSB0aGF0IHdpbGwgYmVcbiAgICAgKiBwb3B1bGF0ZWQgd2l0aCB0aGUgcmVzdWx0IGl0ZS4gT3IgeW91IGNhbiBzcGVjaWZ5IGEgZnVuY3Rpb24gd2l0aCBvbmVcbiAgICAgKiBhcmd1bWVudCwgd2hpY2ggd2lsbCBiZSBjYWxsZWQgd2hlbiBxdWVyeSByZXN1bHRzIGNoYW5nZSBhbmQgY2FuIGRvXG4gICAgICogYW55dGhpbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGFyZ2V0IFRhcmdldCBjb21wb25lbnQgbWVtYmVyIGF0cmlidXRlIG5hbWUgb3IgY2FsbGJhY2tcbiAgICAgKiBAcGFyYW0gb2JzZXJ2YWJsZSBPYnNlcnZhYmxlIG9yIHByb21pc2UgdG8gc3Vic2NyaWJlIHRvXG4gICAgICogQHJldHVybiBVbmRlcmx5aW5nIHN1YnNjcmlwdGlvbiBkaXNwb3NhYmxlXG4gICAgICovXG4gICAgcHVibGljIHN1YnNjcmliZTxUPih0YXJnZXQ6IHN0cmluZyB8ICgoZGF0YTogVCkgPT4gYW55KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ic2VydmFibGU6IFJ4Lk9ic2VydmFibGU8VD4gfCBQcm9taXNlPGFueT4sXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiBTdWJzY3JpYmVDb21wb25lbnRPcHRpb25zID0ge30pIHtcbiAgICAgICAgLy8gQ3JlYXRlIGEgZ3VhcmQgb2JqZWN0IHRoYXQgY2FuIGJlIHJlbW92ZWQgd2hlbiBhIHN1YnNjcmlwdGlvbiBpcyBkb25lLiBXZSBuZWVkXG4gICAgICAgIC8vIHRvIHVzZSBndWFyZCBvYmplY3RzIGluc3RlYWQgb2YgYSBzaW1wbGUgcmVmZXJlbmNlIGNvdW50ZXIgYmVjYXVzZSB0aGUgcGVuZGluZ1xuICAgICAgICAvLyBzdWJzY3JpcHRpb25zIGFycmF5IG1heSBiZSBjbGVhcmVkIHdoaWxlIGNhbGxiYWNrcyBhcmUgc3RpbGwgb3V0c3RhbmRpbmcuXG4gICAgICAgIGNvbnN0IGd1YXJkID0gbmV3IE9iamVjdCgpO1xuICAgICAgICBpZiAoIW9wdGlvbnMuaWdub3JlUmVhZHkpIHtcbiAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdTdWJzY3JpcHRpb25zLnB1c2goZ3VhcmQpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGNvbnZlcnRlZE9ic2VydmFibGU6IFJ4Lk9ic2VydmFibGU8VD47XG4gICAgICAgIGlmIChpc1Byb21pc2Uob2JzZXJ2YWJsZSkpIHtcbiAgICAgICAgICAgIGNvbnZlcnRlZE9ic2VydmFibGUgPSBSeC5PYnNlcnZhYmxlLmZyb21Qcm9taXNlKG9ic2VydmFibGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29udmVydGVkT2JzZXJ2YWJsZSA9IG9ic2VydmFibGU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZWxlYXNlR3VhcmQgPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9wZW5kaW5nU3Vic2NyaXB0aW9ucyA9IF8ud2l0aG91dCh0aGlzLl9wZW5kaW5nU3Vic2NyaXB0aW9ucywgZ3VhcmQpO1xuICAgICAgICB9O1xuICAgICAgICBjb252ZXJ0ZWRPYnNlcnZhYmxlID0gY29udmVydGVkT2JzZXJ2YWJsZS50YXAocmVsZWFzZUd1YXJkLCByZWxlYXNlR3VhcmQpO1xuXG4gICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IHNhZmVBcHBseShcbiAgICAgICAgICAgIGNvbnZlcnRlZE9ic2VydmFibGUsXG4gICAgICAgICAgICB0aGlzLmNvbXBvbmVudC4kc2NvcGUsXG4gICAgICAgICAgICAoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24odGFyZ2V0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0KGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb21wb25lbnRbdGFyZ2V0XSA9IGl0ZW07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdJZ25vcmVkIGVycm9yJywgZXhjZXB0aW9uKTtcbiAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgICAgICAvLyBEaXNwb3NlIG9mIHRoZSBzdWJzY3JpcHRpb24gaW1tZWRpYXRlbHkgaWYgdGhpcyBpcyBhIG9uZSBzaG90IHN1YnNjcmlwdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMub25lU2hvdCAmJiBzdWJzY3JpcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICkuc3Vic2NyaWJlKFxuICAgICAgICAgICAgLy8gU3VjY2VzcyBoYW5kbGVyLlxuICAgICAgICAgICAgXy5ub29wLFxuICAgICAgICAgICAgLy8gRXJyb3IgaGFuZGxlci5cbiAgICAgICAgICAgIChleGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEBpZm5kZWYgR0VOSlNfUFJPRFVDVElPTlxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0hhbmRsZWQgZXJyb3InLCBleGNlcHRpb24pO1xuICAgICAgICAgICAgICAgICAgICAvLyBAZW5kaWZcbiAgICAgICAgICAgICAgICAgICAgc2FmZUNhbGxiYWNrQXBwbHkodGhpcy5jb21wb25lbnQuJHNjb3BlLCAoKSA9PiB7IG9wdGlvbnMub25FcnJvcihleGNlcHRpb24pOyB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1VuaGFuZGxlZCBlcnJvcicsIGV4Y2VwdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMucHVzaChzdWJzY3JpcHRpb24pO1xuICAgICAgICByZXR1cm4gc3Vic2NyaXB0aW9uO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiBhbGwgc3Vic2NyaXB0aW9ucyBjcmVhdGVkIGJ5IGNhbGxpbmcgYHN1YnNjcmliZWAgYXJlIHJlYWR5LlxuICAgICAqIEEgc3Vic2NyaXB0aW9uIGlzIHJlYWR5IHdoZW4gaXQgaGFzIHJlY2VpdmVkIGl0cyBmaXJzdCBiYXRjaCBvZiBkYXRhIGFmdGVyXG4gICAgICogc3Vic2NyaWJpbmcuXG4gICAgICovXG4gICAgcHVibGljIHN1YnNjcmlwdGlvbnNSZWFkeSgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BlbmRpbmdTdWJzY3JpcHRpb25zLmxlbmd0aCA9PT0gMDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSdW5zIHRoZSBjb21wdXRhdGlvbi5cbiAgICAgKi9cbiAgICBwdWJsaWMgY29tcHV0ZSgpIHtcbiAgICAgICAgLy8gU3RvcCBhbGwgc3Vic2NyaXB0aW9ucyBiZWZvcmUgcnVubmluZyBhZ2Fpbi5cbiAgICAgICAgdGhpcy5zdG9wKCk7XG4gICAgICAgIHRoaXMuY29udGVudCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEaXNwb3NlcyBvZiBhbGwgcmVnaXN0ZXJlZCBzdWJzY3JpcHRpb25zLlxuICAgICAqL1xuICAgIHB1YmxpYyBzdG9wKCkge1xuICAgICAgICBmb3IgKGxldCBzdWJzY3JpcHRpb24gb2YgdGhpcy5fc3Vic2NyaXB0aW9ucykge1xuICAgICAgICAgICAgc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zdWJzY3JpcHRpb25zID0gW107XG4gICAgICAgIHRoaXMuX3BlbmRpbmdTdWJzY3JpcHRpb25zID0gW107XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RvcHMgYWxsIHN1YnNjcmlwdGlvbnMgY3VycmVudGx5IHJlZ2lzdGVyZWQgaW4gdGhpcyBjb21wdXRhdGlvbiBhbmQgcmVtb3Zlc1xuICAgICAqIHRoaXMgY29tcHV0YXRpb24gZnJvbSB0aGUgcGFyZW50IGNvbXBvbmVudC4gSWYgYSBkaXNwb3NlIGhhbmRsZXIgaGFzIGJlZW5cbiAgICAgKiBjb25maWd1cmVkLCBpdCBpcyBpbnZva2VkLlxuICAgICAqL1xuICAgIHB1YmxpYyB1bnN1YnNjcmliZSgpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnQudW5zdWJzY3JpYmUodGhpcyk7XG4gICAgICAgIGlmICh0aGlzLl9kaXNwb3NlKSB0aGlzLl9kaXNwb3NlKCk7XG4gICAgICAgIHRoaXMuX2RvbmUgPSB0cnVlO1xuICAgIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBXYXRjaEV4cHJlc3Npb25PZjxUPiB7XG4gICAgKCk6IFQ7XG59XG5leHBvcnQgdHlwZSBXYXRjaEV4cHJlc3Npb24gPSBXYXRjaEV4cHJlc3Npb25PZjx7fT47XG5cbi8qKlxuICogQW4gYWJzdHJhY3QgYmFzZSBjbGFzcyBmb3IgYWxsIGNvbXBvbmVudHMuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBDb21wb25lbnRCYXNlIHtcbiAgICAvLyBDb21wb25lbnQgY29uZmlndXJhdGlvbi5cbiAgICBwdWJsaWMgc3RhdGljIF9fY29tcG9uZW50Q29uZmlnOiBDb21wb25lbnRDb25maWd1cmF0aW9uO1xuICAgIC8vIENvbXB1dGF0aW9ucy5cbiAgICBwcml2YXRlIF9jb21wdXRhdGlvbnM6IENvbXB1dGF0aW9uW10gPSBbXTtcbiAgICAvLyBDb21wb25lbnQgc3RhdGUuXG4gICAgcHJpdmF0ZSBfcmVhZHk6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAgIC8vIEBuZ0luamVjdFxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyAkc2NvcGU6IGFuZ3VsYXIuSVNjb3BlKSB7XG4gICAgICAgICRzY29wZS4kb24oJyRkZXN0cm95JywgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fcmVhZHkgPSBmYWxzZTtcblxuICAgICAgICAgICAgLy8gRW5zdXJlIHRoYXQgYWxsIGNvbXB1dGF0aW9ucyBnZXQgc3RvcHBlZCB3aGVuIHRoZSBjb21wb25lbnQgaXMgZGVzdHJveWVkLlxuICAgICAgICAgICAgZm9yIChsZXQgY29tcHV0YXRpb24gb2YgdGhpcy5fY29tcHV0YXRpb25zKSB7XG4gICAgICAgICAgICAgICAgY29tcHV0YXRpb24uc3RvcCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fY29tcHV0YXRpb25zID0gW107XG5cbiAgICAgICAgICAgIC8vIENhbGwgZGVzdHJveWVkIGhvb2suXG4gICAgICAgICAgICB0aGlzLm9uQ29tcG9uZW50RGVzdHJveWVkKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEFuZ3VsYXIgY2FsbHMgJG9uSW5pdCBhZnRlciBjb25zdHJ1Y3RvciBhbmQgYmluZGluZ3MgaW5pdGlhbGl6YXRpb24uXG4gICAgICAgIHRoaXNbJyRvbkluaXQnXSA9ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMub25Db21wb25lbnRJbml0KCk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgdGhlIHdob2xlIGNoYWluIG9mIGNvbnN0cnVjdG9ycyBpcyBleGVjdXRlZCxcbiAgICAgKiB2aWEgYW5ndWxhciBjb21wb25lbnQgJG9uSW5pdC4gVXNlIGl0IGlmIHlvdSBoYXZlIGFuIGFic3RyYWN0IGNvbXBvbmVudCB0aGF0XG4gICAgICogbWFuaXB1bGF0ZXMgY2xhc3MgcHJvcGVydGllcyBhbmQsIGFzIGEgcmVzdWx0LCBuZWVkcyB0byB3YWl0IGZvciBhbGwgY2hpbGRcbiAgICAgKiBjbGFzcyBwcm9wZXJ0aWVzIHRvIGJlIGFzc2lnbmVkIGFuZCBjb25zdHJ1Y3RvcnMgdG8gZmluaXNoLiAoQ2xhc3MgcHJvcGVydGllc1xuICAgICAqIGRlZmluZWQgaW4gY2hpbGQgY29tcG9uZW50cyBhcmUgYXNzaWduZWQgYmVmb3JlIGNoaWxkJ3MgY29uc3RydWN0b3IpLlxuICAgICAqXG4gICAgICogVmFsdWUgb2YgYCRjb21waWxlUHJvdmlkZXIucHJlQXNzaWduQmluZGluZ3NFbmFibGVkYCAoZmFsc2UgYnkgZGVmYXVsdCBzaW5jZSBhbmd1bGFyIDEuNi4wKVxuICAgICAqIGRldGVybWluZXMgaWYgYmluZGluZ3MgYXJlIHRvIGJlIHByZXNlbnQgaW4gYG9uQ29tcG9uZW50SW5pdGAgbWV0aG9kIChmYWxzZSkgb3IgcHJlLWFzc2lnbmVkXG4gICAgICogaW4gY29uc3RydWN0b3IgKHRydWUpLlxuICAgICAqXG4gICAgICogT3JkZXIgb2YgZXhlY3V0aW9uOlxuICAgICAqIGBgYHRzXG4gICAgICogY2xhc3MgQ2hpbGQgZXh0ZW5kcyBNaWRkbGUge1xuICAgICAqICAgICBwdWJsaWMgcHJvcGVydHlBID0gJ2MnICAgIC8vIDVcbiAgICAgKiAgICAgY29uc3RydWN0b3IoKSB7IHN1cGVyKCkgfSAvLyA2XG4gICAgICogfVxuICAgICAqIGNsYXNzIE1pZGRsZSBleHRlbmRzIEFic3RyYWN0IHtcbiAgICAgKiAgICAgcHVibGljIHByb3BlcnR5QiA9ICdiJyAgICAvLyAzXG4gICAgICogICAgIGNvbnN0cnVjdG9yKCkgeyBzdXBlcigpIH0gLy8gNFxuICAgICAqIH1cbiAgICAgKiBjbGFzcyBBYnN0cmFjdCB7XG4gICAgICogICAgIHB1YmxpYyBwcm9wZXJ0eUEgPSAnYScgICAgLy8gMVxuICAgICAqICAgICBjb25zdHJ1Y3RvcigpIHt9ICAgICAgICAgIC8vIDJcbiAgICAgKiAgICAgb25Db21wb25lbnRJbml0KCkge30gICAgLy8gN1xuICAgICAqIH1cbiAgICAgKiBgYGBcbiAgICAgKi9cbiAgICBwdWJsaWMgb25Db21wb25lbnRJbml0KC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7XG4gICAgICAgIC8vIERlZmF1bHQgaW1wbGVtZW50YXRpb24gZG9lcyBub3RoaW5nLlxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlc3Ryb3lzIHRoZSBjb21wb25lbnQuXG4gICAgICovXG4gICAgcHVibGljIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgICAgIHRoaXMuJHNjb3BlLiRkZXN0cm95KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgaW4gdGhlIGNvbXBpbGUgcGhhc2Ugb2YgdGhlIGRpcmVjdGl2ZSBhbmQgbWF5XG4gICAgICogYmUgb3ZlcnJpZGVuIGJ5IGNvbXBvbmVudCBpbXBsZW1lbnRhdGlvbnMuXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBvbkNvbXBvbmVudENvbXBpbGUoZWxlbWVudDogYW5ndWxhci5JQXVnbWVudGVkSlF1ZXJ5LCBhdHRyaWJ1dGVzOiBhbmd1bGFyLklBdHRyaWJ1dGVzKTogdm9pZCB7XG4gICAgICAgIC8vIERlZmF1bHQgaW1wbGVtZW50YXRpb24gZG9lcyBub3RoaW5nLlxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIHB1YmxpYyBfb25Db21wb25lbnRMaW5rKHNjb3BlOiBhbmd1bGFyLklTY29wZSwgZWxlbWVudDogYW5ndWxhci5JQXVnbWVudGVkSlF1ZXJ5LCBhdHRyaWJ1dGVzOiBhbmd1bGFyLklBdHRyaWJ1dGVzLCAuLi5hcmdzKTogdm9pZCB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBDYWxsIHRoZSBwdWJsaWMgbWV0aG9kIHRoYXQgY2FuIGJlIG92ZXJyaWRlbiBieSB0aGUgdXNlci5cbiAgICAgICAgICAgIHRoaXMub25Db21wb25lbnRMaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRyaWJ1dGVzLCAuLi5hcmdzKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuX3JlYWR5ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkIGluIHRoZSBwb3N0LWxpbmsgcGhhc2Ugb2YgdGhlIGRpcmVjdGl2ZSBhbmQgbWF5XG4gICAgICogYmUgb3ZlcnJpZGVuIGJ5IGNvbXBvbmVudCBpbXBsZW1lbnRhdGlvbnMuXG4gICAgICovXG4gICAgcHVibGljIG9uQ29tcG9uZW50TGluayhzY29wZTogYW5ndWxhci5JU2NvcGUsIGVsZW1lbnQ6IGFuZ3VsYXIuSUF1Z21lbnRlZEpRdWVyeSwgYXR0cmlidXRlczogYW5ndWxhci5JQXR0cmlidXRlcywgLi4uYXJncyk6IHZvaWQge1xuICAgICAgICAvLyBEZWZhdWx0IGltcGxlbWVudGF0aW9uIGRvZXMgbm90aGluZy5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCBhZnRlciB0aGUgY29tcG9uZW50IHNjb3BlIGhhcyBiZWVuIGRlc3Ryb3llZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgb25Db21wb25lbnREZXN0cm95ZWQoKTogdm9pZCB7XG4gICAgICAgIC8vIERlZmF1bHQgaW1wbGVtZW50YXRpb24gZG9lcyBub3RoaW5nLlxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgY29tcG9uZW50IGhhcyBiZWVuIGNyZWF0ZWQuXG4gICAgICovXG4gICAgcHVibGljIGlzUmVhZHkoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZWFkeTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRydWUgaWYgYWxsIHN1YnNjcmlwdGlvbnMgY3JlYXRlZCBieSBjYWxsaW5nIGBzdWJzY3JpYmVgIGFyZSByZWFkeS5cbiAgICAgKiBBIHN1YnNjcmlwdGlvbiBpcyByZWFkeSB3aGVuIGl0IGhhcyByZWNlaXZlZCBpdHMgZmlyc3QgYmF0Y2ggb2YgZGF0YSBhZnRlclxuICAgICAqIHN1YnNjcmliaW5nLlxuICAgICAqL1xuICAgIHB1YmxpYyBzdWJzY3JpcHRpb25zUmVhZHkoKTogYm9vbGVhbiB7XG4gICAgICAgIC8vIFdhaXQgdW50aWwgdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBjcmVhdGVkLlxuICAgICAgICBpZiAoIXRoaXMuaXNSZWFkeSgpKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuIF8uZXZlcnkodGhpcy5fY29tcHV0YXRpb25zLCAoY29tcHV0YXRpb24pID0+IGNvbXB1dGF0aW9uLnN1YnNjcmlwdGlvbnNSZWFkeSgpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jcmVhdGVDb21wdXRhdGlvbihjb250ZW50OiBDb21wdXRhdGlvbkZ1bmN0aW9uID0gXy5ub29wKTogQ29tcHV0YXRpb24ge1xuICAgICAgICBsZXQgY29tcHV0YXRpb24gPSBuZXcgQ29tcHV0YXRpb24odGhpcywgY29udGVudCk7XG4gICAgICAgIHRoaXMuX2NvbXB1dGF0aW9ucy5wdXNoKGNvbXB1dGF0aW9uKTtcbiAgICAgICAgcmV0dXJuIGNvbXB1dGF0aW9uO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFdhdGNoIGNvbXBvbmVudCBzY29wZSBhbmQgcnVuIGEgY29tcHV0YXRpb24gb24gY2hhbmdlcy4gVGhlIGNvbXB1dGF0aW9uIGlzXG4gICAgICogZXhlY3V0ZWQgb25jZSBpbW1lZGlhdGVseSBwcmlvciB0byB3YXRjaGluZy5cbiAgICAgKlxuICAgICAqIFJldHVybmVkIGNvbXB1dGF0aW9uIGluc3RhbmNlIG1heSBiZSB1c2VkIHRvIHN0b3AgdGhlIHdhdGNoIGJ5IGNhbGxpbmcgaXRzXG4gICAgICogW1tDb21wdXRhdGlvbi51bnN1YnNjcmliZV1dIG1ldGhvZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb250ZXh0IEZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhlIGNvbnRleHQgdG8gd2F0Y2hcbiAgICAgKiBAcGFyYW0gY29udGVudCBGdW5jdGlvbiB0byBydW4gb24gY2hhbmdlc1xuICAgICAqIEBwYXJhbSBvYmplY3RFcXVhbGl0eSBTaG91bGQgYGFuZ3VsYXIuZXF1YWxzYCBiZSB1c2VkIGZvciBjb21wYXJpc29uc1xuICAgICAqIEByZXR1cm5zIENvbXB1dGF0aW9uIGluc3RhbmNlXG4gICAgICovXG4gICAgcHVibGljIHdhdGNoKGNvbnRleHQ6IFdhdGNoRXhwcmVzc2lvbiB8IFdhdGNoRXhwcmVzc2lvbltdLFxuICAgICAgICAgICAgICAgICBjb250ZW50OiBDb21wdXRhdGlvbkZ1bmN0aW9uLFxuICAgICAgICAgICAgICAgICBvYmplY3RFcXVhbGl0eT86IGJvb2xlYW4pOiBDb21wdXRhdGlvbiB7XG4gICAgICAgIGxldCBjb21wdXRhdGlvbiA9IHRoaXMuX2NyZWF0ZUNvbXB1dGF0aW9uKGNvbnRlbnQpO1xuICAgICAgICBjb21wdXRhdGlvbi5jb21wdXRlKCk7XG5cbiAgICAgICAgLy8gSW5pdGlhbCBldmFsdWF0aW9uIG1heSBzdG9wIHRoZSBjb21wdXRhdGlvbi4gSW4gdGhpcyBjYXNlLCBkb24ndFxuICAgICAgICAvLyBldmVuIGNyZWF0ZSBhIHdhdGNoIGFuZCBqdXN0IHJldHVybiB0aGUgKGRvbmUpIGNvbXB1dGF0aW9uLlxuICAgICAgICBpZiAoY29tcHV0YXRpb24uaXNEb25lKCkpIHJldHVybiBjb21wdXRhdGlvbjtcblxuICAgICAgICBsZXQgZXhwcmVzc2lvbnMgPSBBcnJheS5pc0FycmF5KGNvbnRleHQpID8gY29udGV4dCA6IFtjb250ZXh0XTtcblxuICAgICAgICBpZiAoIW9iamVjdEVxdWFsaXR5KSB7XG4gICAgICAgICAgICBjb25zdCB1bndhdGNoID0gdGhpcy4kc2NvcGUuJHdhdGNoR3JvdXAoZXhwcmVzc2lvbnMsIGNvbXB1dGF0aW9uLmNvbXB1dGUuYmluZChjb21wdXRhdGlvbikpO1xuICAgICAgICAgICAgY29tcHV0YXRpb24uc2V0RGlzcG9zZUNhbGxiYWNrKHVud2F0Y2gpO1xuICAgICAgICAgICAgcmV0dXJuIGNvbXB1dGF0aW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHdhdGNoZWRFeHByZXNzaW9uOiBXYXRjaEV4cHJlc3Npb24gPSAoKSA9PiBfLm1hcChleHByZXNzaW9ucywgZm4gPT4gZm4oKSk7XG4gICAgICAgIGlmIChleHByZXNzaW9ucy5sZW5ndGggPT09IDEpIHsgLy8gb3B0aW1pemVcbiAgICAgICAgICAgIHdhdGNoZWRFeHByZXNzaW9uID0gZXhwcmVzc2lvbnNbMF07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1bndhdGNoID0gdGhpcy4kc2NvcGUuJHdhdGNoKHdhdGNoZWRFeHByZXNzaW9uLCBjb21wdXRhdGlvbi5jb21wdXRlLmJpbmQoY29tcHV0YXRpb24pLCB0cnVlKTtcbiAgICAgICAgY29tcHV0YXRpb24uc2V0RGlzcG9zZUNhbGxiYWNrKHVud2F0Y2gpO1xuICAgICAgICByZXR1cm4gY29tcHV0YXRpb247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogV2F0Y2ggY29tcG9uZW50IHNjb3BlIGFuZCBydW4gYSBjb21wdXRhdGlvbiBvbiBjaGFuZ2VzLiBUaGlzIHZlcnNpb24gdXNlcyBBbmd1bGFyJ3NcbiAgICAgKiBjb2xsZWN0aW9uIHdhdGNoLiBUaGUgY29tcHV0YXRpb24gaXMgZXhlY3V0ZWQgb25jZSBpbW1lZGlhdGVseSBwcmlvciB0byB3YXRjaGluZy5cbiAgICAgKlxuICAgICAqIFJldHVybmVkIGNvbXB1dGF0aW9uIGluc3RhbmNlIG1heSBiZSB1c2VkIHRvIHN0b3AgdGhlIHdhdGNoIGJ5IGNhbGxpbmcgaXRzXG4gICAgICogW1tDb21wdXRhdGlvbi51bnN1YnNjcmliZV1dIG1ldGhvZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb250ZXh0IEZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhlIGNvbnRleHQgdG8gd2F0Y2hcbiAgICAgKiBAcGFyYW0gY29udGVudCBGdW5jdGlvbiB0byBydW4gb24gY2hhbmdlc1xuICAgICAqIEByZXR1cm5zIENvbXB1dGF0aW9uIGluc3RhbmNlXG4gICAgICovXG4gICAgcHVibGljIHdhdGNoQ29sbGVjdGlvbihjb250ZXh0OiBXYXRjaEV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBDb21wdXRhdGlvbkZ1bmN0aW9uKTogQ29tcHV0YXRpb24ge1xuICAgICAgICBsZXQgY29tcHV0YXRpb24gPSB0aGlzLl9jcmVhdGVDb21wdXRhdGlvbihjb250ZW50KTtcbiAgICAgICAgY29tcHV0YXRpb24uY29tcHV0ZSgpO1xuXG4gICAgICAgIC8vIEluaXRpYWwgZXZhbHVhdGlvbiBtYXkgc3RvcCB0aGUgY29tcHV0YXRpb24uIEluIHRoaXMgY2FzZSwgZG9uJ3RcbiAgICAgICAgLy8gZXZlbiBjcmVhdGUgYSB3YXRjaCBhbmQganVzdCByZXR1cm4gdGhlIChkb25lKSBjb21wdXRhdGlvbi5cbiAgICAgICAgaWYgKGNvbXB1dGF0aW9uLmlzRG9uZSgpKSByZXR1cm4gY29tcHV0YXRpb247XG5cbiAgICAgICAgY29uc3QgdW53YXRjaCA9IHRoaXMuJHNjb3BlLiR3YXRjaENvbGxlY3Rpb24oY29udGV4dCwgY29tcHV0YXRpb24uY29tcHV0ZS5iaW5kKGNvbXB1dGF0aW9uKSk7XG4gICAgICAgIGNvbXB1dGF0aW9uLnNldERpc3Bvc2VDYWxsYmFjayh1bndhdGNoKTtcbiAgICAgICAgcmV0dXJuIGNvbXB1dGF0aW9uO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN1YnNjcmliZXMgdG8gYW4gb2JzZXJ2YWJsZSwgcmVnaXN0ZXJpbmcgdGhlIHN1YnNjcmlwdGlvbiBhcyBhIGRlcGVuZGVuY3lcbiAgICAgKiBvZiB0aGlzIGNvbXBvbmVudC4gVGhlIHN1YnNjcmlwdGlvbiBpcyBhdXRvbWF0aWNhbGx5IHN0b3BwZWQgd2hlbiB0aGVcbiAgICAgKiBjb21wb25lbnQgaXMgZGVzdHJveWVkLlxuICAgICAqXG4gICAgICogRm9yIHRoZSB0YXJnZXQgYXJndW1lbnQsIHlvdSBjYW4gZWl0aGVyIHNwZWNpZnkgYSBzdHJpbmcsIGluIHdoaWNoIGNhc2VcbiAgICAgKiBpdCByZXByZXNlbnRzIHRoZSBuYW1lIG9mIHRoZSBjb21wb25lbnQgbWVtYmVyIHZhcmlhYmxlIHRoYXQgd2lsbCBiZVxuICAgICAqIHBvcHVsYXRlZCB3aXRoIHRoZSByZXN1bHQgaXRlLiBPciB5b3UgY2FuIHNwZWNpZnkgYSBmdW5jdGlvbiB3aXRoIG9uZVxuICAgICAqIGFyZ3VtZW50LCB3aGljaCB3aWxsIGJlIGNhbGxlZCB3aGVuIHF1ZXJ5IHJlc3VsdHMgY2hhbmdlIGFuZCBjYW4gZG9cbiAgICAgKiBhbnl0aGluZy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0YXJnZXQgVGFyZ2V0IGNvbXBvbmVudCBtZW1iZXIgYXRyaWJ1dGUgbmFtZSBvciBjYWxsYmFja1xuICAgICAqIEBwYXJhbSBvYnNlcnZhYmxlIE9ic2VydmFibGUgdG8gc3Vic2NyaWJlIHRvXG4gICAgICogQHJldHVybiBVbmRlcmx5aW5nIHN1YnNjcmlwdGlvblxuICAgICAqL1xuICAgIHB1YmxpYyBzdWJzY3JpYmU8VD4odGFyZ2V0OiBzdHJpbmcgfCAoKGRhdGE6IFQpID0+IGFueSksXG4gICAgICAgICAgICAgICAgICAgICAgICBvYnNlcnZhYmxlOiBSeC5PYnNlcnZhYmxlPFQ+IHwgUHJvbWlzZTxhbnk+LFxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uczogU3Vic2NyaWJlQ29tcG9uZW50T3B0aW9ucyA9IHt9KTogU3Vic2NyaXB0aW9uIHtcbiAgICAgICAgbGV0IGNvbXB1dGF0aW9uID0gdGhpcy5fY3JlYXRlQ29tcHV0YXRpb24oKTtcbiAgICAgICAgY29tcHV0YXRpb24uc3Vic2NyaWJlKHRhcmdldCwgb2JzZXJ2YWJsZSwgb3B0aW9ucyk7XG4gICAgICAgIHJldHVybiBjb21wdXRhdGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVbnN1YnNjcmliZXMgdGhlIGdpdmVuIGNvbXB1dGF0aW9uIGZyb20gdGhpcyBjb21wb25lbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29tcHV0YXRpb24gQ29tcHV0YXRpb24gaW5zdGFuY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgdW5zdWJzY3JpYmUoY29tcHV0YXRpb246IENvbXB1dGF0aW9uKTogdm9pZCB7XG4gICAgICAgIGNvbXB1dGF0aW9uLnN0b3AoKTtcbiAgICAgICAgXy5wdWxsKHRoaXMuX2NvbXB1dGF0aW9ucywgY29tcHV0YXRpb24pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEhlbHBlciBmdW5jdGlvbiB0byBjcmVhdGUgYSB3cmFwcGVyIG9ic2VydmFibGUgYXJvdW5kIHdhdGNoLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbnRleHQgRnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0aGUgY29udGV4dCB0byB3YXRjaFxuICAgICAqIEBwYXJhbSBvYmplY3RFcXVhbGl0eSBTaG91bGQgYGFuZ3VsYXIuZXF1YWxzYCBiZSB1c2VkIGZvciBjb21wYXJpc29uc1xuICAgICAqIEByZXR1cm5zIFdhdGNoIG9ic2VydmFibGVcbiAgICAgKi9cbiAgICBwdWJsaWMgY3JlYXRlV2F0Y2hPYnNlcnZhYmxlPFQ+KGNvbnRleHQ6IFdhdGNoRXhwcmVzc2lvbk9mPFQ+LCBvYmplY3RFcXVhbGl0eT86IGJvb2xlYW4pOiBSeC5PYnNlcnZhYmxlPFQ+IHtcbiAgICAgICAgY29uc3Qgbm90aWZ5T2JzZXJ2ZXIgPSAob2JzZXJ2ZXI6IFJ4Lk9ic2VydmVyPFQ+KSA9PiB7XG4gICAgICAgICAgICBvYnNlcnZlci5vbk5leHQoY29udGV4dCgpKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gUnguT2JzZXJ2YWJsZS5jcmVhdGU8VD4oKG9ic2VydmVyKSA9PiB7XG4gICAgICAgICAgICBub3RpZnlPYnNlcnZlcihvYnNlcnZlcik7XG5cbiAgICAgICAgICAgIGNvbnN0IGNvbXB1dGF0aW9uID0gdGhpcy53YXRjaChcbiAgICAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgICAgICgpID0+IG5vdGlmeU9ic2VydmVyKG9ic2VydmVyKSxcbiAgICAgICAgICAgICAgICBvYmplY3RFcXVhbGl0eVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiAoKSA9PiB7IGNvbXB1dGF0aW9uLnVuc3Vic2NyaWJlKCk7IH07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgY29tcG9uZW50IGNvbmZpZ3VyYXRpb24uXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBnZXRDb25maWcoKTogQ29tcG9uZW50Q29uZmlndXJhdGlvbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fY29tcG9uZW50Q29uZmlnO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgY29tcG9uZW50IGNvbmZpZ3VyYXRpb24uXG4gICAgICovXG4gICAgcHVibGljIGdldENvbmZpZygpOiBDb21wb25lbnRDb25maWd1cmF0aW9uIHtcbiAgICAgICAgcmV0dXJuICg8dHlwZW9mIENvbXBvbmVudEJhc2U+IHRoaXMuY29uc3RydWN0b3IpLmdldENvbmZpZygpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgY29tcG9uZW50IGhhcyBhIHNwZWNpZmllZCBhdHRyaWJ1dGUgY29uZmlndXJlZCBhc1xuICAgICAqIGEgYmluZGluZy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGJvdW5kIGF0dHJpYnV0ZVxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgaGFzQmluZGluZyhuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIF8uc29tZSh0aGlzLl9fY29tcG9uZW50Q29uZmlnLmJpbmRpbmdzLCAodmFsdWUsIGtleSkgPT4ge1xuICAgICAgICAgICAgLy8gSW4gY2FzZSBubyBhdHRyaWJ1dGUgbmFtZSBpcyBzcGVjaWZpZWQsIGNvbXBhcmUgdGhlIGJpbmRpbmcga2V5LFxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlIGNvbXBhcmUgdGhlIGF0dHJpYnV0ZSBuYW1lLlxuICAgICAgICAgICAgY29uc3QgbWF0Y2hlZE5hbWUgPSB2YWx1ZS5yZXBsYWNlKC9eWz1AJjxdXFw/Py8sICcnKTtcbiAgICAgICAgICAgIGNvbnN0IGJvdW5kQXR0cmlidXRlID0gbWF0Y2hlZE5hbWUgfHwga2V5O1xuICAgICAgICAgICAgcmV0dXJuIGJvdW5kQXR0cmlidXRlID09PSBuYW1lO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgdmlldyBjb25maWd1cmF0aW9uIHRoYXQgcmVuZGVycyB0aGlzIGNvbXBvbmVudC4gVGhpcyBtZXRob2QgY2FuIGJlXG4gICAgICogdXNlZCB3aGVuIGNvbmZpZ3VyaW5nIHRoZSBBbmd1bGFyIFVJIHJvdXRlciBhcyBmb2xsb3dzOlxuICAgICAqXG4gICAgICogICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdmb28nLCB7XG4gICAgICogICAgICAgICB1cmw6ICcvZm9vJyxcbiAgICAgKiAgICAgICAgIHZpZXdzOiB7IGFwcGxpY2F0aW9uOiBNeUNvbXBvbmVudC5hc1ZpZXcoKSB9LFxuICAgICAqICAgICB9KTtcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGFzVmlldyhvcHRpb25zOiBDb21wb25lbnRWaWV3T3B0aW9ucyA9IHt9KTogYW55IHtcbiAgICAgICAgbGV0IHRlbXBsYXRlID0gJzwnICsgdGhpcy5fX2NvbXBvbmVudENvbmZpZy5kaXJlY3RpdmU7XG4gICAgICAgIGxldCBhdHRyaWJ1dGVzID0gb3B0aW9ucy5hdHRyaWJ1dGVzIHx8IHt9O1xuXG4gICAgICAgIC8vIFNldHVwIGlucHV0IGJpbmRpbmdzLlxuICAgICAgICBpZiAoIV8uaXNFbXB0eShvcHRpb25zLmlucHV0cykpIHtcbiAgICAgICAgICAgIF8uZm9yT3duKG9wdGlvbnMuaW5wdXRzLCAoaW5wdXQsIGtleSkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIEBpZm5kZWYgR0VOSlNfUFJPRFVDVElPTlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5oYXNCaW5kaW5nKGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEdlbkVycm9yKGBJbnB1dCAnJHtrZXl9JyBpcyBub3QgZGVmaW5lZCBvbiBjb21wb25lbnQuYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEBlbmRpZlxuXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlc1trZXldID0gaW5wdXQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdlbmVyYXRlIGF0dHJpYnV0ZXMuXG4gICAgICAgIGlmICghXy5pc0VtcHR5KGF0dHJpYnV0ZXMpKSB7XG4gICAgICAgICAgICBfLmZvck93bihhdHRyaWJ1dGVzLCAoYXR0cmlidXRlLCBhdHRyaWJ1dGVOYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogUHJvcGVybHkgZXNjYXBlIGF0dHJpYnV0ZSB2YWx1ZXMuXG4gICAgICAgICAgICAgICAgdGVtcGxhdGUgKz0gJyAnICsgXy5rZWJhYkNhc2UoYXR0cmlidXRlTmFtZSkgKyAnPVwiJyArIGF0dHJpYnV0ZSArICdcIic7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0ZW1wbGF0ZSArPSAnPjwvJyArIHRoaXMuX19jb21wb25lbnRDb25maWcuZGlyZWN0aXZlICsgJz4nO1xuXG4gICAgICAgIGxldCByZXN1bHQ6IGFueSA9IHtcbiAgICAgICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBTZXR1cCBwYXJlbnQgc2NvcGUgZm9yIHRoZSBpbnRlcm1lZGlhdGUgdGVtcGxhdGUuXG4gICAgICAgIGlmIChvcHRpb25zLnBhcmVudCkge1xuICAgICAgICAgICAgcmVzdWx0LnNjb3BlID0gb3B0aW9ucy5wYXJlbnQuJHNjb3BlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIF8uZXh0ZW5kKHJlc3VsdCwgb3B0aW9ucy5leHRlbmRXaXRoIHx8IHt9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtcyBhbnkgbW9kaWZpY2F0aW9ucyBvZiB0aGUgY29tcG9uZW50IGNvbmZpZ3VyYXRpb24uIFRoaXMgbWV0aG9kIGlzXG4gICAgICogaW52b2tlZCBkdXJpbmcgY29tcG9uZW50IGNsYXNzIGRlY29yYXRpb24gYW5kIG1heSBhcmJpdHJhcmlseSBtb2RpZnkgdGhlXG4gICAgICogcGFzc2VkIGNvbXBvbmVudCBjb25maWd1cmF0aW9uLCBiZWZvcmUgdGhlIGNvbXBvbmVudCBpcyByZWdpc3RlcmVkIHdpdGhcbiAgICAgKiBBbmd1bGFyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbmZpZyBDb21wb25lbnQgY29uZmlndXJhdGlvblxuICAgICAqIEByZXR1cm4gTW9kaWZpZWQgY29tcG9uZW50IGNvbmZpZ3VyYXRpb25cbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGNvbmZpZ3VyZUNvbXBvbmVudChjb25maWc6IENvbXBvbmVudENvbmZpZ3VyYXRpb24pOiBDb21wb25lbnRDb25maWd1cmF0aW9uIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRpcmVjdGl2ZUZhY3RvcnkoY29uZmlnOiBDb21wb25lbnRDb25maWd1cmF0aW9uLCB0eXBlOiBEaXJlY3RpdmVUeXBlKSB7XG4gICAgcmV0dXJuICh0YXJnZXQ6IHR5cGVvZiBDb21wb25lbnRCYXNlKTogRnVuY3Rpb24gPT4ge1xuICAgICAgICAvLyBTdG9yZSBjb21wb25lbnQgY29uZmlndXJhdGlvbiBvbiB0aGUgY29tcG9uZW50LCBleHRlbmRpbmcgY29uZmlndXJhdGlvbiBvYnRhaW5lZCBmcm9tIGJhc2UgY2xhc3MuXG4gICAgICAgIGlmICh0YXJnZXQuX19jb21wb25lbnRDb25maWcpIHtcbiAgICAgICAgICAgIHRhcmdldC5fX2NvbXBvbmVudENvbmZpZyA9IF8uY2xvbmVEZWVwKHRhcmdldC5fX2NvbXBvbmVudENvbmZpZyk7XG4gICAgICAgICAgICAvLyBEb24ndCBpbmhlcml0IHRoZSBhYnN0cmFjdCBmbGFnIGFzIG90aGVyd2lzZSB5b3Ugd291bGQgYmUgcmVxdWlyZWQgdG8gZXhwbGljaXRseVxuICAgICAgICAgICAgLy8gc2V0IGl0IHRvIGZhbHNlIGluIGFsbCBzdWJjbGFzc2VzLlxuICAgICAgICAgICAgZGVsZXRlIHRhcmdldC5fX2NvbXBvbmVudENvbmZpZy5hYnN0cmFjdDtcblxuICAgICAgICAgICAgXy5tZXJnZSh0YXJnZXQuX19jb21wb25lbnRDb25maWcsIGNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0YXJnZXQuX19jb21wb25lbnRDb25maWcgPSBjb25maWc7XG4gICAgICAgIH1cblxuICAgICAgICBjb25maWcgPSB0YXJnZXQuY29uZmlndXJlQ29tcG9uZW50KHRhcmdldC5fX2NvbXBvbmVudENvbmZpZyk7XG5cbiAgICAgICAgaWYgKCFjb25maWcuYWJzdHJhY3QpIHtcbiAgICAgICAgICAgIC8vIElmIG1vZHVsZSBvciBkaXJlY3RpdmUgaXMgbm90IGRlZmluZWQgZm9yIGEgbm9uLWFic3RyYWN0IGNvbXBvbmVudCwgdGhpcyBpcyBhbiBlcnJvci5cbiAgICAgICAgICAgIGlmICghY29uZmlnLmRpcmVjdGl2ZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihcIkRpcmVjdGl2ZSBub3QgZGVmaW5lZCBmb3IgY29tcG9uZW50LlwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFfLnN0YXJ0c1dpdGgoY29uZmlnLmRpcmVjdGl2ZSwgJ2dlbi0nKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihcIkRpcmVjdGl2ZSBub3QgcHJlZml4ZWQgd2l0aCBcXFwiZ2VuLVxcXCI6IFwiICsgY29uZmlnLmRpcmVjdGl2ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghY29uZmlnLm1vZHVsZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihcIk1vZHVsZSBub3QgZGVmaW5lZCBmb3IgY29tcG9uZW50ICdcIiArIGNvbmZpZy5kaXJlY3RpdmUgKyBcIicuXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoXy5hbnkoY29uZmlnLmJpbmRpbmdzLCAodmFsdWUsIGtleSkgPT4gXy5zdGFydHNXaXRoKHZhbHVlLnN1YnN0cmluZygxKSB8fCBrZXksICdkYXRhJykpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmluZGluZ3Mgc2hvdWxkIG5vdCBzdGFydCB3aXRoICdkYXRhJ1wiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uZmlnLm1vZHVsZS5kaXJlY3RpdmUoXy5jYW1lbENhc2UoY29uZmlnLmRpcmVjdGl2ZSksICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb250cm9sbGVyQmluZGluZyA9IGNvbmZpZy5jb250cm9sbGVyQXMgfHwgJ2N0cmwnO1xuXG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdDogYW5ndWxhci5JRGlyZWN0aXZlID0ge1xuICAgICAgICAgICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IGNvbmZpZy5iaW5kaW5ncyB8fCB7fSxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogPGFueT4gdGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyQXM6IGNvbnRyb2xsZXJCaW5kaW5nLFxuICAgICAgICAgICAgICAgICAgICBjb21waWxlOiAoZWxlbWVudCwgYXR0cmlidXRlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FsbCB0aGUgY29tcGlsZSBsaWZlLWN5Y2xlIHN0YXRpYyBtZXRob2QuXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQub25Db21wb25lbnRDb21waWxlKGVsZW1lbnQsIGF0dHJpYnV0ZXMpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKHNjb3BlLCBlbGVtZW50LCBhdHRyaWJ1dGVzLCAuLi5hcmdzKSA9PiB7IC8vIHRzbGludDpkaXNhYmxlLWxpbmU6bm8tc2hhZG93ZWQtdmFyaWFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZXQgY29udHJvbGxlciBmcm9tIHRoZSBzY29wZSBhbmQgY2FsbCB0aGUgbGluayBsaWZlLWN5Y2xlIG1ldGhvZC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPENvbXBvbmVudEJhc2U+IHNjb3BlW2NvbnRyb2xsZXJCaW5kaW5nXSkuX29uQ29tcG9uZW50TGluayhzY29wZSwgZWxlbWVudCwgYXR0cmlidXRlcywgLi4uYXJncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogY29uZmlnLnRlbXBsYXRlVXJsLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogY29uZmlnLnRlbXBsYXRlLFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlOiBjb25maWcucmVxdWlyZSxcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgRGlyZWN0aXZlVHlwZS5DT01QT05FTlQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5yZXN0cmljdCA9ICdFJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgRGlyZWN0aXZlVHlwZS5BVFRSSUJVVEU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5yZXN0cmljdCA9ICdBJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IHVzZSBlcnJvciBoYW5kbGVyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgR2VuRXJyb3IoYFVua25vd24gdHlwZSAke3R5cGV9YCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH07XG59XG5cbi8qKlxuICogQSBkZWNvcmF0b3IgdGhhdCB0cmFuc2Zvcm1zIHRoZSBkZWNvcmF0ZWQgY2xhc3MgaW50byBhbiBBbmd1bGFySlNcbiAqIGNvbXBvbmVudCBkaXJlY3RpdmUgd2l0aCBwcm9wZXIgZGVwZW5kZW5jeSBpbmplY3Rpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wb25lbnQoY29uZmlnOiBDb21wb25lbnRDb25maWd1cmF0aW9uKTogQ2xhc3NEZWNvcmF0b3Ige1xuICAgIHJldHVybiA8Q2xhc3NEZWNvcmF0b3I+IGRpcmVjdGl2ZUZhY3RvcnkoY29uZmlnLCBEaXJlY3RpdmVUeXBlLkNPTVBPTkVOVCk7XG59XG5cbi8qKlxuICogQSBkZWNvcmF0b3IgdGhhdCB0cmFuc2Zvcm1zIHRoZSBkZWNvcmF0ZWQgY2xhc3MgaW50byBhbiBBbmd1bGFySlNcbiAqIGF0dHJpYnV0ZSBkaXJlY3RpdmUgd2l0aCBwcm9wZXIgZGVwZW5kZW5jeSBpbmplY3Rpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmUoY29uZmlnOiBDb21wb25lbnRDb25maWd1cmF0aW9uKTogQ2xhc3NEZWNvcmF0b3Ige1xuICAgIHJldHVybiA8Q2xhc3NEZWNvcmF0b3I+IGRpcmVjdGl2ZUZhY3RvcnkoY29uZmlnLCBEaXJlY3RpdmVUeXBlLkFUVFJJQlVURSk7XG59XG4iXX0=
