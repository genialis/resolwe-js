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
        var expressions = Array.isArray(context) ? context : [context];
        if (!objectEquality) {
            return this.$scope.$watchGroup(expressions, computation.compute.bind(computation));
        }
        var watchedExpression = function () { return _.map(expressions, function (fn) { return fn(); }); };
        if (expressions.length === 1) {
            watchedExpression = expressions[0];
        }
        return this.$scope.$watch(watchedExpression, computation.compute.bind(computation), true);
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
        this.$scope.$watchCollection(context, computation.compute.bind(computation));
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
            return _this.watch(context, function () { return notifyObserver(observer); }, objectEquality);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2NvbXBvbmVudHMvYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsaUNBQW1DO0FBQ25DLDBCQUE0QjtBQUM1Qix1QkFBeUI7QUFFekIsc0NBQXdDO0FBQ3hDLHlDQUF5QztBQUd6QyxJQUFLLGFBR0o7QUFIRCxXQUFLLGFBQWE7SUFDZCwyREFBUyxDQUFBO0lBQ1QsMkRBQVMsQ0FBQTtBQUNiLENBQUMsRUFISSxhQUFhLEtBQWIsYUFBYSxRQUdqQjtBQThDRCwyQkFBMkIsTUFBc0IsRUFBRSxRQUFvQjtJQUNuRSxFQUFFLENBQUMsQ0FBUSxNQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUM3QixNQUFNLENBQUM7SUFDWCxDQUFDO0lBRUQsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDekMsUUFBUSxFQUFFLENBQUM7SUFDZixDQUFDO0lBQUMsSUFBSSxDQUFDLENBQUM7UUFDSixNQUFNLENBQUMsTUFBTSxDQUFDLGNBQVEsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN6QyxDQUFDO0FBQ0wsQ0FBQztBQUVELG1CQUFzQixVQUE0QixFQUFFLEtBQXFCLEVBQUUsUUFBMkI7SUFDbEcsUUFBUSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEdBQUcsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFFNUQsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUM7UUFDeEIsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ2pDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFDLElBQUk7UUFDUixpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsY0FBUSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4RCxDQUFD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QkFDVixDQUFDO29CQUNELFNBQVMsQ0FBQzt3QkFDTiwwQkFBMEI7d0JBQzFCLE1BQU0sSUFBSSxnQkFBUSxDQUFDLGtCQUFnQixJQUFNLENBQUMsQ0FBQztvQkFDL0MsQ0FBQztnQkFDTCxDQUFDO2dCQUVELE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDbEIsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO1FBRUQsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNsQixDQUFDLENBQUM7QUFDTixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsbUJBQTBCLE1BQThCO0lBQ3BELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzdELENBQUM7QUFGRCw4QkFFQztBQUVEOzs7R0FHRztBQUNILG1CQUEwQixNQUE4QjtJQUNwRCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUM3RCxDQUFDO0FBRkQsOEJBRUMiLCJmaWxlIjoiY29yZS9jb21wb25lbnRzL2Jhc2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhbmd1bGFyIGZyb20gJ2FuZ3VsYXInO1xuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgUnggZnJvbSAncngnO1xuXG5pbXBvcnQge2lzUHJvbWlzZX0gZnJvbSAnLi4vdXRpbHMvbGFuZyc7XG5pbXBvcnQge0dlbkVycm9yfSBmcm9tICcuLi9lcnJvcnMvZXJyb3InO1xuaW1wb3J0IHtlcnJvckxvZ30gZnJvbSAnLi4vdXRpbHMvZXJyb3JfbG9nJztcblxuZW51bSBEaXJlY3RpdmVUeXBlIHtcbiAgICBDT01QT05FTlQsXG4gICAgQVRUUklCVVRFXG59XG5cbi8qKlxuICogQ29tcG9uZW50IGNvbmZpZ3VyYXRpb24uIERpcmVjdGl2ZSBuYW1lIHNob3VsZCBiZSBpbiBkYXNoLWNhc2UuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcG9uZW50Q29uZmlndXJhdGlvbiB7XG4gICAgYWJzdHJhY3Q/OiBib29sZWFuO1xuICAgIG1vZHVsZT86IGFuZ3VsYXIuSU1vZHVsZTtcbiAgICBkaXJlY3RpdmU/OiBzdHJpbmc7XG4gICAgYmluZGluZ3M/OiBfLkRpY3Rpb25hcnk8c3RyaW5nPjtcbiAgICBjb250cm9sbGVyQXM/OiBzdHJpbmc7XG4gICAgdGVtcGxhdGVVcmw/OiBzdHJpbmc7XG4gICAgdGVtcGxhdGU/OiBzdHJpbmc7XG4gICAgcmVxdWlyZT86IHN0cmluZyB8IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbXBvbmVudFZpZXdPcHRpb25zIHtcbiAgICBpbnB1dHM/OiBPYmplY3Q7XG4gICAgcGFyZW50PzogQ29tcG9uZW50QmFzZTtcbiAgICBhdHRyaWJ1dGVzPzogT2JqZWN0O1xuICAgIGV4dGVuZFdpdGg/OiBPYmplY3Q7XG59XG5cbmludGVyZmFjZSBTdWJzY3JpcHRpb25NYXAge1xuICAgIFtrZXk6IHN0cmluZ106IFJ4LkRpc3Bvc2FibGU7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcHV0YXRpb25GdW5jdGlvbiB7XG4gICAgKGNvbXB1dGF0aW9uOiBDb21wdXRhdGlvbik6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3Vic2NyaXB0aW9uIHtcbiAgICB1bnN1YnNjcmliZSgpOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN1YnNjcmliZUNvbXBvbmVudE9wdGlvbnMge1xuICAgIG9uZVNob3Q/OiBib29sZWFuO1xuICAgIG9uRXJyb3I/OiAoZXhjZXB0aW9uOiBhbnkpID0+IHZvaWQ7XG5cbiAgICAvLyBTZXQgdGhpcyB0byB0cnVlIHRvIG1ha2UgdGhlIHN1YnNjcmlwdGlvbiBiZSBpZ25vcmVkIHdoZW4gZGV0ZXJtaW5pbmdcbiAgICAvLyB3aGV0aGVyIHRoZSBjb21wb25lbnQgaXMgZG9uZSB3YWl0aW5nIGZvciBzdWJzY3JpcHRpb25zLlxuICAgIGlnbm9yZVJlYWR5PzogYm9vbGVhbjtcbn1cblxudHlwZSBTdWJzY3JpcHRpb25HdWFyZCA9IHt9O1xuXG5mdW5jdGlvbiBzYWZlQ2FsbGJhY2tBcHBseSgkc2NvcGU6IGFuZ3VsYXIuSVNjb3BlLCBjYWxsYmFjazogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIGlmICgoPGFueT4gJHNjb3BlKS4kJGRlc3Ryb3llZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCRzY29wZS4kJHBoYXNlIHx8ICRzY29wZS4kcm9vdC4kJHBoYXNlKSB7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgJHNjb3BlLiRhcHBseSgoKSA9PiB7IGNhbGxiYWNrKCk7IH0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2FmZUFwcGx5PFQ+KG9ic2VydmFibGU6IFJ4Lk9ic2VydmFibGU8VD4sIHNjb3BlOiBhbmd1bGFyLklTY29wZSwgY2FsbGJhY2s6IChkYXRhOiBUKSA9PiB2b2lkKSB7XG4gICAgY2FsbGJhY2sgPSBhbmd1bGFyLmlzRnVuY3Rpb24oY2FsbGJhY2spID8gY2FsbGJhY2sgOiBfLm5vb3A7XG5cbiAgICByZXR1cm4gb2JzZXJ2YWJsZS50YWtlV2hpbGUoKCkgPT4ge1xuICAgICAgICByZXR1cm4gIXNjb3BlWyckJGRlc3Ryb3llZCddO1xuICAgIH0pLnRhcCgoZGF0YSkgPT4ge1xuICAgICAgICBzYWZlQ2FsbGJhY2tBcHBseShzY29wZSwgKCkgPT4geyBjYWxsYmFjayhkYXRhKTsgfSk7XG4gICAgfSk7XG59XG5cbi8qKlxuICogQWJzdHJhY3Rpb24gb2YgYSBjb21wdXRhdGlvbiB3aXRoIGRlcGVuZGVuY2llcyB0byBvYnNlcnZhYmxlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbXB1dGF0aW9uIHtcbiAgICBwcml2YXRlIF9zdWJzY3JpcHRpb25zOiBSeC5EaXNwb3NhYmxlW107XG4gICAgcHJpdmF0ZSBfcGVuZGluZ1N1YnNjcmlwdGlvbnM6IFN1YnNjcmlwdGlvbkd1YXJkW107XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RzIGEgbmV3IGNvbXB1dGF0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbXBvbmVudCBPd25pbmcgY29tcG9uZW50XG4gICAgICogQHBhcmFtIGNvbnRlbnQgQ29tcHV0YXRpb24gY29udGVudFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBjb21wb25lbnQ6IENvbXBvbmVudEJhc2UsIHB1YmxpYyBjb250ZW50OiBDb21wdXRhdGlvbkZ1bmN0aW9uKSB7XG4gICAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5fcGVuZGluZ1N1YnNjcmlwdGlvbnMgPSBbXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdWJzY3JpYmVzIHRvIGFuIG9ic2VydmFibGUsIHJlZ2lzdGVyaW5nIHRoZSBzdWJzY3JpcHRpb24gYXMgYSBkZXBlbmRlbmN5XG4gICAgICogb2YgdGhpcyBjb21wb25lbnQuIFRoZSBzdWJzY3JpcHRpb24gaXMgYXV0b21hdGljYWxseSBzdG9wcGVkIHdoZW4gdGhlXG4gICAgICogY29tcG9uZW50IGlzIGRlc3Ryb3llZC5cbiAgICAgKlxuICAgICAqIEZvciB0aGUgdGFyZ2V0IGFyZ3VtZW50LCB5b3UgY2FuIGVpdGhlciBzcGVjaWZ5IGEgc3RyaW5nLCBpbiB3aGljaCBjYXNlXG4gICAgICogaXQgcmVwcmVzZW50cyB0aGUgbmFtZSBvZiB0aGUgY29tcG9uZW50IG1lbWJlciB2YXJpYWJsZSB0aGF0IHdpbGwgYmVcbiAgICAgKiBwb3B1bGF0ZWQgd2l0aCB0aGUgcmVzdWx0IGl0ZS4gT3IgeW91IGNhbiBzcGVjaWZ5IGEgZnVuY3Rpb24gd2l0aCBvbmVcbiAgICAgKiBhcmd1bWVudCwgd2hpY2ggd2lsbCBiZSBjYWxsZWQgd2hlbiBxdWVyeSByZXN1bHRzIGNoYW5nZSBhbmQgY2FuIGRvXG4gICAgICogYW55dGhpbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGFyZ2V0IFRhcmdldCBjb21wb25lbnQgbWVtYmVyIGF0cmlidXRlIG5hbWUgb3IgY2FsbGJhY2tcbiAgICAgKiBAcGFyYW0gb2JzZXJ2YWJsZSBPYnNlcnZhYmxlIG9yIHByb21pc2UgdG8gc3Vic2NyaWJlIHRvXG4gICAgICogQHJldHVybiBVbmRlcmx5aW5nIHN1YnNjcmlwdGlvbiBkaXNwb3NhYmxlXG4gICAgICovXG4gICAgcHVibGljIHN1YnNjcmliZTxUPih0YXJnZXQ6IHN0cmluZyB8ICgoZGF0YTogVCkgPT4gYW55KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ic2VydmFibGU6IFJ4Lk9ic2VydmFibGU8VD4gfCBQcm9taXNlPGFueT4sXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiBTdWJzY3JpYmVDb21wb25lbnRPcHRpb25zID0ge30pIHtcbiAgICAgICAgLy8gQ3JlYXRlIGEgZ3VhcmQgb2JqZWN0IHRoYXQgY2FuIGJlIHJlbW92ZWQgd2hlbiBhIHN1YnNjcmlwdGlvbiBpcyBkb25lLiBXZSBuZWVkXG4gICAgICAgIC8vIHRvIHVzZSBndWFyZCBvYmplY3RzIGluc3RlYWQgb2YgYSBzaW1wbGUgcmVmZXJlbmNlIGNvdW50ZXIgYmVjYXVzZSB0aGUgcGVuZGluZ1xuICAgICAgICAvLyBzdWJzY3JpcHRpb25zIGFycmF5IG1heSBiZSBjbGVhcmVkIHdoaWxlIGNhbGxiYWNrcyBhcmUgc3RpbGwgb3V0c3RhbmRpbmcuXG4gICAgICAgIGNvbnN0IGd1YXJkID0gbmV3IE9iamVjdCgpO1xuICAgICAgICBpZiAoIW9wdGlvbnMuaWdub3JlUmVhZHkpIHtcbiAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdTdWJzY3JpcHRpb25zLnB1c2goZ3VhcmQpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGNvbnZlcnRlZE9ic2VydmFibGU6IFJ4Lk9ic2VydmFibGU8VD47XG4gICAgICAgIGlmIChpc1Byb21pc2Uob2JzZXJ2YWJsZSkpIHtcbiAgICAgICAgICAgIGNvbnZlcnRlZE9ic2VydmFibGUgPSBSeC5PYnNlcnZhYmxlLmZyb21Qcm9taXNlKG9ic2VydmFibGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29udmVydGVkT2JzZXJ2YWJsZSA9IG9ic2VydmFibGU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZWxlYXNlR3VhcmQgPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9wZW5kaW5nU3Vic2NyaXB0aW9ucyA9IF8ud2l0aG91dCh0aGlzLl9wZW5kaW5nU3Vic2NyaXB0aW9ucywgZ3VhcmQpO1xuICAgICAgICB9O1xuICAgICAgICBjb252ZXJ0ZWRPYnNlcnZhYmxlID0gY29udmVydGVkT2JzZXJ2YWJsZS50YXAocmVsZWFzZUd1YXJkLCByZWxlYXNlR3VhcmQpO1xuXG4gICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IHNhZmVBcHBseShcbiAgICAgICAgICAgIGNvbnZlcnRlZE9ic2VydmFibGUsXG4gICAgICAgICAgICB0aGlzLmNvbXBvbmVudC4kc2NvcGUsXG4gICAgICAgICAgICAoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24odGFyZ2V0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0KGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb21wb25lbnRbdGFyZ2V0XSA9IGl0ZW07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQGlmbmRlZiBHRU5KU19QUk9EVUNUSU9OXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvckxvZygnSWdub3JlZCBlcnJvcicsIGV4Y2VwdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIC8vIEBlbmRpZlxuICAgICAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIERpc3Bvc2Ugb2YgdGhlIHN1YnNjcmlwdGlvbiBpbW1lZGlhdGVseSBpZiB0aGlzIGlzIGEgb25lIHNob3Qgc3Vic2NyaXB0aW9uLlxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5vbmVTaG90ICYmIHN1YnNjcmlwdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKS5zdWJzY3JpYmUoXG4gICAgICAgICAgICAvLyBTdWNjZXNzIGhhbmRsZXIuXG4gICAgICAgICAgICBfLm5vb3AsXG4gICAgICAgICAgICAvLyBFcnJvciBoYW5kbGVyLlxuICAgICAgICAgICAgKGV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQGlmbmRlZiBHRU5KU19QUk9EVUNUSU9OXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvckxvZygnSGFuZGxlZCBlcnJvcicsIGV4Y2VwdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIC8vIEBlbmRpZlxuICAgICAgICAgICAgICAgICAgICBzYWZlQ2FsbGJhY2tBcHBseSh0aGlzLmNvbXBvbmVudC4kc2NvcGUsICgpID0+IHsgb3B0aW9ucy5vbkVycm9yKGV4Y2VwdGlvbik7IH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEBpZm5kZWYgR0VOSlNfUFJPRFVDVElPTlxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JMb2coJ1VuaGFuZGxlZCBlcnJvcicsIGV4Y2VwdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIC8vIEBlbmRpZlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgICAgICB0aGlzLl9zdWJzY3JpcHRpb25zLnB1c2goc3Vic2NyaXB0aW9uKTtcbiAgICAgICAgcmV0dXJuIHN1YnNjcmlwdGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRydWUgaWYgYWxsIHN1YnNjcmlwdGlvbnMgY3JlYXRlZCBieSBjYWxsaW5nIGBzdWJzY3JpYmVgIGFyZSByZWFkeS5cbiAgICAgKiBBIHN1YnNjcmlwdGlvbiBpcyByZWFkeSB3aGVuIGl0IGhhcyByZWNlaXZlZCBpdHMgZmlyc3QgYmF0Y2ggb2YgZGF0YSBhZnRlclxuICAgICAqIHN1YnNjcmliaW5nLlxuICAgICAqL1xuICAgIHB1YmxpYyBzdWJzY3JpcHRpb25zUmVhZHkoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wZW5kaW5nU3Vic2NyaXB0aW9ucy5sZW5ndGggPT09IDA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUnVucyB0aGUgY29tcHV0YXRpb24uXG4gICAgICovXG4gICAgcHVibGljIGNvbXB1dGUoKSB7XG4gICAgICAgIC8vIFN0b3AgYWxsIHN1YnNjcmlwdGlvbnMgYmVmb3JlIHJ1bm5pbmcgYWdhaW4uXG4gICAgICAgIHRoaXMuc3RvcCgpO1xuICAgICAgICB0aGlzLmNvbnRlbnQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGlzcG9zZXMgb2YgYWxsIHJlZ2lzdGVyZWQgc3Vic2NyaXB0aW9ucy5cbiAgICAgKi9cbiAgICBwdWJsaWMgc3RvcCgpIHtcbiAgICAgICAgZm9yIChsZXQgc3Vic2NyaXB0aW9uIG9mIHRoaXMuX3N1YnNjcmlwdGlvbnMpIHtcbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IFtdO1xuICAgICAgICB0aGlzLl9wZW5kaW5nU3Vic2NyaXB0aW9ucyA9IFtdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0b3BzIGFsbCBzdWJzY3JpcHRpb25zIGN1cnJlbnRseSByZWlnc3RlcmVkIGluIHRoaXMgY29tcHV0YXRpb24gYW5kIHJlbW92ZXNcbiAgICAgKiB0aGlzIGNvbXB1dGF0aW9uIGZyb20gdGhlIHBhcmVudCBjb21wb25lbnQuXG4gICAgICovXG4gICAgcHVibGljIHVuc3Vic2NyaWJlKCkge1xuICAgICAgICB0aGlzLmNvbXBvbmVudC51bnN1YnNjcmliZSh0aGlzKTtcbiAgICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgV2F0Y2hFeHByZXNzaW9uT2Y8VD4ge1xuICAgICgpOiBUO1xufVxuZXhwb3J0IHR5cGUgV2F0Y2hFeHByZXNzaW9uID0gV2F0Y2hFeHByZXNzaW9uT2Y8e30+O1xuXG4vKipcbiAqIEFuIGFic3RyYWN0IGJhc2UgY2xhc3MgZm9yIGFsbCBjb21wb25lbnRzLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQ29tcG9uZW50QmFzZSB7XG4gICAgLy8gQ29tcG9uZW50IGNvbmZpZ3VyYXRpb24uXG4gICAgcHVibGljIHN0YXRpYyBfX2NvbXBvbmVudENvbmZpZzogQ29tcG9uZW50Q29uZmlndXJhdGlvbjtcbiAgICAvLyBDb21wdXRhdGlvbnMuXG4gICAgcHJpdmF0ZSBfY29tcHV0YXRpb25zOiBDb21wdXRhdGlvbltdID0gW107XG4gICAgLy8gQ29tcG9uZW50IHN0YXRlLlxuICAgIHByaXZhdGUgX3JlYWR5OiBib29sZWFuID0gZmFsc2U7XG5cbiAgICAvLyBAbmdJbmplY3RcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgJHNjb3BlOiBhbmd1bGFyLklTY29wZSkge1xuICAgICAgICAkc2NvcGUuJG9uKCckZGVzdHJveScsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3JlYWR5ID0gZmFsc2U7XG5cbiAgICAgICAgICAgIC8vIEVuc3VyZSB0aGF0IGFsbCBjb21wdXRhdGlvbnMgZ2V0IHN0b3BwZWQgd2hlbiB0aGUgY29tcG9uZW50IGlzIGRlc3Ryb3llZC5cbiAgICAgICAgICAgIGZvciAobGV0IGNvbXB1dGF0aW9uIG9mIHRoaXMuX2NvbXB1dGF0aW9ucykge1xuICAgICAgICAgICAgICAgIGNvbXB1dGF0aW9uLnN0b3AoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2NvbXB1dGF0aW9ucyA9IFtdO1xuXG4gICAgICAgICAgICAvLyBDYWxsIGRlc3Ryb3llZCBob29rLlxuICAgICAgICAgICAgdGhpcy5vbkNvbXBvbmVudERlc3Ryb3llZCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBBbmd1bGFyIGNhbGxzICRvbkluaXQgYWZ0ZXIgY29uc3RydWN0b3IgYW5kIGJpbmRpbmdzIGluaXRpYWxpemF0aW9uLlxuICAgICAgICB0aGlzWyckb25Jbml0J10gPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm9uQ29tcG9uZW50SW5pdCgpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkIGFmdGVyIHRoZSB3aG9sZSBjaGFpbiBvZiBjb25zdHJ1Y3RvcnMgaXMgZXhlY3V0ZWQsXG4gICAgICogdmlhIGFuZ3VsYXIgY29tcG9uZW50ICRvbkluaXQuIFVzZSBpdCBpZiB5b3UgaGF2ZSBhbiBhYnN0cmFjdCBjb21wb25lbnQgdGhhdFxuICAgICAqIG1hbmlwdWxhdGVzIGNsYXNzIHByb3BlcnRpZXMgYW5kLCBhcyBhIHJlc3VsdCwgbmVlZHMgdG8gd2FpdCBmb3IgYWxsIGNoaWxkXG4gICAgICogY2xhc3MgcHJvcGVydGllcyB0byBiZSBhc3NpZ25lZCBhbmQgY29uc3RydWN0b3JzIHRvIGZpbmlzaC4gKENsYXNzIHByb3BlcnRpZXNcbiAgICAgKiBkZWZpbmVkIGluIGNoaWxkIGNvbXBvbmVudHMgYXJlIGFzc2lnbmVkIGJlZm9yZSBjaGlsZCdzIGNvbnN0cnVjdG9yKS5cbiAgICAgKlxuICAgICAqIE9yZGVyIG9mIGV4ZWN1dGlvbjpcbiAgICAgKiBgYGB0c1xuICAgICAqIGNsYXNzIENoaWxkIGV4dGVuZHMgTWlkZGxlIHtcbiAgICAgKiAgICAgcHVibGljIHByb3BlcnR5QSA9ICdjJyAgICAvLyA1XG4gICAgICogICAgIGNvbnN0cnVjdG9yKCkgeyBzdXBlcigpIH0gLy8gNlxuICAgICAqIH1cbiAgICAgKiBjbGFzcyBNaWRkbGUgZXh0ZW5kcyBBYnN0cmFjdCB7XG4gICAgICogICAgIHB1YmxpYyBwcm9wZXJ0eUIgPSAnYicgICAgLy8gM1xuICAgICAqICAgICBjb25zdHJ1Y3RvcigpIHsgc3VwZXIoKSB9IC8vIDRcbiAgICAgKiB9XG4gICAgICogY2xhc3MgQWJzdHJhY3Qge1xuICAgICAqICAgICBwdWJsaWMgcHJvcGVydHlBID0gJ2EnICAgIC8vIDFcbiAgICAgKiAgICAgY29uc3RydWN0b3IoKSB7fSAgICAgICAgICAvLyAyXG4gICAgICogICAgIG9uQ29tcG9uZW50SW5pdCgpIHt9ICAgIC8vIDdcbiAgICAgKiB9XG4gICAgICogYGBgXG4gICAgICovXG4gICAgcHVibGljIG9uQ29tcG9uZW50SW5pdCgpIHtcbiAgICAgICAgLy8gRGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBkb2VzIG5vdGhpbmcuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVzdHJveXMgdGhlIGNvbXBvbmVudC5cbiAgICAgKi9cbiAgICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kc2NvcGUuJGRlc3Ryb3koKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCBpbiB0aGUgY29tcGlsZSBwaGFzZSBvZiB0aGUgZGlyZWN0aXZlIGFuZCBtYXlcbiAgICAgKiBiZSBvdmVycmlkZW4gYnkgY29tcG9uZW50IGltcGxlbWVudGF0aW9ucy5cbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIG9uQ29tcG9uZW50Q29tcGlsZShlbGVtZW50OiBhbmd1bGFyLklBdWdtZW50ZWRKUXVlcnksIGF0dHJpYnV0ZXM6IGFuZ3VsYXIuSUF0dHJpYnV0ZXMpOiB2b2lkIHtcbiAgICAgICAgLy8gRGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBkb2VzIG5vdGhpbmcuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGludGVybmFsXG4gICAgICovXG4gICAgcHVibGljIF9vbkNvbXBvbmVudExpbmsoc2NvcGU6IGFuZ3VsYXIuSVNjb3BlLCBlbGVtZW50OiBhbmd1bGFyLklBdWdtZW50ZWRKUXVlcnksIGF0dHJpYnV0ZXM6IGFuZ3VsYXIuSUF0dHJpYnV0ZXMsIC4uLmFyZ3MpOiB2b2lkIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIENhbGwgdGhlIHB1YmxpYyBtZXRob2QgdGhhdCBjYW4gYmUgb3ZlcnJpZGVuIGJ5IHRoZSB1c2VyLlxuICAgICAgICAgICAgdGhpcy5vbkNvbXBvbmVudExpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJpYnV0ZXMsIC4uLmFyZ3MpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5fcmVhZHkgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgaW4gdGhlIHBvc3QtbGluayBwaGFzZSBvZiB0aGUgZGlyZWN0aXZlIGFuZCBtYXlcbiAgICAgKiBiZSBvdmVycmlkZW4gYnkgY29tcG9uZW50IGltcGxlbWVudGF0aW9ucy5cbiAgICAgKi9cbiAgICBwdWJsaWMgb25Db21wb25lbnRMaW5rKHNjb3BlOiBhbmd1bGFyLklTY29wZSwgZWxlbWVudDogYW5ndWxhci5JQXVnbWVudGVkSlF1ZXJ5LCBhdHRyaWJ1dGVzOiBhbmd1bGFyLklBdHRyaWJ1dGVzLCAuLi5hcmdzKTogdm9pZCB7XG4gICAgICAgIC8vIERlZmF1bHQgaW1wbGVtZW50YXRpb24gZG9lcyBub3RoaW5nLlxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkIGFmdGVyIHRoZSBjb21wb25lbnQgc2NvcGUgaGFzIGJlZW4gZGVzdHJveWVkLlxuICAgICAqL1xuICAgIHB1YmxpYyBvbkNvbXBvbmVudERlc3Ryb3llZCgpOiB2b2lkIHtcbiAgICAgICAgLy8gRGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBkb2VzIG5vdGhpbmcuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0cnVlIGlmIHRoZSBjb21wb25lbnQgaGFzIGJlZW4gY3JlYXRlZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgaXNSZWFkeSgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlYWR5O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiBhbGwgc3Vic2NyaXB0aW9ucyBjcmVhdGVkIGJ5IGNhbGxpbmcgYHN1YnNjcmliZWAgYXJlIHJlYWR5LlxuICAgICAqIEEgc3Vic2NyaXB0aW9uIGlzIHJlYWR5IHdoZW4gaXQgaGFzIHJlY2VpdmVkIGl0cyBmaXJzdCBiYXRjaCBvZiBkYXRhIGFmdGVyXG4gICAgICogc3Vic2NyaWJpbmcuXG4gICAgICovXG4gICAgcHVibGljIHN1YnNjcmlwdGlvbnNSZWFkeSgpOiBib29sZWFuIHtcbiAgICAgICAgLy8gV2FpdCB1bnRpbCB0aGUgY29tcG9uZW50IGhhcyBiZWVuIGNyZWF0ZWQuXG4gICAgICAgIGlmICghdGhpcy5pc1JlYWR5KCkpIHJldHVybiBmYWxzZTtcblxuICAgICAgICByZXR1cm4gXy5ldmVyeSh0aGlzLl9jb21wdXRhdGlvbnMsIChjb21wdXRhdGlvbikgPT4gY29tcHV0YXRpb24uc3Vic2NyaXB0aW9uc1JlYWR5KCkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2NyZWF0ZUNvbXB1dGF0aW9uKGNvbnRlbnQ6IENvbXB1dGF0aW9uRnVuY3Rpb24gPSBfLm5vb3ApOiBDb21wdXRhdGlvbiB7XG4gICAgICAgIGxldCBjb21wdXRhdGlvbiA9IG5ldyBDb21wdXRhdGlvbih0aGlzLCBjb250ZW50KTtcbiAgICAgICAgdGhpcy5fY29tcHV0YXRpb25zLnB1c2goY29tcHV0YXRpb24pO1xuICAgICAgICByZXR1cm4gY29tcHV0YXRpb247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogV2F0Y2ggY29tcG9uZW50IHNjb3BlIGFuZCBydW4gYSBjb21wdXRhdGlvbiBvbiBjaGFuZ2VzLiBUaGUgY29tcHV0YXRpb24gaXNcbiAgICAgKiBleGVjdXRlZCBvbmNlIGltbWVkaWF0ZWx5IHByaW9yIHRvIHdhdGNoaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbnRleHQgRnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0aGUgY29udGV4dCB0byB3YXRjaFxuICAgICAqIEBwYXJhbSBjb250ZW50IEZ1bmN0aW9uIHRvIHJ1biBvbiBjaGFuZ2VzXG4gICAgICogQHBhcmFtIG9iamVjdEVxdWFsaXR5IFNob3VsZCBgYW5ndWxhci5lcXVhbHNgIGJlIHVzZWQgZm9yIGNvbXBhcmlzb25zXG4gICAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHVucmVnaXN0ZXJzIHRoZSBib3VuZCBleHByZXNzaW9uXG4gICAgICovXG4gICAgcHVibGljIHdhdGNoKGNvbnRleHQ6IFdhdGNoRXhwcmVzc2lvbiB8IFdhdGNoRXhwcmVzc2lvbltdLCBjb250ZW50OiBDb21wdXRhdGlvbkZ1bmN0aW9uLCBvYmplY3RFcXVhbGl0eT86IGJvb2xlYW4pOiAoKSA9PiB2b2lkIHtcbiAgICAgICAgbGV0IGNvbXB1dGF0aW9uID0gdGhpcy5fY3JlYXRlQ29tcHV0YXRpb24oY29udGVudCk7XG4gICAgICAgIGNvbXB1dGF0aW9uLmNvbXB1dGUoKTtcbiAgICAgICAgbGV0IGV4cHJlc3Npb25zID0gQXJyYXkuaXNBcnJheShjb250ZXh0KSA/IGNvbnRleHQgOiBbY29udGV4dF07XG5cbiAgICAgICAgaWYgKCFvYmplY3RFcXVhbGl0eSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuJHNjb3BlLiR3YXRjaEdyb3VwKGV4cHJlc3Npb25zLCBjb21wdXRhdGlvbi5jb21wdXRlLmJpbmQoY29tcHV0YXRpb24pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB3YXRjaGVkRXhwcmVzc2lvbjogV2F0Y2hFeHByZXNzaW9uID0gKCkgPT4gXy5tYXAoZXhwcmVzc2lvbnMsIGZuID0+IGZuKCkpO1xuICAgICAgICBpZiAoZXhwcmVzc2lvbnMubGVuZ3RoID09PSAxKSB7IC8vIG9wdGltaXplXG4gICAgICAgICAgICB3YXRjaGVkRXhwcmVzc2lvbiA9IGV4cHJlc3Npb25zWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuJHNjb3BlLiR3YXRjaCh3YXRjaGVkRXhwcmVzc2lvbiwgY29tcHV0YXRpb24uY29tcHV0ZS5iaW5kKGNvbXB1dGF0aW9uKSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogV2F0Y2ggY29tcG9uZW50IHNjb3BlIGFuZCBydW4gYSBjb21wdXRhdGlvbiBvbiBjaGFuZ2VzLiBUaGlzIHZlcnNpb24gdXNlcyBBbmd1bGFyJ3NcbiAgICAgKiBjb2xsZWN0aW9uIHdhdGNoLiBUaGUgY29tcHV0YXRpb24gaXMgZXhlY3V0ZWQgb25jZSBpbW1lZGlhdGVseSBwcmlvciB0byB3YXRjaGluZy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb250ZXh0IEZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhlIGNvbnRleHQgdG8gd2F0Y2hcbiAgICAgKiBAcGFyYW0gY29udGVudCBGdW5jdGlvbiB0byBydW4gb24gY2hhbmdlc1xuICAgICAqL1xuICAgIHB1YmxpYyB3YXRjaENvbGxlY3Rpb24oY29udGV4dDogV2F0Y2hFeHByZXNzaW9uLCBjb250ZW50OiBDb21wdXRhdGlvbkZ1bmN0aW9uKTogdm9pZCB7XG4gICAgICAgIGxldCBjb21wdXRhdGlvbiA9IHRoaXMuX2NyZWF0ZUNvbXB1dGF0aW9uKGNvbnRlbnQpO1xuICAgICAgICBjb21wdXRhdGlvbi5jb21wdXRlKCk7XG4gICAgICAgIHRoaXMuJHNjb3BlLiR3YXRjaENvbGxlY3Rpb24oY29udGV4dCwgY29tcHV0YXRpb24uY29tcHV0ZS5iaW5kKGNvbXB1dGF0aW9uKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3Vic2NyaWJlcyB0byBhbiBvYnNlcnZhYmxlLCByZWdpc3RlcmluZyB0aGUgc3Vic2NyaXB0aW9uIGFzIGEgZGVwZW5kZW5jeVxuICAgICAqIG9mIHRoaXMgY29tcG9uZW50LiBUaGUgc3Vic2NyaXB0aW9uIGlzIGF1dG9tYXRpY2FsbHkgc3RvcHBlZCB3aGVuIHRoZVxuICAgICAqIGNvbXBvbmVudCBpcyBkZXN0cm95ZWQuXG4gICAgICpcbiAgICAgKiBGb3IgdGhlIHRhcmdldCBhcmd1bWVudCwgeW91IGNhbiBlaXRoZXIgc3BlY2lmeSBhIHN0cmluZywgaW4gd2hpY2ggY2FzZVxuICAgICAqIGl0IHJlcHJlc2VudHMgdGhlIG5hbWUgb2YgdGhlIGNvbXBvbmVudCBtZW1iZXIgdmFyaWFibGUgdGhhdCB3aWxsIGJlXG4gICAgICogcG9wdWxhdGVkIHdpdGggdGhlIHJlc3VsdCBpdGUuIE9yIHlvdSBjYW4gc3BlY2lmeSBhIGZ1bmN0aW9uIHdpdGggb25lXG4gICAgICogYXJndW1lbnQsIHdoaWNoIHdpbGwgYmUgY2FsbGVkIHdoZW4gcXVlcnkgcmVzdWx0cyBjaGFuZ2UgYW5kIGNhbiBkb1xuICAgICAqIGFueXRoaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRhcmdldCBUYXJnZXQgY29tcG9uZW50IG1lbWJlciBhdHJpYnV0ZSBuYW1lIG9yIGNhbGxiYWNrXG4gICAgICogQHBhcmFtIG9ic2VydmFibGUgT2JzZXJ2YWJsZSB0byBzdWJzY3JpYmUgdG9cbiAgICAgKiBAcmV0dXJuIFVuZGVybHlpbmcgc3Vic2NyaXB0aW9uXG4gICAgICovXG4gICAgcHVibGljIHN1YnNjcmliZTxUPih0YXJnZXQ6IHN0cmluZyB8ICgoZGF0YTogVCkgPT4gYW55KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ic2VydmFibGU6IFJ4Lk9ic2VydmFibGU8VD4gfCBQcm9taXNlPGFueT4sXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiBTdWJzY3JpYmVDb21wb25lbnRPcHRpb25zID0ge30pOiBTdWJzY3JpcHRpb24ge1xuICAgICAgICBsZXQgY29tcHV0YXRpb24gPSB0aGlzLl9jcmVhdGVDb21wdXRhdGlvbigpO1xuICAgICAgICBjb21wdXRhdGlvbi5zdWJzY3JpYmUodGFyZ2V0LCBvYnNlcnZhYmxlLCBvcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIGNvbXB1dGF0aW9uO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVuc3Vic2NyaWJlcyB0aGUgZ2l2ZW4gY29tcHV0YXRpb24gZnJvbSB0aGlzIGNvbXBvbmVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb21wdXRhdGlvbiBDb21wdXRhdGlvbiBpbnN0YW5jZVxuICAgICAqL1xuICAgIHB1YmxpYyB1bnN1YnNjcmliZShjb21wdXRhdGlvbjogQ29tcHV0YXRpb24pOiB2b2lkIHtcbiAgICAgICAgY29tcHV0YXRpb24uc3RvcCgpO1xuICAgICAgICBfLnB1bGwodGhpcy5fY29tcHV0YXRpb25zLCBjb21wdXRhdGlvbik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSGVscGVyIGZ1bmN0aW9uIHRvIGNyZWF0ZSBhIHdyYXBwZXIgb2JzZXJ2YWJsZSBhcm91bmQgd2F0Y2guXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29udGV4dCBGdW5jdGlvbiB3aGljaCByZXR1cm5zIHRoZSBjb250ZXh0IHRvIHdhdGNoXG4gICAgICogQHBhcmFtIG9iamVjdEVxdWFsaXR5IFNob3VsZCBgYW5ndWxhci5lcXVhbHNgIGJlIHVzZWQgZm9yIGNvbXBhcmlzb25zXG4gICAgICogQHJldHVybnMgV2F0Y2ggb2JzZXJ2YWJsZVxuICAgICAqL1xuICAgIHB1YmxpYyBjcmVhdGVXYXRjaE9ic2VydmFibGU8VD4oY29udGV4dDogV2F0Y2hFeHByZXNzaW9uT2Y8VD4sIG9iamVjdEVxdWFsaXR5PzogYm9vbGVhbik6IFJ4Lk9ic2VydmFibGU8VD4ge1xuICAgICAgICBjb25zdCBub3RpZnlPYnNlcnZlciA9IChvYnNlcnZlcjogUnguT2JzZXJ2ZXI8VD4pID0+IHtcbiAgICAgICAgICAgIG9ic2VydmVyLm9uTmV4dChjb250ZXh0KCkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBSeC5PYnNlcnZhYmxlLmNyZWF0ZTxUPigob2JzZXJ2ZXIpID0+IHtcbiAgICAgICAgICAgIG5vdGlmeU9ic2VydmVyKG9ic2VydmVyKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMud2F0Y2goXG4gICAgICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgICAgICAoKSA9PiBub3RpZnlPYnNlcnZlcihvYnNlcnZlciksXG4gICAgICAgICAgICAgICAgb2JqZWN0RXF1YWxpdHlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgY29tcG9uZW50IGNvbmZpZ3VyYXRpb24uXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBnZXRDb25maWcoKTogQ29tcG9uZW50Q29uZmlndXJhdGlvbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fY29tcG9uZW50Q29uZmlnO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgY29tcG9uZW50IGNvbmZpZ3VyYXRpb24uXG4gICAgICovXG4gICAgcHVibGljIGdldENvbmZpZygpOiBDb21wb25lbnRDb25maWd1cmF0aW9uIHtcbiAgICAgICAgcmV0dXJuICg8dHlwZW9mIENvbXBvbmVudEJhc2U+IHRoaXMuY29uc3RydWN0b3IpLmdldENvbmZpZygpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgY29tcG9uZW50IGhhcyBhIHNwZWNpZmllZCBhdHRyaWJ1dGUgY29uZmlndXJlZCBhc1xuICAgICAqIGEgYmluZGluZy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGJvdW5kIGF0dHJpYnV0ZVxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgaGFzQmluZGluZyhuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIF8uc29tZSh0aGlzLl9fY29tcG9uZW50Q29uZmlnLmJpbmRpbmdzLCAodmFsdWUsIGtleSkgPT4ge1xuICAgICAgICAgICAgLy8gSW4gY2FzZSBubyBhdHRyaWJ1dGUgbmFtZSBpcyBzcGVjaWZpZWQsIGNvbXBhcmUgdGhlIGJpbmRpbmcga2V5LFxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlIGNvbXBhcmUgdGhlIGF0dHJpYnV0ZSBuYW1lLlxuICAgICAgICAgICAgY29uc3QgbWF0Y2hlZE5hbWUgPSB2YWx1ZS5yZXBsYWNlKC9eWz1AJjxdXFw/Py8sICcnKTtcbiAgICAgICAgICAgIGNvbnN0IGJvdW5kQXR0cmlidXRlID0gbWF0Y2hlZE5hbWUgfHwga2V5O1xuICAgICAgICAgICAgcmV0dXJuIGJvdW5kQXR0cmlidXRlID09PSBuYW1lO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgdmlldyBjb25maWd1cmF0aW9uIHRoYXQgcmVuZGVycyB0aGlzIGNvbXBvbmVudC4gVGhpcyBtZXRob2QgY2FuIGJlXG4gICAgICogdXNlZCB3aGVuIGNvbmZpZ3VyaW5nIHRoZSBBbmd1bGFyIFVJIHJvdXRlciBhcyBmb2xsb3dzOlxuICAgICAqXG4gICAgICogICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdmb28nLCB7XG4gICAgICogICAgICAgICB1cmw6ICcvZm9vJyxcbiAgICAgKiAgICAgICAgIHZpZXdzOiB7IGFwcGxpY2F0aW9uOiBNeUNvbXBvbmVudC5hc1ZpZXcoKSB9LFxuICAgICAqICAgICB9KTtcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGFzVmlldyhvcHRpb25zOiBDb21wb25lbnRWaWV3T3B0aW9ucyA9IHt9KTogYW55IHtcbiAgICAgICAgbGV0IHRlbXBsYXRlID0gJzwnICsgdGhpcy5fX2NvbXBvbmVudENvbmZpZy5kaXJlY3RpdmU7XG4gICAgICAgIGxldCBhdHRyaWJ1dGVzID0gb3B0aW9ucy5hdHRyaWJ1dGVzIHx8IHt9O1xuXG4gICAgICAgIC8vIFNldHVwIGlucHV0IGJpbmRpbmdzLlxuICAgICAgICBpZiAoIV8uaXNFbXB0eShvcHRpb25zLmlucHV0cykpIHtcbiAgICAgICAgICAgIF8uZm9yT3duKG9wdGlvbnMuaW5wdXRzLCAoaW5wdXQsIGtleSkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIEBpZm5kZWYgR0VOSlNfUFJPRFVDVElPTlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5oYXNCaW5kaW5nKGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEdlbkVycm9yKGBJbnB1dCAnJHtrZXl9JyBpcyBub3QgZGVmaW5lZCBvbiBjb21wb25lbnQuYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEBlbmRpZlxuXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlc1trZXldID0gaW5wdXQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdlbmVyYXRlIGF0dHJpYnV0ZXMuXG4gICAgICAgIGlmICghXy5pc0VtcHR5KGF0dHJpYnV0ZXMpKSB7XG4gICAgICAgICAgICBfLmZvck93bihhdHRyaWJ1dGVzLCAoYXR0cmlidXRlLCBhdHRyaWJ1dGVOYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogUHJvcGVybHkgZXNjYXBlIGF0dHJpYnV0ZSB2YWx1ZXMuXG4gICAgICAgICAgICAgICAgdGVtcGxhdGUgKz0gJyAnICsgXy5rZWJhYkNhc2UoYXR0cmlidXRlTmFtZSkgKyAnPVwiJyArIGF0dHJpYnV0ZSArICdcIic7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0ZW1wbGF0ZSArPSAnPjwvJyArIHRoaXMuX19jb21wb25lbnRDb25maWcuZGlyZWN0aXZlICsgJz4nO1xuXG4gICAgICAgIGxldCByZXN1bHQ6IGFueSA9IHtcbiAgICAgICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBTZXR1cCBwYXJlbnQgc2NvcGUgZm9yIHRoZSBpbnRlcm1lZGlhdGUgdGVtcGxhdGUuXG4gICAgICAgIGlmIChvcHRpb25zLnBhcmVudCkge1xuICAgICAgICAgICAgcmVzdWx0LnNjb3BlID0gb3B0aW9ucy5wYXJlbnQuJHNjb3BlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIF8uZXh0ZW5kKHJlc3VsdCwgb3B0aW9ucy5leHRlbmRXaXRoIHx8IHt9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtcyBhbnkgbW9kaWZpY2F0aW9ucyBvZiB0aGUgY29tcG9uZW50IGNvbmZpZ3VyYXRpb24uIFRoaXMgbWV0aG9kIGlzXG4gICAgICogaW52b2tlZCBkdXJpbmcgY29tcG9uZW50IGNsYXNzIGRlY29yYXRpb24gYW5kIG1heSBhcmJpdHJhcmlseSBtb2RpZnkgdGhlXG4gICAgICogcGFzc2VkIGNvbXBvbmVudCBjb25maWd1cmF0aW9uLCBiZWZvcmUgdGhlIGNvbXBvbmVudCBpcyByZWdpc3RlcmVkIHdpdGhcbiAgICAgKiBBbmd1bGFyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbmZpZyBDb21wb25lbnQgY29uZmlndXJhdGlvblxuICAgICAqIEByZXR1cm4gTW9kaWZpZWQgY29tcG9uZW50IGNvbmZpZ3VyYXRpb25cbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGNvbmZpZ3VyZUNvbXBvbmVudChjb25maWc6IENvbXBvbmVudENvbmZpZ3VyYXRpb24pOiBDb21wb25lbnRDb25maWd1cmF0aW9uIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRpcmVjdGl2ZUZhY3RvcnkoY29uZmlnOiBDb21wb25lbnRDb25maWd1cmF0aW9uLCB0eXBlOiBEaXJlY3RpdmVUeXBlKSB7XG4gICAgcmV0dXJuICh0YXJnZXQ6IHR5cGVvZiBDb21wb25lbnRCYXNlKTogRnVuY3Rpb24gPT4ge1xuICAgICAgICAvLyBTdG9yZSBjb21wb25lbnQgY29uZmlndXJhdGlvbiBvbiB0aGUgY29tcG9uZW50LCBleHRlbmRpbmcgY29uZmlndXJhdGlvbiBvYnRhaW5lZCBmcm9tIGJhc2UgY2xhc3MuXG4gICAgICAgIGlmICh0YXJnZXQuX19jb21wb25lbnRDb25maWcpIHtcbiAgICAgICAgICAgIHRhcmdldC5fX2NvbXBvbmVudENvbmZpZyA9IF8uY2xvbmVEZWVwKHRhcmdldC5fX2NvbXBvbmVudENvbmZpZyk7XG4gICAgICAgICAgICAvLyBEb24ndCBpbmhlcml0IHRoZSBhYnN0cmFjdCBmbGFnIGFzIG90aGVyd2lzZSB5b3Ugd291bGQgYmUgcmVxdWlyZWQgdG8gZXhwbGljaXRseVxuICAgICAgICAgICAgLy8gc2V0IGl0IHRvIGZhbHNlIGluIGFsbCBzdWJjbGFzc2VzLlxuICAgICAgICAgICAgZGVsZXRlIHRhcmdldC5fX2NvbXBvbmVudENvbmZpZy5hYnN0cmFjdDtcblxuICAgICAgICAgICAgXy5tZXJnZSh0YXJnZXQuX19jb21wb25lbnRDb25maWcsIGNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0YXJnZXQuX19jb21wb25lbnRDb25maWcgPSBjb25maWc7XG4gICAgICAgIH1cblxuICAgICAgICBjb25maWcgPSB0YXJnZXQuY29uZmlndXJlQ29tcG9uZW50KHRhcmdldC5fX2NvbXBvbmVudENvbmZpZyk7XG5cbiAgICAgICAgaWYgKCFjb25maWcuYWJzdHJhY3QpIHtcbiAgICAgICAgICAgIC8vIElmIG1vZHVsZSBvciBkaXJlY3RpdmUgaXMgbm90IGRlZmluZWQgZm9yIGEgbm9uLWFic3RyYWN0IGNvbXBvbmVudCwgdGhpcyBpcyBhbiBlcnJvci5cbiAgICAgICAgICAgIGlmICghY29uZmlnLmRpcmVjdGl2ZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihcIkRpcmVjdGl2ZSBub3QgZGVmaW5lZCBmb3IgY29tcG9uZW50LlwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFfLnN0YXJ0c1dpdGgoY29uZmlnLmRpcmVjdGl2ZSwgJ2dlbi0nKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihcIkRpcmVjdGl2ZSBub3QgcHJlZml4ZWQgd2l0aCBcXFwiZ2VuLVxcXCI6IFwiICsgY29uZmlnLmRpcmVjdGl2ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghY29uZmlnLm1vZHVsZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihcIk1vZHVsZSBub3QgZGVmaW5lZCBmb3IgY29tcG9uZW50ICdcIiArIGNvbmZpZy5kaXJlY3RpdmUgKyBcIicuXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoXy5hbnkoY29uZmlnLmJpbmRpbmdzLCAodmFsdWUsIGtleSkgPT4gXy5zdGFydHNXaXRoKHZhbHVlLnN1YnN0cmluZygxKSB8fCBrZXksICdkYXRhJykpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmluZGluZ3Mgc2hvdWxkIG5vdCBzdGFydCB3aXRoICdkYXRhJ1wiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uZmlnLm1vZHVsZS5kaXJlY3RpdmUoXy5jYW1lbENhc2UoY29uZmlnLmRpcmVjdGl2ZSksICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb250cm9sbGVyQmluZGluZyA9IGNvbmZpZy5jb250cm9sbGVyQXMgfHwgJ2N0cmwnO1xuXG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdDogYW5ndWxhci5JRGlyZWN0aXZlID0ge1xuICAgICAgICAgICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IGNvbmZpZy5iaW5kaW5ncyB8fCB7fSxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogPGFueT4gdGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyQXM6IGNvbnRyb2xsZXJCaW5kaW5nLFxuICAgICAgICAgICAgICAgICAgICBjb21waWxlOiAoZWxlbWVudCwgYXR0cmlidXRlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FsbCB0aGUgY29tcGlsZSBsaWZlLWN5Y2xlIHN0YXRpYyBtZXRob2QuXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQub25Db21wb25lbnRDb21waWxlKGVsZW1lbnQsIGF0dHJpYnV0ZXMpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKHNjb3BlLCBlbGVtZW50LCBhdHRyaWJ1dGVzLCAuLi5hcmdzKSA9PiB7IC8vIHRzbGludDpkaXNhYmxlLWxpbmU6bm8tc2hhZG93ZWQtdmFyaWFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZXQgY29udHJvbGxlciBmcm9tIHRoZSBzY29wZSBhbmQgY2FsbCB0aGUgbGluayBsaWZlLWN5Y2xlIG1ldGhvZC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPENvbXBvbmVudEJhc2U+IHNjb3BlW2NvbnRyb2xsZXJCaW5kaW5nXSkuX29uQ29tcG9uZW50TGluayhzY29wZSwgZWxlbWVudCwgYXR0cmlidXRlcywgLi4uYXJncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogY29uZmlnLnRlbXBsYXRlVXJsLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogY29uZmlnLnRlbXBsYXRlLFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlOiBjb25maWcucmVxdWlyZSxcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgRGlyZWN0aXZlVHlwZS5DT01QT05FTlQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5yZXN0cmljdCA9ICdFJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgRGlyZWN0aXZlVHlwZS5BVFRSSUJVVEU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5yZXN0cmljdCA9ICdBJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IHVzZSBlcnJvciBoYW5kbGVyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgR2VuRXJyb3IoYFVua25vd24gdHlwZSAke3R5cGV9YCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH07XG59XG5cbi8qKlxuICogQSBkZWNvcmF0b3IgdGhhdCB0cmFuc2Zvcm1zIHRoZSBkZWNvcmF0ZWQgY2xhc3MgaW50byBhbiBBbmd1bGFySlNcbiAqIGNvbXBvbmVudCBkaXJlY3RpdmUgd2l0aCBwcm9wZXIgZGVwZW5kZW5jeSBpbmplY3Rpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wb25lbnQoY29uZmlnOiBDb21wb25lbnRDb25maWd1cmF0aW9uKTogQ2xhc3NEZWNvcmF0b3Ige1xuICAgIHJldHVybiBkaXJlY3RpdmVGYWN0b3J5KGNvbmZpZywgRGlyZWN0aXZlVHlwZS5DT01QT05FTlQpO1xufVxuXG4vKipcbiAqIEEgZGVjb3JhdG9yIHRoYXQgdHJhbnNmb3JtcyB0aGUgZGVjb3JhdGVkIGNsYXNzIGludG8gYW4gQW5ndWxhckpTXG4gKiBhdHRyaWJ1dGUgZGlyZWN0aXZlIHdpdGggcHJvcGVyIGRlcGVuZGVuY3kgaW5qZWN0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlKGNvbmZpZzogQ29tcG9uZW50Q29uZmlndXJhdGlvbik6IENsYXNzRGVjb3JhdG9yIHtcbiAgICByZXR1cm4gZGlyZWN0aXZlRmFjdG9yeShjb25maWcsIERpcmVjdGl2ZVR5cGUuQVRUUklCVVRFKTtcbn1cbiJdfQ==
