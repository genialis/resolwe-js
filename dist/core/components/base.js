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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2NvbXBvbmVudHMvYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsaUNBQW1DO0FBQ25DLDBCQUE0QjtBQUM1Qix1QkFBeUI7QUFFekIsc0NBQXdDO0FBQ3hDLHlDQUF5QztBQUd6QyxJQUFLLGFBR0o7QUFIRCxXQUFLLGFBQWE7SUFDZCwyREFBUyxDQUFBO0lBQ1QsMkRBQVMsQ0FBQTtBQUNiLENBQUMsRUFISSxhQUFhLEtBQWIsYUFBYSxRQUdqQjtBQThDRCwyQkFBMkIsTUFBc0IsRUFBRSxRQUFvQjtJQUNuRSxFQUFFLENBQUMsQ0FBUSxNQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUM3QixNQUFNLENBQUM7SUFDWCxDQUFDO0lBRUQsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDekMsUUFBUSxFQUFFLENBQUM7SUFDZixDQUFDO0lBQUMsSUFBSSxDQUFDLENBQUM7UUFDSixNQUFNLENBQUMsTUFBTSxDQUFDLGNBQVEsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN6QyxDQUFDO0FBQ0wsQ0FBQztBQUVELG1CQUFzQixVQUE0QixFQUFFLEtBQXFCLEVBQUUsUUFBMkI7SUFDbEcsUUFBUSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEdBQUcsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFFNUQsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUM7UUFDeEIsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ2pDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFDLElBQUk7UUFDUixpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsY0FBUSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4RCxDQUFD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TSxJQUFJLGdCQUFRLENBQUMsa0JBQWdCLElBQU0sQ0FBQyxDQUFDO29CQUMvQyxDQUFDO2dCQUNMLENBQUM7Z0JBRUQsTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUNsQixDQUFDLENBQUMsQ0FBQztRQUNQLENBQUM7UUFFRCxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ2xCLENBQUMsQ0FBQztBQUNOLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxtQkFBMEIsTUFBOEI7SUFDcEQsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDN0QsQ0FBQztBQUZELDhCQUVDO0FBRUQ7OztHQUdHO0FBQ0gsbUJBQTBCLE1BQThCO0lBQ3BELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzdELENBQUM7QUFGRCw4QkFFQyIsImZpbGUiOiJjb3JlL2NvbXBvbmVudHMvYmFzZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFuZ3VsYXIgZnJvbSAnYW5ndWxhcic7XG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgKiBhcyBSeCBmcm9tICdyeCc7XG5cbmltcG9ydCB7aXNQcm9taXNlfSBmcm9tICcuLi91dGlscy9sYW5nJztcbmltcG9ydCB7R2VuRXJyb3J9IGZyb20gJy4uL2Vycm9ycy9lcnJvcic7XG5pbXBvcnQge2Vycm9yTG9nfSBmcm9tICcuLi91dGlscy9lcnJvcl9sb2cnO1xuXG5lbnVtIERpcmVjdGl2ZVR5cGUge1xuICAgIENPTVBPTkVOVCxcbiAgICBBVFRSSUJVVEVcbn1cblxuLyoqXG4gKiBDb21wb25lbnQgY29uZmlndXJhdGlvbi4gRGlyZWN0aXZlIG5hbWUgc2hvdWxkIGJlIGluIGRhc2gtY2FzZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb21wb25lbnRDb25maWd1cmF0aW9uIHtcbiAgICBhYnN0cmFjdD86IGJvb2xlYW47XG4gICAgbW9kdWxlPzogYW5ndWxhci5JTW9kdWxlO1xuICAgIGRpcmVjdGl2ZT86IHN0cmluZztcbiAgICBiaW5kaW5ncz86IF8uRGljdGlvbmFyeTxzdHJpbmc+O1xuICAgIGNvbnRyb2xsZXJBcz86IHN0cmluZztcbiAgICB0ZW1wbGF0ZVVybD86IHN0cmluZztcbiAgICB0ZW1wbGF0ZT86IHN0cmluZztcbiAgICByZXF1aXJlPzogc3RyaW5nIHwgc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcG9uZW50Vmlld09wdGlvbnMge1xuICAgIGlucHV0cz86IE9iamVjdDtcbiAgICBwYXJlbnQ/OiBDb21wb25lbnRCYXNlO1xuICAgIGF0dHJpYnV0ZXM/OiBPYmplY3Q7XG4gICAgZXh0ZW5kV2l0aD86IE9iamVjdDtcbn1cblxuaW50ZXJmYWNlIFN1YnNjcmlwdGlvbk1hcCB7XG4gICAgW2tleTogc3RyaW5nXTogUnguRGlzcG9zYWJsZTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb21wdXRhdGlvbkZ1bmN0aW9uIHtcbiAgICAoY29tcHV0YXRpb246IENvbXB1dGF0aW9uKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdWJzY3JpcHRpb24ge1xuICAgIHVuc3Vic2NyaWJlKCk6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3Vic2NyaWJlQ29tcG9uZW50T3B0aW9ucyB7XG4gICAgb25lU2hvdD86IGJvb2xlYW47XG4gICAgb25FcnJvcj86IChleGNlcHRpb246IGFueSkgPT4gdm9pZDtcblxuICAgIC8vIFNldCB0aGlzIHRvIHRydWUgdG8gbWFrZSB0aGUgc3Vic2NyaXB0aW9uIGJlIGlnbm9yZWQgd2hlbiBkZXRlcm1pbmluZ1xuICAgIC8vIHdoZXRoZXIgdGhlIGNvbXBvbmVudCBpcyBkb25lIHdhaXRpbmcgZm9yIHN1YnNjcmlwdGlvbnMuXG4gICAgaWdub3JlUmVhZHk/OiBib29sZWFuO1xufVxuXG50eXBlIFN1YnNjcmlwdGlvbkd1YXJkID0ge307XG5cbmZ1bmN0aW9uIHNhZmVDYWxsYmFja0FwcGx5KCRzY29wZTogYW5ndWxhci5JU2NvcGUsIGNhbGxiYWNrOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgaWYgKCg8YW55PiAkc2NvcGUpLiQkZGVzdHJveWVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoJHNjb3BlLiQkcGhhc2UgfHwgJHNjb3BlLiRyb290LiQkcGhhc2UpIHtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAkc2NvcGUuJGFwcGx5KCgpID0+IHsgY2FsbGJhY2soKTsgfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzYWZlQXBwbHk8VD4ob2JzZXJ2YWJsZTogUnguT2JzZXJ2YWJsZTxUPiwgc2NvcGU6IGFuZ3VsYXIuSVNjb3BlLCBjYWxsYmFjazogKGRhdGE6IFQpID0+IHZvaWQpIHtcbiAgICBjYWxsYmFjayA9IGFuZ3VsYXIuaXNGdW5jdGlvbihjYWxsYmFjaykgPyBjYWxsYmFjayA6IF8ubm9vcDtcblxuICAgIHJldHVybiBvYnNlcnZhYmxlLnRha2VXaGlsZSgoKSA9PiB7XG4gICAgICAgIHJldHVybiAhc2NvcGVbJyQkZGVzdHJveWVkJ107XG4gICAgfSkudGFwKChkYXRhKSA9PiB7XG4gICAgICAgIHNhZmVDYWxsYmFja0FwcGx5KHNjb3BlLCAoKSA9PiB7IGNhbGxiYWNrKGRhdGEpOyB9KTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBBYnN0cmFjdGlvbiBvZiBhIGNvbXB1dGF0aW9uIHdpdGggZGVwZW5kZW5jaWVzIHRvIG9ic2VydmFibGVzLlxuICovXG5leHBvcnQgY2xhc3MgQ29tcHV0YXRpb24ge1xuICAgIHByaXZhdGUgX3N1YnNjcmlwdGlvbnM6IFJ4LkRpc3Bvc2FibGVbXTtcbiAgICBwcml2YXRlIF9wZW5kaW5nU3Vic2NyaXB0aW9uczogU3Vic2NyaXB0aW9uR3VhcmRbXTtcbiAgICBwcml2YXRlIF9kaXNwb3NlOiAoKSA9PiB2b2lkO1xuICAgIHByaXZhdGUgX2RvbmU6IGJvb2xlYW47XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RzIGEgbmV3IGNvbXB1dGF0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbXBvbmVudCBPd25pbmcgY29tcG9uZW50XG4gICAgICogQHBhcmFtIGNvbnRlbnQgQ29tcHV0YXRpb24gY29udGVudFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBjb21wb25lbnQ6IENvbXBvbmVudEJhc2UsIHB1YmxpYyBjb250ZW50OiBDb21wdXRhdGlvbkZ1bmN0aW9uKSB7XG4gICAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5fcGVuZGluZ1N1YnNjcmlwdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5fZGlzcG9zZSA9ICgpID0+IHsgLyogRG8gbm90aGluZyBieSBkZWZhdWx0LiAqLyB9O1xuICAgICAgICB0aGlzLl9kb25lID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhpcyBjb21wdXRhdGlvbiBoYXMgZmluaXNoZWQuXG4gICAgICovXG4gICAgcHVibGljIGlzRG9uZSgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RvbmU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyBhbiBhbHRlcm5hdGl2ZSBkaXNwb3NlIGNhbGxiYWNrIGZvciB0aGlzIGNvbXB1dGF0aW9uLiBUaGlzIGNhbGxiYWNrXG4gICAgICogaXMgaW52b2tlZCB3aGVuIFtbdW5zdWJzY3JpYmVdXSBpcyBjYWxsZWQuXG4gICAgICovXG4gICAgcHVibGljIHNldERpc3Bvc2VDYWxsYmFjayhjYWxsYmFjazogKCkgPT4gdm9pZCkge1xuICAgICAgICB0aGlzLl9kaXNwb3NlID0gY2FsbGJhY2s7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3Vic2NyaWJlcyB0byBhbiBvYnNlcnZhYmxlLCByZWdpc3RlcmluZyB0aGUgc3Vic2NyaXB0aW9uIGFzIGEgZGVwZW5kZW5jeVxuICAgICAqIG9mIHRoaXMgY29tcG9uZW50LiBUaGUgc3Vic2NyaXB0aW9uIGlzIGF1dG9tYXRpY2FsbHkgc3RvcHBlZCB3aGVuIHRoZVxuICAgICAqIGNvbXBvbmVudCBpcyBkZXN0cm95ZWQuXG4gICAgICpcbiAgICAgKiBGb3IgdGhlIHRhcmdldCBhcmd1bWVudCwgeW91IGNhbiBlaXRoZXIgc3BlY2lmeSBhIHN0cmluZywgaW4gd2hpY2ggY2FzZVxuICAgICAqIGl0IHJlcHJlc2VudHMgdGhlIG5hbWUgb2YgdGhlIGNvbXBvbmVudCBtZW1iZXIgdmFyaWFibGUgdGhhdCB3aWxsIGJlXG4gICAgICogcG9wdWxhdGVkIHdpdGggdGhlIHJlc3VsdCBpdGUuIE9yIHlvdSBjYW4gc3BlY2lmeSBhIGZ1bmN0aW9uIHdpdGggb25lXG4gICAgICogYXJndW1lbnQsIHdoaWNoIHdpbGwgYmUgY2FsbGVkIHdoZW4gcXVlcnkgcmVzdWx0cyBjaGFuZ2UgYW5kIGNhbiBkb1xuICAgICAqIGFueXRoaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRhcmdldCBUYXJnZXQgY29tcG9uZW50IG1lbWJlciBhdHJpYnV0ZSBuYW1lIG9yIGNhbGxiYWNrXG4gICAgICogQHBhcmFtIG9ic2VydmFibGUgT2JzZXJ2YWJsZSBvciBwcm9taXNlIHRvIHN1YnNjcmliZSB0b1xuICAgICAqIEByZXR1cm4gVW5kZXJseWluZyBzdWJzY3JpcHRpb24gZGlzcG9zYWJsZVxuICAgICAqL1xuICAgIHB1YmxpYyBzdWJzY3JpYmU8VD4odGFyZ2V0OiBzdHJpbmcgfCAoKGRhdGE6IFQpID0+IGFueSksXG4gICAgICAgICAgICAgICAgICAgICAgICBvYnNlcnZhYmxlOiBSeC5PYnNlcnZhYmxlPFQ+IHwgUHJvbWlzZTxhbnk+LFxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uczogU3Vic2NyaWJlQ29tcG9uZW50T3B0aW9ucyA9IHt9KSB7XG4gICAgICAgIC8vIENyZWF0ZSBhIGd1YXJkIG9iamVjdCB0aGF0IGNhbiBiZSByZW1vdmVkIHdoZW4gYSBzdWJzY3JpcHRpb24gaXMgZG9uZS4gV2UgbmVlZFxuICAgICAgICAvLyB0byB1c2UgZ3VhcmQgb2JqZWN0cyBpbnN0ZWFkIG9mIGEgc2ltcGxlIHJlZmVyZW5jZSBjb3VudGVyIGJlY2F1c2UgdGhlIHBlbmRpbmdcbiAgICAgICAgLy8gc3Vic2NyaXB0aW9ucyBhcnJheSBtYXkgYmUgY2xlYXJlZCB3aGlsZSBjYWxsYmFja3MgYXJlIHN0aWxsIG91dHN0YW5kaW5nLlxuICAgICAgICBjb25zdCBndWFyZCA9IG5ldyBPYmplY3QoKTtcbiAgICAgICAgaWYgKCFvcHRpb25zLmlnbm9yZVJlYWR5KSB7XG4gICAgICAgICAgICB0aGlzLl9wZW5kaW5nU3Vic2NyaXB0aW9ucy5wdXNoKGd1YXJkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjb252ZXJ0ZWRPYnNlcnZhYmxlOiBSeC5PYnNlcnZhYmxlPFQ+O1xuICAgICAgICBpZiAoaXNQcm9taXNlKG9ic2VydmFibGUpKSB7XG4gICAgICAgICAgICBjb252ZXJ0ZWRPYnNlcnZhYmxlID0gUnguT2JzZXJ2YWJsZS5mcm9tUHJvbWlzZShvYnNlcnZhYmxlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnZlcnRlZE9ic2VydmFibGUgPSBvYnNlcnZhYmxlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVsZWFzZUd1YXJkID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fcGVuZGluZ1N1YnNjcmlwdGlvbnMgPSBfLndpdGhvdXQodGhpcy5fcGVuZGluZ1N1YnNjcmlwdGlvbnMsIGd1YXJkKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29udmVydGVkT2JzZXJ2YWJsZSA9IGNvbnZlcnRlZE9ic2VydmFibGUudGFwKHJlbGVhc2VHdWFyZCwgcmVsZWFzZUd1YXJkKTtcblxuICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBzYWZlQXBwbHkoXG4gICAgICAgICAgICBjb252ZXJ0ZWRPYnNlcnZhYmxlLFxuICAgICAgICAgICAgdGhpcy5jb21wb25lbnQuJHNjb3BlLFxuICAgICAgICAgICAgKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKHRhcmdldCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldChpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29tcG9uZW50W3RhcmdldF0gPSBpdGVtO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEBpZm5kZWYgR0VOSlNfUFJPRFVDVElPTlxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JMb2coJ0lnbm9yZWQgZXJyb3InLCBleGNlcHRpb24pO1xuICAgICAgICAgICAgICAgICAgICAvLyBAZW5kaWZcbiAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgICAgICAvLyBEaXNwb3NlIG9mIHRoZSBzdWJzY3JpcHRpb24gaW1tZWRpYXRlbHkgaWYgdGhpcyBpcyBhIG9uZSBzaG90IHN1YnNjcmlwdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMub25lU2hvdCAmJiBzdWJzY3JpcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICkuc3Vic2NyaWJlKFxuICAgICAgICAgICAgLy8gU3VjY2VzcyBoYW5kbGVyLlxuICAgICAgICAgICAgXy5ub29wLFxuICAgICAgICAgICAgLy8gRXJyb3IgaGFuZGxlci5cbiAgICAgICAgICAgIChleGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEBpZm5kZWYgR0VOSlNfUFJPRFVDVElPTlxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JMb2coJ0hhbmRsZWQgZXJyb3InLCBleGNlcHRpb24pO1xuICAgICAgICAgICAgICAgICAgICAvLyBAZW5kaWZcbiAgICAgICAgICAgICAgICAgICAgc2FmZUNhbGxiYWNrQXBwbHkodGhpcy5jb21wb25lbnQuJHNjb3BlLCAoKSA9PiB7IG9wdGlvbnMub25FcnJvcihleGNlcHRpb24pOyB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBAaWZuZGVmIEdFTkpTX1BST0RVQ1RJT05cbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yTG9nKCdVbmhhbmRsZWQgZXJyb3InLCBleGNlcHRpb24pO1xuICAgICAgICAgICAgICAgICAgICAvLyBAZW5kaWZcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5wdXNoKHN1YnNjcmlwdGlvbik7XG4gICAgICAgIHJldHVybiBzdWJzY3JpcHRpb247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0cnVlIGlmIGFsbCBzdWJzY3JpcHRpb25zIGNyZWF0ZWQgYnkgY2FsbGluZyBgc3Vic2NyaWJlYCBhcmUgcmVhZHkuXG4gICAgICogQSBzdWJzY3JpcHRpb24gaXMgcmVhZHkgd2hlbiBpdCBoYXMgcmVjZWl2ZWQgaXRzIGZpcnN0IGJhdGNoIG9mIGRhdGEgYWZ0ZXJcbiAgICAgKiBzdWJzY3JpYmluZy5cbiAgICAgKi9cbiAgICBwdWJsaWMgc3Vic2NyaXB0aW9uc1JlYWR5KCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGVuZGluZ1N1YnNjcmlwdGlvbnMubGVuZ3RoID09PSAwO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJ1bnMgdGhlIGNvbXB1dGF0aW9uLlxuICAgICAqL1xuICAgIHB1YmxpYyBjb21wdXRlKCkge1xuICAgICAgICAvLyBTdG9wIGFsbCBzdWJzY3JpcHRpb25zIGJlZm9yZSBydW5uaW5nIGFnYWluLlxuICAgICAgICB0aGlzLnN0b3AoKTtcbiAgICAgICAgdGhpcy5jb250ZW50KHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERpc3Bvc2VzIG9mIGFsbCByZWdpc3RlcmVkIHN1YnNjcmlwdGlvbnMuXG4gICAgICovXG4gICAgcHVibGljIHN0b3AoKSB7XG4gICAgICAgIGZvciAobGV0IHN1YnNjcmlwdGlvbiBvZiB0aGlzLl9zdWJzY3JpcHRpb25zKSB7XG4gICAgICAgICAgICBzdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5fcGVuZGluZ1N1YnNjcmlwdGlvbnMgPSBbXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdG9wcyBhbGwgc3Vic2NyaXB0aW9ucyBjdXJyZW50bHkgcmVnaXN0ZXJlZCBpbiB0aGlzIGNvbXB1dGF0aW9uIGFuZCByZW1vdmVzXG4gICAgICogdGhpcyBjb21wdXRhdGlvbiBmcm9tIHRoZSBwYXJlbnQgY29tcG9uZW50LiBJZiBhIGRpc3Bvc2UgaGFuZGxlciBoYXMgYmVlblxuICAgICAqIGNvbmZpZ3VyZWQsIGl0IGlzIGludm9rZWQuXG4gICAgICovXG4gICAgcHVibGljIHVuc3Vic2NyaWJlKCkge1xuICAgICAgICB0aGlzLmNvbXBvbmVudC51bnN1YnNjcmliZSh0aGlzKTtcbiAgICAgICAgaWYgKHRoaXMuX2Rpc3Bvc2UpIHRoaXMuX2Rpc3Bvc2UoKTtcbiAgICAgICAgdGhpcy5fZG9uZSA9IHRydWU7XG4gICAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFdhdGNoRXhwcmVzc2lvbk9mPFQ+IHtcbiAgICAoKTogVDtcbn1cbmV4cG9ydCB0eXBlIFdhdGNoRXhwcmVzc2lvbiA9IFdhdGNoRXhwcmVzc2lvbk9mPHt9PjtcblxuLyoqXG4gKiBBbiBhYnN0cmFjdCBiYXNlIGNsYXNzIGZvciBhbGwgY29tcG9uZW50cy5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIENvbXBvbmVudEJhc2Uge1xuICAgIC8vIENvbXBvbmVudCBjb25maWd1cmF0aW9uLlxuICAgIHB1YmxpYyBzdGF0aWMgX19jb21wb25lbnRDb25maWc6IENvbXBvbmVudENvbmZpZ3VyYXRpb247XG4gICAgLy8gQ29tcHV0YXRpb25zLlxuICAgIHByaXZhdGUgX2NvbXB1dGF0aW9uczogQ29tcHV0YXRpb25bXSA9IFtdO1xuICAgIC8vIENvbXBvbmVudCBzdGF0ZS5cbiAgICBwcml2YXRlIF9yZWFkeTogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgLy8gQG5nSW5qZWN0XG4gICAgY29uc3RydWN0b3IocHVibGljICRzY29wZTogYW5ndWxhci5JU2NvcGUpIHtcbiAgICAgICAgJHNjb3BlLiRvbignJGRlc3Ryb3knLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9yZWFkeSA9IGZhbHNlO1xuXG4gICAgICAgICAgICAvLyBFbnN1cmUgdGhhdCBhbGwgY29tcHV0YXRpb25zIGdldCBzdG9wcGVkIHdoZW4gdGhlIGNvbXBvbmVudCBpcyBkZXN0cm95ZWQuXG4gICAgICAgICAgICBmb3IgKGxldCBjb21wdXRhdGlvbiBvZiB0aGlzLl9jb21wdXRhdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBjb21wdXRhdGlvbi5zdG9wKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9jb21wdXRhdGlvbnMgPSBbXTtcblxuICAgICAgICAgICAgLy8gQ2FsbCBkZXN0cm95ZWQgaG9vay5cbiAgICAgICAgICAgIHRoaXMub25Db21wb25lbnREZXN0cm95ZWQoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQW5ndWxhciBjYWxscyAkb25Jbml0IGFmdGVyIGNvbnN0cnVjdG9yIGFuZCBiaW5kaW5ncyBpbml0aWFsaXphdGlvbi5cbiAgICAgICAgdGhpc1snJG9uSW5pdCddID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5vbkNvbXBvbmVudEluaXQoKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCBhZnRlciB0aGUgd2hvbGUgY2hhaW4gb2YgY29uc3RydWN0b3JzIGlzIGV4ZWN1dGVkLFxuICAgICAqIHZpYSBhbmd1bGFyIGNvbXBvbmVudCAkb25Jbml0LiBVc2UgaXQgaWYgeW91IGhhdmUgYW4gYWJzdHJhY3QgY29tcG9uZW50IHRoYXRcbiAgICAgKiBtYW5pcHVsYXRlcyBjbGFzcyBwcm9wZXJ0aWVzIGFuZCwgYXMgYSByZXN1bHQsIG5lZWRzIHRvIHdhaXQgZm9yIGFsbCBjaGlsZFxuICAgICAqIGNsYXNzIHByb3BlcnRpZXMgdG8gYmUgYXNzaWduZWQgYW5kIGNvbnN0cnVjdG9ycyB0byBmaW5pc2guIChDbGFzcyBwcm9wZXJ0aWVzXG4gICAgICogZGVmaW5lZCBpbiBjaGlsZCBjb21wb25lbnRzIGFyZSBhc3NpZ25lZCBiZWZvcmUgY2hpbGQncyBjb25zdHJ1Y3RvcikuXG4gICAgICpcbiAgICAgKiBPcmRlciBvZiBleGVjdXRpb246XG4gICAgICogYGBgdHNcbiAgICAgKiBjbGFzcyBDaGlsZCBleHRlbmRzIE1pZGRsZSB7XG4gICAgICogICAgIHB1YmxpYyBwcm9wZXJ0eUEgPSAnYycgICAgLy8gNVxuICAgICAqICAgICBjb25zdHJ1Y3RvcigpIHsgc3VwZXIoKSB9IC8vIDZcbiAgICAgKiB9XG4gICAgICogY2xhc3MgTWlkZGxlIGV4dGVuZHMgQWJzdHJhY3Qge1xuICAgICAqICAgICBwdWJsaWMgcHJvcGVydHlCID0gJ2InICAgIC8vIDNcbiAgICAgKiAgICAgY29uc3RydWN0b3IoKSB7IHN1cGVyKCkgfSAvLyA0XG4gICAgICogfVxuICAgICAqIGNsYXNzIEFic3RyYWN0IHtcbiAgICAgKiAgICAgcHVibGljIHByb3BlcnR5QSA9ICdhJyAgICAvLyAxXG4gICAgICogICAgIGNvbnN0cnVjdG9yKCkge30gICAgICAgICAgLy8gMlxuICAgICAqICAgICBvbkNvbXBvbmVudEluaXQoKSB7fSAgICAvLyA3XG4gICAgICogfVxuICAgICAqIGBgYFxuICAgICAqL1xuICAgIHB1YmxpYyBvbkNvbXBvbmVudEluaXQoKSB7XG4gICAgICAgIC8vIERlZmF1bHQgaW1wbGVtZW50YXRpb24gZG9lcyBub3RoaW5nLlxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlc3Ryb3lzIHRoZSBjb21wb25lbnQuXG4gICAgICovXG4gICAgcHVibGljIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgICAgIHRoaXMuJHNjb3BlLiRkZXN0cm95KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgaW4gdGhlIGNvbXBpbGUgcGhhc2Ugb2YgdGhlIGRpcmVjdGl2ZSBhbmQgbWF5XG4gICAgICogYmUgb3ZlcnJpZGVuIGJ5IGNvbXBvbmVudCBpbXBsZW1lbnRhdGlvbnMuXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBvbkNvbXBvbmVudENvbXBpbGUoZWxlbWVudDogYW5ndWxhci5JQXVnbWVudGVkSlF1ZXJ5LCBhdHRyaWJ1dGVzOiBhbmd1bGFyLklBdHRyaWJ1dGVzKTogdm9pZCB7XG4gICAgICAgIC8vIERlZmF1bHQgaW1wbGVtZW50YXRpb24gZG9lcyBub3RoaW5nLlxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIHB1YmxpYyBfb25Db21wb25lbnRMaW5rKHNjb3BlOiBhbmd1bGFyLklTY29wZSwgZWxlbWVudDogYW5ndWxhci5JQXVnbWVudGVkSlF1ZXJ5LCBhdHRyaWJ1dGVzOiBhbmd1bGFyLklBdHRyaWJ1dGVzLCAuLi5hcmdzKTogdm9pZCB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBDYWxsIHRoZSBwdWJsaWMgbWV0aG9kIHRoYXQgY2FuIGJlIG92ZXJyaWRlbiBieSB0aGUgdXNlci5cbiAgICAgICAgICAgIHRoaXMub25Db21wb25lbnRMaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRyaWJ1dGVzLCAuLi5hcmdzKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuX3JlYWR5ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkIGluIHRoZSBwb3N0LWxpbmsgcGhhc2Ugb2YgdGhlIGRpcmVjdGl2ZSBhbmQgbWF5XG4gICAgICogYmUgb3ZlcnJpZGVuIGJ5IGNvbXBvbmVudCBpbXBsZW1lbnRhdGlvbnMuXG4gICAgICovXG4gICAgcHVibGljIG9uQ29tcG9uZW50TGluayhzY29wZTogYW5ndWxhci5JU2NvcGUsIGVsZW1lbnQ6IGFuZ3VsYXIuSUF1Z21lbnRlZEpRdWVyeSwgYXR0cmlidXRlczogYW5ndWxhci5JQXR0cmlidXRlcywgLi4uYXJncyk6IHZvaWQge1xuICAgICAgICAvLyBEZWZhdWx0IGltcGxlbWVudGF0aW9uIGRvZXMgbm90aGluZy5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCBhZnRlciB0aGUgY29tcG9uZW50IHNjb3BlIGhhcyBiZWVuIGRlc3Ryb3llZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgb25Db21wb25lbnREZXN0cm95ZWQoKTogdm9pZCB7XG4gICAgICAgIC8vIERlZmF1bHQgaW1wbGVtZW50YXRpb24gZG9lcyBub3RoaW5nLlxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgY29tcG9uZW50IGhhcyBiZWVuIGNyZWF0ZWQuXG4gICAgICovXG4gICAgcHVibGljIGlzUmVhZHkoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZWFkeTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRydWUgaWYgYWxsIHN1YnNjcmlwdGlvbnMgY3JlYXRlZCBieSBjYWxsaW5nIGBzdWJzY3JpYmVgIGFyZSByZWFkeS5cbiAgICAgKiBBIHN1YnNjcmlwdGlvbiBpcyByZWFkeSB3aGVuIGl0IGhhcyByZWNlaXZlZCBpdHMgZmlyc3QgYmF0Y2ggb2YgZGF0YSBhZnRlclxuICAgICAqIHN1YnNjcmliaW5nLlxuICAgICAqL1xuICAgIHB1YmxpYyBzdWJzY3JpcHRpb25zUmVhZHkoKTogYm9vbGVhbiB7XG4gICAgICAgIC8vIFdhaXQgdW50aWwgdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBjcmVhdGVkLlxuICAgICAgICBpZiAoIXRoaXMuaXNSZWFkeSgpKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuIF8uZXZlcnkodGhpcy5fY29tcHV0YXRpb25zLCAoY29tcHV0YXRpb24pID0+IGNvbXB1dGF0aW9uLnN1YnNjcmlwdGlvbnNSZWFkeSgpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jcmVhdGVDb21wdXRhdGlvbihjb250ZW50OiBDb21wdXRhdGlvbkZ1bmN0aW9uID0gXy5ub29wKTogQ29tcHV0YXRpb24ge1xuICAgICAgICBsZXQgY29tcHV0YXRpb24gPSBuZXcgQ29tcHV0YXRpb24odGhpcywgY29udGVudCk7XG4gICAgICAgIHRoaXMuX2NvbXB1dGF0aW9ucy5wdXNoKGNvbXB1dGF0aW9uKTtcbiAgICAgICAgcmV0dXJuIGNvbXB1dGF0aW9uO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFdhdGNoIGNvbXBvbmVudCBzY29wZSBhbmQgcnVuIGEgY29tcHV0YXRpb24gb24gY2hhbmdlcy4gVGhlIGNvbXB1dGF0aW9uIGlzXG4gICAgICogZXhlY3V0ZWQgb25jZSBpbW1lZGlhdGVseSBwcmlvciB0byB3YXRjaGluZy5cbiAgICAgKlxuICAgICAqIFJldHVybmVkIGNvbXB1dGF0aW9uIGluc3RhbmNlIG1heSBiZSB1c2VkIHRvIHN0b3AgdGhlIHdhdGNoIGJ5IGNhbGxpbmcgaXRzXG4gICAgICogW1tDb21wdXRhdGlvbi51bnN1YnNjcmliZV1dIG1ldGhvZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb250ZXh0IEZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhlIGNvbnRleHQgdG8gd2F0Y2hcbiAgICAgKiBAcGFyYW0gY29udGVudCBGdW5jdGlvbiB0byBydW4gb24gY2hhbmdlc1xuICAgICAqIEBwYXJhbSBvYmplY3RFcXVhbGl0eSBTaG91bGQgYGFuZ3VsYXIuZXF1YWxzYCBiZSB1c2VkIGZvciBjb21wYXJpc29uc1xuICAgICAqIEByZXR1cm5zIENvbXB1dGF0aW9uIGluc3RhbmNlXG4gICAgICovXG4gICAgcHVibGljIHdhdGNoKGNvbnRleHQ6IFdhdGNoRXhwcmVzc2lvbiB8IFdhdGNoRXhwcmVzc2lvbltdLFxuICAgICAgICAgICAgICAgICBjb250ZW50OiBDb21wdXRhdGlvbkZ1bmN0aW9uLFxuICAgICAgICAgICAgICAgICBvYmplY3RFcXVhbGl0eT86IGJvb2xlYW4pOiBDb21wdXRhdGlvbiB7XG4gICAgICAgIGxldCBjb21wdXRhdGlvbiA9IHRoaXMuX2NyZWF0ZUNvbXB1dGF0aW9uKGNvbnRlbnQpO1xuICAgICAgICBjb21wdXRhdGlvbi5jb21wdXRlKCk7XG5cbiAgICAgICAgLy8gSW5pdGlhbCBldmFsdWF0aW9uIG1heSBzdG9wIHRoZSBjb21wdXRhdGlvbi4gSW4gdGhpcyBjYXNlLCBkb24ndFxuICAgICAgICAvLyBldmVuIGNyZWF0ZSBhIHdhdGNoIGFuZCBqdXN0IHJldHVybiB0aGUgKGRvbmUpIGNvbXB1dGF0aW9uLlxuICAgICAgICBpZiAoY29tcHV0YXRpb24uaXNEb25lKCkpIHJldHVybiBjb21wdXRhdGlvbjtcblxuICAgICAgICBsZXQgZXhwcmVzc2lvbnMgPSBBcnJheS5pc0FycmF5KGNvbnRleHQpID8gY29udGV4dCA6IFtjb250ZXh0XTtcblxuICAgICAgICBpZiAoIW9iamVjdEVxdWFsaXR5KSB7XG4gICAgICAgICAgICBjb25zdCB1bndhdGNoID0gdGhpcy4kc2NvcGUuJHdhdGNoR3JvdXAoZXhwcmVzc2lvbnMsIGNvbXB1dGF0aW9uLmNvbXB1dGUuYmluZChjb21wdXRhdGlvbikpO1xuICAgICAgICAgICAgY29tcHV0YXRpb24uc2V0RGlzcG9zZUNhbGxiYWNrKHVud2F0Y2gpO1xuICAgICAgICAgICAgcmV0dXJuIGNvbXB1dGF0aW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHdhdGNoZWRFeHByZXNzaW9uOiBXYXRjaEV4cHJlc3Npb24gPSAoKSA9PiBfLm1hcChleHByZXNzaW9ucywgZm4gPT4gZm4oKSk7XG4gICAgICAgIGlmIChleHByZXNzaW9ucy5sZW5ndGggPT09IDEpIHsgLy8gb3B0aW1pemVcbiAgICAgICAgICAgIHdhdGNoZWRFeHByZXNzaW9uID0gZXhwcmVzc2lvbnNbMF07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1bndhdGNoID0gdGhpcy4kc2NvcGUuJHdhdGNoKHdhdGNoZWRFeHByZXNzaW9uLCBjb21wdXRhdGlvbi5jb21wdXRlLmJpbmQoY29tcHV0YXRpb24pLCB0cnVlKTtcbiAgICAgICAgY29tcHV0YXRpb24uc2V0RGlzcG9zZUNhbGxiYWNrKHVud2F0Y2gpO1xuICAgICAgICByZXR1cm4gY29tcHV0YXRpb247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogV2F0Y2ggY29tcG9uZW50IHNjb3BlIGFuZCBydW4gYSBjb21wdXRhdGlvbiBvbiBjaGFuZ2VzLiBUaGlzIHZlcnNpb24gdXNlcyBBbmd1bGFyJ3NcbiAgICAgKiBjb2xsZWN0aW9uIHdhdGNoLiBUaGUgY29tcHV0YXRpb24gaXMgZXhlY3V0ZWQgb25jZSBpbW1lZGlhdGVseSBwcmlvciB0byB3YXRjaGluZy5cbiAgICAgKlxuICAgICAqIFJldHVybmVkIGNvbXB1dGF0aW9uIGluc3RhbmNlIG1heSBiZSB1c2VkIHRvIHN0b3AgdGhlIHdhdGNoIGJ5IGNhbGxpbmcgaXRzXG4gICAgICogW1tDb21wdXRhdGlvbi51bnN1YnNjcmliZV1dIG1ldGhvZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb250ZXh0IEZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhlIGNvbnRleHQgdG8gd2F0Y2hcbiAgICAgKiBAcGFyYW0gY29udGVudCBGdW5jdGlvbiB0byBydW4gb24gY2hhbmdlc1xuICAgICAqIEByZXR1cm5zIENvbXB1dGF0aW9uIGluc3RhbmNlXG4gICAgICovXG4gICAgcHVibGljIHdhdGNoQ29sbGVjdGlvbihjb250ZXh0OiBXYXRjaEV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBDb21wdXRhdGlvbkZ1bmN0aW9uKTogQ29tcHV0YXRpb24ge1xuICAgICAgICBsZXQgY29tcHV0YXRpb24gPSB0aGlzLl9jcmVhdGVDb21wdXRhdGlvbihjb250ZW50KTtcbiAgICAgICAgY29tcHV0YXRpb24uY29tcHV0ZSgpO1xuXG4gICAgICAgIC8vIEluaXRpYWwgZXZhbHVhdGlvbiBtYXkgc3RvcCB0aGUgY29tcHV0YXRpb24uIEluIHRoaXMgY2FzZSwgZG9uJ3RcbiAgICAgICAgLy8gZXZlbiBjcmVhdGUgYSB3YXRjaCBhbmQganVzdCByZXR1cm4gdGhlIChkb25lKSBjb21wdXRhdGlvbi5cbiAgICAgICAgaWYgKGNvbXB1dGF0aW9uLmlzRG9uZSgpKSByZXR1cm4gY29tcHV0YXRpb247XG5cbiAgICAgICAgY29uc3QgdW53YXRjaCA9IHRoaXMuJHNjb3BlLiR3YXRjaENvbGxlY3Rpb24oY29udGV4dCwgY29tcHV0YXRpb24uY29tcHV0ZS5iaW5kKGNvbXB1dGF0aW9uKSk7XG4gICAgICAgIGNvbXB1dGF0aW9uLnNldERpc3Bvc2VDYWxsYmFjayh1bndhdGNoKTtcbiAgICAgICAgcmV0dXJuIGNvbXB1dGF0aW9uO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN1YnNjcmliZXMgdG8gYW4gb2JzZXJ2YWJsZSwgcmVnaXN0ZXJpbmcgdGhlIHN1YnNjcmlwdGlvbiBhcyBhIGRlcGVuZGVuY3lcbiAgICAgKiBvZiB0aGlzIGNvbXBvbmVudC4gVGhlIHN1YnNjcmlwdGlvbiBpcyBhdXRvbWF0aWNhbGx5IHN0b3BwZWQgd2hlbiB0aGVcbiAgICAgKiBjb21wb25lbnQgaXMgZGVzdHJveWVkLlxuICAgICAqXG4gICAgICogRm9yIHRoZSB0YXJnZXQgYXJndW1lbnQsIHlvdSBjYW4gZWl0aGVyIHNwZWNpZnkgYSBzdHJpbmcsIGluIHdoaWNoIGNhc2VcbiAgICAgKiBpdCByZXByZXNlbnRzIHRoZSBuYW1lIG9mIHRoZSBjb21wb25lbnQgbWVtYmVyIHZhcmlhYmxlIHRoYXQgd2lsbCBiZVxuICAgICAqIHBvcHVsYXRlZCB3aXRoIHRoZSByZXN1bHQgaXRlLiBPciB5b3UgY2FuIHNwZWNpZnkgYSBmdW5jdGlvbiB3aXRoIG9uZVxuICAgICAqIGFyZ3VtZW50LCB3aGljaCB3aWxsIGJlIGNhbGxlZCB3aGVuIHF1ZXJ5IHJlc3VsdHMgY2hhbmdlIGFuZCBjYW4gZG9cbiAgICAgKiBhbnl0aGluZy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0YXJnZXQgVGFyZ2V0IGNvbXBvbmVudCBtZW1iZXIgYXRyaWJ1dGUgbmFtZSBvciBjYWxsYmFja1xuICAgICAqIEBwYXJhbSBvYnNlcnZhYmxlIE9ic2VydmFibGUgdG8gc3Vic2NyaWJlIHRvXG4gICAgICogQHJldHVybiBVbmRlcmx5aW5nIHN1YnNjcmlwdGlvblxuICAgICAqL1xuICAgIHB1YmxpYyBzdWJzY3JpYmU8VD4odGFyZ2V0OiBzdHJpbmcgfCAoKGRhdGE6IFQpID0+IGFueSksXG4gICAgICAgICAgICAgICAgICAgICAgICBvYnNlcnZhYmxlOiBSeC5PYnNlcnZhYmxlPFQ+IHwgUHJvbWlzZTxhbnk+LFxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uczogU3Vic2NyaWJlQ29tcG9uZW50T3B0aW9ucyA9IHt9KTogU3Vic2NyaXB0aW9uIHtcbiAgICAgICAgbGV0IGNvbXB1dGF0aW9uID0gdGhpcy5fY3JlYXRlQ29tcHV0YXRpb24oKTtcbiAgICAgICAgY29tcHV0YXRpb24uc3Vic2NyaWJlKHRhcmdldCwgb2JzZXJ2YWJsZSwgb3B0aW9ucyk7XG4gICAgICAgIHJldHVybiBjb21wdXRhdGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVbnN1YnNjcmliZXMgdGhlIGdpdmVuIGNvbXB1dGF0aW9uIGZyb20gdGhpcyBjb21wb25lbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29tcHV0YXRpb24gQ29tcHV0YXRpb24gaW5zdGFuY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgdW5zdWJzY3JpYmUoY29tcHV0YXRpb246IENvbXB1dGF0aW9uKTogdm9pZCB7XG4gICAgICAgIGNvbXB1dGF0aW9uLnN0b3AoKTtcbiAgICAgICAgXy5wdWxsKHRoaXMuX2NvbXB1dGF0aW9ucywgY29tcHV0YXRpb24pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEhlbHBlciBmdW5jdGlvbiB0byBjcmVhdGUgYSB3cmFwcGVyIG9ic2VydmFibGUgYXJvdW5kIHdhdGNoLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbnRleHQgRnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0aGUgY29udGV4dCB0byB3YXRjaFxuICAgICAqIEBwYXJhbSBvYmplY3RFcXVhbGl0eSBTaG91bGQgYGFuZ3VsYXIuZXF1YWxzYCBiZSB1c2VkIGZvciBjb21wYXJpc29uc1xuICAgICAqIEByZXR1cm5zIFdhdGNoIG9ic2VydmFibGVcbiAgICAgKi9cbiAgICBwdWJsaWMgY3JlYXRlV2F0Y2hPYnNlcnZhYmxlPFQ+KGNvbnRleHQ6IFdhdGNoRXhwcmVzc2lvbk9mPFQ+LCBvYmplY3RFcXVhbGl0eT86IGJvb2xlYW4pOiBSeC5PYnNlcnZhYmxlPFQ+IHtcbiAgICAgICAgY29uc3Qgbm90aWZ5T2JzZXJ2ZXIgPSAob2JzZXJ2ZXI6IFJ4Lk9ic2VydmVyPFQ+KSA9PiB7XG4gICAgICAgICAgICBvYnNlcnZlci5vbk5leHQoY29udGV4dCgpKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gUnguT2JzZXJ2YWJsZS5jcmVhdGU8VD4oKG9ic2VydmVyKSA9PiB7XG4gICAgICAgICAgICBub3RpZnlPYnNlcnZlcihvYnNlcnZlcik7XG5cbiAgICAgICAgICAgIGNvbnN0IGNvbXB1dGF0aW9uID0gdGhpcy53YXRjaChcbiAgICAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgICAgICgpID0+IG5vdGlmeU9ic2VydmVyKG9ic2VydmVyKSxcbiAgICAgICAgICAgICAgICBvYmplY3RFcXVhbGl0eVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiAoKSA9PiB7IGNvbXB1dGF0aW9uLnVuc3Vic2NyaWJlKCk7IH07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgY29tcG9uZW50IGNvbmZpZ3VyYXRpb24uXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBnZXRDb25maWcoKTogQ29tcG9uZW50Q29uZmlndXJhdGlvbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fY29tcG9uZW50Q29uZmlnO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgY29tcG9uZW50IGNvbmZpZ3VyYXRpb24uXG4gICAgICovXG4gICAgcHVibGljIGdldENvbmZpZygpOiBDb21wb25lbnRDb25maWd1cmF0aW9uIHtcbiAgICAgICAgcmV0dXJuICg8dHlwZW9mIENvbXBvbmVudEJhc2U+IHRoaXMuY29uc3RydWN0b3IpLmdldENvbmZpZygpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgY29tcG9uZW50IGhhcyBhIHNwZWNpZmllZCBhdHRyaWJ1dGUgY29uZmlndXJlZCBhc1xuICAgICAqIGEgYmluZGluZy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGJvdW5kIGF0dHJpYnV0ZVxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgaGFzQmluZGluZyhuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIF8uc29tZSh0aGlzLl9fY29tcG9uZW50Q29uZmlnLmJpbmRpbmdzLCAodmFsdWUsIGtleSkgPT4ge1xuICAgICAgICAgICAgLy8gSW4gY2FzZSBubyBhdHRyaWJ1dGUgbmFtZSBpcyBzcGVjaWZpZWQsIGNvbXBhcmUgdGhlIGJpbmRpbmcga2V5LFxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlIGNvbXBhcmUgdGhlIGF0dHJpYnV0ZSBuYW1lLlxuICAgICAgICAgICAgY29uc3QgbWF0Y2hlZE5hbWUgPSB2YWx1ZS5yZXBsYWNlKC9eWz1AJjxdXFw/Py8sICcnKTtcbiAgICAgICAgICAgIGNvbnN0IGJvdW5kQXR0cmlidXRlID0gbWF0Y2hlZE5hbWUgfHwga2V5O1xuICAgICAgICAgICAgcmV0dXJuIGJvdW5kQXR0cmlidXRlID09PSBuYW1lO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgdmlldyBjb25maWd1cmF0aW9uIHRoYXQgcmVuZGVycyB0aGlzIGNvbXBvbmVudC4gVGhpcyBtZXRob2QgY2FuIGJlXG4gICAgICogdXNlZCB3aGVuIGNvbmZpZ3VyaW5nIHRoZSBBbmd1bGFyIFVJIHJvdXRlciBhcyBmb2xsb3dzOlxuICAgICAqXG4gICAgICogICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdmb28nLCB7XG4gICAgICogICAgICAgICB1cmw6ICcvZm9vJyxcbiAgICAgKiAgICAgICAgIHZpZXdzOiB7IGFwcGxpY2F0aW9uOiBNeUNvbXBvbmVudC5hc1ZpZXcoKSB9LFxuICAgICAqICAgICB9KTtcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGFzVmlldyhvcHRpb25zOiBDb21wb25lbnRWaWV3T3B0aW9ucyA9IHt9KTogYW55IHtcbiAgICAgICAgbGV0IHRlbXBsYXRlID0gJzwnICsgdGhpcy5fX2NvbXBvbmVudENvbmZpZy5kaXJlY3RpdmU7XG4gICAgICAgIGxldCBhdHRyaWJ1dGVzID0gb3B0aW9ucy5hdHRyaWJ1dGVzIHx8IHt9O1xuXG4gICAgICAgIC8vIFNldHVwIGlucHV0IGJpbmRpbmdzLlxuICAgICAgICBpZiAoIV8uaXNFbXB0eShvcHRpb25zLmlucHV0cykpIHtcbiAgICAgICAgICAgIF8uZm9yT3duKG9wdGlvbnMuaW5wdXRzLCAoaW5wdXQsIGtleSkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIEBpZm5kZWYgR0VOSlNfUFJPRFVDVElPTlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5oYXNCaW5kaW5nKGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEdlbkVycm9yKGBJbnB1dCAnJHtrZXl9JyBpcyBub3QgZGVmaW5lZCBvbiBjb21wb25lbnQuYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEBlbmRpZlxuXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlc1trZXldID0gaW5wdXQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdlbmVyYXRlIGF0dHJpYnV0ZXMuXG4gICAgICAgIGlmICghXy5pc0VtcHR5KGF0dHJpYnV0ZXMpKSB7XG4gICAgICAgICAgICBfLmZvck93bihhdHRyaWJ1dGVzLCAoYXR0cmlidXRlLCBhdHRyaWJ1dGVOYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogUHJvcGVybHkgZXNjYXBlIGF0dHJpYnV0ZSB2YWx1ZXMuXG4gICAgICAgICAgICAgICAgdGVtcGxhdGUgKz0gJyAnICsgXy5rZWJhYkNhc2UoYXR0cmlidXRlTmFtZSkgKyAnPVwiJyArIGF0dHJpYnV0ZSArICdcIic7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0ZW1wbGF0ZSArPSAnPjwvJyArIHRoaXMuX19jb21wb25lbnRDb25maWcuZGlyZWN0aXZlICsgJz4nO1xuXG4gICAgICAgIGxldCByZXN1bHQ6IGFueSA9IHtcbiAgICAgICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBTZXR1cCBwYXJlbnQgc2NvcGUgZm9yIHRoZSBpbnRlcm1lZGlhdGUgdGVtcGxhdGUuXG4gICAgICAgIGlmIChvcHRpb25zLnBhcmVudCkge1xuICAgICAgICAgICAgcmVzdWx0LnNjb3BlID0gb3B0aW9ucy5wYXJlbnQuJHNjb3BlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIF8uZXh0ZW5kKHJlc3VsdCwgb3B0aW9ucy5leHRlbmRXaXRoIHx8IHt9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtcyBhbnkgbW9kaWZpY2F0aW9ucyBvZiB0aGUgY29tcG9uZW50IGNvbmZpZ3VyYXRpb24uIFRoaXMgbWV0aG9kIGlzXG4gICAgICogaW52b2tlZCBkdXJpbmcgY29tcG9uZW50IGNsYXNzIGRlY29yYXRpb24gYW5kIG1heSBhcmJpdHJhcmlseSBtb2RpZnkgdGhlXG4gICAgICogcGFzc2VkIGNvbXBvbmVudCBjb25maWd1cmF0aW9uLCBiZWZvcmUgdGhlIGNvbXBvbmVudCBpcyByZWdpc3RlcmVkIHdpdGhcbiAgICAgKiBBbmd1bGFyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbmZpZyBDb21wb25lbnQgY29uZmlndXJhdGlvblxuICAgICAqIEByZXR1cm4gTW9kaWZpZWQgY29tcG9uZW50IGNvbmZpZ3VyYXRpb25cbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGNvbmZpZ3VyZUNvbXBvbmVudChjb25maWc6IENvbXBvbmVudENvbmZpZ3VyYXRpb24pOiBDb21wb25lbnRDb25maWd1cmF0aW9uIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRpcmVjdGl2ZUZhY3RvcnkoY29uZmlnOiBDb21wb25lbnRDb25maWd1cmF0aW9uLCB0eXBlOiBEaXJlY3RpdmVUeXBlKSB7XG4gICAgcmV0dXJuICh0YXJnZXQ6IHR5cGVvZiBDb21wb25lbnRCYXNlKTogRnVuY3Rpb24gPT4ge1xuICAgICAgICAvLyBTdG9yZSBjb21wb25lbnQgY29uZmlndXJhdGlvbiBvbiB0aGUgY29tcG9uZW50LCBleHRlbmRpbmcgY29uZmlndXJhdGlvbiBvYnRhaW5lZCBmcm9tIGJhc2UgY2xhc3MuXG4gICAgICAgIGlmICh0YXJnZXQuX19jb21wb25lbnRDb25maWcpIHtcbiAgICAgICAgICAgIHRhcmdldC5fX2NvbXBvbmVudENvbmZpZyA9IF8uY2xvbmVEZWVwKHRhcmdldC5fX2NvbXBvbmVudENvbmZpZyk7XG4gICAgICAgICAgICAvLyBEb24ndCBpbmhlcml0IHRoZSBhYnN0cmFjdCBmbGFnIGFzIG90aGVyd2lzZSB5b3Ugd291bGQgYmUgcmVxdWlyZWQgdG8gZXhwbGljaXRseVxuICAgICAgICAgICAgLy8gc2V0IGl0IHRvIGZhbHNlIGluIGFsbCBzdWJjbGFzc2VzLlxuICAgICAgICAgICAgZGVsZXRlIHRhcmdldC5fX2NvbXBvbmVudENvbmZpZy5hYnN0cmFjdDtcblxuICAgICAgICAgICAgXy5tZXJnZSh0YXJnZXQuX19jb21wb25lbnRDb25maWcsIGNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0YXJnZXQuX19jb21wb25lbnRDb25maWcgPSBjb25maWc7XG4gICAgICAgIH1cblxuICAgICAgICBjb25maWcgPSB0YXJnZXQuY29uZmlndXJlQ29tcG9uZW50KHRhcmdldC5fX2NvbXBvbmVudENvbmZpZyk7XG5cbiAgICAgICAgaWYgKCFjb25maWcuYWJzdHJhY3QpIHtcbiAgICAgICAgICAgIC8vIElmIG1vZHVsZSBvciBkaXJlY3RpdmUgaXMgbm90IGRlZmluZWQgZm9yIGEgbm9uLWFic3RyYWN0IGNvbXBvbmVudCwgdGhpcyBpcyBhbiBlcnJvci5cbiAgICAgICAgICAgIGlmICghY29uZmlnLmRpcmVjdGl2ZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihcIkRpcmVjdGl2ZSBub3QgZGVmaW5lZCBmb3IgY29tcG9uZW50LlwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFfLnN0YXJ0c1dpdGgoY29uZmlnLmRpcmVjdGl2ZSwgJ2dlbi0nKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihcIkRpcmVjdGl2ZSBub3QgcHJlZml4ZWQgd2l0aCBcXFwiZ2VuLVxcXCI6IFwiICsgY29uZmlnLmRpcmVjdGl2ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghY29uZmlnLm1vZHVsZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihcIk1vZHVsZSBub3QgZGVmaW5lZCBmb3IgY29tcG9uZW50ICdcIiArIGNvbmZpZy5kaXJlY3RpdmUgKyBcIicuXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoXy5hbnkoY29uZmlnLmJpbmRpbmdzLCAodmFsdWUsIGtleSkgPT4gXy5zdGFydHNXaXRoKHZhbHVlLnN1YnN0cmluZygxKSB8fCBrZXksICdkYXRhJykpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmluZGluZ3Mgc2hvdWxkIG5vdCBzdGFydCB3aXRoICdkYXRhJ1wiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uZmlnLm1vZHVsZS5kaXJlY3RpdmUoXy5jYW1lbENhc2UoY29uZmlnLmRpcmVjdGl2ZSksICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb250cm9sbGVyQmluZGluZyA9IGNvbmZpZy5jb250cm9sbGVyQXMgfHwgJ2N0cmwnO1xuXG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdDogYW5ndWxhci5JRGlyZWN0aXZlID0ge1xuICAgICAgICAgICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IGNvbmZpZy5iaW5kaW5ncyB8fCB7fSxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogPGFueT4gdGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyQXM6IGNvbnRyb2xsZXJCaW5kaW5nLFxuICAgICAgICAgICAgICAgICAgICBjb21waWxlOiAoZWxlbWVudCwgYXR0cmlidXRlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FsbCB0aGUgY29tcGlsZSBsaWZlLWN5Y2xlIHN0YXRpYyBtZXRob2QuXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQub25Db21wb25lbnRDb21waWxlKGVsZW1lbnQsIGF0dHJpYnV0ZXMpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKHNjb3BlLCBlbGVtZW50LCBhdHRyaWJ1dGVzLCAuLi5hcmdzKSA9PiB7IC8vIHRzbGludDpkaXNhYmxlLWxpbmU6bm8tc2hhZG93ZWQtdmFyaWFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZXQgY29udHJvbGxlciBmcm9tIHRoZSBzY29wZSBhbmQgY2FsbCB0aGUgbGluayBsaWZlLWN5Y2xlIG1ldGhvZC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPENvbXBvbmVudEJhc2U+IHNjb3BlW2NvbnRyb2xsZXJCaW5kaW5nXSkuX29uQ29tcG9uZW50TGluayhzY29wZSwgZWxlbWVudCwgYXR0cmlidXRlcywgLi4uYXJncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogY29uZmlnLnRlbXBsYXRlVXJsLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogY29uZmlnLnRlbXBsYXRlLFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlOiBjb25maWcucmVxdWlyZSxcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgRGlyZWN0aXZlVHlwZS5DT01QT05FTlQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5yZXN0cmljdCA9ICdFJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgRGlyZWN0aXZlVHlwZS5BVFRSSUJVVEU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5yZXN0cmljdCA9ICdBJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IHVzZSBlcnJvciBoYW5kbGVyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgR2VuRXJyb3IoYFVua25vd24gdHlwZSAke3R5cGV9YCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH07XG59XG5cbi8qKlxuICogQSBkZWNvcmF0b3IgdGhhdCB0cmFuc2Zvcm1zIHRoZSBkZWNvcmF0ZWQgY2xhc3MgaW50byBhbiBBbmd1bGFySlNcbiAqIGNvbXBvbmVudCBkaXJlY3RpdmUgd2l0aCBwcm9wZXIgZGVwZW5kZW5jeSBpbmplY3Rpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wb25lbnQoY29uZmlnOiBDb21wb25lbnRDb25maWd1cmF0aW9uKTogQ2xhc3NEZWNvcmF0b3Ige1xuICAgIHJldHVybiBkaXJlY3RpdmVGYWN0b3J5KGNvbmZpZywgRGlyZWN0aXZlVHlwZS5DT01QT05FTlQpO1xufVxuXG4vKipcbiAqIEEgZGVjb3JhdG9yIHRoYXQgdHJhbnNmb3JtcyB0aGUgZGVjb3JhdGVkIGNsYXNzIGludG8gYW4gQW5ndWxhckpTXG4gKiBhdHRyaWJ1dGUgZGlyZWN0aXZlIHdpdGggcHJvcGVyIGRlcGVuZGVuY3kgaW5qZWN0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlKGNvbmZpZzogQ29tcG9uZW50Q29uZmlndXJhdGlvbik6IENsYXNzRGVjb3JhdG9yIHtcbiAgICByZXR1cm4gZGlyZWN0aXZlRmFjdG9yeShjb25maWcsIERpcmVjdGl2ZVR5cGUuQVRUUklCVVRFKTtcbn1cbiJdfQ==
