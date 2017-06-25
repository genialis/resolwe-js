"use strict";
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
var Computation = (function () {
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
    Computation.prototype.subscribe = function (callback, observable, options) {
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
                callback(item);
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
var ComponentBase = (function () {
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
    ComponentBase.prototype.subscribe = function (callback, observable, options) {
        if (options === void 0) { options = {}; }
        var computation = this._createComputation();
        computation.subscribe(callback, observable, options);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2NvbXBvbmVudHMvYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsaUNBQW1DO0FBQ25DLDBCQUE0QjtBQUM1Qix1QkFBeUI7QUFFekIsc0NBQXdDO0FBQ3hDLHlDQUF5QztBQUV6QyxJQUFLLGFBR0o7QUFIRCxXQUFLLGFBQWE7SUFDZCwyREFBUyxDQUFBO0lBQ1QsMkRBQVMsQ0FBQTtBQUNiLENBQUMsRUFISSxhQUFhLEtBQWIsYUFBYSxRQUdqQjtBQThDRCwyQkFBMkIsTUFBc0IsRUFBRSxRQUFvQjtJQUNuRSxFQUFFLENBQUMsQ0FBUSxNQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUM3QixNQUFNLENBQUM7SUFDWCxDQUFDO0lBRUQsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDekMsUUFBUSxFQUFFLENBQUM7SUFDZixDQUFDO0lBQUMsSUFBSSxDQUFDLENBQUM7UUFDSixNQUFNLENBQUMsTUFBTSxDQUFDLGNBQVEsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN6QyxDQUFDO0FBQ0wsQ0FBQztBQUVELG1CQUFzQixVQUE0QixFQUFFLEtBQXFCLEVBQUUsUUFBMkI7SUFDbEcsUUFBUSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEdBQUcsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFFNUQsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUM7UUFDeEIsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ2pDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFDLElBQUk7UUFDUixpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsY0FBUSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4RCxDQUFD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TCxDQUFDO2dCQUVELE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDbEIsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO1FBRUQsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNsQixDQUFDLENBQUM7QUFDTixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsbUJBQTBCLE1BQThCO0lBQ3BELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzdELENBQUM7QUFGRCw4QkFFQztBQUVEOzs7R0FHRztBQUNILG1CQUEwQixNQUE4QjtJQUNwRCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUM3RCxDQUFDO0FBRkQsOEJBRUMiLCJmaWxlIjoiY29yZS9jb21wb25lbnRzL2Jhc2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhbmd1bGFyIGZyb20gJ2FuZ3VsYXInO1xuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgUnggZnJvbSAncngnO1xuXG5pbXBvcnQge2lzUHJvbWlzZX0gZnJvbSAnLi4vdXRpbHMvbGFuZyc7XG5pbXBvcnQge0dlbkVycm9yfSBmcm9tICcuLi9lcnJvcnMvZXJyb3InO1xuXG5lbnVtIERpcmVjdGl2ZVR5cGUge1xuICAgIENPTVBPTkVOVCxcbiAgICBBVFRSSUJVVEVcbn1cblxuLyoqXG4gKiBDb21wb25lbnQgY29uZmlndXJhdGlvbi4gRGlyZWN0aXZlIG5hbWUgc2hvdWxkIGJlIGluIGRhc2gtY2FzZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb21wb25lbnRDb25maWd1cmF0aW9uIHtcbiAgICBhYnN0cmFjdD86IGJvb2xlYW47XG4gICAgbW9kdWxlPzogYW5ndWxhci5JTW9kdWxlO1xuICAgIGRpcmVjdGl2ZT86IHN0cmluZztcbiAgICBiaW5kaW5ncz86IF8uRGljdGlvbmFyeTxzdHJpbmc+O1xuICAgIGNvbnRyb2xsZXJBcz86IHN0cmluZztcbiAgICB0ZW1wbGF0ZVVybD86IHN0cmluZztcbiAgICB0ZW1wbGF0ZT86IHN0cmluZztcbiAgICByZXF1aXJlPzogc3RyaW5nIHwgc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcG9uZW50Vmlld09wdGlvbnMge1xuICAgIGlucHV0cz86IE9iamVjdDtcbiAgICBwYXJlbnQ/OiBDb21wb25lbnRCYXNlO1xuICAgIGF0dHJpYnV0ZXM/OiBPYmplY3Q7XG4gICAgZXh0ZW5kV2l0aD86IE9iamVjdDtcbn1cblxuaW50ZXJmYWNlIFN1YnNjcmlwdGlvbk1hcCB7XG4gICAgW2tleTogc3RyaW5nXTogUnguRGlzcG9zYWJsZTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb21wdXRhdGlvbkZ1bmN0aW9uIHtcbiAgICAoY29tcHV0YXRpb246IENvbXB1dGF0aW9uKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdWJzY3JpcHRpb24ge1xuICAgIHVuc3Vic2NyaWJlKCk6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3Vic2NyaWJlQ29tcG9uZW50T3B0aW9ucyB7XG4gICAgb25lU2hvdD86IGJvb2xlYW47XG4gICAgb25FcnJvcj86IChleGNlcHRpb246IGFueSkgPT4gdm9pZDtcblxuICAgIC8vIFNldCB0aGlzIHRvIHRydWUgdG8gbWFrZSB0aGUgc3Vic2NyaXB0aW9uIGJlIGlnbm9yZWQgd2hlbiBkZXRlcm1pbmluZ1xuICAgIC8vIHdoZXRoZXIgdGhlIGNvbXBvbmVudCBpcyBkb25lIHdhaXRpbmcgZm9yIHN1YnNjcmlwdGlvbnMuXG4gICAgaWdub3JlUmVhZHk/OiBib29sZWFuO1xufVxuXG50eXBlIFN1YnNjcmlwdGlvbkd1YXJkID0ge307XG5cbmZ1bmN0aW9uIHNhZmVDYWxsYmFja0FwcGx5KCRzY29wZTogYW5ndWxhci5JU2NvcGUsIGNhbGxiYWNrOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgaWYgKCg8YW55PiAkc2NvcGUpLiQkZGVzdHJveWVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoJHNjb3BlLiQkcGhhc2UgfHwgJHNjb3BlLiRyb290LiQkcGhhc2UpIHtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAkc2NvcGUuJGFwcGx5KCgpID0+IHsgY2FsbGJhY2soKTsgfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzYWZlQXBwbHk8VD4ob2JzZXJ2YWJsZTogUnguT2JzZXJ2YWJsZTxUPiwgc2NvcGU6IGFuZ3VsYXIuSVNjb3BlLCBjYWxsYmFjazogKGRhdGE6IFQpID0+IHZvaWQpIHtcbiAgICBjYWxsYmFjayA9IGFuZ3VsYXIuaXNGdW5jdGlvbihjYWxsYmFjaykgPyBjYWxsYmFjayA6IF8ubm9vcDtcblxuICAgIHJldHVybiBvYnNlcnZhYmxlLnRha2VXaGlsZSgoKSA9PiB7XG4gICAgICAgIHJldHVybiAhc2NvcGVbJyQkZGVzdHJveWVkJ107XG4gICAgfSkudGFwKChkYXRhKSA9PiB7XG4gICAgICAgIHNhZmVDYWxsYmFja0FwcGx5KHNjb3BlLCAoKSA9PiB7IGNhbGxiYWNrKGRhdGEpOyB9KTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBBYnN0cmFjdGlvbiBvZiBhIGNvbXB1dGF0aW9uIHdpdGggZGVwZW5kZW5jaWVzIHRvIG9ic2VydmFibGVzLlxuICovXG5leHBvcnQgY2xhc3MgQ29tcHV0YXRpb24ge1xuICAgIHByaXZhdGUgX3N1YnNjcmlwdGlvbnM6IFJ4LkRpc3Bvc2FibGVbXTtcbiAgICBwcml2YXRlIF9wZW5kaW5nU3Vic2NyaXB0aW9uczogU3Vic2NyaXB0aW9uR3VhcmRbXTtcbiAgICBwcml2YXRlIF9kaXNwb3NlOiAoKSA9PiB2b2lkO1xuICAgIHByaXZhdGUgX2RvbmU6IGJvb2xlYW47XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RzIGEgbmV3IGNvbXB1dGF0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbXBvbmVudCBPd25pbmcgY29tcG9uZW50XG4gICAgICogQHBhcmFtIGNvbnRlbnQgQ29tcHV0YXRpb24gY29udGVudFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBjb21wb25lbnQ6IENvbXBvbmVudEJhc2UsIHB1YmxpYyBjb250ZW50OiBDb21wdXRhdGlvbkZ1bmN0aW9uKSB7XG4gICAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5fcGVuZGluZ1N1YnNjcmlwdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5fZGlzcG9zZSA9ICgpID0+IHsgLyogRG8gbm90aGluZyBieSBkZWZhdWx0LiAqLyB9O1xuICAgICAgICB0aGlzLl9kb25lID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhpcyBjb21wdXRhdGlvbiBoYXMgZmluaXNoZWQuXG4gICAgICovXG4gICAgcHVibGljIGlzRG9uZSgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RvbmU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyBhbiBhbHRlcm5hdGl2ZSBkaXNwb3NlIGNhbGxiYWNrIGZvciB0aGlzIGNvbXB1dGF0aW9uLiBUaGlzIGNhbGxiYWNrXG4gICAgICogaXMgaW52b2tlZCB3aGVuIFtbdW5zdWJzY3JpYmVdXSBpcyBjYWxsZWQuXG4gICAgICovXG4gICAgcHVibGljIHNldERpc3Bvc2VDYWxsYmFjayhjYWxsYmFjazogKCkgPT4gdm9pZCkge1xuICAgICAgICB0aGlzLl9kaXNwb3NlID0gY2FsbGJhY2s7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3Vic2NyaWJlcyB0byBhbiBvYnNlcnZhYmxlLCByZWdpc3RlcmluZyB0aGUgc3Vic2NyaXB0aW9uIGFzIGEgZGVwZW5kZW5jeVxuICAgICAqIG9mIHRoaXMgY29tcG9uZW50LiBUaGUgc3Vic2NyaXB0aW9uIGlzIGF1dG9tYXRpY2FsbHkgc3RvcHBlZCB3aGVuIHRoZVxuICAgICAqIGNvbXBvbmVudCBpcyBkZXN0cm95ZWQuXG4gICAgICpcbiAgICAgKiBGb3IgdGhlIHRhcmdldCBhcmd1bWVudCwgeW91IGNhbiBlaXRoZXIgc3BlY2lmeSBhIHN0cmluZywgaW4gd2hpY2ggY2FzZVxuICAgICAqIGl0IHJlcHJlc2VudHMgdGhlIG5hbWUgb2YgdGhlIGNvbXBvbmVudCBtZW1iZXIgdmFyaWFibGUgdGhhdCB3aWxsIGJlXG4gICAgICogcG9wdWxhdGVkIHdpdGggdGhlIHJlc3VsdCBpdGUuIE9yIHlvdSBjYW4gc3BlY2lmeSBhIGZ1bmN0aW9uIHdpdGggb25lXG4gICAgICogYXJndW1lbnQsIHdoaWNoIHdpbGwgYmUgY2FsbGVkIHdoZW4gcXVlcnkgcmVzdWx0cyBjaGFuZ2UgYW5kIGNhbiBkb1xuICAgICAqIGFueXRoaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRhcmdldCBUYXJnZXQgY29tcG9uZW50IG1lbWJlciBhdHJpYnV0ZSBuYW1lIG9yIGNhbGxiYWNrXG4gICAgICogQHBhcmFtIG9ic2VydmFibGUgT2JzZXJ2YWJsZSBvciBwcm9taXNlIHRvIHN1YnNjcmliZSB0b1xuICAgICAqIEByZXR1cm4gVW5kZXJseWluZyBzdWJzY3JpcHRpb24gZGlzcG9zYWJsZVxuICAgICAqL1xuICAgIHB1YmxpYyBzdWJzY3JpYmU8VD4oY2FsbGJhY2s6IChkYXRhOiBUKSA9PiBhbnksXG4gICAgICAgICAgICAgICAgICAgICAgICBvYnNlcnZhYmxlOiBSeC5PYnNlcnZhYmxlPFQ+IHwgUHJvbWlzZTxhbnk+LFxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uczogU3Vic2NyaWJlQ29tcG9uZW50T3B0aW9ucyA9IHt9KSB7XG4gICAgICAgIC8vIENyZWF0ZSBhIGd1YXJkIG9iamVjdCB0aGF0IGNhbiBiZSByZW1vdmVkIHdoZW4gYSBzdWJzY3JpcHRpb24gaXMgZG9uZS4gV2UgbmVlZFxuICAgICAgICAvLyB0byB1c2UgZ3VhcmQgb2JqZWN0cyBpbnN0ZWFkIG9mIGEgc2ltcGxlIHJlZmVyZW5jZSBjb3VudGVyIGJlY2F1c2UgdGhlIHBlbmRpbmdcbiAgICAgICAgLy8gc3Vic2NyaXB0aW9ucyBhcnJheSBtYXkgYmUgY2xlYXJlZCB3aGlsZSBjYWxsYmFja3MgYXJlIHN0aWxsIG91dHN0YW5kaW5nLlxuICAgICAgICBjb25zdCBndWFyZCA9IG5ldyBPYmplY3QoKTtcbiAgICAgICAgaWYgKCFvcHRpb25zLmlnbm9yZVJlYWR5KSB7XG4gICAgICAgICAgICB0aGlzLl9wZW5kaW5nU3Vic2NyaXB0aW9ucy5wdXNoKGd1YXJkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjb252ZXJ0ZWRPYnNlcnZhYmxlOiBSeC5PYnNlcnZhYmxlPFQ+O1xuICAgICAgICBpZiAoaXNQcm9taXNlKG9ic2VydmFibGUpKSB7XG4gICAgICAgICAgICBjb252ZXJ0ZWRPYnNlcnZhYmxlID0gUnguT2JzZXJ2YWJsZS5mcm9tUHJvbWlzZShvYnNlcnZhYmxlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnZlcnRlZE9ic2VydmFibGUgPSBvYnNlcnZhYmxlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVsZWFzZUd1YXJkID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fcGVuZGluZ1N1YnNjcmlwdGlvbnMgPSBfLndpdGhvdXQodGhpcy5fcGVuZGluZ1N1YnNjcmlwdGlvbnMsIGd1YXJkKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29udmVydGVkT2JzZXJ2YWJsZSA9IGNvbnZlcnRlZE9ic2VydmFibGUudGFwKHJlbGVhc2VHdWFyZCwgcmVsZWFzZUd1YXJkKTtcblxuICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBzYWZlQXBwbHkoXG4gICAgICAgICAgICBjb252ZXJ0ZWRPYnNlcnZhYmxlLFxuICAgICAgICAgICAgdGhpcy5jb21wb25lbnQuJHNjb3BlLFxuICAgICAgICAgICAgKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhpdGVtKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdJZ25vcmVkIGVycm9yJywgZXhjZXB0aW9uKTtcbiAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgICAgICAvLyBEaXNwb3NlIG9mIHRoZSBzdWJzY3JpcHRpb24gaW1tZWRpYXRlbHkgaWYgdGhpcyBpcyBhIG9uZSBzaG90IHN1YnNjcmlwdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMub25lU2hvdCAmJiBzdWJzY3JpcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICkuc3Vic2NyaWJlKFxuICAgICAgICAgICAgLy8gU3VjY2VzcyBoYW5kbGVyLlxuICAgICAgICAgICAgXy5ub29wLFxuICAgICAgICAgICAgLy8gRXJyb3IgaGFuZGxlci5cbiAgICAgICAgICAgIChleGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEBpZm5kZWYgR0VOSlNfUFJPRFVDVElPTlxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0hhbmRsZWQgZXJyb3InLCBleGNlcHRpb24pO1xuICAgICAgICAgICAgICAgICAgICAvLyBAZW5kaWZcbiAgICAgICAgICAgICAgICAgICAgc2FmZUNhbGxiYWNrQXBwbHkodGhpcy5jb21wb25lbnQuJHNjb3BlLCAoKSA9PiB7IG9wdGlvbnMub25FcnJvcihleGNlcHRpb24pOyB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1VuaGFuZGxlZCBlcnJvcicsIGV4Y2VwdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMucHVzaChzdWJzY3JpcHRpb24pO1xuICAgICAgICByZXR1cm4gc3Vic2NyaXB0aW9uO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiBhbGwgc3Vic2NyaXB0aW9ucyBjcmVhdGVkIGJ5IGNhbGxpbmcgYHN1YnNjcmliZWAgYXJlIHJlYWR5LlxuICAgICAqIEEgc3Vic2NyaXB0aW9uIGlzIHJlYWR5IHdoZW4gaXQgaGFzIHJlY2VpdmVkIGl0cyBmaXJzdCBiYXRjaCBvZiBkYXRhIGFmdGVyXG4gICAgICogc3Vic2NyaWJpbmcuXG4gICAgICovXG4gICAgcHVibGljIHN1YnNjcmlwdGlvbnNSZWFkeSgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BlbmRpbmdTdWJzY3JpcHRpb25zLmxlbmd0aCA9PT0gMDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSdW5zIHRoZSBjb21wdXRhdGlvbi5cbiAgICAgKi9cbiAgICBwdWJsaWMgY29tcHV0ZSgpIHtcbiAgICAgICAgLy8gU3RvcCBhbGwgc3Vic2NyaXB0aW9ucyBiZWZvcmUgcnVubmluZyBhZ2Fpbi5cbiAgICAgICAgdGhpcy5zdG9wKCk7XG4gICAgICAgIHRoaXMuY29udGVudCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEaXNwb3NlcyBvZiBhbGwgcmVnaXN0ZXJlZCBzdWJzY3JpcHRpb25zLlxuICAgICAqL1xuICAgIHB1YmxpYyBzdG9wKCkge1xuICAgICAgICBmb3IgKGxldCBzdWJzY3JpcHRpb24gb2YgdGhpcy5fc3Vic2NyaXB0aW9ucykge1xuICAgICAgICAgICAgc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zdWJzY3JpcHRpb25zID0gW107XG4gICAgICAgIHRoaXMuX3BlbmRpbmdTdWJzY3JpcHRpb25zID0gW107XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RvcHMgYWxsIHN1YnNjcmlwdGlvbnMgY3VycmVudGx5IHJlZ2lzdGVyZWQgaW4gdGhpcyBjb21wdXRhdGlvbiBhbmQgcmVtb3Zlc1xuICAgICAqIHRoaXMgY29tcHV0YXRpb24gZnJvbSB0aGUgcGFyZW50IGNvbXBvbmVudC4gSWYgYSBkaXNwb3NlIGhhbmRsZXIgaGFzIGJlZW5cbiAgICAgKiBjb25maWd1cmVkLCBpdCBpcyBpbnZva2VkLlxuICAgICAqL1xuICAgIHB1YmxpYyB1bnN1YnNjcmliZSgpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnQudW5zdWJzY3JpYmUodGhpcyk7XG4gICAgICAgIGlmICh0aGlzLl9kaXNwb3NlKSB0aGlzLl9kaXNwb3NlKCk7XG4gICAgICAgIHRoaXMuX2RvbmUgPSB0cnVlO1xuICAgIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBXYXRjaEV4cHJlc3Npb25PZjxUPiB7XG4gICAgKCk6IFQ7XG59XG5leHBvcnQgdHlwZSBXYXRjaEV4cHJlc3Npb24gPSBXYXRjaEV4cHJlc3Npb25PZjx7fT47XG5cbi8qKlxuICogQW4gYWJzdHJhY3QgYmFzZSBjbGFzcyBmb3IgYWxsIGNvbXBvbmVudHMuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBDb21wb25lbnRCYXNlIHtcbiAgICAvLyBDb21wb25lbnQgY29uZmlndXJhdGlvbi5cbiAgICBwdWJsaWMgc3RhdGljIF9fY29tcG9uZW50Q29uZmlnOiBDb21wb25lbnRDb25maWd1cmF0aW9uO1xuICAgIC8vIENvbXB1dGF0aW9ucy5cbiAgICBwcml2YXRlIF9jb21wdXRhdGlvbnM6IENvbXB1dGF0aW9uW10gPSBbXTtcbiAgICAvLyBDb21wb25lbnQgc3RhdGUuXG4gICAgcHJpdmF0ZSBfcmVhZHk6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAgIC8vIEBuZ0luamVjdFxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyAkc2NvcGU6IGFuZ3VsYXIuSVNjb3BlKSB7XG4gICAgICAgICRzY29wZS4kb24oJyRkZXN0cm95JywgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fcmVhZHkgPSBmYWxzZTtcblxuICAgICAgICAgICAgLy8gRW5zdXJlIHRoYXQgYWxsIGNvbXB1dGF0aW9ucyBnZXQgc3RvcHBlZCB3aGVuIHRoZSBjb21wb25lbnQgaXMgZGVzdHJveWVkLlxuICAgICAgICAgICAgZm9yIChsZXQgY29tcHV0YXRpb24gb2YgdGhpcy5fY29tcHV0YXRpb25zKSB7XG4gICAgICAgICAgICAgICAgY29tcHV0YXRpb24uc3RvcCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fY29tcHV0YXRpb25zID0gW107XG5cbiAgICAgICAgICAgIC8vIENhbGwgZGVzdHJveWVkIGhvb2suXG4gICAgICAgICAgICB0aGlzLm9uQ29tcG9uZW50RGVzdHJveWVkKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEFuZ3VsYXIgY2FsbHMgJG9uSW5pdCBhZnRlciBjb25zdHJ1Y3RvciBhbmQgYmluZGluZ3MgaW5pdGlhbGl6YXRpb24uXG4gICAgICAgIHRoaXNbJyRvbkluaXQnXSA9ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMub25Db21wb25lbnRJbml0KCk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgdGhlIHdob2xlIGNoYWluIG9mIGNvbnN0cnVjdG9ycyBpcyBleGVjdXRlZCxcbiAgICAgKiB2aWEgYW5ndWxhciBjb21wb25lbnQgJG9uSW5pdC4gVXNlIGl0IGlmIHlvdSBoYXZlIGFuIGFic3RyYWN0IGNvbXBvbmVudCB0aGF0XG4gICAgICogbWFuaXB1bGF0ZXMgY2xhc3MgcHJvcGVydGllcyBhbmQsIGFzIGEgcmVzdWx0LCBuZWVkcyB0byB3YWl0IGZvciBhbGwgY2hpbGRcbiAgICAgKiBjbGFzcyBwcm9wZXJ0aWVzIHRvIGJlIGFzc2lnbmVkIGFuZCBjb25zdHJ1Y3RvcnMgdG8gZmluaXNoLiAoQ2xhc3MgcHJvcGVydGllc1xuICAgICAqIGRlZmluZWQgaW4gY2hpbGQgY29tcG9uZW50cyBhcmUgYXNzaWduZWQgYmVmb3JlIGNoaWxkJ3MgY29uc3RydWN0b3IpLlxuICAgICAqXG4gICAgICogT3JkZXIgb2YgZXhlY3V0aW9uOlxuICAgICAqIGBgYHRzXG4gICAgICogY2xhc3MgQ2hpbGQgZXh0ZW5kcyBNaWRkbGUge1xuICAgICAqICAgICBwdWJsaWMgcHJvcGVydHlBID0gJ2MnICAgIC8vIDVcbiAgICAgKiAgICAgY29uc3RydWN0b3IoKSB7IHN1cGVyKCkgfSAvLyA2XG4gICAgICogfVxuICAgICAqIGNsYXNzIE1pZGRsZSBleHRlbmRzIEFic3RyYWN0IHtcbiAgICAgKiAgICAgcHVibGljIHByb3BlcnR5QiA9ICdiJyAgICAvLyAzXG4gICAgICogICAgIGNvbnN0cnVjdG9yKCkgeyBzdXBlcigpIH0gLy8gNFxuICAgICAqIH1cbiAgICAgKiBjbGFzcyBBYnN0cmFjdCB7XG4gICAgICogICAgIHB1YmxpYyBwcm9wZXJ0eUEgPSAnYScgICAgLy8gMVxuICAgICAqICAgICBjb25zdHJ1Y3RvcigpIHt9ICAgICAgICAgIC8vIDJcbiAgICAgKiAgICAgb25Db21wb25lbnRJbml0KCkge30gICAgLy8gN1xuICAgICAqIH1cbiAgICAgKiBgYGBcbiAgICAgKi9cbiAgICBwdWJsaWMgb25Db21wb25lbnRJbml0KCkge1xuICAgICAgICAvLyBEZWZhdWx0IGltcGxlbWVudGF0aW9uIGRvZXMgbm90aGluZy5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXN0cm95cyB0aGUgY29tcG9uZW50LlxuICAgICAqL1xuICAgIHB1YmxpYyBkZXN0cm95KCk6IHZvaWQge1xuICAgICAgICB0aGlzLiRzY29wZS4kZGVzdHJveSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkIGluIHRoZSBjb21waWxlIHBoYXNlIG9mIHRoZSBkaXJlY3RpdmUgYW5kIG1heVxuICAgICAqIGJlIG92ZXJyaWRlbiBieSBjb21wb25lbnQgaW1wbGVtZW50YXRpb25zLlxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgb25Db21wb25lbnRDb21waWxlKGVsZW1lbnQ6IGFuZ3VsYXIuSUF1Z21lbnRlZEpRdWVyeSwgYXR0cmlidXRlczogYW5ndWxhci5JQXR0cmlidXRlcyk6IHZvaWQge1xuICAgICAgICAvLyBEZWZhdWx0IGltcGxlbWVudGF0aW9uIGRvZXMgbm90aGluZy5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICBwdWJsaWMgX29uQ29tcG9uZW50TGluayhzY29wZTogYW5ndWxhci5JU2NvcGUsIGVsZW1lbnQ6IGFuZ3VsYXIuSUF1Z21lbnRlZEpRdWVyeSwgYXR0cmlidXRlczogYW5ndWxhci5JQXR0cmlidXRlcywgLi4uYXJncyk6IHZvaWQge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gQ2FsbCB0aGUgcHVibGljIG1ldGhvZCB0aGF0IGNhbiBiZSBvdmVycmlkZW4gYnkgdGhlIHVzZXIuXG4gICAgICAgICAgICB0aGlzLm9uQ29tcG9uZW50TGluayhzY29wZSwgZWxlbWVudCwgYXR0cmlidXRlcywgLi4uYXJncyk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLl9yZWFkeSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCBpbiB0aGUgcG9zdC1saW5rIHBoYXNlIG9mIHRoZSBkaXJlY3RpdmUgYW5kIG1heVxuICAgICAqIGJlIG92ZXJyaWRlbiBieSBjb21wb25lbnQgaW1wbGVtZW50YXRpb25zLlxuICAgICAqL1xuICAgIHB1YmxpYyBvbkNvbXBvbmVudExpbmsoc2NvcGU6IGFuZ3VsYXIuSVNjb3BlLCBlbGVtZW50OiBhbmd1bGFyLklBdWdtZW50ZWRKUXVlcnksIGF0dHJpYnV0ZXM6IGFuZ3VsYXIuSUF0dHJpYnV0ZXMsIC4uLmFyZ3MpOiB2b2lkIHtcbiAgICAgICAgLy8gRGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBkb2VzIG5vdGhpbmcuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgdGhlIGNvbXBvbmVudCBzY29wZSBoYXMgYmVlbiBkZXN0cm95ZWQuXG4gICAgICovXG4gICAgcHVibGljIG9uQ29tcG9uZW50RGVzdHJveWVkKCk6IHZvaWQge1xuICAgICAgICAvLyBEZWZhdWx0IGltcGxlbWVudGF0aW9uIGRvZXMgbm90aGluZy5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBjcmVhdGVkLlxuICAgICAqL1xuICAgIHB1YmxpYyBpc1JlYWR5KCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVhZHk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0cnVlIGlmIGFsbCBzdWJzY3JpcHRpb25zIGNyZWF0ZWQgYnkgY2FsbGluZyBgc3Vic2NyaWJlYCBhcmUgcmVhZHkuXG4gICAgICogQSBzdWJzY3JpcHRpb24gaXMgcmVhZHkgd2hlbiBpdCBoYXMgcmVjZWl2ZWQgaXRzIGZpcnN0IGJhdGNoIG9mIGRhdGEgYWZ0ZXJcbiAgICAgKiBzdWJzY3JpYmluZy5cbiAgICAgKi9cbiAgICBwdWJsaWMgc3Vic2NyaXB0aW9uc1JlYWR5KCk6IGJvb2xlYW4ge1xuICAgICAgICAvLyBXYWl0IHVudGlsIHRoZSBjb21wb25lbnQgaGFzIGJlZW4gY3JlYXRlZC5cbiAgICAgICAgaWYgKCF0aGlzLmlzUmVhZHkoKSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIHJldHVybiBfLmV2ZXJ5KHRoaXMuX2NvbXB1dGF0aW9ucywgKGNvbXB1dGF0aW9uKSA9PiBjb21wdXRhdGlvbi5zdWJzY3JpcHRpb25zUmVhZHkoKSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfY3JlYXRlQ29tcHV0YXRpb24oY29udGVudDogQ29tcHV0YXRpb25GdW5jdGlvbiA9IF8ubm9vcCk6IENvbXB1dGF0aW9uIHtcbiAgICAgICAgbGV0IGNvbXB1dGF0aW9uID0gbmV3IENvbXB1dGF0aW9uKHRoaXMsIGNvbnRlbnQpO1xuICAgICAgICB0aGlzLl9jb21wdXRhdGlvbnMucHVzaChjb21wdXRhdGlvbik7XG4gICAgICAgIHJldHVybiBjb21wdXRhdGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBXYXRjaCBjb21wb25lbnQgc2NvcGUgYW5kIHJ1biBhIGNvbXB1dGF0aW9uIG9uIGNoYW5nZXMuIFRoZSBjb21wdXRhdGlvbiBpc1xuICAgICAqIGV4ZWN1dGVkIG9uY2UgaW1tZWRpYXRlbHkgcHJpb3IgdG8gd2F0Y2hpbmcuXG4gICAgICpcbiAgICAgKiBSZXR1cm5lZCBjb21wdXRhdGlvbiBpbnN0YW5jZSBtYXkgYmUgdXNlZCB0byBzdG9wIHRoZSB3YXRjaCBieSBjYWxsaW5nIGl0c1xuICAgICAqIFtbQ29tcHV0YXRpb24udW5zdWJzY3JpYmVdXSBtZXRob2QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29udGV4dCBGdW5jdGlvbiB3aGljaCByZXR1cm5zIHRoZSBjb250ZXh0IHRvIHdhdGNoXG4gICAgICogQHBhcmFtIGNvbnRlbnQgRnVuY3Rpb24gdG8gcnVuIG9uIGNoYW5nZXNcbiAgICAgKiBAcGFyYW0gb2JqZWN0RXF1YWxpdHkgU2hvdWxkIGBhbmd1bGFyLmVxdWFsc2AgYmUgdXNlZCBmb3IgY29tcGFyaXNvbnNcbiAgICAgKiBAcmV0dXJucyBDb21wdXRhdGlvbiBpbnN0YW5jZVxuICAgICAqL1xuICAgIHB1YmxpYyB3YXRjaChjb250ZXh0OiBXYXRjaEV4cHJlc3Npb24gfCBXYXRjaEV4cHJlc3Npb25bXSxcbiAgICAgICAgICAgICAgICAgY29udGVudDogQ29tcHV0YXRpb25GdW5jdGlvbixcbiAgICAgICAgICAgICAgICAgb2JqZWN0RXF1YWxpdHk/OiBib29sZWFuKTogQ29tcHV0YXRpb24ge1xuICAgICAgICBsZXQgY29tcHV0YXRpb24gPSB0aGlzLl9jcmVhdGVDb21wdXRhdGlvbihjb250ZW50KTtcbiAgICAgICAgY29tcHV0YXRpb24uY29tcHV0ZSgpO1xuXG4gICAgICAgIC8vIEluaXRpYWwgZXZhbHVhdGlvbiBtYXkgc3RvcCB0aGUgY29tcHV0YXRpb24uIEluIHRoaXMgY2FzZSwgZG9uJ3RcbiAgICAgICAgLy8gZXZlbiBjcmVhdGUgYSB3YXRjaCBhbmQganVzdCByZXR1cm4gdGhlIChkb25lKSBjb21wdXRhdGlvbi5cbiAgICAgICAgaWYgKGNvbXB1dGF0aW9uLmlzRG9uZSgpKSByZXR1cm4gY29tcHV0YXRpb247XG5cbiAgICAgICAgbGV0IGV4cHJlc3Npb25zID0gQXJyYXkuaXNBcnJheShjb250ZXh0KSA/IGNvbnRleHQgOiBbY29udGV4dF07XG5cbiAgICAgICAgaWYgKCFvYmplY3RFcXVhbGl0eSkge1xuICAgICAgICAgICAgY29uc3QgdW53YXRjaCA9IHRoaXMuJHNjb3BlLiR3YXRjaEdyb3VwKGV4cHJlc3Npb25zLCBjb21wdXRhdGlvbi5jb21wdXRlLmJpbmQoY29tcHV0YXRpb24pKTtcbiAgICAgICAgICAgIGNvbXB1dGF0aW9uLnNldERpc3Bvc2VDYWxsYmFjayh1bndhdGNoKTtcbiAgICAgICAgICAgIHJldHVybiBjb21wdXRhdGlvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB3YXRjaGVkRXhwcmVzc2lvbjogV2F0Y2hFeHByZXNzaW9uID0gKCkgPT4gXy5tYXAoZXhwcmVzc2lvbnMsIGZuID0+IGZuKCkpO1xuICAgICAgICBpZiAoZXhwcmVzc2lvbnMubGVuZ3RoID09PSAxKSB7IC8vIG9wdGltaXplXG4gICAgICAgICAgICB3YXRjaGVkRXhwcmVzc2lvbiA9IGV4cHJlc3Npb25zWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdW53YXRjaCA9IHRoaXMuJHNjb3BlLiR3YXRjaCh3YXRjaGVkRXhwcmVzc2lvbiwgY29tcHV0YXRpb24uY29tcHV0ZS5iaW5kKGNvbXB1dGF0aW9uKSwgdHJ1ZSk7XG4gICAgICAgIGNvbXB1dGF0aW9uLnNldERpc3Bvc2VDYWxsYmFjayh1bndhdGNoKTtcbiAgICAgICAgcmV0dXJuIGNvbXB1dGF0aW9uO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFdhdGNoIGNvbXBvbmVudCBzY29wZSBhbmQgcnVuIGEgY29tcHV0YXRpb24gb24gY2hhbmdlcy4gVGhpcyB2ZXJzaW9uIHVzZXMgQW5ndWxhcidzXG4gICAgICogY29sbGVjdGlvbiB3YXRjaC4gVGhlIGNvbXB1dGF0aW9uIGlzIGV4ZWN1dGVkIG9uY2UgaW1tZWRpYXRlbHkgcHJpb3IgdG8gd2F0Y2hpbmcuXG4gICAgICpcbiAgICAgKiBSZXR1cm5lZCBjb21wdXRhdGlvbiBpbnN0YW5jZSBtYXkgYmUgdXNlZCB0byBzdG9wIHRoZSB3YXRjaCBieSBjYWxsaW5nIGl0c1xuICAgICAqIFtbQ29tcHV0YXRpb24udW5zdWJzY3JpYmVdXSBtZXRob2QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29udGV4dCBGdW5jdGlvbiB3aGljaCByZXR1cm5zIHRoZSBjb250ZXh0IHRvIHdhdGNoXG4gICAgICogQHBhcmFtIGNvbnRlbnQgRnVuY3Rpb24gdG8gcnVuIG9uIGNoYW5nZXNcbiAgICAgKiBAcmV0dXJucyBDb21wdXRhdGlvbiBpbnN0YW5jZVxuICAgICAqL1xuICAgIHB1YmxpYyB3YXRjaENvbGxlY3Rpb24oY29udGV4dDogV2F0Y2hFeHByZXNzaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogQ29tcHV0YXRpb25GdW5jdGlvbik6IENvbXB1dGF0aW9uIHtcbiAgICAgICAgbGV0IGNvbXB1dGF0aW9uID0gdGhpcy5fY3JlYXRlQ29tcHV0YXRpb24oY29udGVudCk7XG4gICAgICAgIGNvbXB1dGF0aW9uLmNvbXB1dGUoKTtcblxuICAgICAgICAvLyBJbml0aWFsIGV2YWx1YXRpb24gbWF5IHN0b3AgdGhlIGNvbXB1dGF0aW9uLiBJbiB0aGlzIGNhc2UsIGRvbid0XG4gICAgICAgIC8vIGV2ZW4gY3JlYXRlIGEgd2F0Y2ggYW5kIGp1c3QgcmV0dXJuIHRoZSAoZG9uZSkgY29tcHV0YXRpb24uXG4gICAgICAgIGlmIChjb21wdXRhdGlvbi5pc0RvbmUoKSkgcmV0dXJuIGNvbXB1dGF0aW9uO1xuXG4gICAgICAgIGNvbnN0IHVud2F0Y2ggPSB0aGlzLiRzY29wZS4kd2F0Y2hDb2xsZWN0aW9uKGNvbnRleHQsIGNvbXB1dGF0aW9uLmNvbXB1dGUuYmluZChjb21wdXRhdGlvbikpO1xuICAgICAgICBjb21wdXRhdGlvbi5zZXREaXNwb3NlQ2FsbGJhY2sodW53YXRjaCk7XG4gICAgICAgIHJldHVybiBjb21wdXRhdGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdWJzY3JpYmVzIHRvIGFuIG9ic2VydmFibGUsIHJlZ2lzdGVyaW5nIHRoZSBzdWJzY3JpcHRpb24gYXMgYSBkZXBlbmRlbmN5XG4gICAgICogb2YgdGhpcyBjb21wb25lbnQuIFRoZSBzdWJzY3JpcHRpb24gaXMgYXV0b21hdGljYWxseSBzdG9wcGVkIHdoZW4gdGhlXG4gICAgICogY29tcG9uZW50IGlzIGRlc3Ryb3llZC5cbiAgICAgKlxuICAgICAqIEZvciB0aGUgdGFyZ2V0IGFyZ3VtZW50LCB5b3UgY2FuIGVpdGhlciBzcGVjaWZ5IGEgc3RyaW5nLCBpbiB3aGljaCBjYXNlXG4gICAgICogaXQgcmVwcmVzZW50cyB0aGUgbmFtZSBvZiB0aGUgY29tcG9uZW50IG1lbWJlciB2YXJpYWJsZSB0aGF0IHdpbGwgYmVcbiAgICAgKiBwb3B1bGF0ZWQgd2l0aCB0aGUgcmVzdWx0IGl0ZS4gT3IgeW91IGNhbiBzcGVjaWZ5IGEgZnVuY3Rpb24gd2l0aCBvbmVcbiAgICAgKiBhcmd1bWVudCwgd2hpY2ggd2lsbCBiZSBjYWxsZWQgd2hlbiBxdWVyeSByZXN1bHRzIGNoYW5nZSBhbmQgY2FuIGRvXG4gICAgICogYW55dGhpbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGFyZ2V0IFRhcmdldCBjb21wb25lbnQgbWVtYmVyIGF0cmlidXRlIG5hbWUgb3IgY2FsbGJhY2tcbiAgICAgKiBAcGFyYW0gb2JzZXJ2YWJsZSBPYnNlcnZhYmxlIHRvIHN1YnNjcmliZSB0b1xuICAgICAqIEByZXR1cm4gVW5kZXJseWluZyBzdWJzY3JpcHRpb25cbiAgICAgKi9cbiAgICBwdWJsaWMgc3Vic2NyaWJlPFQ+KGNhbGxiYWNrOiAoZGF0YTogVCkgPT4gYW55LFxuICAgICAgICAgICAgICAgICAgICAgICAgb2JzZXJ2YWJsZTogUnguT2JzZXJ2YWJsZTxUPiB8IFByb21pc2U8YW55PixcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IFN1YnNjcmliZUNvbXBvbmVudE9wdGlvbnMgPSB7fSk6IFN1YnNjcmlwdGlvbiB7XG4gICAgICAgIGxldCBjb21wdXRhdGlvbiA9IHRoaXMuX2NyZWF0ZUNvbXB1dGF0aW9uKCk7XG4gICAgICAgIGNvbXB1dGF0aW9uLnN1YnNjcmliZShjYWxsYmFjaywgb2JzZXJ2YWJsZSwgb3B0aW9ucyk7XG4gICAgICAgIHJldHVybiBjb21wdXRhdGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVbnN1YnNjcmliZXMgdGhlIGdpdmVuIGNvbXB1dGF0aW9uIGZyb20gdGhpcyBjb21wb25lbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29tcHV0YXRpb24gQ29tcHV0YXRpb24gaW5zdGFuY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgdW5zdWJzY3JpYmUoY29tcHV0YXRpb246IENvbXB1dGF0aW9uKTogdm9pZCB7XG4gICAgICAgIGNvbXB1dGF0aW9uLnN0b3AoKTtcbiAgICAgICAgXy5wdWxsKHRoaXMuX2NvbXB1dGF0aW9ucywgY29tcHV0YXRpb24pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEhlbHBlciBmdW5jdGlvbiB0byBjcmVhdGUgYSB3cmFwcGVyIG9ic2VydmFibGUgYXJvdW5kIHdhdGNoLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbnRleHQgRnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0aGUgY29udGV4dCB0byB3YXRjaFxuICAgICAqIEBwYXJhbSBvYmplY3RFcXVhbGl0eSBTaG91bGQgYGFuZ3VsYXIuZXF1YWxzYCBiZSB1c2VkIGZvciBjb21wYXJpc29uc1xuICAgICAqIEByZXR1cm5zIFdhdGNoIG9ic2VydmFibGVcbiAgICAgKi9cbiAgICBwdWJsaWMgY3JlYXRlV2F0Y2hPYnNlcnZhYmxlPFQ+KGNvbnRleHQ6IFdhdGNoRXhwcmVzc2lvbk9mPFQ+LCBvYmplY3RFcXVhbGl0eT86IGJvb2xlYW4pOiBSeC5PYnNlcnZhYmxlPFQ+IHtcbiAgICAgICAgY29uc3Qgbm90aWZ5T2JzZXJ2ZXIgPSAob2JzZXJ2ZXI6IFJ4Lk9ic2VydmVyPFQ+KSA9PiB7XG4gICAgICAgICAgICBvYnNlcnZlci5vbk5leHQoY29udGV4dCgpKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gUnguT2JzZXJ2YWJsZS5jcmVhdGU8VD4oKG9ic2VydmVyKSA9PiB7XG4gICAgICAgICAgICBub3RpZnlPYnNlcnZlcihvYnNlcnZlcik7XG5cbiAgICAgICAgICAgIGNvbnN0IGNvbXB1dGF0aW9uID0gdGhpcy53YXRjaChcbiAgICAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgICAgICgpID0+IG5vdGlmeU9ic2VydmVyKG9ic2VydmVyKSxcbiAgICAgICAgICAgICAgICBvYmplY3RFcXVhbGl0eVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiAoKSA9PiB7IGNvbXB1dGF0aW9uLnVuc3Vic2NyaWJlKCk7IH07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgY29tcG9uZW50IGNvbmZpZ3VyYXRpb24uXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBnZXRDb25maWcoKTogQ29tcG9uZW50Q29uZmlndXJhdGlvbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fY29tcG9uZW50Q29uZmlnO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgY29tcG9uZW50IGNvbmZpZ3VyYXRpb24uXG4gICAgICovXG4gICAgcHVibGljIGdldENvbmZpZygpOiBDb21wb25lbnRDb25maWd1cmF0aW9uIHtcbiAgICAgICAgcmV0dXJuICg8dHlwZW9mIENvbXBvbmVudEJhc2U+IHRoaXMuY29uc3RydWN0b3IpLmdldENvbmZpZygpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgY29tcG9uZW50IGhhcyBhIHNwZWNpZmllZCBhdHRyaWJ1dGUgY29uZmlndXJlZCBhc1xuICAgICAqIGEgYmluZGluZy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGJvdW5kIGF0dHJpYnV0ZVxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgaGFzQmluZGluZyhuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIF8uc29tZSh0aGlzLl9fY29tcG9uZW50Q29uZmlnLmJpbmRpbmdzLCAodmFsdWUsIGtleSkgPT4ge1xuICAgICAgICAgICAgLy8gSW4gY2FzZSBubyBhdHRyaWJ1dGUgbmFtZSBpcyBzcGVjaWZpZWQsIGNvbXBhcmUgdGhlIGJpbmRpbmcga2V5LFxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlIGNvbXBhcmUgdGhlIGF0dHJpYnV0ZSBuYW1lLlxuICAgICAgICAgICAgY29uc3QgbWF0Y2hlZE5hbWUgPSB2YWx1ZS5yZXBsYWNlKC9eWz1AJjxdXFw/Py8sICcnKTtcbiAgICAgICAgICAgIGNvbnN0IGJvdW5kQXR0cmlidXRlID0gbWF0Y2hlZE5hbWUgfHwga2V5O1xuICAgICAgICAgICAgcmV0dXJuIGJvdW5kQXR0cmlidXRlID09PSBuYW1lO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgdmlldyBjb25maWd1cmF0aW9uIHRoYXQgcmVuZGVycyB0aGlzIGNvbXBvbmVudC4gVGhpcyBtZXRob2QgY2FuIGJlXG4gICAgICogdXNlZCB3aGVuIGNvbmZpZ3VyaW5nIHRoZSBBbmd1bGFyIFVJIHJvdXRlciBhcyBmb2xsb3dzOlxuICAgICAqXG4gICAgICogICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdmb28nLCB7XG4gICAgICogICAgICAgICB1cmw6ICcvZm9vJyxcbiAgICAgKiAgICAgICAgIHZpZXdzOiB7IGFwcGxpY2F0aW9uOiBNeUNvbXBvbmVudC5hc1ZpZXcoKSB9LFxuICAgICAqICAgICB9KTtcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGFzVmlldyhvcHRpb25zOiBDb21wb25lbnRWaWV3T3B0aW9ucyA9IHt9KTogYW55IHtcbiAgICAgICAgbGV0IHRlbXBsYXRlID0gJzwnICsgdGhpcy5fX2NvbXBvbmVudENvbmZpZy5kaXJlY3RpdmU7XG4gICAgICAgIGxldCBhdHRyaWJ1dGVzID0gb3B0aW9ucy5hdHRyaWJ1dGVzIHx8IHt9O1xuXG4gICAgICAgIC8vIFNldHVwIGlucHV0IGJpbmRpbmdzLlxuICAgICAgICBpZiAoIV8uaXNFbXB0eShvcHRpb25zLmlucHV0cykpIHtcbiAgICAgICAgICAgIF8uZm9yT3duKG9wdGlvbnMuaW5wdXRzLCAoaW5wdXQsIGtleSkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIEBpZm5kZWYgR0VOSlNfUFJPRFVDVElPTlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5oYXNCaW5kaW5nKGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEdlbkVycm9yKGBJbnB1dCAnJHtrZXl9JyBpcyBub3QgZGVmaW5lZCBvbiBjb21wb25lbnQuYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEBlbmRpZlxuXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlc1trZXldID0gaW5wdXQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdlbmVyYXRlIGF0dHJpYnV0ZXMuXG4gICAgICAgIGlmICghXy5pc0VtcHR5KGF0dHJpYnV0ZXMpKSB7XG4gICAgICAgICAgICBfLmZvck93bihhdHRyaWJ1dGVzLCAoYXR0cmlidXRlLCBhdHRyaWJ1dGVOYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogUHJvcGVybHkgZXNjYXBlIGF0dHJpYnV0ZSB2YWx1ZXMuXG4gICAgICAgICAgICAgICAgdGVtcGxhdGUgKz0gJyAnICsgXy5rZWJhYkNhc2UoYXR0cmlidXRlTmFtZSkgKyAnPVwiJyArIGF0dHJpYnV0ZSArICdcIic7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0ZW1wbGF0ZSArPSAnPjwvJyArIHRoaXMuX19jb21wb25lbnRDb25maWcuZGlyZWN0aXZlICsgJz4nO1xuXG4gICAgICAgIGxldCByZXN1bHQ6IGFueSA9IHtcbiAgICAgICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBTZXR1cCBwYXJlbnQgc2NvcGUgZm9yIHRoZSBpbnRlcm1lZGlhdGUgdGVtcGxhdGUuXG4gICAgICAgIGlmIChvcHRpb25zLnBhcmVudCkge1xuICAgICAgICAgICAgcmVzdWx0LnNjb3BlID0gb3B0aW9ucy5wYXJlbnQuJHNjb3BlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIF8uZXh0ZW5kKHJlc3VsdCwgb3B0aW9ucy5leHRlbmRXaXRoIHx8IHt9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtcyBhbnkgbW9kaWZpY2F0aW9ucyBvZiB0aGUgY29tcG9uZW50IGNvbmZpZ3VyYXRpb24uIFRoaXMgbWV0aG9kIGlzXG4gICAgICogaW52b2tlZCBkdXJpbmcgY29tcG9uZW50IGNsYXNzIGRlY29yYXRpb24gYW5kIG1heSBhcmJpdHJhcmlseSBtb2RpZnkgdGhlXG4gICAgICogcGFzc2VkIGNvbXBvbmVudCBjb25maWd1cmF0aW9uLCBiZWZvcmUgdGhlIGNvbXBvbmVudCBpcyByZWdpc3RlcmVkIHdpdGhcbiAgICAgKiBBbmd1bGFyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbmZpZyBDb21wb25lbnQgY29uZmlndXJhdGlvblxuICAgICAqIEByZXR1cm4gTW9kaWZpZWQgY29tcG9uZW50IGNvbmZpZ3VyYXRpb25cbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGNvbmZpZ3VyZUNvbXBvbmVudChjb25maWc6IENvbXBvbmVudENvbmZpZ3VyYXRpb24pOiBDb21wb25lbnRDb25maWd1cmF0aW9uIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRpcmVjdGl2ZUZhY3RvcnkoY29uZmlnOiBDb21wb25lbnRDb25maWd1cmF0aW9uLCB0eXBlOiBEaXJlY3RpdmVUeXBlKSB7XG4gICAgcmV0dXJuICh0YXJnZXQ6IHR5cGVvZiBDb21wb25lbnRCYXNlKTogRnVuY3Rpb24gPT4ge1xuICAgICAgICAvLyBTdG9yZSBjb21wb25lbnQgY29uZmlndXJhdGlvbiBvbiB0aGUgY29tcG9uZW50LCBleHRlbmRpbmcgY29uZmlndXJhdGlvbiBvYnRhaW5lZCBmcm9tIGJhc2UgY2xhc3MuXG4gICAgICAgIGlmICh0YXJnZXQuX19jb21wb25lbnRDb25maWcpIHtcbiAgICAgICAgICAgIHRhcmdldC5fX2NvbXBvbmVudENvbmZpZyA9IF8uY2xvbmVEZWVwKHRhcmdldC5fX2NvbXBvbmVudENvbmZpZyk7XG4gICAgICAgICAgICAvLyBEb24ndCBpbmhlcml0IHRoZSBhYnN0cmFjdCBmbGFnIGFzIG90aGVyd2lzZSB5b3Ugd291bGQgYmUgcmVxdWlyZWQgdG8gZXhwbGljaXRseVxuICAgICAgICAgICAgLy8gc2V0IGl0IHRvIGZhbHNlIGluIGFsbCBzdWJjbGFzc2VzLlxuICAgICAgICAgICAgZGVsZXRlIHRhcmdldC5fX2NvbXBvbmVudENvbmZpZy5hYnN0cmFjdDtcblxuICAgICAgICAgICAgXy5tZXJnZSh0YXJnZXQuX19jb21wb25lbnRDb25maWcsIGNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0YXJnZXQuX19jb21wb25lbnRDb25maWcgPSBjb25maWc7XG4gICAgICAgIH1cblxuICAgICAgICBjb25maWcgPSB0YXJnZXQuY29uZmlndXJlQ29tcG9uZW50KHRhcmdldC5fX2NvbXBvbmVudENvbmZpZyk7XG5cbiAgICAgICAgaWYgKCFjb25maWcuYWJzdHJhY3QpIHtcbiAgICAgICAgICAgIC8vIElmIG1vZHVsZSBvciBkaXJlY3RpdmUgaXMgbm90IGRlZmluZWQgZm9yIGEgbm9uLWFic3RyYWN0IGNvbXBvbmVudCwgdGhpcyBpcyBhbiBlcnJvci5cbiAgICAgICAgICAgIGlmICghY29uZmlnLmRpcmVjdGl2ZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihcIkRpcmVjdGl2ZSBub3QgZGVmaW5lZCBmb3IgY29tcG9uZW50LlwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFfLnN0YXJ0c1dpdGgoY29uZmlnLmRpcmVjdGl2ZSwgJ2dlbi0nKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihcIkRpcmVjdGl2ZSBub3QgcHJlZml4ZWQgd2l0aCBcXFwiZ2VuLVxcXCI6IFwiICsgY29uZmlnLmRpcmVjdGl2ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghY29uZmlnLm1vZHVsZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihcIk1vZHVsZSBub3QgZGVmaW5lZCBmb3IgY29tcG9uZW50ICdcIiArIGNvbmZpZy5kaXJlY3RpdmUgKyBcIicuXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoXy5hbnkoY29uZmlnLmJpbmRpbmdzLCAodmFsdWUsIGtleSkgPT4gXy5zdGFydHNXaXRoKHZhbHVlLnN1YnN0cmluZygxKSB8fCBrZXksICdkYXRhJykpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmluZGluZ3Mgc2hvdWxkIG5vdCBzdGFydCB3aXRoICdkYXRhJ1wiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uZmlnLm1vZHVsZS5kaXJlY3RpdmUoXy5jYW1lbENhc2UoY29uZmlnLmRpcmVjdGl2ZSksICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb250cm9sbGVyQmluZGluZyA9IGNvbmZpZy5jb250cm9sbGVyQXMgfHwgJ2N0cmwnO1xuXG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdDogYW5ndWxhci5JRGlyZWN0aXZlID0ge1xuICAgICAgICAgICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IGNvbmZpZy5iaW5kaW5ncyB8fCB7fSxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogPGFueT4gdGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyQXM6IGNvbnRyb2xsZXJCaW5kaW5nLFxuICAgICAgICAgICAgICAgICAgICBjb21waWxlOiAoZWxlbWVudCwgYXR0cmlidXRlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FsbCB0aGUgY29tcGlsZSBsaWZlLWN5Y2xlIHN0YXRpYyBtZXRob2QuXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQub25Db21wb25lbnRDb21waWxlKGVsZW1lbnQsIGF0dHJpYnV0ZXMpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKHNjb3BlLCBlbGVtZW50LCBhdHRyaWJ1dGVzLCAuLi5hcmdzKSA9PiB7IC8vIHRzbGludDpkaXNhYmxlLWxpbmU6bm8tc2hhZG93ZWQtdmFyaWFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZXQgY29udHJvbGxlciBmcm9tIHRoZSBzY29wZSBhbmQgY2FsbCB0aGUgbGluayBsaWZlLWN5Y2xlIG1ldGhvZC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPENvbXBvbmVudEJhc2U+IHNjb3BlW2NvbnRyb2xsZXJCaW5kaW5nXSkuX29uQ29tcG9uZW50TGluayhzY29wZSwgZWxlbWVudCwgYXR0cmlidXRlcywgLi4uYXJncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogY29uZmlnLnRlbXBsYXRlVXJsLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogY29uZmlnLnRlbXBsYXRlLFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlOiBjb25maWcucmVxdWlyZSxcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgRGlyZWN0aXZlVHlwZS5DT01QT05FTlQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5yZXN0cmljdCA9ICdFJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgRGlyZWN0aXZlVHlwZS5BVFRSSUJVVEU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5yZXN0cmljdCA9ICdBJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IHVzZSBlcnJvciBoYW5kbGVyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgR2VuRXJyb3IoYFVua25vd24gdHlwZSAke3R5cGV9YCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH07XG59XG5cbi8qKlxuICogQSBkZWNvcmF0b3IgdGhhdCB0cmFuc2Zvcm1zIHRoZSBkZWNvcmF0ZWQgY2xhc3MgaW50byBhbiBBbmd1bGFySlNcbiAqIGNvbXBvbmVudCBkaXJlY3RpdmUgd2l0aCBwcm9wZXIgZGVwZW5kZW5jeSBpbmplY3Rpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wb25lbnQoY29uZmlnOiBDb21wb25lbnRDb25maWd1cmF0aW9uKTogQ2xhc3NEZWNvcmF0b3Ige1xuICAgIHJldHVybiBkaXJlY3RpdmVGYWN0b3J5KGNvbmZpZywgRGlyZWN0aXZlVHlwZS5DT01QT05FTlQpO1xufVxuXG4vKipcbiAqIEEgZGVjb3JhdG9yIHRoYXQgdHJhbnNmb3JtcyB0aGUgZGVjb3JhdGVkIGNsYXNzIGludG8gYW4gQW5ndWxhckpTXG4gKiBhdHRyaWJ1dGUgZGlyZWN0aXZlIHdpdGggcHJvcGVyIGRlcGVuZGVuY3kgaW5qZWN0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlKGNvbmZpZzogQ29tcG9uZW50Q29uZmlndXJhdGlvbik6IENsYXNzRGVjb3JhdG9yIHtcbiAgICByZXR1cm4gZGlyZWN0aXZlRmFjdG9yeShjb25maWcsIERpcmVjdGl2ZVR5cGUuQVRUUklCVVRFKTtcbn1cbiJdfQ==
