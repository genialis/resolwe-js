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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2NvbXBvbmVudHMvYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlDQUFtQztBQUNuQywwQkFBNEI7QUFDNUIsdUJBQXlCO0FBRXpCLHNDQUF3QztBQUN4Qyx5Q0FBeUM7QUFFekMsSUFBSyxhQUdKO0FBSEQsV0FBSyxhQUFhO0lBQ2QsMkRBQVMsQ0FBQTtJQUNULDJEQUFTLENBQUE7QUFDYixDQUFDLEVBSEksYUFBYSxLQUFiLGFBQWEsUUFHakI7QUE4Q0QsMkJBQTJCLE1BQXNCLEVBQUUsUUFBb0I7SUFDbkUsRUFBRSxDQUFDLENBQVEsTUFBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDN0IsTUFBTSxDQUFDO0lBQ1gsQ0FBQztJQUVELEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ3pDLFFBQVEsRUFBRSxDQUFDO0lBQ2YsQ0FBQztJQUFDLElBQUksQ0FBQyxDQUFDO1FBQ0osTUFBTSxDQUFDLE1BQU0sQ0FBQyxjQUFRLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekMsQ0FBQztBQUNMLENBQUM7QUFFRCxtQkFBc0IsVUFBNEIsRUFBRSxLQUFxQixFQUFFLFFBQTJCO0lBQ2xHLFFBQVEsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxHQUFHLFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBRTVELE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDO1FBQ3hCLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUNqQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQyxJQUFJO1FBQ1IsaUJBQWlCLENBQUMsS0FBSyxFQUFFLGNBQVEsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDeEQsQ0FB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QUM7d0JBQzNCLE1BQU0sQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDO3dCQUN0QixLQUFLLENBQUM7b0JBQ1YsQ0FBQztvQkFDRCxTQUFTLENBQUM7d0JBQ04sMEJBQTBCO3dCQUMxQixNQUFNLElBQUksZ0JBQVEsQ0FBQyxrQkFBZ0IsSUFBTSxDQUFDLENBQUM7b0JBQy9DLENBQUM7Z0JBQ0wsQ0FBQztnQkFFRCxNQUFNLENBQUMsTUFBTSxDQUFDO1lBQ2xCLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztRQUVELE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDbEIsQ0FBQyxDQUFDO0FBQ04sQ0FBQztBQUVEOzs7R0FHRztBQUNILG1CQUEwQixNQUE4QjtJQUNwRCxNQUFNLENBQWtCLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDOUUsQ0FBQztBQUZELDhCQUVDO0FBRUQ7OztHQUdHO0FBQ0gsbUJBQTBCLE1BQThCO0lBQ3BELE1BQU0sQ0FBa0IsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUM5RSxDQUFDO0FBRkQsOEJBRUMiLCJmaWxlIjoiY29yZS9jb21wb25lbnRzL2Jhc2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhbmd1bGFyIGZyb20gJ2FuZ3VsYXInO1xuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgUnggZnJvbSAncngnO1xuXG5pbXBvcnQge2lzUHJvbWlzZX0gZnJvbSAnLi4vdXRpbHMvbGFuZyc7XG5pbXBvcnQge0dlbkVycm9yfSBmcm9tICcuLi9lcnJvcnMvZXJyb3InO1xuXG5lbnVtIERpcmVjdGl2ZVR5cGUge1xuICAgIENPTVBPTkVOVCxcbiAgICBBVFRSSUJVVEVcbn1cblxuLyoqXG4gKiBDb21wb25lbnQgY29uZmlndXJhdGlvbi4gRGlyZWN0aXZlIG5hbWUgc2hvdWxkIGJlIGluIGRhc2gtY2FzZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb21wb25lbnRDb25maWd1cmF0aW9uIHtcbiAgICBhYnN0cmFjdD86IGJvb2xlYW47XG4gICAgbW9kdWxlPzogYW5ndWxhci5JTW9kdWxlO1xuICAgIGRpcmVjdGl2ZT86IHN0cmluZztcbiAgICBiaW5kaW5ncz86IF8uRGljdGlvbmFyeTxzdHJpbmc+O1xuICAgIGNvbnRyb2xsZXJBcz86IHN0cmluZztcbiAgICB0ZW1wbGF0ZVVybD86IHN0cmluZztcbiAgICB0ZW1wbGF0ZT86IHN0cmluZztcbiAgICByZXF1aXJlPzogc3RyaW5nIHwgc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcG9uZW50Vmlld09wdGlvbnMge1xuICAgIGlucHV0cz86IE9iamVjdDtcbiAgICBwYXJlbnQ/OiBDb21wb25lbnRCYXNlO1xuICAgIGF0dHJpYnV0ZXM/OiBPYmplY3Q7XG4gICAgZXh0ZW5kV2l0aD86IE9iamVjdDtcbn1cblxuaW50ZXJmYWNlIFN1YnNjcmlwdGlvbk1hcCB7XG4gICAgW2tleTogc3RyaW5nXTogUnguRGlzcG9zYWJsZTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb21wdXRhdGlvbkZ1bmN0aW9uIHtcbiAgICAoY29tcHV0YXRpb246IENvbXB1dGF0aW9uKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdWJzY3JpcHRpb24ge1xuICAgIHVuc3Vic2NyaWJlKCk6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3Vic2NyaWJlQ29tcG9uZW50T3B0aW9ucyB7XG4gICAgb25lU2hvdD86IGJvb2xlYW47XG4gICAgb25FcnJvcj86IChleGNlcHRpb246IGFueSkgPT4gdm9pZDtcblxuICAgIC8vIFNldCB0aGlzIHRvIHRydWUgdG8gbWFrZSB0aGUgc3Vic2NyaXB0aW9uIGJlIGlnbm9yZWQgd2hlbiBkZXRlcm1pbmluZ1xuICAgIC8vIHdoZXRoZXIgdGhlIGNvbXBvbmVudCBpcyBkb25lIHdhaXRpbmcgZm9yIHN1YnNjcmlwdGlvbnMuXG4gICAgaWdub3JlUmVhZHk/OiBib29sZWFuO1xufVxuXG50eXBlIFN1YnNjcmlwdGlvbkd1YXJkID0ge307XG5cbmZ1bmN0aW9uIHNhZmVDYWxsYmFja0FwcGx5KCRzY29wZTogYW5ndWxhci5JU2NvcGUsIGNhbGxiYWNrOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgaWYgKCg8YW55PiAkc2NvcGUpLiQkZGVzdHJveWVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoJHNjb3BlLiQkcGhhc2UgfHwgJHNjb3BlLiRyb290LiQkcGhhc2UpIHtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAkc2NvcGUuJGFwcGx5KCgpID0+IHsgY2FsbGJhY2soKTsgfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzYWZlQXBwbHk8VD4ob2JzZXJ2YWJsZTogUnguT2JzZXJ2YWJsZTxUPiwgc2NvcGU6IGFuZ3VsYXIuSVNjb3BlLCBjYWxsYmFjazogKGRhdGE6IFQpID0+IHZvaWQpIHtcbiAgICBjYWxsYmFjayA9IGFuZ3VsYXIuaXNGdW5jdGlvbihjYWxsYmFjaykgPyBjYWxsYmFjayA6IF8ubm9vcDtcblxuICAgIHJldHVybiBvYnNlcnZhYmxlLnRha2VXaGlsZSgoKSA9PiB7XG4gICAgICAgIHJldHVybiAhc2NvcGVbJyQkZGVzdHJveWVkJ107XG4gICAgfSkudGFwKChkYXRhKSA9PiB7XG4gICAgICAgIHNhZmVDYWxsYmFja0FwcGx5KHNjb3BlLCAoKSA9PiB7IGNhbGxiYWNrKGRhdGEpOyB9KTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBBYnN0cmFjdGlvbiBvZiBhIGNvbXB1dGF0aW9uIHdpdGggZGVwZW5kZW5jaWVzIHRvIG9ic2VydmFibGVzLlxuICovXG5leHBvcnQgY2xhc3MgQ29tcHV0YXRpb24ge1xuICAgIHByaXZhdGUgX3N1YnNjcmlwdGlvbnM6IFJ4LkRpc3Bvc2FibGVbXTtcbiAgICBwcml2YXRlIF9wZW5kaW5nU3Vic2NyaXB0aW9uczogU3Vic2NyaXB0aW9uR3VhcmRbXTtcbiAgICBwcml2YXRlIF9kaXNwb3NlOiAoKSA9PiB2b2lkO1xuICAgIHByaXZhdGUgX2RvbmU6IGJvb2xlYW47XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RzIGEgbmV3IGNvbXB1dGF0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbXBvbmVudCBPd25pbmcgY29tcG9uZW50XG4gICAgICogQHBhcmFtIGNvbnRlbnQgQ29tcHV0YXRpb24gY29udGVudFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBjb21wb25lbnQ6IENvbXBvbmVudEJhc2UsIHB1YmxpYyBjb250ZW50OiBDb21wdXRhdGlvbkZ1bmN0aW9uKSB7XG4gICAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5fcGVuZGluZ1N1YnNjcmlwdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5fZGlzcG9zZSA9ICgpID0+IHsgLyogRG8gbm90aGluZyBieSBkZWZhdWx0LiAqLyB9O1xuICAgICAgICB0aGlzLl9kb25lID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhpcyBjb21wdXRhdGlvbiBoYXMgZmluaXNoZWQuXG4gICAgICovXG4gICAgcHVibGljIGlzRG9uZSgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RvbmU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyBhbiBhbHRlcm5hdGl2ZSBkaXNwb3NlIGNhbGxiYWNrIGZvciB0aGlzIGNvbXB1dGF0aW9uLiBUaGlzIGNhbGxiYWNrXG4gICAgICogaXMgaW52b2tlZCB3aGVuIFtbdW5zdWJzY3JpYmVdXSBpcyBjYWxsZWQuXG4gICAgICovXG4gICAgcHVibGljIHNldERpc3Bvc2VDYWxsYmFjayhjYWxsYmFjazogKCkgPT4gdm9pZCkge1xuICAgICAgICB0aGlzLl9kaXNwb3NlID0gY2FsbGJhY2s7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3Vic2NyaWJlcyB0byBhbiBvYnNlcnZhYmxlLCByZWdpc3RlcmluZyB0aGUgc3Vic2NyaXB0aW9uIGFzIGEgZGVwZW5kZW5jeVxuICAgICAqIG9mIHRoaXMgY29tcG9uZW50LiBUaGUgc3Vic2NyaXB0aW9uIGlzIGF1dG9tYXRpY2FsbHkgc3RvcHBlZCB3aGVuIHRoZVxuICAgICAqIGNvbXBvbmVudCBpcyBkZXN0cm95ZWQuXG4gICAgICpcbiAgICAgKiBGb3IgdGhlIHRhcmdldCBhcmd1bWVudCwgeW91IGNhbiBlaXRoZXIgc3BlY2lmeSBhIHN0cmluZywgaW4gd2hpY2ggY2FzZVxuICAgICAqIGl0IHJlcHJlc2VudHMgdGhlIG5hbWUgb2YgdGhlIGNvbXBvbmVudCBtZW1iZXIgdmFyaWFibGUgdGhhdCB3aWxsIGJlXG4gICAgICogcG9wdWxhdGVkIHdpdGggdGhlIHJlc3VsdCBpdGUuIE9yIHlvdSBjYW4gc3BlY2lmeSBhIGZ1bmN0aW9uIHdpdGggb25lXG4gICAgICogYXJndW1lbnQsIHdoaWNoIHdpbGwgYmUgY2FsbGVkIHdoZW4gcXVlcnkgcmVzdWx0cyBjaGFuZ2UgYW5kIGNhbiBkb1xuICAgICAqIGFueXRoaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRhcmdldCBUYXJnZXQgY29tcG9uZW50IG1lbWJlciBhdHJpYnV0ZSBuYW1lIG9yIGNhbGxiYWNrXG4gICAgICogQHBhcmFtIG9ic2VydmFibGUgT2JzZXJ2YWJsZSBvciBwcm9taXNlIHRvIHN1YnNjcmliZSB0b1xuICAgICAqIEByZXR1cm4gVW5kZXJseWluZyBzdWJzY3JpcHRpb24gZGlzcG9zYWJsZVxuICAgICAqL1xuICAgIHB1YmxpYyBzdWJzY3JpYmU8VD4odGFyZ2V0OiBzdHJpbmcgfCAoKGRhdGE6IFQpID0+IGFueSksXG4gICAgICAgICAgICAgICAgICAgICAgICBvYnNlcnZhYmxlOiBSeC5PYnNlcnZhYmxlPFQ+IHwgUHJvbWlzZTxhbnk+LFxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uczogU3Vic2NyaWJlQ29tcG9uZW50T3B0aW9ucyA9IHt9KSB7XG4gICAgICAgIC8vIENyZWF0ZSBhIGd1YXJkIG9iamVjdCB0aGF0IGNhbiBiZSByZW1vdmVkIHdoZW4gYSBzdWJzY3JpcHRpb24gaXMgZG9uZS4gV2UgbmVlZFxuICAgICAgICAvLyB0byB1c2UgZ3VhcmQgb2JqZWN0cyBpbnN0ZWFkIG9mIGEgc2ltcGxlIHJlZmVyZW5jZSBjb3VudGVyIGJlY2F1c2UgdGhlIHBlbmRpbmdcbiAgICAgICAgLy8gc3Vic2NyaXB0aW9ucyBhcnJheSBtYXkgYmUgY2xlYXJlZCB3aGlsZSBjYWxsYmFja3MgYXJlIHN0aWxsIG91dHN0YW5kaW5nLlxuICAgICAgICBjb25zdCBndWFyZCA9IG5ldyBPYmplY3QoKTtcbiAgICAgICAgaWYgKCFvcHRpb25zLmlnbm9yZVJlYWR5KSB7XG4gICAgICAgICAgICB0aGlzLl9wZW5kaW5nU3Vic2NyaXB0aW9ucy5wdXNoKGd1YXJkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjb252ZXJ0ZWRPYnNlcnZhYmxlOiBSeC5PYnNlcnZhYmxlPFQ+O1xuICAgICAgICBpZiAoaXNQcm9taXNlKG9ic2VydmFibGUpKSB7XG4gICAgICAgICAgICBjb252ZXJ0ZWRPYnNlcnZhYmxlID0gUnguT2JzZXJ2YWJsZS5mcm9tUHJvbWlzZShvYnNlcnZhYmxlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnZlcnRlZE9ic2VydmFibGUgPSBvYnNlcnZhYmxlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVsZWFzZUd1YXJkID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fcGVuZGluZ1N1YnNjcmlwdGlvbnMgPSBfLndpdGhvdXQodGhpcy5fcGVuZGluZ1N1YnNjcmlwdGlvbnMsIGd1YXJkKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29udmVydGVkT2JzZXJ2YWJsZSA9IGNvbnZlcnRlZE9ic2VydmFibGUudGFwKHJlbGVhc2VHdWFyZCwgcmVsZWFzZUd1YXJkKTtcblxuICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBzYWZlQXBwbHkoXG4gICAgICAgICAgICBjb252ZXJ0ZWRPYnNlcnZhYmxlLFxuICAgICAgICAgICAgdGhpcy5jb21wb25lbnQuJHNjb3BlLFxuICAgICAgICAgICAgKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKHRhcmdldCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldChpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29tcG9uZW50W3RhcmdldF0gPSBpdGVtO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignSWdub3JlZCBlcnJvcicsIGV4Y2VwdGlvbik7XG4gICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRGlzcG9zZSBvZiB0aGUgc3Vic2NyaXB0aW9uIGltbWVkaWF0ZWx5IGlmIHRoaXMgaXMgYSBvbmUgc2hvdCBzdWJzY3JpcHRpb24uXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLm9uZVNob3QgJiYgc3Vic2NyaXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICApLnN1YnNjcmliZShcbiAgICAgICAgICAgIC8vIFN1Y2Nlc3MgaGFuZGxlci5cbiAgICAgICAgICAgIF8ubm9vcCxcbiAgICAgICAgICAgIC8vIEVycm9yIGhhbmRsZXIuXG4gICAgICAgICAgICAoZXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMub25FcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAvLyBAaWZuZGVmIEdFTkpTX1BST0RVQ1RJT05cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdIYW5kbGVkIGVycm9yJywgZXhjZXB0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQGVuZGlmXG4gICAgICAgICAgICAgICAgICAgIHNhZmVDYWxsYmFja0FwcGx5KHRoaXMuY29tcG9uZW50LiRzY29wZSwgKCkgPT4geyBvcHRpb25zLm9uRXJyb3IoZXhjZXB0aW9uKTsgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdVbmhhbmRsZWQgZXJyb3InLCBleGNlcHRpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgICAgICB0aGlzLl9zdWJzY3JpcHRpb25zLnB1c2goc3Vic2NyaXB0aW9uKTtcbiAgICAgICAgcmV0dXJuIHN1YnNjcmlwdGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRydWUgaWYgYWxsIHN1YnNjcmlwdGlvbnMgY3JlYXRlZCBieSBjYWxsaW5nIGBzdWJzY3JpYmVgIGFyZSByZWFkeS5cbiAgICAgKiBBIHN1YnNjcmlwdGlvbiBpcyByZWFkeSB3aGVuIGl0IGhhcyByZWNlaXZlZCBpdHMgZmlyc3QgYmF0Y2ggb2YgZGF0YSBhZnRlclxuICAgICAqIHN1YnNjcmliaW5nLlxuICAgICAqL1xuICAgIHB1YmxpYyBzdWJzY3JpcHRpb25zUmVhZHkoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wZW5kaW5nU3Vic2NyaXB0aW9ucy5sZW5ndGggPT09IDA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUnVucyB0aGUgY29tcHV0YXRpb24uXG4gICAgICovXG4gICAgcHVibGljIGNvbXB1dGUoKSB7XG4gICAgICAgIC8vIFN0b3AgYWxsIHN1YnNjcmlwdGlvbnMgYmVmb3JlIHJ1bm5pbmcgYWdhaW4uXG4gICAgICAgIHRoaXMuc3RvcCgpO1xuICAgICAgICB0aGlzLmNvbnRlbnQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGlzcG9zZXMgb2YgYWxsIHJlZ2lzdGVyZWQgc3Vic2NyaXB0aW9ucy5cbiAgICAgKi9cbiAgICBwdWJsaWMgc3RvcCgpIHtcbiAgICAgICAgZm9yIChsZXQgc3Vic2NyaXB0aW9uIG9mIHRoaXMuX3N1YnNjcmlwdGlvbnMpIHtcbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IFtdO1xuICAgICAgICB0aGlzLl9wZW5kaW5nU3Vic2NyaXB0aW9ucyA9IFtdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0b3BzIGFsbCBzdWJzY3JpcHRpb25zIGN1cnJlbnRseSByZWdpc3RlcmVkIGluIHRoaXMgY29tcHV0YXRpb24gYW5kIHJlbW92ZXNcbiAgICAgKiB0aGlzIGNvbXB1dGF0aW9uIGZyb20gdGhlIHBhcmVudCBjb21wb25lbnQuIElmIGEgZGlzcG9zZSBoYW5kbGVyIGhhcyBiZWVuXG4gICAgICogY29uZmlndXJlZCwgaXQgaXMgaW52b2tlZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgdW5zdWJzY3JpYmUoKSB7XG4gICAgICAgIHRoaXMuY29tcG9uZW50LnVuc3Vic2NyaWJlKHRoaXMpO1xuICAgICAgICBpZiAodGhpcy5fZGlzcG9zZSkgdGhpcy5fZGlzcG9zZSgpO1xuICAgICAgICB0aGlzLl9kb25lID0gdHJ1ZTtcbiAgICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgV2F0Y2hFeHByZXNzaW9uT2Y8VD4ge1xuICAgICgpOiBUO1xufVxuZXhwb3J0IHR5cGUgV2F0Y2hFeHByZXNzaW9uID0gV2F0Y2hFeHByZXNzaW9uT2Y8e30+O1xuXG4vKipcbiAqIEFuIGFic3RyYWN0IGJhc2UgY2xhc3MgZm9yIGFsbCBjb21wb25lbnRzLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQ29tcG9uZW50QmFzZSB7XG4gICAgLy8gQ29tcG9uZW50IGNvbmZpZ3VyYXRpb24uXG4gICAgcHVibGljIHN0YXRpYyBfX2NvbXBvbmVudENvbmZpZzogQ29tcG9uZW50Q29uZmlndXJhdGlvbjtcbiAgICAvLyBDb21wdXRhdGlvbnMuXG4gICAgcHJpdmF0ZSBfY29tcHV0YXRpb25zOiBDb21wdXRhdGlvbltdID0gW107XG4gICAgLy8gQ29tcG9uZW50IHN0YXRlLlxuICAgIHByaXZhdGUgX3JlYWR5OiBib29sZWFuID0gZmFsc2U7XG5cbiAgICAvLyBAbmdJbmplY3RcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgJHNjb3BlOiBhbmd1bGFyLklTY29wZSkge1xuICAgICAgICAkc2NvcGUuJG9uKCckZGVzdHJveScsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3JlYWR5ID0gZmFsc2U7XG5cbiAgICAgICAgICAgIC8vIEVuc3VyZSB0aGF0IGFsbCBjb21wdXRhdGlvbnMgZ2V0IHN0b3BwZWQgd2hlbiB0aGUgY29tcG9uZW50IGlzIGRlc3Ryb3llZC5cbiAgICAgICAgICAgIGZvciAobGV0IGNvbXB1dGF0aW9uIG9mIHRoaXMuX2NvbXB1dGF0aW9ucykge1xuICAgICAgICAgICAgICAgIGNvbXB1dGF0aW9uLnN0b3AoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2NvbXB1dGF0aW9ucyA9IFtdO1xuXG4gICAgICAgICAgICAvLyBDYWxsIGRlc3Ryb3llZCBob29rLlxuICAgICAgICAgICAgdGhpcy5vbkNvbXBvbmVudERlc3Ryb3llZCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBBbmd1bGFyIGNhbGxzICRvbkluaXQgYWZ0ZXIgY29uc3RydWN0b3IgYW5kIGJpbmRpbmdzIGluaXRpYWxpemF0aW9uLlxuICAgICAgICB0aGlzWyckb25Jbml0J10gPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm9uQ29tcG9uZW50SW5pdCgpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkIGFmdGVyIHRoZSB3aG9sZSBjaGFpbiBvZiBjb25zdHJ1Y3RvcnMgaXMgZXhlY3V0ZWQsXG4gICAgICogdmlhIGFuZ3VsYXIgY29tcG9uZW50ICRvbkluaXQuIFVzZSBpdCBpZiB5b3UgaGF2ZSBhbiBhYnN0cmFjdCBjb21wb25lbnQgdGhhdFxuICAgICAqIG1hbmlwdWxhdGVzIGNsYXNzIHByb3BlcnRpZXMgYW5kLCBhcyBhIHJlc3VsdCwgbmVlZHMgdG8gd2FpdCBmb3IgYWxsIGNoaWxkXG4gICAgICogY2xhc3MgcHJvcGVydGllcyB0byBiZSBhc3NpZ25lZCBhbmQgY29uc3RydWN0b3JzIHRvIGZpbmlzaC4gKENsYXNzIHByb3BlcnRpZXNcbiAgICAgKiBkZWZpbmVkIGluIGNoaWxkIGNvbXBvbmVudHMgYXJlIGFzc2lnbmVkIGJlZm9yZSBjaGlsZCdzIGNvbnN0cnVjdG9yKS5cbiAgICAgKlxuICAgICAqIE9yZGVyIG9mIGV4ZWN1dGlvbjpcbiAgICAgKiBgYGB0c1xuICAgICAqIGNsYXNzIENoaWxkIGV4dGVuZHMgTWlkZGxlIHtcbiAgICAgKiAgICAgcHVibGljIHByb3BlcnR5QSA9ICdjJyAgICAvLyA1XG4gICAgICogICAgIGNvbnN0cnVjdG9yKCkgeyBzdXBlcigpIH0gLy8gNlxuICAgICAqIH1cbiAgICAgKiBjbGFzcyBNaWRkbGUgZXh0ZW5kcyBBYnN0cmFjdCB7XG4gICAgICogICAgIHB1YmxpYyBwcm9wZXJ0eUIgPSAnYicgICAgLy8gM1xuICAgICAqICAgICBjb25zdHJ1Y3RvcigpIHsgc3VwZXIoKSB9IC8vIDRcbiAgICAgKiB9XG4gICAgICogY2xhc3MgQWJzdHJhY3Qge1xuICAgICAqICAgICBwdWJsaWMgcHJvcGVydHlBID0gJ2EnICAgIC8vIDFcbiAgICAgKiAgICAgY29uc3RydWN0b3IoKSB7fSAgICAgICAgICAvLyAyXG4gICAgICogICAgIG9uQ29tcG9uZW50SW5pdCgpIHt9ICAgIC8vIDdcbiAgICAgKiB9XG4gICAgICogYGBgXG4gICAgICovXG4gICAgcHVibGljIG9uQ29tcG9uZW50SW5pdCgpIHtcbiAgICAgICAgLy8gRGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBkb2VzIG5vdGhpbmcuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVzdHJveXMgdGhlIGNvbXBvbmVudC5cbiAgICAgKi9cbiAgICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kc2NvcGUuJGRlc3Ryb3koKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCBpbiB0aGUgY29tcGlsZSBwaGFzZSBvZiB0aGUgZGlyZWN0aXZlIGFuZCBtYXlcbiAgICAgKiBiZSBvdmVycmlkZW4gYnkgY29tcG9uZW50IGltcGxlbWVudGF0aW9ucy5cbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIG9uQ29tcG9uZW50Q29tcGlsZShlbGVtZW50OiBhbmd1bGFyLklBdWdtZW50ZWRKUXVlcnksIGF0dHJpYnV0ZXM6IGFuZ3VsYXIuSUF0dHJpYnV0ZXMpOiB2b2lkIHtcbiAgICAgICAgLy8gRGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBkb2VzIG5vdGhpbmcuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgcHVibGljIF9vbkNvbXBvbmVudExpbmsoc2NvcGU6IGFuZ3VsYXIuSVNjb3BlLCBlbGVtZW50OiBhbmd1bGFyLklBdWdtZW50ZWRKUXVlcnksIGF0dHJpYnV0ZXM6IGFuZ3VsYXIuSUF0dHJpYnV0ZXMsIC4uLmFyZ3MpOiB2b2lkIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIENhbGwgdGhlIHB1YmxpYyBtZXRob2QgdGhhdCBjYW4gYmUgb3ZlcnJpZGVuIGJ5IHRoZSB1c2VyLlxuICAgICAgICAgICAgdGhpcy5vbkNvbXBvbmVudExpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJpYnV0ZXMsIC4uLmFyZ3MpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5fcmVhZHkgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgaW4gdGhlIHBvc3QtbGluayBwaGFzZSBvZiB0aGUgZGlyZWN0aXZlIGFuZCBtYXlcbiAgICAgKiBiZSBvdmVycmlkZW4gYnkgY29tcG9uZW50IGltcGxlbWVudGF0aW9ucy5cbiAgICAgKi9cbiAgICBwdWJsaWMgb25Db21wb25lbnRMaW5rKHNjb3BlOiBhbmd1bGFyLklTY29wZSwgZWxlbWVudDogYW5ndWxhci5JQXVnbWVudGVkSlF1ZXJ5LCBhdHRyaWJ1dGVzOiBhbmd1bGFyLklBdHRyaWJ1dGVzLCAuLi5hcmdzKTogdm9pZCB7XG4gICAgICAgIC8vIERlZmF1bHQgaW1wbGVtZW50YXRpb24gZG9lcyBub3RoaW5nLlxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkIGFmdGVyIHRoZSBjb21wb25lbnQgc2NvcGUgaGFzIGJlZW4gZGVzdHJveWVkLlxuICAgICAqL1xuICAgIHB1YmxpYyBvbkNvbXBvbmVudERlc3Ryb3llZCgpOiB2b2lkIHtcbiAgICAgICAgLy8gRGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBkb2VzIG5vdGhpbmcuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0cnVlIGlmIHRoZSBjb21wb25lbnQgaGFzIGJlZW4gY3JlYXRlZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgaXNSZWFkeSgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlYWR5O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiBhbGwgc3Vic2NyaXB0aW9ucyBjcmVhdGVkIGJ5IGNhbGxpbmcgYHN1YnNjcmliZWAgYXJlIHJlYWR5LlxuICAgICAqIEEgc3Vic2NyaXB0aW9uIGlzIHJlYWR5IHdoZW4gaXQgaGFzIHJlY2VpdmVkIGl0cyBmaXJzdCBiYXRjaCBvZiBkYXRhIGFmdGVyXG4gICAgICogc3Vic2NyaWJpbmcuXG4gICAgICovXG4gICAgcHVibGljIHN1YnNjcmlwdGlvbnNSZWFkeSgpOiBib29sZWFuIHtcbiAgICAgICAgLy8gV2FpdCB1bnRpbCB0aGUgY29tcG9uZW50IGhhcyBiZWVuIGNyZWF0ZWQuXG4gICAgICAgIGlmICghdGhpcy5pc1JlYWR5KCkpIHJldHVybiBmYWxzZTtcblxuICAgICAgICByZXR1cm4gXy5ldmVyeSh0aGlzLl9jb21wdXRhdGlvbnMsIChjb21wdXRhdGlvbikgPT4gY29tcHV0YXRpb24uc3Vic2NyaXB0aW9uc1JlYWR5KCkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2NyZWF0ZUNvbXB1dGF0aW9uKGNvbnRlbnQ6IENvbXB1dGF0aW9uRnVuY3Rpb24gPSBfLm5vb3ApOiBDb21wdXRhdGlvbiB7XG4gICAgICAgIGxldCBjb21wdXRhdGlvbiA9IG5ldyBDb21wdXRhdGlvbih0aGlzLCBjb250ZW50KTtcbiAgICAgICAgdGhpcy5fY29tcHV0YXRpb25zLnB1c2goY29tcHV0YXRpb24pO1xuICAgICAgICByZXR1cm4gY29tcHV0YXRpb247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogV2F0Y2ggY29tcG9uZW50IHNjb3BlIGFuZCBydW4gYSBjb21wdXRhdGlvbiBvbiBjaGFuZ2VzLiBUaGUgY29tcHV0YXRpb24gaXNcbiAgICAgKiBleGVjdXRlZCBvbmNlIGltbWVkaWF0ZWx5IHByaW9yIHRvIHdhdGNoaW5nLlxuICAgICAqXG4gICAgICogUmV0dXJuZWQgY29tcHV0YXRpb24gaW5zdGFuY2UgbWF5IGJlIHVzZWQgdG8gc3RvcCB0aGUgd2F0Y2ggYnkgY2FsbGluZyBpdHNcbiAgICAgKiBbW0NvbXB1dGF0aW9uLnVuc3Vic2NyaWJlXV0gbWV0aG9kLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbnRleHQgRnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0aGUgY29udGV4dCB0byB3YXRjaFxuICAgICAqIEBwYXJhbSBjb250ZW50IEZ1bmN0aW9uIHRvIHJ1biBvbiBjaGFuZ2VzXG4gICAgICogQHBhcmFtIG9iamVjdEVxdWFsaXR5IFNob3VsZCBgYW5ndWxhci5lcXVhbHNgIGJlIHVzZWQgZm9yIGNvbXBhcmlzb25zXG4gICAgICogQHJldHVybnMgQ29tcHV0YXRpb24gaW5zdGFuY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgd2F0Y2goY29udGV4dDogV2F0Y2hFeHByZXNzaW9uIHwgV2F0Y2hFeHByZXNzaW9uW10sXG4gICAgICAgICAgICAgICAgIGNvbnRlbnQ6IENvbXB1dGF0aW9uRnVuY3Rpb24sXG4gICAgICAgICAgICAgICAgIG9iamVjdEVxdWFsaXR5PzogYm9vbGVhbik6IENvbXB1dGF0aW9uIHtcbiAgICAgICAgbGV0IGNvbXB1dGF0aW9uID0gdGhpcy5fY3JlYXRlQ29tcHV0YXRpb24oY29udGVudCk7XG4gICAgICAgIGNvbXB1dGF0aW9uLmNvbXB1dGUoKTtcblxuICAgICAgICAvLyBJbml0aWFsIGV2YWx1YXRpb24gbWF5IHN0b3AgdGhlIGNvbXB1dGF0aW9uLiBJbiB0aGlzIGNhc2UsIGRvbid0XG4gICAgICAgIC8vIGV2ZW4gY3JlYXRlIGEgd2F0Y2ggYW5kIGp1c3QgcmV0dXJuIHRoZSAoZG9uZSkgY29tcHV0YXRpb24uXG4gICAgICAgIGlmIChjb21wdXRhdGlvbi5pc0RvbmUoKSkgcmV0dXJuIGNvbXB1dGF0aW9uO1xuXG4gICAgICAgIGxldCBleHByZXNzaW9ucyA9IEFycmF5LmlzQXJyYXkoY29udGV4dCkgPyBjb250ZXh0IDogW2NvbnRleHRdO1xuXG4gICAgICAgIGlmICghb2JqZWN0RXF1YWxpdHkpIHtcbiAgICAgICAgICAgIGNvbnN0IHVud2F0Y2ggPSB0aGlzLiRzY29wZS4kd2F0Y2hHcm91cChleHByZXNzaW9ucywgY29tcHV0YXRpb24uY29tcHV0ZS5iaW5kKGNvbXB1dGF0aW9uKSk7XG4gICAgICAgICAgICBjb21wdXRhdGlvbi5zZXREaXNwb3NlQ2FsbGJhY2sodW53YXRjaCk7XG4gICAgICAgICAgICByZXR1cm4gY29tcHV0YXRpb247XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgd2F0Y2hlZEV4cHJlc3Npb246IFdhdGNoRXhwcmVzc2lvbiA9ICgpID0+IF8ubWFwKGV4cHJlc3Npb25zLCBmbiA9PiBmbigpKTtcbiAgICAgICAgaWYgKGV4cHJlc3Npb25zLmxlbmd0aCA9PT0gMSkgeyAvLyBvcHRpbWl6ZVxuICAgICAgICAgICAgd2F0Y2hlZEV4cHJlc3Npb24gPSBleHByZXNzaW9uc1swXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHVud2F0Y2ggPSB0aGlzLiRzY29wZS4kd2F0Y2god2F0Y2hlZEV4cHJlc3Npb24sIGNvbXB1dGF0aW9uLmNvbXB1dGUuYmluZChjb21wdXRhdGlvbiksIHRydWUpO1xuICAgICAgICBjb21wdXRhdGlvbi5zZXREaXNwb3NlQ2FsbGJhY2sodW53YXRjaCk7XG4gICAgICAgIHJldHVybiBjb21wdXRhdGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBXYXRjaCBjb21wb25lbnQgc2NvcGUgYW5kIHJ1biBhIGNvbXB1dGF0aW9uIG9uIGNoYW5nZXMuIFRoaXMgdmVyc2lvbiB1c2VzIEFuZ3VsYXInc1xuICAgICAqIGNvbGxlY3Rpb24gd2F0Y2guIFRoZSBjb21wdXRhdGlvbiBpcyBleGVjdXRlZCBvbmNlIGltbWVkaWF0ZWx5IHByaW9yIHRvIHdhdGNoaW5nLlxuICAgICAqXG4gICAgICogUmV0dXJuZWQgY29tcHV0YXRpb24gaW5zdGFuY2UgbWF5IGJlIHVzZWQgdG8gc3RvcCB0aGUgd2F0Y2ggYnkgY2FsbGluZyBpdHNcbiAgICAgKiBbW0NvbXB1dGF0aW9uLnVuc3Vic2NyaWJlXV0gbWV0aG9kLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbnRleHQgRnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0aGUgY29udGV4dCB0byB3YXRjaFxuICAgICAqIEBwYXJhbSBjb250ZW50IEZ1bmN0aW9uIHRvIHJ1biBvbiBjaGFuZ2VzXG4gICAgICogQHJldHVybnMgQ29tcHV0YXRpb24gaW5zdGFuY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgd2F0Y2hDb2xsZWN0aW9uKGNvbnRleHQ6IFdhdGNoRXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IENvbXB1dGF0aW9uRnVuY3Rpb24pOiBDb21wdXRhdGlvbiB7XG4gICAgICAgIGxldCBjb21wdXRhdGlvbiA9IHRoaXMuX2NyZWF0ZUNvbXB1dGF0aW9uKGNvbnRlbnQpO1xuICAgICAgICBjb21wdXRhdGlvbi5jb21wdXRlKCk7XG5cbiAgICAgICAgLy8gSW5pdGlhbCBldmFsdWF0aW9uIG1heSBzdG9wIHRoZSBjb21wdXRhdGlvbi4gSW4gdGhpcyBjYXNlLCBkb24ndFxuICAgICAgICAvLyBldmVuIGNyZWF0ZSBhIHdhdGNoIGFuZCBqdXN0IHJldHVybiB0aGUgKGRvbmUpIGNvbXB1dGF0aW9uLlxuICAgICAgICBpZiAoY29tcHV0YXRpb24uaXNEb25lKCkpIHJldHVybiBjb21wdXRhdGlvbjtcblxuICAgICAgICBjb25zdCB1bndhdGNoID0gdGhpcy4kc2NvcGUuJHdhdGNoQ29sbGVjdGlvbihjb250ZXh0LCBjb21wdXRhdGlvbi5jb21wdXRlLmJpbmQoY29tcHV0YXRpb24pKTtcbiAgICAgICAgY29tcHV0YXRpb24uc2V0RGlzcG9zZUNhbGxiYWNrKHVud2F0Y2gpO1xuICAgICAgICByZXR1cm4gY29tcHV0YXRpb247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3Vic2NyaWJlcyB0byBhbiBvYnNlcnZhYmxlLCByZWdpc3RlcmluZyB0aGUgc3Vic2NyaXB0aW9uIGFzIGEgZGVwZW5kZW5jeVxuICAgICAqIG9mIHRoaXMgY29tcG9uZW50LiBUaGUgc3Vic2NyaXB0aW9uIGlzIGF1dG9tYXRpY2FsbHkgc3RvcHBlZCB3aGVuIHRoZVxuICAgICAqIGNvbXBvbmVudCBpcyBkZXN0cm95ZWQuXG4gICAgICpcbiAgICAgKiBGb3IgdGhlIHRhcmdldCBhcmd1bWVudCwgeW91IGNhbiBlaXRoZXIgc3BlY2lmeSBhIHN0cmluZywgaW4gd2hpY2ggY2FzZVxuICAgICAqIGl0IHJlcHJlc2VudHMgdGhlIG5hbWUgb2YgdGhlIGNvbXBvbmVudCBtZW1iZXIgdmFyaWFibGUgdGhhdCB3aWxsIGJlXG4gICAgICogcG9wdWxhdGVkIHdpdGggdGhlIHJlc3VsdCBpdGUuIE9yIHlvdSBjYW4gc3BlY2lmeSBhIGZ1bmN0aW9uIHdpdGggb25lXG4gICAgICogYXJndW1lbnQsIHdoaWNoIHdpbGwgYmUgY2FsbGVkIHdoZW4gcXVlcnkgcmVzdWx0cyBjaGFuZ2UgYW5kIGNhbiBkb1xuICAgICAqIGFueXRoaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRhcmdldCBUYXJnZXQgY29tcG9uZW50IG1lbWJlciBhdHJpYnV0ZSBuYW1lIG9yIGNhbGxiYWNrXG4gICAgICogQHBhcmFtIG9ic2VydmFibGUgT2JzZXJ2YWJsZSB0byBzdWJzY3JpYmUgdG9cbiAgICAgKiBAcmV0dXJuIFVuZGVybHlpbmcgc3Vic2NyaXB0aW9uXG4gICAgICovXG4gICAgcHVibGljIHN1YnNjcmliZTxUPih0YXJnZXQ6IHN0cmluZyB8ICgoZGF0YTogVCkgPT4gYW55KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ic2VydmFibGU6IFJ4Lk9ic2VydmFibGU8VD4gfCBQcm9taXNlPGFueT4sXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiBTdWJzY3JpYmVDb21wb25lbnRPcHRpb25zID0ge30pOiBTdWJzY3JpcHRpb24ge1xuICAgICAgICBsZXQgY29tcHV0YXRpb24gPSB0aGlzLl9jcmVhdGVDb21wdXRhdGlvbigpO1xuICAgICAgICBjb21wdXRhdGlvbi5zdWJzY3JpYmUodGFyZ2V0LCBvYnNlcnZhYmxlLCBvcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIGNvbXB1dGF0aW9uO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVuc3Vic2NyaWJlcyB0aGUgZ2l2ZW4gY29tcHV0YXRpb24gZnJvbSB0aGlzIGNvbXBvbmVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb21wdXRhdGlvbiBDb21wdXRhdGlvbiBpbnN0YW5jZVxuICAgICAqL1xuICAgIHB1YmxpYyB1bnN1YnNjcmliZShjb21wdXRhdGlvbjogQ29tcHV0YXRpb24pOiB2b2lkIHtcbiAgICAgICAgY29tcHV0YXRpb24uc3RvcCgpO1xuICAgICAgICBfLnB1bGwodGhpcy5fY29tcHV0YXRpb25zLCBjb21wdXRhdGlvbik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSGVscGVyIGZ1bmN0aW9uIHRvIGNyZWF0ZSBhIHdyYXBwZXIgb2JzZXJ2YWJsZSBhcm91bmQgd2F0Y2guXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29udGV4dCBGdW5jdGlvbiB3aGljaCByZXR1cm5zIHRoZSBjb250ZXh0IHRvIHdhdGNoXG4gICAgICogQHBhcmFtIG9iamVjdEVxdWFsaXR5IFNob3VsZCBgYW5ndWxhci5lcXVhbHNgIGJlIHVzZWQgZm9yIGNvbXBhcmlzb25zXG4gICAgICogQHJldHVybnMgV2F0Y2ggb2JzZXJ2YWJsZVxuICAgICAqL1xuICAgIHB1YmxpYyBjcmVhdGVXYXRjaE9ic2VydmFibGU8VD4oY29udGV4dDogV2F0Y2hFeHByZXNzaW9uT2Y8VD4sIG9iamVjdEVxdWFsaXR5PzogYm9vbGVhbik6IFJ4Lk9ic2VydmFibGU8VD4ge1xuICAgICAgICBjb25zdCBub3RpZnlPYnNlcnZlciA9IChvYnNlcnZlcjogUnguT2JzZXJ2ZXI8VD4pID0+IHtcbiAgICAgICAgICAgIG9ic2VydmVyLm9uTmV4dChjb250ZXh0KCkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBSeC5PYnNlcnZhYmxlLmNyZWF0ZTxUPigob2JzZXJ2ZXIpID0+IHtcbiAgICAgICAgICAgIG5vdGlmeU9ic2VydmVyKG9ic2VydmVyKTtcblxuICAgICAgICAgICAgY29uc3QgY29tcHV0YXRpb24gPSB0aGlzLndhdGNoKFxuICAgICAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICAgICAgKCkgPT4gbm90aWZ5T2JzZXJ2ZXIob2JzZXJ2ZXIpLFxuICAgICAgICAgICAgICAgIG9iamVjdEVxdWFsaXR5XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuICgpID0+IHsgY29tcHV0YXRpb24udW5zdWJzY3JpYmUoKTsgfTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBjb21wb25lbnQgY29uZmlndXJhdGlvbi5cbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGdldENvbmZpZygpOiBDb21wb25lbnRDb25maWd1cmF0aW9uIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19jb21wb25lbnRDb25maWc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBjb21wb25lbnQgY29uZmlndXJhdGlvbi5cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0Q29uZmlnKCk6IENvbXBvbmVudENvbmZpZ3VyYXRpb24ge1xuICAgICAgICByZXR1cm4gKDx0eXBlb2YgQ29tcG9uZW50QmFzZT4gdGhpcy5jb25zdHJ1Y3RvcikuZ2V0Q29uZmlnKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0cnVlIGlmIHRoZSBjb21wb25lbnQgaGFzIGEgc3BlY2lmaWVkIGF0dHJpYnV0ZSBjb25maWd1cmVkIGFzXG4gICAgICogYSBiaW5kaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgYm91bmQgYXR0cmlidXRlXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBoYXNCaW5kaW5nKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gXy5zb21lKHRoaXMuX19jb21wb25lbnRDb25maWcuYmluZGluZ3MsICh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICAgICAgICAvLyBJbiBjYXNlIG5vIGF0dHJpYnV0ZSBuYW1lIGlzIHNwZWNpZmllZCwgY29tcGFyZSB0aGUgYmluZGluZyBrZXksXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UgY29tcGFyZSB0aGUgYXR0cmlidXRlIG5hbWUuXG4gICAgICAgICAgICBjb25zdCBtYXRjaGVkTmFtZSA9IHZhbHVlLnJlcGxhY2UoL15bPUAmPF1cXD8/LywgJycpO1xuICAgICAgICAgICAgY29uc3QgYm91bmRBdHRyaWJ1dGUgPSBtYXRjaGVkTmFtZSB8fCBrZXk7XG4gICAgICAgICAgICByZXR1cm4gYm91bmRBdHRyaWJ1dGUgPT09IG5hbWU7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSB2aWV3IGNvbmZpZ3VyYXRpb24gdGhhdCByZW5kZXJzIHRoaXMgY29tcG9uZW50LiBUaGlzIG1ldGhvZCBjYW4gYmVcbiAgICAgKiB1c2VkIHdoZW4gY29uZmlndXJpbmcgdGhlIEFuZ3VsYXIgVUkgcm91dGVyIGFzIGZvbGxvd3M6XG4gICAgICpcbiAgICAgKiAgICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2ZvbycsIHtcbiAgICAgKiAgICAgICAgIHVybDogJy9mb28nLFxuICAgICAqICAgICAgICAgdmlld3M6IHsgYXBwbGljYXRpb246IE15Q29tcG9uZW50LmFzVmlldygpIH0sXG4gICAgICogICAgIH0pO1xuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgYXNWaWV3KG9wdGlvbnM6IENvbXBvbmVudFZpZXdPcHRpb25zID0ge30pOiBhbnkge1xuICAgICAgICBsZXQgdGVtcGxhdGUgPSAnPCcgKyB0aGlzLl9fY29tcG9uZW50Q29uZmlnLmRpcmVjdGl2ZTtcbiAgICAgICAgbGV0IGF0dHJpYnV0ZXMgPSBvcHRpb25zLmF0dHJpYnV0ZXMgfHwge307XG5cbiAgICAgICAgLy8gU2V0dXAgaW5wdXQgYmluZGluZ3MuXG4gICAgICAgIGlmICghXy5pc0VtcHR5KG9wdGlvbnMuaW5wdXRzKSkge1xuICAgICAgICAgICAgXy5mb3JPd24ob3B0aW9ucy5pbnB1dHMsIChpbnB1dCwga2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gQGlmbmRlZiBHRU5KU19QUk9EVUNUSU9OXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmhhc0JpbmRpbmcoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgR2VuRXJyb3IoYElucHV0ICcke2tleX0nIGlzIG5vdCBkZWZpbmVkIG9uIGNvbXBvbmVudC5gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gQGVuZGlmXG5cbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzW2tleV0gPSBpbnB1dDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2VuZXJhdGUgYXR0cmlidXRlcy5cbiAgICAgICAgaWYgKCFfLmlzRW1wdHkoYXR0cmlidXRlcykpIHtcbiAgICAgICAgICAgIF8uZm9yT3duKGF0dHJpYnV0ZXMsIChhdHRyaWJ1dGUsIGF0dHJpYnV0ZU5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBQcm9wZXJseSBlc2NhcGUgYXR0cmlidXRlIHZhbHVlcy5cbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZSArPSAnICcgKyBfLmtlYmFiQ2FzZShhdHRyaWJ1dGVOYW1lKSArICc9XCInICsgYXR0cmlidXRlICsgJ1wiJztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRlbXBsYXRlICs9ICc+PC8nICsgdGhpcy5fX2NvbXBvbmVudENvbmZpZy5kaXJlY3RpdmUgKyAnPic7XG5cbiAgICAgICAgbGV0IHJlc3VsdDogYW55ID0ge1xuICAgICAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFNldHVwIHBhcmVudCBzY29wZSBmb3IgdGhlIGludGVybWVkaWF0ZSB0ZW1wbGF0ZS5cbiAgICAgICAgaWYgKG9wdGlvbnMucGFyZW50KSB7XG4gICAgICAgICAgICByZXN1bHQuc2NvcGUgPSBvcHRpb25zLnBhcmVudC4kc2NvcGU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gXy5leHRlbmQocmVzdWx0LCBvcHRpb25zLmV4dGVuZFdpdGggfHwge30pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm1zIGFueSBtb2RpZmljYXRpb25zIG9mIHRoZSBjb21wb25lbnQgY29uZmlndXJhdGlvbi4gVGhpcyBtZXRob2QgaXNcbiAgICAgKiBpbnZva2VkIGR1cmluZyBjb21wb25lbnQgY2xhc3MgZGVjb3JhdGlvbiBhbmQgbWF5IGFyYml0cmFyaWx5IG1vZGlmeSB0aGVcbiAgICAgKiBwYXNzZWQgY29tcG9uZW50IGNvbmZpZ3VyYXRpb24sIGJlZm9yZSB0aGUgY29tcG9uZW50IGlzIHJlZ2lzdGVyZWQgd2l0aFxuICAgICAqIEFuZ3VsYXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29uZmlnIENvbXBvbmVudCBjb25maWd1cmF0aW9uXG4gICAgICogQHJldHVybiBNb2RpZmllZCBjb21wb25lbnQgY29uZmlndXJhdGlvblxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgY29uZmlndXJlQ29tcG9uZW50KGNvbmZpZzogQ29tcG9uZW50Q29uZmlndXJhdGlvbik6IENvbXBvbmVudENvbmZpZ3VyYXRpb24ge1xuICAgICAgICByZXR1cm4gY29uZmlnO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZGlyZWN0aXZlRmFjdG9yeShjb25maWc6IENvbXBvbmVudENvbmZpZ3VyYXRpb24sIHR5cGU6IERpcmVjdGl2ZVR5cGUpIHtcbiAgICByZXR1cm4gKHRhcmdldDogdHlwZW9mIENvbXBvbmVudEJhc2UpOiBGdW5jdGlvbiA9PiB7XG4gICAgICAgIC8vIFN0b3JlIGNvbXBvbmVudCBjb25maWd1cmF0aW9uIG9uIHRoZSBjb21wb25lbnQsIGV4dGVuZGluZyBjb25maWd1cmF0aW9uIG9idGFpbmVkIGZyb20gYmFzZSBjbGFzcy5cbiAgICAgICAgaWYgKHRhcmdldC5fX2NvbXBvbmVudENvbmZpZykge1xuICAgICAgICAgICAgdGFyZ2V0Ll9fY29tcG9uZW50Q29uZmlnID0gXy5jbG9uZURlZXAodGFyZ2V0Ll9fY29tcG9uZW50Q29uZmlnKTtcbiAgICAgICAgICAgIC8vIERvbid0IGluaGVyaXQgdGhlIGFic3RyYWN0IGZsYWcgYXMgb3RoZXJ3aXNlIHlvdSB3b3VsZCBiZSByZXF1aXJlZCB0byBleHBsaWNpdGx5XG4gICAgICAgICAgICAvLyBzZXQgaXQgdG8gZmFsc2UgaW4gYWxsIHN1YmNsYXNzZXMuXG4gICAgICAgICAgICBkZWxldGUgdGFyZ2V0Ll9fY29tcG9uZW50Q29uZmlnLmFic3RyYWN0O1xuXG4gICAgICAgICAgICBfLm1lcmdlKHRhcmdldC5fX2NvbXBvbmVudENvbmZpZywgY29uZmlnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRhcmdldC5fX2NvbXBvbmVudENvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbmZpZyA9IHRhcmdldC5jb25maWd1cmVDb21wb25lbnQodGFyZ2V0Ll9fY29tcG9uZW50Q29uZmlnKTtcblxuICAgICAgICBpZiAoIWNvbmZpZy5hYnN0cmFjdCkge1xuICAgICAgICAgICAgLy8gSWYgbW9kdWxlIG9yIGRpcmVjdGl2ZSBpcyBub3QgZGVmaW5lZCBmb3IgYSBub24tYWJzdHJhY3QgY29tcG9uZW50LCB0aGlzIGlzIGFuIGVycm9yLlxuICAgICAgICAgICAgaWYgKCFjb25maWcuZGlyZWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEdlbkVycm9yKFwiRGlyZWN0aXZlIG5vdCBkZWZpbmVkIGZvciBjb21wb25lbnQuXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIV8uc3RhcnRzV2l0aChjb25maWcuZGlyZWN0aXZlLCAnZ2VuLScpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEdlbkVycm9yKFwiRGlyZWN0aXZlIG5vdCBwcmVmaXhlZCB3aXRoIFxcXCJnZW4tXFxcIjogXCIgKyBjb25maWcuZGlyZWN0aXZlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFjb25maWcubW9kdWxlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEdlbkVycm9yKFwiTW9kdWxlIG5vdCBkZWZpbmVkIGZvciBjb21wb25lbnQgJ1wiICsgY29uZmlnLmRpcmVjdGl2ZSArIFwiJy5cIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChfLmFueShjb25maWcuYmluZGluZ3MsICh2YWx1ZSwga2V5KSA9PiBfLnN0YXJ0c1dpdGgodmFsdWUuc3Vic3RyaW5nKDEpIHx8IGtleSwgJ2RhdGEnKSkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCaW5kaW5ncyBzaG91bGQgbm90IHN0YXJ0IHdpdGggJ2RhdGEnXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25maWcubW9kdWxlLmRpcmVjdGl2ZShfLmNhbWVsQ2FzZShjb25maWcuZGlyZWN0aXZlKSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRyb2xsZXJCaW5kaW5nID0gY29uZmlnLmNvbnRyb2xsZXJBcyB8fCAnY3RybCc7XG5cbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0OiBhbmd1bGFyLklEaXJlY3RpdmUgPSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjogY29uZmlnLmJpbmRpbmdzIHx8IHt9LFxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiA8YW55PiB0YXJnZXQsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXJBczogY29udHJvbGxlckJpbmRpbmcsXG4gICAgICAgICAgICAgICAgICAgIGNvbXBpbGU6IChlbGVtZW50LCBhdHRyaWJ1dGVzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWxsIHRoZSBjb21waWxlIGxpZmUtY3ljbGUgc3RhdGljIG1ldGhvZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldC5vbkNvbXBvbmVudENvbXBpbGUoZWxlbWVudCwgYXR0cmlidXRlcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJpYnV0ZXMsIC4uLmFyZ3MpID0+IHsgLy8gdHNsaW50OmRpc2FibGUtbGluZTpuby1zaGFkb3dlZC12YXJpYWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdldCBjb250cm9sbGVyIGZyb20gdGhlIHNjb3BlIGFuZCBjYWxsIHRoZSBsaW5rIGxpZmUtY3ljbGUgbWV0aG9kLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8Q29tcG9uZW50QmFzZT4gc2NvcGVbY29udHJvbGxlckJpbmRpbmddKS5fb25Db21wb25lbnRMaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRyaWJ1dGVzLCAuLi5hcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBjb25maWcudGVtcGxhdGVVcmwsXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlOiBjb25maWcudGVtcGxhdGUsXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmU6IGNvbmZpZy5yZXF1aXJlLFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBEaXJlY3RpdmVUeXBlLkNPTVBPTkVOVDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnJlc3RyaWN0ID0gJ0UnO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2FzZSBEaXJlY3RpdmVUeXBlLkFUVFJJQlVURToge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnJlc3RyaWN0ID0gJ0EnO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogdXNlIGVycm9yIGhhbmRsZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihgVW5rbm93biB0eXBlICR7dHlwZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfTtcbn1cblxuLyoqXG4gKiBBIGRlY29yYXRvciB0aGF0IHRyYW5zZm9ybXMgdGhlIGRlY29yYXRlZCBjbGFzcyBpbnRvIGFuIEFuZ3VsYXJKU1xuICogY29tcG9uZW50IGRpcmVjdGl2ZSB3aXRoIHByb3BlciBkZXBlbmRlbmN5IGluamVjdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvbmVudChjb25maWc6IENvbXBvbmVudENvbmZpZ3VyYXRpb24pOiBDbGFzc0RlY29yYXRvciB7XG4gICAgcmV0dXJuIDxDbGFzc0RlY29yYXRvcj4gZGlyZWN0aXZlRmFjdG9yeShjb25maWcsIERpcmVjdGl2ZVR5cGUuQ09NUE9ORU5UKTtcbn1cblxuLyoqXG4gKiBBIGRlY29yYXRvciB0aGF0IHRyYW5zZm9ybXMgdGhlIGRlY29yYXRlZCBjbGFzcyBpbnRvIGFuIEFuZ3VsYXJKU1xuICogYXR0cmlidXRlIGRpcmVjdGl2ZSB3aXRoIHByb3BlciBkZXBlbmRlbmN5IGluamVjdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZShjb25maWc6IENvbXBvbmVudENvbmZpZ3VyYXRpb24pOiBDbGFzc0RlY29yYXRvciB7XG4gICAgcmV0dXJuIDxDbGFzc0RlY29yYXRvcj4gZGlyZWN0aXZlRmFjdG9yeShjb25maWcsIERpcmVjdGl2ZVR5cGUuQVRUUklCVVRFKTtcbn1cbiJdfQ==
