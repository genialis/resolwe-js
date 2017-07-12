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
     * Stops all subscriptions currently reigstered in this computation and removes
     * this computation from the parent component.
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
     * @param context Function which returns the context to watch
     * @param content Function to run on changes
     * @param objectEquality Should `angular.equals` be used for comparisons
     * @returns A function that unregisters the bound expression
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
     * @param context Function which returns the context to watch
     * @param content Function to run on changes
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2NvbXBvbmVudHMvYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsaUNBQW1DO0FBQ25DLDBCQUE0QjtBQUM1Qix1QkFBeUI7QUFFekIsc0NBQXdDO0FBQ3hDLHlDQUF5QztBQUd6QyxJQUFLLGFBR0o7QUFIRCxXQUFLLGFBQWE7SUFDZCwyREFBUyxDQUFBO0lBQ1QsMkRBQVMsQ0FBQTtBQUNiLENBQUMsRUFISSxhQUFhLEtBQWIsYUFBYSxRQUdqQjtBQThDRCwyQkFBMkIsTUFBc0IsRUFBRSxRQUFvQjtJQUNuRSxFQUFFLENBQUMsQ0FBUSxNQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUM3QixNQUFNLENBQUM7SUFDWCxDQUFDO0lBRUQsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDekMsUUFBUSxFQUFFLENBQUM7SUFDZixDQUFDO0lBQUMsSUFBSSxDQUFDLENBQUM7UUFDSixNQUFNLENBQUMsTUFBTSxDQUFDLGNBQVEsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN6QyxDQUFDO0FBQ0wsQ0FBQztBQUVELG1CQUFzQixVQUE0QixFQUFFLEtBQXFCLEVBQUUsUUFBMkI7SUFDbEcsUUFBUSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEdBQUcsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFFNUQsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUM7UUFDeEIsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ2pDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFDLElBQUk7UUFDUixpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsY0FBUSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4RCxDQUFD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QkFBUSxDQUFDLGtCQUFnQixJQUFNLENBQUMsQ0FBQztvQkFDL0MsQ0FBQztnQkFDTCxDQUFDO2dCQUVELE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDbEIsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO1FBRUQsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNsQixDQUFDLENBQUM7QUFDTixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsbUJBQTBCLE1BQThCO0lBQ3BELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzdELENBQUM7QUFGRCw4QkFFQztBQUVEOzs7R0FHRztBQUNILG1CQUEwQixNQUE4QjtJQUNwRCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUM3RCxDQUFDO0FBRkQsOEJBRUMiLCJmaWxlIjoiY29yZS9jb21wb25lbnRzL2Jhc2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhbmd1bGFyIGZyb20gJ2FuZ3VsYXInO1xuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgUnggZnJvbSAncngnO1xuXG5pbXBvcnQge2lzUHJvbWlzZX0gZnJvbSAnLi4vdXRpbHMvbGFuZyc7XG5pbXBvcnQge0dlbkVycm9yfSBmcm9tICcuLi9lcnJvcnMvZXJyb3InO1xuaW1wb3J0IHtlcnJvckxvZ30gZnJvbSAnLi4vdXRpbHMvZXJyb3JfbG9nJztcblxuZW51bSBEaXJlY3RpdmVUeXBlIHtcbiAgICBDT01QT05FTlQsXG4gICAgQVRUUklCVVRFXG59XG5cbi8qKlxuICogQ29tcG9uZW50IGNvbmZpZ3VyYXRpb24uIERpcmVjdGl2ZSBuYW1lIHNob3VsZCBiZSBpbiBkYXNoLWNhc2UuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcG9uZW50Q29uZmlndXJhdGlvbiB7XG4gICAgYWJzdHJhY3Q/OiBib29sZWFuO1xuICAgIG1vZHVsZT86IGFuZ3VsYXIuSU1vZHVsZTtcbiAgICBkaXJlY3RpdmU/OiBzdHJpbmc7XG4gICAgYmluZGluZ3M/OiBfLkRpY3Rpb25hcnk8c3RyaW5nPjtcbiAgICBjb250cm9sbGVyQXM/OiBzdHJpbmc7XG4gICAgdGVtcGxhdGVVcmw/OiBzdHJpbmc7XG4gICAgdGVtcGxhdGU/OiBzdHJpbmc7XG4gICAgcmVxdWlyZT86IHN0cmluZyB8IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbXBvbmVudFZpZXdPcHRpb25zIHtcbiAgICBpbnB1dHM/OiBPYmplY3Q7XG4gICAgcGFyZW50PzogQ29tcG9uZW50QmFzZTtcbiAgICBhdHRyaWJ1dGVzPzogT2JqZWN0O1xuICAgIGV4dGVuZFdpdGg/OiBPYmplY3Q7XG59XG5cbmludGVyZmFjZSBTdWJzY3JpcHRpb25NYXAge1xuICAgIFtrZXk6IHN0cmluZ106IFJ4LkRpc3Bvc2FibGU7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcHV0YXRpb25GdW5jdGlvbiB7XG4gICAgKGNvbXB1dGF0aW9uOiBDb21wdXRhdGlvbik6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3Vic2NyaXB0aW9uIHtcbiAgICB1bnN1YnNjcmliZSgpOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN1YnNjcmliZUNvbXBvbmVudE9wdGlvbnMge1xuICAgIG9uZVNob3Q/OiBib29sZWFuO1xuICAgIG9uRXJyb3I/OiAoZXhjZXB0aW9uOiBhbnkpID0+IHZvaWQ7XG5cbiAgICAvLyBTZXQgdGhpcyB0byB0cnVlIHRvIG1ha2UgdGhlIHN1YnNjcmlwdGlvbiBiZSBpZ25vcmVkIHdoZW4gZGV0ZXJtaW5pbmdcbiAgICAvLyB3aGV0aGVyIHRoZSBjb21wb25lbnQgaXMgZG9uZSB3YWl0aW5nIGZvciBzdWJzY3JpcHRpb25zLlxuICAgIGlnbm9yZVJlYWR5PzogYm9vbGVhbjtcbn1cblxudHlwZSBTdWJzY3JpcHRpb25HdWFyZCA9IHt9O1xuXG5mdW5jdGlvbiBzYWZlQ2FsbGJhY2tBcHBseSgkc2NvcGU6IGFuZ3VsYXIuSVNjb3BlLCBjYWxsYmFjazogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIGlmICgoPGFueT4gJHNjb3BlKS4kJGRlc3Ryb3llZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCRzY29wZS4kJHBoYXNlIHx8ICRzY29wZS4kcm9vdC4kJHBoYXNlKSB7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgJHNjb3BlLiRhcHBseSgoKSA9PiB7IGNhbGxiYWNrKCk7IH0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2FmZUFwcGx5PFQ+KG9ic2VydmFibGU6IFJ4Lk9ic2VydmFibGU8VD4sIHNjb3BlOiBhbmd1bGFyLklTY29wZSwgY2FsbGJhY2s6IChkYXRhOiBUKSA9PiB2b2lkKSB7XG4gICAgY2FsbGJhY2sgPSBhbmd1bGFyLmlzRnVuY3Rpb24oY2FsbGJhY2spID8gY2FsbGJhY2sgOiBfLm5vb3A7XG5cbiAgICByZXR1cm4gb2JzZXJ2YWJsZS50YWtlV2hpbGUoKCkgPT4ge1xuICAgICAgICByZXR1cm4gIXNjb3BlWyckJGRlc3Ryb3llZCddO1xuICAgIH0pLnRhcCgoZGF0YSkgPT4ge1xuICAgICAgICBzYWZlQ2FsbGJhY2tBcHBseShzY29wZSwgKCkgPT4geyBjYWxsYmFjayhkYXRhKTsgfSk7XG4gICAgfSk7XG59XG5cbi8qKlxuICogQWJzdHJhY3Rpb24gb2YgYSBjb21wdXRhdGlvbiB3aXRoIGRlcGVuZGVuY2llcyB0byBvYnNlcnZhYmxlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbXB1dGF0aW9uIHtcbiAgICBwcml2YXRlIF9zdWJzY3JpcHRpb25zOiBSeC5EaXNwb3NhYmxlW107XG4gICAgcHJpdmF0ZSBfcGVuZGluZ1N1YnNjcmlwdGlvbnM6IFN1YnNjcmlwdGlvbkd1YXJkW107XG4gICAgcHJpdmF0ZSBfZGlzcG9zZTogKCkgPT4gdm9pZDtcbiAgICBwcml2YXRlIF9kb25lOiBib29sZWFuO1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0cyBhIG5ldyBjb21wdXRhdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb21wb25lbnQgT3duaW5nIGNvbXBvbmVudFxuICAgICAqIEBwYXJhbSBjb250ZW50IENvbXB1dGF0aW9uIGNvbnRlbnRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgY29tcG9uZW50OiBDb21wb25lbnRCYXNlLCBwdWJsaWMgY29udGVudDogQ29tcHV0YXRpb25GdW5jdGlvbikge1xuICAgICAgICB0aGlzLl9zdWJzY3JpcHRpb25zID0gW107XG4gICAgICAgIHRoaXMuX3BlbmRpbmdTdWJzY3JpcHRpb25zID0gW107XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2UgPSAoKSA9PiB7IC8qIERvIG5vdGhpbmcgYnkgZGVmYXVsdC4gKi8gfTtcbiAgICAgICAgdGhpcy5fZG9uZSA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoaXMgY29tcHV0YXRpb24gaGFzIGZpbmlzaGVkLlxuICAgICAqL1xuICAgIHB1YmxpYyBpc0RvbmUoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kb25lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgYW4gYWx0ZXJuYXRpdmUgZGlzcG9zZSBjYWxsYmFjayBmb3IgdGhpcyBjb21wdXRhdGlvbi4gVGhpcyBjYWxsYmFja1xuICAgICAqIGlzIGludm9rZWQgd2hlbiBbW3Vuc3Vic2NyaWJlXV0gaXMgY2FsbGVkLlxuICAgICAqL1xuICAgIHB1YmxpYyBzZXREaXNwb3NlQ2FsbGJhY2soY2FsbGJhY2s6ICgpID0+IHZvaWQpIHtcbiAgICAgICAgdGhpcy5fZGlzcG9zZSA9IGNhbGxiYWNrO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN1YnNjcmliZXMgdG8gYW4gb2JzZXJ2YWJsZSwgcmVnaXN0ZXJpbmcgdGhlIHN1YnNjcmlwdGlvbiBhcyBhIGRlcGVuZGVuY3lcbiAgICAgKiBvZiB0aGlzIGNvbXBvbmVudC4gVGhlIHN1YnNjcmlwdGlvbiBpcyBhdXRvbWF0aWNhbGx5IHN0b3BwZWQgd2hlbiB0aGVcbiAgICAgKiBjb21wb25lbnQgaXMgZGVzdHJveWVkLlxuICAgICAqXG4gICAgICogRm9yIHRoZSB0YXJnZXQgYXJndW1lbnQsIHlvdSBjYW4gZWl0aGVyIHNwZWNpZnkgYSBzdHJpbmcsIGluIHdoaWNoIGNhc2VcbiAgICAgKiBpdCByZXByZXNlbnRzIHRoZSBuYW1lIG9mIHRoZSBjb21wb25lbnQgbWVtYmVyIHZhcmlhYmxlIHRoYXQgd2lsbCBiZVxuICAgICAqIHBvcHVsYXRlZCB3aXRoIHRoZSByZXN1bHQgaXRlLiBPciB5b3UgY2FuIHNwZWNpZnkgYSBmdW5jdGlvbiB3aXRoIG9uZVxuICAgICAqIGFyZ3VtZW50LCB3aGljaCB3aWxsIGJlIGNhbGxlZCB3aGVuIHF1ZXJ5IHJlc3VsdHMgY2hhbmdlIGFuZCBjYW4gZG9cbiAgICAgKiBhbnl0aGluZy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0YXJnZXQgVGFyZ2V0IGNvbXBvbmVudCBtZW1iZXIgYXRyaWJ1dGUgbmFtZSBvciBjYWxsYmFja1xuICAgICAqIEBwYXJhbSBvYnNlcnZhYmxlIE9ic2VydmFibGUgb3IgcHJvbWlzZSB0byBzdWJzY3JpYmUgdG9cbiAgICAgKiBAcmV0dXJuIFVuZGVybHlpbmcgc3Vic2NyaXB0aW9uIGRpc3Bvc2FibGVcbiAgICAgKi9cbiAgICBwdWJsaWMgc3Vic2NyaWJlPFQ+KHRhcmdldDogc3RyaW5nIHwgKChkYXRhOiBUKSA9PiBhbnkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgb2JzZXJ2YWJsZTogUnguT2JzZXJ2YWJsZTxUPiB8IFByb21pc2U8YW55PixcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IFN1YnNjcmliZUNvbXBvbmVudE9wdGlvbnMgPSB7fSkge1xuICAgICAgICAvLyBDcmVhdGUgYSBndWFyZCBvYmplY3QgdGhhdCBjYW4gYmUgcmVtb3ZlZCB3aGVuIGEgc3Vic2NyaXB0aW9uIGlzIGRvbmUuIFdlIG5lZWRcbiAgICAgICAgLy8gdG8gdXNlIGd1YXJkIG9iamVjdHMgaW5zdGVhZCBvZiBhIHNpbXBsZSByZWZlcmVuY2UgY291bnRlciBiZWNhdXNlIHRoZSBwZW5kaW5nXG4gICAgICAgIC8vIHN1YnNjcmlwdGlvbnMgYXJyYXkgbWF5IGJlIGNsZWFyZWQgd2hpbGUgY2FsbGJhY2tzIGFyZSBzdGlsbCBvdXRzdGFuZGluZy5cbiAgICAgICAgY29uc3QgZ3VhcmQgPSBuZXcgT2JqZWN0KCk7XG4gICAgICAgIGlmICghb3B0aW9ucy5pZ25vcmVSZWFkeSkge1xuICAgICAgICAgICAgdGhpcy5fcGVuZGluZ1N1YnNjcmlwdGlvbnMucHVzaChndWFyZCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgY29udmVydGVkT2JzZXJ2YWJsZTogUnguT2JzZXJ2YWJsZTxUPjtcbiAgICAgICAgaWYgKGlzUHJvbWlzZShvYnNlcnZhYmxlKSkge1xuICAgICAgICAgICAgY29udmVydGVkT2JzZXJ2YWJsZSA9IFJ4Lk9ic2VydmFibGUuZnJvbVByb21pc2Uob2JzZXJ2YWJsZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb252ZXJ0ZWRPYnNlcnZhYmxlID0gb2JzZXJ2YWJsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlbGVhc2VHdWFyZCA9ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdTdWJzY3JpcHRpb25zID0gXy53aXRob3V0KHRoaXMuX3BlbmRpbmdTdWJzY3JpcHRpb25zLCBndWFyZCk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnZlcnRlZE9ic2VydmFibGUgPSBjb252ZXJ0ZWRPYnNlcnZhYmxlLnRhcChyZWxlYXNlR3VhcmQsIHJlbGVhc2VHdWFyZCk7XG5cbiAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gc2FmZUFwcGx5KFxuICAgICAgICAgICAgY29udmVydGVkT2JzZXJ2YWJsZSxcbiAgICAgICAgICAgIHRoaXMuY29tcG9uZW50LiRzY29wZSxcbiAgICAgICAgICAgIChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF8uaXNGdW5jdGlvbih0YXJnZXQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQoaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbXBvbmVudFt0YXJnZXRdID0gaXRlbTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAvLyBAaWZuZGVmIEdFTkpTX1BST0RVQ1RJT05cbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yTG9nKCdJZ25vcmVkIGVycm9yJywgZXhjZXB0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQGVuZGlmXG4gICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRGlzcG9zZSBvZiB0aGUgc3Vic2NyaXB0aW9uIGltbWVkaWF0ZWx5IGlmIHRoaXMgaXMgYSBvbmUgc2hvdCBzdWJzY3JpcHRpb24uXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLm9uZVNob3QgJiYgc3Vic2NyaXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICApLnN1YnNjcmliZShcbiAgICAgICAgICAgIC8vIFN1Y2Nlc3MgaGFuZGxlci5cbiAgICAgICAgICAgIF8ubm9vcCxcbiAgICAgICAgICAgIC8vIEVycm9yIGhhbmRsZXIuXG4gICAgICAgICAgICAoZXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMub25FcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAvLyBAaWZuZGVmIEdFTkpTX1BST0RVQ1RJT05cbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yTG9nKCdIYW5kbGVkIGVycm9yJywgZXhjZXB0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQGVuZGlmXG4gICAgICAgICAgICAgICAgICAgIHNhZmVDYWxsYmFja0FwcGx5KHRoaXMuY29tcG9uZW50LiRzY29wZSwgKCkgPT4geyBvcHRpb25zLm9uRXJyb3IoZXhjZXB0aW9uKTsgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQGlmbmRlZiBHRU5KU19QUk9EVUNUSU9OXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvckxvZygnVW5oYW5kbGVkIGVycm9yJywgZXhjZXB0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQGVuZGlmXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMucHVzaChzdWJzY3JpcHRpb24pO1xuICAgICAgICByZXR1cm4gc3Vic2NyaXB0aW9uO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiBhbGwgc3Vic2NyaXB0aW9ucyBjcmVhdGVkIGJ5IGNhbGxpbmcgYHN1YnNjcmliZWAgYXJlIHJlYWR5LlxuICAgICAqIEEgc3Vic2NyaXB0aW9uIGlzIHJlYWR5IHdoZW4gaXQgaGFzIHJlY2VpdmVkIGl0cyBmaXJzdCBiYXRjaCBvZiBkYXRhIGFmdGVyXG4gICAgICogc3Vic2NyaWJpbmcuXG4gICAgICovXG4gICAgcHVibGljIHN1YnNjcmlwdGlvbnNSZWFkeSgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BlbmRpbmdTdWJzY3JpcHRpb25zLmxlbmd0aCA9PT0gMDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSdW5zIHRoZSBjb21wdXRhdGlvbi5cbiAgICAgKi9cbiAgICBwdWJsaWMgY29tcHV0ZSgpIHtcbiAgICAgICAgLy8gU3RvcCBhbGwgc3Vic2NyaXB0aW9ucyBiZWZvcmUgcnVubmluZyBhZ2Fpbi5cbiAgICAgICAgdGhpcy5zdG9wKCk7XG4gICAgICAgIHRoaXMuY29udGVudCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEaXNwb3NlcyBvZiBhbGwgcmVnaXN0ZXJlZCBzdWJzY3JpcHRpb25zLlxuICAgICAqL1xuICAgIHB1YmxpYyBzdG9wKCkge1xuICAgICAgICBmb3IgKGxldCBzdWJzY3JpcHRpb24gb2YgdGhpcy5fc3Vic2NyaXB0aW9ucykge1xuICAgICAgICAgICAgc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zdWJzY3JpcHRpb25zID0gW107XG4gICAgICAgIHRoaXMuX3BlbmRpbmdTdWJzY3JpcHRpb25zID0gW107XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RvcHMgYWxsIHN1YnNjcmlwdGlvbnMgY3VycmVudGx5IHJlaWdzdGVyZWQgaW4gdGhpcyBjb21wdXRhdGlvbiBhbmQgcmVtb3Zlc1xuICAgICAqIHRoaXMgY29tcHV0YXRpb24gZnJvbSB0aGUgcGFyZW50IGNvbXBvbmVudC5cbiAgICAgKi9cbiAgICBwdWJsaWMgdW5zdWJzY3JpYmUoKSB7XG4gICAgICAgIHRoaXMuY29tcG9uZW50LnVuc3Vic2NyaWJlKHRoaXMpO1xuICAgICAgICBpZiAodGhpcy5fZGlzcG9zZSkgdGhpcy5fZGlzcG9zZSgpO1xuICAgICAgICB0aGlzLl9kb25lID0gdHJ1ZTtcbiAgICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgV2F0Y2hFeHByZXNzaW9uT2Y8VD4ge1xuICAgICgpOiBUO1xufVxuZXhwb3J0IHR5cGUgV2F0Y2hFeHByZXNzaW9uID0gV2F0Y2hFeHByZXNzaW9uT2Y8e30+O1xuXG4vKipcbiAqIEFuIGFic3RyYWN0IGJhc2UgY2xhc3MgZm9yIGFsbCBjb21wb25lbnRzLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQ29tcG9uZW50QmFzZSB7XG4gICAgLy8gQ29tcG9uZW50IGNvbmZpZ3VyYXRpb24uXG4gICAgcHVibGljIHN0YXRpYyBfX2NvbXBvbmVudENvbmZpZzogQ29tcG9uZW50Q29uZmlndXJhdGlvbjtcbiAgICAvLyBDb21wdXRhdGlvbnMuXG4gICAgcHJpdmF0ZSBfY29tcHV0YXRpb25zOiBDb21wdXRhdGlvbltdID0gW107XG4gICAgLy8gQ29tcG9uZW50IHN0YXRlLlxuICAgIHByaXZhdGUgX3JlYWR5OiBib29sZWFuID0gZmFsc2U7XG5cbiAgICAvLyBAbmdJbmplY3RcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgJHNjb3BlOiBhbmd1bGFyLklTY29wZSkge1xuICAgICAgICAkc2NvcGUuJG9uKCckZGVzdHJveScsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3JlYWR5ID0gZmFsc2U7XG5cbiAgICAgICAgICAgIC8vIEVuc3VyZSB0aGF0IGFsbCBjb21wdXRhdGlvbnMgZ2V0IHN0b3BwZWQgd2hlbiB0aGUgY29tcG9uZW50IGlzIGRlc3Ryb3llZC5cbiAgICAgICAgICAgIGZvciAobGV0IGNvbXB1dGF0aW9uIG9mIHRoaXMuX2NvbXB1dGF0aW9ucykge1xuICAgICAgICAgICAgICAgIGNvbXB1dGF0aW9uLnN0b3AoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2NvbXB1dGF0aW9ucyA9IFtdO1xuXG4gICAgICAgICAgICAvLyBDYWxsIGRlc3Ryb3llZCBob29rLlxuICAgICAgICAgICAgdGhpcy5vbkNvbXBvbmVudERlc3Ryb3llZCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBBbmd1bGFyIGNhbGxzICRvbkluaXQgYWZ0ZXIgY29uc3RydWN0b3IgYW5kIGJpbmRpbmdzIGluaXRpYWxpemF0aW9uLlxuICAgICAgICB0aGlzWyckb25Jbml0J10gPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm9uQ29tcG9uZW50SW5pdCgpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkIGFmdGVyIHRoZSB3aG9sZSBjaGFpbiBvZiBjb25zdHJ1Y3RvcnMgaXMgZXhlY3V0ZWQsXG4gICAgICogdmlhIGFuZ3VsYXIgY29tcG9uZW50ICRvbkluaXQuIFVzZSBpdCBpZiB5b3UgaGF2ZSBhbiBhYnN0cmFjdCBjb21wb25lbnQgdGhhdFxuICAgICAqIG1hbmlwdWxhdGVzIGNsYXNzIHByb3BlcnRpZXMgYW5kLCBhcyBhIHJlc3VsdCwgbmVlZHMgdG8gd2FpdCBmb3IgYWxsIGNoaWxkXG4gICAgICogY2xhc3MgcHJvcGVydGllcyB0byBiZSBhc3NpZ25lZCBhbmQgY29uc3RydWN0b3JzIHRvIGZpbmlzaC4gKENsYXNzIHByb3BlcnRpZXNcbiAgICAgKiBkZWZpbmVkIGluIGNoaWxkIGNvbXBvbmVudHMgYXJlIGFzc2lnbmVkIGJlZm9yZSBjaGlsZCdzIGNvbnN0cnVjdG9yKS5cbiAgICAgKlxuICAgICAqIE9yZGVyIG9mIGV4ZWN1dGlvbjpcbiAgICAgKiBgYGB0c1xuICAgICAqIGNsYXNzIENoaWxkIGV4dGVuZHMgTWlkZGxlIHtcbiAgICAgKiAgICAgcHVibGljIHByb3BlcnR5QSA9ICdjJyAgICAvLyA1XG4gICAgICogICAgIGNvbnN0cnVjdG9yKCkgeyBzdXBlcigpIH0gLy8gNlxuICAgICAqIH1cbiAgICAgKiBjbGFzcyBNaWRkbGUgZXh0ZW5kcyBBYnN0cmFjdCB7XG4gICAgICogICAgIHB1YmxpYyBwcm9wZXJ0eUIgPSAnYicgICAgLy8gM1xuICAgICAqICAgICBjb25zdHJ1Y3RvcigpIHsgc3VwZXIoKSB9IC8vIDRcbiAgICAgKiB9XG4gICAgICogY2xhc3MgQWJzdHJhY3Qge1xuICAgICAqICAgICBwdWJsaWMgcHJvcGVydHlBID0gJ2EnICAgIC8vIDFcbiAgICAgKiAgICAgY29uc3RydWN0b3IoKSB7fSAgICAgICAgICAvLyAyXG4gICAgICogICAgIG9uQ29tcG9uZW50SW5pdCgpIHt9ICAgIC8vIDdcbiAgICAgKiB9XG4gICAgICogYGBgXG4gICAgICovXG4gICAgcHVibGljIG9uQ29tcG9uZW50SW5pdCgpIHtcbiAgICAgICAgLy8gRGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBkb2VzIG5vdGhpbmcuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVzdHJveXMgdGhlIGNvbXBvbmVudC5cbiAgICAgKi9cbiAgICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kc2NvcGUuJGRlc3Ryb3koKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCBpbiB0aGUgY29tcGlsZSBwaGFzZSBvZiB0aGUgZGlyZWN0aXZlIGFuZCBtYXlcbiAgICAgKiBiZSBvdmVycmlkZW4gYnkgY29tcG9uZW50IGltcGxlbWVudGF0aW9ucy5cbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIG9uQ29tcG9uZW50Q29tcGlsZShlbGVtZW50OiBhbmd1bGFyLklBdWdtZW50ZWRKUXVlcnksIGF0dHJpYnV0ZXM6IGFuZ3VsYXIuSUF0dHJpYnV0ZXMpOiB2b2lkIHtcbiAgICAgICAgLy8gRGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBkb2VzIG5vdGhpbmcuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgcHVibGljIF9vbkNvbXBvbmVudExpbmsoc2NvcGU6IGFuZ3VsYXIuSVNjb3BlLCBlbGVtZW50OiBhbmd1bGFyLklBdWdtZW50ZWRKUXVlcnksIGF0dHJpYnV0ZXM6IGFuZ3VsYXIuSUF0dHJpYnV0ZXMsIC4uLmFyZ3MpOiB2b2lkIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIENhbGwgdGhlIHB1YmxpYyBtZXRob2QgdGhhdCBjYW4gYmUgb3ZlcnJpZGVuIGJ5IHRoZSB1c2VyLlxuICAgICAgICAgICAgdGhpcy5vbkNvbXBvbmVudExpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJpYnV0ZXMsIC4uLmFyZ3MpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5fcmVhZHkgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgaW4gdGhlIHBvc3QtbGluayBwaGFzZSBvZiB0aGUgZGlyZWN0aXZlIGFuZCBtYXlcbiAgICAgKiBiZSBvdmVycmlkZW4gYnkgY29tcG9uZW50IGltcGxlbWVudGF0aW9ucy5cbiAgICAgKi9cbiAgICBwdWJsaWMgb25Db21wb25lbnRMaW5rKHNjb3BlOiBhbmd1bGFyLklTY29wZSwgZWxlbWVudDogYW5ndWxhci5JQXVnbWVudGVkSlF1ZXJ5LCBhdHRyaWJ1dGVzOiBhbmd1bGFyLklBdHRyaWJ1dGVzLCAuLi5hcmdzKTogdm9pZCB7XG4gICAgICAgIC8vIERlZmF1bHQgaW1wbGVtZW50YXRpb24gZG9lcyBub3RoaW5nLlxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkIGFmdGVyIHRoZSBjb21wb25lbnQgc2NvcGUgaGFzIGJlZW4gZGVzdHJveWVkLlxuICAgICAqL1xuICAgIHB1YmxpYyBvbkNvbXBvbmVudERlc3Ryb3llZCgpOiB2b2lkIHtcbiAgICAgICAgLy8gRGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBkb2VzIG5vdGhpbmcuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0cnVlIGlmIHRoZSBjb21wb25lbnQgaGFzIGJlZW4gY3JlYXRlZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgaXNSZWFkeSgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlYWR5O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiBhbGwgc3Vic2NyaXB0aW9ucyBjcmVhdGVkIGJ5IGNhbGxpbmcgYHN1YnNjcmliZWAgYXJlIHJlYWR5LlxuICAgICAqIEEgc3Vic2NyaXB0aW9uIGlzIHJlYWR5IHdoZW4gaXQgaGFzIHJlY2VpdmVkIGl0cyBmaXJzdCBiYXRjaCBvZiBkYXRhIGFmdGVyXG4gICAgICogc3Vic2NyaWJpbmcuXG4gICAgICovXG4gICAgcHVibGljIHN1YnNjcmlwdGlvbnNSZWFkeSgpOiBib29sZWFuIHtcbiAgICAgICAgLy8gV2FpdCB1bnRpbCB0aGUgY29tcG9uZW50IGhhcyBiZWVuIGNyZWF0ZWQuXG4gICAgICAgIGlmICghdGhpcy5pc1JlYWR5KCkpIHJldHVybiBmYWxzZTtcblxuICAgICAgICByZXR1cm4gXy5ldmVyeSh0aGlzLl9jb21wdXRhdGlvbnMsIChjb21wdXRhdGlvbikgPT4gY29tcHV0YXRpb24uc3Vic2NyaXB0aW9uc1JlYWR5KCkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2NyZWF0ZUNvbXB1dGF0aW9uKGNvbnRlbnQ6IENvbXB1dGF0aW9uRnVuY3Rpb24gPSBfLm5vb3ApOiBDb21wdXRhdGlvbiB7XG4gICAgICAgIGxldCBjb21wdXRhdGlvbiA9IG5ldyBDb21wdXRhdGlvbih0aGlzLCBjb250ZW50KTtcbiAgICAgICAgdGhpcy5fY29tcHV0YXRpb25zLnB1c2goY29tcHV0YXRpb24pO1xuICAgICAgICByZXR1cm4gY29tcHV0YXRpb247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogV2F0Y2ggY29tcG9uZW50IHNjb3BlIGFuZCBydW4gYSBjb21wdXRhdGlvbiBvbiBjaGFuZ2VzLiBUaGUgY29tcHV0YXRpb24gaXNcbiAgICAgKiBleGVjdXRlZCBvbmNlIGltbWVkaWF0ZWx5IHByaW9yIHRvIHdhdGNoaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbnRleHQgRnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0aGUgY29udGV4dCB0byB3YXRjaFxuICAgICAqIEBwYXJhbSBjb250ZW50IEZ1bmN0aW9uIHRvIHJ1biBvbiBjaGFuZ2VzXG4gICAgICogQHBhcmFtIG9iamVjdEVxdWFsaXR5IFNob3VsZCBgYW5ndWxhci5lcXVhbHNgIGJlIHVzZWQgZm9yIGNvbXBhcmlzb25zXG4gICAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHVucmVnaXN0ZXJzIHRoZSBib3VuZCBleHByZXNzaW9uXG4gICAgICovXG4gICAgcHVibGljIHdhdGNoKGNvbnRleHQ6IFdhdGNoRXhwcmVzc2lvbiB8IFdhdGNoRXhwcmVzc2lvbltdLFxuICAgICAgICAgICAgICAgICBjb250ZW50OiBDb21wdXRhdGlvbkZ1bmN0aW9uLFxuICAgICAgICAgICAgICAgICBvYmplY3RFcXVhbGl0eT86IGJvb2xlYW4pOiBDb21wdXRhdGlvbiB7XG4gICAgICAgIGxldCBjb21wdXRhdGlvbiA9IHRoaXMuX2NyZWF0ZUNvbXB1dGF0aW9uKGNvbnRlbnQpO1xuICAgICAgICBjb21wdXRhdGlvbi5jb21wdXRlKCk7XG5cbiAgICAgICAgLy8gSW5pdGlhbCBldmFsdWF0aW9uIG1heSBzdG9wIHRoZSBjb21wdXRhdGlvbi4gSW4gdGhpcyBjYXNlLCBkb24ndFxuICAgICAgICAvLyBldmVuIGNyZWF0ZSBhIHdhdGNoIGFuZCBqdXN0IHJldHVybiB0aGUgKGRvbmUpIGNvbXB1dGF0aW9uLlxuICAgICAgICBpZiAoY29tcHV0YXRpb24uaXNEb25lKCkpIHJldHVybiBjb21wdXRhdGlvbjtcblxuICAgICAgICBsZXQgZXhwcmVzc2lvbnMgPSBBcnJheS5pc0FycmF5KGNvbnRleHQpID8gY29udGV4dCA6IFtjb250ZXh0XTtcblxuICAgICAgICBpZiAoIW9iamVjdEVxdWFsaXR5KSB7XG4gICAgICAgICAgICBjb25zdCB1bndhdGNoID0gdGhpcy4kc2NvcGUuJHdhdGNoR3JvdXAoZXhwcmVzc2lvbnMsIGNvbXB1dGF0aW9uLmNvbXB1dGUuYmluZChjb21wdXRhdGlvbikpO1xuICAgICAgICAgICAgY29tcHV0YXRpb24uc2V0RGlzcG9zZUNhbGxiYWNrKHVud2F0Y2gpO1xuICAgICAgICAgICAgcmV0dXJuIGNvbXB1dGF0aW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHdhdGNoZWRFeHByZXNzaW9uOiBXYXRjaEV4cHJlc3Npb24gPSAoKSA9PiBfLm1hcChleHByZXNzaW9ucywgZm4gPT4gZm4oKSk7XG4gICAgICAgIGlmIChleHByZXNzaW9ucy5sZW5ndGggPT09IDEpIHsgLy8gb3B0aW1pemVcbiAgICAgICAgICAgIHdhdGNoZWRFeHByZXNzaW9uID0gZXhwcmVzc2lvbnNbMF07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1bndhdGNoID0gdGhpcy4kc2NvcGUuJHdhdGNoKHdhdGNoZWRFeHByZXNzaW9uLCBjb21wdXRhdGlvbi5jb21wdXRlLmJpbmQoY29tcHV0YXRpb24pLCB0cnVlKTtcbiAgICAgICAgY29tcHV0YXRpb24uc2V0RGlzcG9zZUNhbGxiYWNrKHVud2F0Y2gpO1xuICAgICAgICByZXR1cm4gY29tcHV0YXRpb247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogV2F0Y2ggY29tcG9uZW50IHNjb3BlIGFuZCBydW4gYSBjb21wdXRhdGlvbiBvbiBjaGFuZ2VzLiBUaGlzIHZlcnNpb24gdXNlcyBBbmd1bGFyJ3NcbiAgICAgKiBjb2xsZWN0aW9uIHdhdGNoLiBUaGUgY29tcHV0YXRpb24gaXMgZXhlY3V0ZWQgb25jZSBpbW1lZGlhdGVseSBwcmlvciB0byB3YXRjaGluZy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb250ZXh0IEZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhlIGNvbnRleHQgdG8gd2F0Y2hcbiAgICAgKiBAcGFyYW0gY29udGVudCBGdW5jdGlvbiB0byBydW4gb24gY2hhbmdlc1xuICAgICAqL1xuICAgIHB1YmxpYyB3YXRjaENvbGxlY3Rpb24oY29udGV4dDogV2F0Y2hFeHByZXNzaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogQ29tcHV0YXRpb25GdW5jdGlvbik6IENvbXB1dGF0aW9uIHtcbiAgICAgICAgbGV0IGNvbXB1dGF0aW9uID0gdGhpcy5fY3JlYXRlQ29tcHV0YXRpb24oY29udGVudCk7XG4gICAgICAgIGNvbXB1dGF0aW9uLmNvbXB1dGUoKTtcblxuICAgICAgICAvLyBJbml0aWFsIGV2YWx1YXRpb24gbWF5IHN0b3AgdGhlIGNvbXB1dGF0aW9uLiBJbiB0aGlzIGNhc2UsIGRvbid0XG4gICAgICAgIC8vIGV2ZW4gY3JlYXRlIGEgd2F0Y2ggYW5kIGp1c3QgcmV0dXJuIHRoZSAoZG9uZSkgY29tcHV0YXRpb24uXG4gICAgICAgIGlmIChjb21wdXRhdGlvbi5pc0RvbmUoKSkgcmV0dXJuIGNvbXB1dGF0aW9uO1xuXG4gICAgICAgIGNvbnN0IHVud2F0Y2ggPSB0aGlzLiRzY29wZS4kd2F0Y2hDb2xsZWN0aW9uKGNvbnRleHQsIGNvbXB1dGF0aW9uLmNvbXB1dGUuYmluZChjb21wdXRhdGlvbikpO1xuICAgICAgICBjb21wdXRhdGlvbi5zZXREaXNwb3NlQ2FsbGJhY2sodW53YXRjaCk7XG4gICAgICAgIHJldHVybiBjb21wdXRhdGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdWJzY3JpYmVzIHRvIGFuIG9ic2VydmFibGUsIHJlZ2lzdGVyaW5nIHRoZSBzdWJzY3JpcHRpb24gYXMgYSBkZXBlbmRlbmN5XG4gICAgICogb2YgdGhpcyBjb21wb25lbnQuIFRoZSBzdWJzY3JpcHRpb24gaXMgYXV0b21hdGljYWxseSBzdG9wcGVkIHdoZW4gdGhlXG4gICAgICogY29tcG9uZW50IGlzIGRlc3Ryb3llZC5cbiAgICAgKlxuICAgICAqIEZvciB0aGUgdGFyZ2V0IGFyZ3VtZW50LCB5b3UgY2FuIGVpdGhlciBzcGVjaWZ5IGEgc3RyaW5nLCBpbiB3aGljaCBjYXNlXG4gICAgICogaXQgcmVwcmVzZW50cyB0aGUgbmFtZSBvZiB0aGUgY29tcG9uZW50IG1lbWJlciB2YXJpYWJsZSB0aGF0IHdpbGwgYmVcbiAgICAgKiBwb3B1bGF0ZWQgd2l0aCB0aGUgcmVzdWx0IGl0ZS4gT3IgeW91IGNhbiBzcGVjaWZ5IGEgZnVuY3Rpb24gd2l0aCBvbmVcbiAgICAgKiBhcmd1bWVudCwgd2hpY2ggd2lsbCBiZSBjYWxsZWQgd2hlbiBxdWVyeSByZXN1bHRzIGNoYW5nZSBhbmQgY2FuIGRvXG4gICAgICogYW55dGhpbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGFyZ2V0IFRhcmdldCBjb21wb25lbnQgbWVtYmVyIGF0cmlidXRlIG5hbWUgb3IgY2FsbGJhY2tcbiAgICAgKiBAcGFyYW0gb2JzZXJ2YWJsZSBPYnNlcnZhYmxlIHRvIHN1YnNjcmliZSB0b1xuICAgICAqIEByZXR1cm4gVW5kZXJseWluZyBzdWJzY3JpcHRpb25cbiAgICAgKi9cbiAgICBwdWJsaWMgc3Vic2NyaWJlPFQ+KHRhcmdldDogc3RyaW5nIHwgKChkYXRhOiBUKSA9PiBhbnkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgb2JzZXJ2YWJsZTogUnguT2JzZXJ2YWJsZTxUPiB8IFByb21pc2U8YW55PixcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IFN1YnNjcmliZUNvbXBvbmVudE9wdGlvbnMgPSB7fSk6IFN1YnNjcmlwdGlvbiB7XG4gICAgICAgIGxldCBjb21wdXRhdGlvbiA9IHRoaXMuX2NyZWF0ZUNvbXB1dGF0aW9uKCk7XG4gICAgICAgIGNvbXB1dGF0aW9uLnN1YnNjcmliZSh0YXJnZXQsIG9ic2VydmFibGUsIG9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gY29tcHV0YXRpb247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVW5zdWJzY3JpYmVzIHRoZSBnaXZlbiBjb21wdXRhdGlvbiBmcm9tIHRoaXMgY29tcG9uZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbXB1dGF0aW9uIENvbXB1dGF0aW9uIGluc3RhbmNlXG4gICAgICovXG4gICAgcHVibGljIHVuc3Vic2NyaWJlKGNvbXB1dGF0aW9uOiBDb21wdXRhdGlvbik6IHZvaWQge1xuICAgICAgICBjb21wdXRhdGlvbi5zdG9wKCk7XG4gICAgICAgIF8ucHVsbCh0aGlzLl9jb21wdXRhdGlvbnMsIGNvbXB1dGF0aW9uKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBIZWxwZXIgZnVuY3Rpb24gdG8gY3JlYXRlIGEgd3JhcHBlciBvYnNlcnZhYmxlIGFyb3VuZCB3YXRjaC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb250ZXh0IEZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhlIGNvbnRleHQgdG8gd2F0Y2hcbiAgICAgKiBAcGFyYW0gb2JqZWN0RXF1YWxpdHkgU2hvdWxkIGBhbmd1bGFyLmVxdWFsc2AgYmUgdXNlZCBmb3IgY29tcGFyaXNvbnNcbiAgICAgKiBAcmV0dXJucyBXYXRjaCBvYnNlcnZhYmxlXG4gICAgICovXG4gICAgcHVibGljIGNyZWF0ZVdhdGNoT2JzZXJ2YWJsZTxUPihjb250ZXh0OiBXYXRjaEV4cHJlc3Npb25PZjxUPiwgb2JqZWN0RXF1YWxpdHk/OiBib29sZWFuKTogUnguT2JzZXJ2YWJsZTxUPiB7XG4gICAgICAgIGNvbnN0IG5vdGlmeU9ic2VydmVyID0gKG9ic2VydmVyOiBSeC5PYnNlcnZlcjxUPikgPT4ge1xuICAgICAgICAgICAgb2JzZXJ2ZXIub25OZXh0KGNvbnRleHQoKSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFJ4Lk9ic2VydmFibGUuY3JlYXRlPFQ+KChvYnNlcnZlcikgPT4ge1xuICAgICAgICAgICAgbm90aWZ5T2JzZXJ2ZXIob2JzZXJ2ZXIpO1xuXG4gICAgICAgICAgICBjb25zdCBjb21wdXRhdGlvbiA9IHRoaXMud2F0Y2goXG4gICAgICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgICAgICAoKSA9PiBub3RpZnlPYnNlcnZlcihvYnNlcnZlciksXG4gICAgICAgICAgICAgICAgb2JqZWN0RXF1YWxpdHlcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gKCkgPT4geyBjb21wdXRhdGlvbi51bnN1YnNjcmliZSgpOyB9O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGNvbXBvbmVudCBjb25maWd1cmF0aW9uLlxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgZ2V0Q29uZmlnKCk6IENvbXBvbmVudENvbmZpZ3VyYXRpb24ge1xuICAgICAgICByZXR1cm4gdGhpcy5fX2NvbXBvbmVudENvbmZpZztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGNvbXBvbmVudCBjb25maWd1cmF0aW9uLlxuICAgICAqL1xuICAgIHB1YmxpYyBnZXRDb25maWcoKTogQ29tcG9uZW50Q29uZmlndXJhdGlvbiB7XG4gICAgICAgIHJldHVybiAoPHR5cGVvZiBDb21wb25lbnRCYXNlPiB0aGlzLmNvbnN0cnVjdG9yKS5nZXRDb25maWcoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIGNvbXBvbmVudCBoYXMgYSBzcGVjaWZpZWQgYXR0cmlidXRlIGNvbmZpZ3VyZWQgYXNcbiAgICAgKiBhIGJpbmRpbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBib3VuZCBhdHRyaWJ1dGVcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGhhc0JpbmRpbmcobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiBfLnNvbWUodGhpcy5fX2NvbXBvbmVudENvbmZpZy5iaW5kaW5ncywgKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgICAgIC8vIEluIGNhc2Ugbm8gYXR0cmlidXRlIG5hbWUgaXMgc3BlY2lmaWVkLCBjb21wYXJlIHRoZSBiaW5kaW5nIGtleSxcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSBjb21wYXJlIHRoZSBhdHRyaWJ1dGUgbmFtZS5cbiAgICAgICAgICAgIGNvbnN0IG1hdGNoZWROYW1lID0gdmFsdWUucmVwbGFjZSgvXls9QCY8XVxcPz8vLCAnJyk7XG4gICAgICAgICAgICBjb25zdCBib3VuZEF0dHJpYnV0ZSA9IG1hdGNoZWROYW1lIHx8IGtleTtcbiAgICAgICAgICAgIHJldHVybiBib3VuZEF0dHJpYnV0ZSA9PT0gbmFtZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIHZpZXcgY29uZmlndXJhdGlvbiB0aGF0IHJlbmRlcnMgdGhpcyBjb21wb25lbnQuIFRoaXMgbWV0aG9kIGNhbiBiZVxuICAgICAqIHVzZWQgd2hlbiBjb25maWd1cmluZyB0aGUgQW5ndWxhciBVSSByb3V0ZXIgYXMgZm9sbG93czpcbiAgICAgKlxuICAgICAqICAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZm9vJywge1xuICAgICAqICAgICAgICAgdXJsOiAnL2ZvbycsXG4gICAgICogICAgICAgICB2aWV3czogeyBhcHBsaWNhdGlvbjogTXlDb21wb25lbnQuYXNWaWV3KCkgfSxcbiAgICAgKiAgICAgfSk7XG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBhc1ZpZXcob3B0aW9uczogQ29tcG9uZW50Vmlld09wdGlvbnMgPSB7fSk6IGFueSB7XG4gICAgICAgIGxldCB0ZW1wbGF0ZSA9ICc8JyArIHRoaXMuX19jb21wb25lbnRDb25maWcuZGlyZWN0aXZlO1xuICAgICAgICBsZXQgYXR0cmlidXRlcyA9IG9wdGlvbnMuYXR0cmlidXRlcyB8fCB7fTtcblxuICAgICAgICAvLyBTZXR1cCBpbnB1dCBiaW5kaW5ncy5cbiAgICAgICAgaWYgKCFfLmlzRW1wdHkob3B0aW9ucy5pbnB1dHMpKSB7XG4gICAgICAgICAgICBfLmZvck93bihvcHRpb25zLmlucHV0cywgKGlucHV0LCBrZXkpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBAaWZuZGVmIEdFTkpTX1BST0RVQ1RJT05cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaGFzQmluZGluZyhrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihgSW5wdXQgJyR7a2V5fScgaXMgbm90IGRlZmluZWQgb24gY29tcG9uZW50LmApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBAZW5kaWZcblxuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXNba2V5XSA9IGlucHV0O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHZW5lcmF0ZSBhdHRyaWJ1dGVzLlxuICAgICAgICBpZiAoIV8uaXNFbXB0eShhdHRyaWJ1dGVzKSkge1xuICAgICAgICAgICAgXy5mb3JPd24oYXR0cmlidXRlcywgKGF0dHJpYnV0ZSwgYXR0cmlidXRlTmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IFByb3Blcmx5IGVzY2FwZSBhdHRyaWJ1dGUgdmFsdWVzLlxuICAgICAgICAgICAgICAgIHRlbXBsYXRlICs9ICcgJyArIF8ua2ViYWJDYXNlKGF0dHJpYnV0ZU5hbWUpICsgJz1cIicgKyBhdHRyaWJ1dGUgKyAnXCInO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdGVtcGxhdGUgKz0gJz48LycgKyB0aGlzLl9fY29tcG9uZW50Q29uZmlnLmRpcmVjdGl2ZSArICc+JztcblxuICAgICAgICBsZXQgcmVzdWx0OiBhbnkgPSB7XG4gICAgICAgICAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gU2V0dXAgcGFyZW50IHNjb3BlIGZvciB0aGUgaW50ZXJtZWRpYXRlIHRlbXBsYXRlLlxuICAgICAgICBpZiAob3B0aW9ucy5wYXJlbnQpIHtcbiAgICAgICAgICAgIHJlc3VsdC5zY29wZSA9IG9wdGlvbnMucGFyZW50LiRzY29wZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBfLmV4dGVuZChyZXN1bHQsIG9wdGlvbnMuZXh0ZW5kV2l0aCB8fCB7fSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGVyZm9ybXMgYW55IG1vZGlmaWNhdGlvbnMgb2YgdGhlIGNvbXBvbmVudCBjb25maWd1cmF0aW9uLiBUaGlzIG1ldGhvZCBpc1xuICAgICAqIGludm9rZWQgZHVyaW5nIGNvbXBvbmVudCBjbGFzcyBkZWNvcmF0aW9uIGFuZCBtYXkgYXJiaXRyYXJpbHkgbW9kaWZ5IHRoZVxuICAgICAqIHBhc3NlZCBjb21wb25lbnQgY29uZmlndXJhdGlvbiwgYmVmb3JlIHRoZSBjb21wb25lbnQgaXMgcmVnaXN0ZXJlZCB3aXRoXG4gICAgICogQW5ndWxhci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb25maWcgQ29tcG9uZW50IGNvbmZpZ3VyYXRpb25cbiAgICAgKiBAcmV0dXJuIE1vZGlmaWVkIGNvbXBvbmVudCBjb25maWd1cmF0aW9uXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBjb25maWd1cmVDb21wb25lbnQoY29uZmlnOiBDb21wb25lbnRDb25maWd1cmF0aW9uKTogQ29tcG9uZW50Q29uZmlndXJhdGlvbiB7XG4gICAgICAgIHJldHVybiBjb25maWc7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkaXJlY3RpdmVGYWN0b3J5KGNvbmZpZzogQ29tcG9uZW50Q29uZmlndXJhdGlvbiwgdHlwZTogRGlyZWN0aXZlVHlwZSkge1xuICAgIHJldHVybiAodGFyZ2V0OiB0eXBlb2YgQ29tcG9uZW50QmFzZSk6IEZ1bmN0aW9uID0+IHtcbiAgICAgICAgLy8gU3RvcmUgY29tcG9uZW50IGNvbmZpZ3VyYXRpb24gb24gdGhlIGNvbXBvbmVudCwgZXh0ZW5kaW5nIGNvbmZpZ3VyYXRpb24gb2J0YWluZWQgZnJvbSBiYXNlIGNsYXNzLlxuICAgICAgICBpZiAodGFyZ2V0Ll9fY29tcG9uZW50Q29uZmlnKSB7XG4gICAgICAgICAgICB0YXJnZXQuX19jb21wb25lbnRDb25maWcgPSBfLmNsb25lRGVlcCh0YXJnZXQuX19jb21wb25lbnRDb25maWcpO1xuICAgICAgICAgICAgLy8gRG9uJ3QgaW5oZXJpdCB0aGUgYWJzdHJhY3QgZmxhZyBhcyBvdGhlcndpc2UgeW91IHdvdWxkIGJlIHJlcXVpcmVkIHRvIGV4cGxpY2l0bHlcbiAgICAgICAgICAgIC8vIHNldCBpdCB0byBmYWxzZSBpbiBhbGwgc3ViY2xhc3Nlcy5cbiAgICAgICAgICAgIGRlbGV0ZSB0YXJnZXQuX19jb21wb25lbnRDb25maWcuYWJzdHJhY3Q7XG5cbiAgICAgICAgICAgIF8ubWVyZ2UodGFyZ2V0Ll9fY29tcG9uZW50Q29uZmlnLCBjb25maWcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGFyZ2V0Ll9fY29tcG9uZW50Q29uZmlnID0gY29uZmlnO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uZmlnID0gdGFyZ2V0LmNvbmZpZ3VyZUNvbXBvbmVudCh0YXJnZXQuX19jb21wb25lbnRDb25maWcpO1xuXG4gICAgICAgIGlmICghY29uZmlnLmFic3RyYWN0KSB7XG4gICAgICAgICAgICAvLyBJZiBtb2R1bGUgb3IgZGlyZWN0aXZlIGlzIG5vdCBkZWZpbmVkIGZvciBhIG5vbi1hYnN0cmFjdCBjb21wb25lbnQsIHRoaXMgaXMgYW4gZXJyb3IuXG4gICAgICAgICAgICBpZiAoIWNvbmZpZy5kaXJlY3RpdmUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgR2VuRXJyb3IoXCJEaXJlY3RpdmUgbm90IGRlZmluZWQgZm9yIGNvbXBvbmVudC5cIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghXy5zdGFydHNXaXRoKGNvbmZpZy5kaXJlY3RpdmUsICdnZW4tJykpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgR2VuRXJyb3IoXCJEaXJlY3RpdmUgbm90IHByZWZpeGVkIHdpdGggXFxcImdlbi1cXFwiOiBcIiArIGNvbmZpZy5kaXJlY3RpdmUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWNvbmZpZy5tb2R1bGUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgR2VuRXJyb3IoXCJNb2R1bGUgbm90IGRlZmluZWQgZm9yIGNvbXBvbmVudCAnXCIgKyBjb25maWcuZGlyZWN0aXZlICsgXCInLlwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKF8uYW55KGNvbmZpZy5iaW5kaW5ncywgKHZhbHVlLCBrZXkpID0+IF8uc3RhcnRzV2l0aCh2YWx1ZS5zdWJzdHJpbmcoMSkgfHwga2V5LCAnZGF0YScpKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkJpbmRpbmdzIHNob3VsZCBub3Qgc3RhcnQgd2l0aCAnZGF0YSdcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbmZpZy5tb2R1bGUuZGlyZWN0aXZlKF8uY2FtZWxDYXNlKGNvbmZpZy5kaXJlY3RpdmUpLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udHJvbGxlckJpbmRpbmcgPSBjb25maWcuY29udHJvbGxlckFzIHx8ICdjdHJsJztcblxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQ6IGFuZ3VsYXIuSURpcmVjdGl2ZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiBjb25maWcuYmluZGluZ3MgfHwge30sXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IDxhbnk+IHRhcmdldCxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlckFzOiBjb250cm9sbGVyQmluZGluZyxcbiAgICAgICAgICAgICAgICAgICAgY29tcGlsZTogKGVsZW1lbnQsIGF0dHJpYnV0ZXMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhbGwgdGhlIGNvbXBpbGUgbGlmZS1jeWNsZSBzdGF0aWMgbWV0aG9kLlxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Lm9uQ29tcG9uZW50Q29tcGlsZShlbGVtZW50LCBhdHRyaWJ1dGVzKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChzY29wZSwgZWxlbWVudCwgYXR0cmlidXRlcywgLi4uYXJncykgPT4geyAvLyB0c2xpbnQ6ZGlzYWJsZS1saW5lOm5vLXNoYWRvd2VkLXZhcmlhYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2V0IGNvbnRyb2xsZXIgZnJvbSB0aGUgc2NvcGUgYW5kIGNhbGwgdGhlIGxpbmsgbGlmZS1jeWNsZSBtZXRob2QuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxDb21wb25lbnRCYXNlPiBzY29wZVtjb250cm9sbGVyQmluZGluZ10pLl9vbkNvbXBvbmVudExpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJpYnV0ZXMsIC4uLmFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6IGNvbmZpZy50ZW1wbGF0ZVVybCxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGU6IGNvbmZpZy50ZW1wbGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZTogY29uZmlnLnJlcXVpcmUsXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIERpcmVjdGl2ZVR5cGUuQ09NUE9ORU5UOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucmVzdHJpY3QgPSAnRSc7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXNlIERpcmVjdGl2ZVR5cGUuQVRUUklCVVRFOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucmVzdHJpY3QgPSAnQSc7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiB1c2UgZXJyb3IgaGFuZGxlclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEdlbkVycm9yKGBVbmtub3duIHR5cGUgJHt0eXBlfWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9O1xufVxuXG4vKipcbiAqIEEgZGVjb3JhdG9yIHRoYXQgdHJhbnNmb3JtcyB0aGUgZGVjb3JhdGVkIGNsYXNzIGludG8gYW4gQW5ndWxhckpTXG4gKiBjb21wb25lbnQgZGlyZWN0aXZlIHdpdGggcHJvcGVyIGRlcGVuZGVuY3kgaW5qZWN0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcG9uZW50KGNvbmZpZzogQ29tcG9uZW50Q29uZmlndXJhdGlvbik6IENsYXNzRGVjb3JhdG9yIHtcbiAgICByZXR1cm4gZGlyZWN0aXZlRmFjdG9yeShjb25maWcsIERpcmVjdGl2ZVR5cGUuQ09NUE9ORU5UKTtcbn1cblxuLyoqXG4gKiBBIGRlY29yYXRvciB0aGF0IHRyYW5zZm9ybXMgdGhlIGRlY29yYXRlZCBjbGFzcyBpbnRvIGFuIEFuZ3VsYXJKU1xuICogYXR0cmlidXRlIGRpcmVjdGl2ZSB3aXRoIHByb3BlciBkZXBlbmRlbmN5IGluamVjdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZShjb25maWc6IENvbXBvbmVudENvbmZpZ3VyYXRpb24pOiBDbGFzc0RlY29yYXRvciB7XG4gICAgcmV0dXJuIGRpcmVjdGl2ZUZhY3RvcnkoY29uZmlnLCBEaXJlY3RpdmVUeXBlLkFUVFJJQlVURSk7XG59XG4iXX0=
