"use strict";
var _ = require("lodash");
var angular = require("angular");
require("angular-mocks");
var mock_1 = require("../api/mock");
var matchers_1 = require("./matchers");
var error_1 = require("../core/errors/error");
var lang_1 = require("../core/utils/lang");
var mock_2 = require("./mock");
require("./matchers");
// Service modules that should be loaded.
require("../core/shared_store/index");
require("../core/components/manager");
/**
 * Helper for creating simple shared stores in tests. Also see
 * [[SharedStoreProvider.create]].
 *
 * @param storeId Identifier of the shared store (must be globally unique)
 * @param initialState Optional initial state of the shared store
 */
function createSharedStore(storeId, initialState) {
    if (initialState === void 0) { initialState = null; }
    return {
        storeId: storeId,
        initialState: initialState,
    };
}
exports.createSharedStore = createSharedStore;
/**
 * Helper for using shared stores in tests.
 *
 * @param storeId Identifier of the shared store (must be globally unique)
 * @param factory Shared store class
 */
function useSharedStore(storeId, factory) {
    return {
        storeId: storeId,
        factory: factory,
    };
}
exports.useSharedStore = useSharedStore;
/**
 * Helper function when unit testing components which compiles a component.
 *
 * @param $compile Compile service
 * @param $scope Scope service
 * @param template template in the form of a directive, e.g. `'<gen-some-component><gen-some-component>'`
 * @returns {ComponentDescriptor} Element and its controller
 */
function getComponent($compile, $scope, template) {
    // TODO: instead of having getComponent<T>, we could have getComponent<T extends ComponentBase> and then you would do
    // T.asView thus reducing the need for template argument, but looks like typescript does not support that (yet)
    // https://github.com/Microsoft/TypeScript/issues/5677
    var element = $compile(template)($scope);
    $scope.$digest();
    var ctrl;
    try {
        ctrl = $scope['$$childTail'].ctrl;
    }
    catch (e) {
        throw new error_1.GenError("Unable to fetch component controller. Did you load your module in tests?");
    }
    return {
        element: element,
        ctrl: ctrl,
    };
}
exports.getComponent = getComponent;
/**
 * A helper function to ease testing of components. It will take care of mocking the
 * usual modules needed for testing components and preparing a module that you can use
 * to register test components.
 *
 * The test case is passed an instance of [[ComponentTester]], which contains some
 * useful properties and methods for testing components.
 *
 * The following modules are automatically loaded:
 * * `resolwe.services.shared_store`
 *
 * If you need to load any additional modules, specify them in the `modules`
 * argument.
 *
 * @param description Test case description
 * @param modules List of modules to load for this test
 * @param tests Test case body
 * @param apiClass Optional mock API class that should be used
 * @param baseModules Optional list of modules to load before everything for this test
 */
function describeComponent(description, modules, tests, apiClass, baseModules) {
    if (apiClass === void 0) { apiClass = mock_1.MockApi; }
    if (baseModules === void 0) { baseModules = []; }
    describe(description, function () {
        var $compile;
        var $scope;
        var mockApi;
        var moduleName = 'resolwe.tests.' + description.replace(/ /g, '.');
        var module = angular.module(moduleName, []);
        // Load base modules.
        beforeEach(angular.mock.module('resolwe.services.shared_store'));
        beforeEach(angular.mock.module('resolwe.services.state_manager'));
        baseModules.forEach(function (baseModule) { return beforeEach(angular.mock.module(baseModule)); });
        beforeEach(angular.mock.module(function ($provide) {
            // Replace usual API service with mock API.
            $provide.service('api', lang_1.compose([apiClass, mock_2.MockApiService]));
        }));
        beforeEach(angular.mock.module(moduleName));
        // Register any shared stores.
        var sharedStores = _.filter(modules, function (m) { return m.storeId; });
        modules = _.filter(modules, function (m) { return !m.storeId; });
        module.config(["sharedStoreManagerProvider", function (sharedStoreManagerProvider) {
            sharedStores.forEach(function (descriptor) {
                if (descriptor.factory) {
                    sharedStoreManagerProvider.register(descriptor.storeId, descriptor.factory);
                }
                else {
                    sharedStoreManagerProvider.create(descriptor.storeId, descriptor.initialState);
                }
            });
        }]);
        for (var _i = 0, modules_1 = modules; _i < modules_1.length; _i++) {
            var additionalModuleName = modules_1[_i];
            beforeEach(angular.mock.module(additionalModuleName));
        }
        // A container in DOM where we can temporarily append component elements.
        var containerElement = null;
        function provideRealDOM() {
            var body = angular.element(document.body);
            containerElement = angular.element('<div id="test-container-element"></div>');
            body.remove('#test-container-element');
            body.append(containerElement);
        }
        beforeEach(function () {
            jasmine.addMatchers(matchers_1.ngEqualMatcher);
        });
        beforeEach(angular.mock.inject(function (_$compile_, _$rootScope_, _api_) {
            $compile = _$compile_;
            $scope = _$rootScope_.$new();
            mockApi = _api_;
        }));
        afterEach(function () {
            $scope.$destroy();
            if (containerElement)
                containerElement.empty();
        });
        tests({
            module: module,
            createComponent: function (template) {
                var component = getComponent($compile, $scope, template);
                if (containerElement) {
                    // Append component element to actual DOM. Otherwise, computations like height will not work.
                    containerElement.append(component.element);
                    $scope.$digest();
                }
                return component;
            },
            digest: function () {
                $scope.$digest();
            },
            api: function () {
                return mockApi;
            },
            scope: function () {
                return $scope;
            },
            provideRealDOM: provideRealDOM,
        });
    });
}
exports.describeComponent = describeComponent;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUFNLEVBQUU7Z0JBQ0osTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3JCLENBQUM7WUFFRCxHQUFHLEVBQUU7Z0JBQ0QsTUFBTSxDQUFDLE9BQU8sQ0FBQztZQUNuQixDQUFDO1lBRUQsS0FBSyxFQUFFO2dCQUNILE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDbEIsQ0FBQztZQUVELGNBQWMsRUFBRSxjQUFjO1NBQ2pDLENBQUMsQ0FBQztJQUNQLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQWxHRCw4Q0FrR0MiLCJmaWxlIjoidGVzdHMvY29tcG9uZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgYW5ndWxhciBmcm9tICdhbmd1bGFyJztcbmltcG9ydCAnYW5ndWxhci1tb2Nrcyc7XG5cbmltcG9ydCB7UmVzb2x3ZUFwaX0gZnJvbSAnLi4vYXBpL2luZGV4JztcbmltcG9ydCB7TW9ja0Jhc2UsIE1vY2tBcGl9IGZyb20gJy4uL2FwaS9tb2NrJztcbmltcG9ydCB7bmdFcXVhbE1hdGNoZXJ9IGZyb20gJy4vbWF0Y2hlcnMnO1xuaW1wb3J0IHtTaGFyZWRTdG9yZUZhY3RvcnksIFNoYXJlZFN0b3JlUHJvdmlkZXJ9IGZyb20gJy4uL2NvcmUvc2hhcmVkX3N0b3JlL2luZGV4JztcbmltcG9ydCB7R2VuRXJyb3J9IGZyb20gJy4uL2NvcmUvZXJyb3JzL2Vycm9yJztcbmltcG9ydCB7Y29tcG9zZX0gZnJvbSAnLi4vY29yZS91dGlscy9sYW5nJztcbmltcG9ydCB7TW9ja0FwaVNlcnZpY2V9IGZyb20gJy4vbW9jayc7XG5pbXBvcnQgJy4vbWF0Y2hlcnMnO1xuXG4vLyBTZXJ2aWNlIG1vZHVsZXMgdGhhdCBzaG91bGQgYmUgbG9hZGVkLlxuaW1wb3J0ICcuLi9jb3JlL3NoYXJlZF9zdG9yZS9pbmRleCc7XG5pbXBvcnQgJy4uL2NvcmUvY29tcG9uZW50cy9tYW5hZ2VyJztcblxuZXhwb3J0IGludGVyZmFjZSBDb21wb25lbnREZXNjcmlwdG9yPFQ+IHtcbiAgICBlbGVtZW50OiBhbmd1bGFyLklBdWdtZW50ZWRKUXVlcnk7XG4gICAgY3RybDogVDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTaGFyZWRTdG9yZURlc2NyaXB0b3Ige1xuICAgIHN0b3JlSWQ6IHN0cmluZztcbiAgICBpbml0aWFsU3RhdGU/OiBhbnk7XG4gICAgZmFjdG9yeT86IFNoYXJlZFN0b3JlRmFjdG9yeTxhbnksIGFueT47XG59XG5cbi8qKlxuICogSGVscGVyIGZvciBjcmVhdGluZyBzaW1wbGUgc2hhcmVkIHN0b3JlcyBpbiB0ZXN0cy4gQWxzbyBzZWVcbiAqIFtbU2hhcmVkU3RvcmVQcm92aWRlci5jcmVhdGVdXS5cbiAqXG4gKiBAcGFyYW0gc3RvcmVJZCBJZGVudGlmaWVyIG9mIHRoZSBzaGFyZWQgc3RvcmUgKG11c3QgYmUgZ2xvYmFsbHkgdW5pcXVlKVxuICogQHBhcmFtIGluaXRpYWxTdGF0ZSBPcHRpb25hbCBpbml0aWFsIHN0YXRlIG9mIHRoZSBzaGFyZWQgc3RvcmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNoYXJlZFN0b3JlKHN0b3JlSWQ6IHN0cmluZywgaW5pdGlhbFN0YXRlOiBhbnkgPSBudWxsKTogU2hhcmVkU3RvcmVEZXNjcmlwdG9yIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBzdG9yZUlkLFxuICAgICAgICBpbml0aWFsU3RhdGUsXG4gICAgfTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgZm9yIHVzaW5nIHNoYXJlZCBzdG9yZXMgaW4gdGVzdHMuXG4gKlxuICogQHBhcmFtIHN0b3JlSWQgSWRlbnRpZmllciBvZiB0aGUgc2hhcmVkIHN0b3JlIChtdXN0IGJlIGdsb2JhbGx5IHVuaXF1ZSlcbiAqIEBwYXJhbSBmYWN0b3J5IFNoYXJlZCBzdG9yZSBjbGFzc1xuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlU2hhcmVkU3RvcmUoc3RvcmVJZDogc3RyaW5nLCBmYWN0b3J5OiBTaGFyZWRTdG9yZUZhY3Rvcnk8YW55LCBhbnk+KTogU2hhcmVkU3RvcmVEZXNjcmlwdG9yIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBzdG9yZUlkLFxuICAgICAgICBmYWN0b3J5LFxuICAgIH07XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHdoZW4gdW5pdCB0ZXN0aW5nIGNvbXBvbmVudHMgd2hpY2ggY29tcGlsZXMgYSBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtICRjb21waWxlIENvbXBpbGUgc2VydmljZVxuICogQHBhcmFtICRzY29wZSBTY29wZSBzZXJ2aWNlXG4gKiBAcGFyYW0gdGVtcGxhdGUgdGVtcGxhdGUgaW4gdGhlIGZvcm0gb2YgYSBkaXJlY3RpdmUsIGUuZy4gYCc8Z2VuLXNvbWUtY29tcG9uZW50PjxnZW4tc29tZS1jb21wb25lbnQ+J2BcbiAqIEByZXR1cm5zIHtDb21wb25lbnREZXNjcmlwdG9yfSBFbGVtZW50IGFuZCBpdHMgY29udHJvbGxlclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tcG9uZW50PFQ+KCRjb21waWxlOiBhbmd1bGFyLklDb21waWxlU2VydmljZSwgJHNjb3BlOiBhbmd1bGFyLklTY29wZSwgdGVtcGxhdGU6IHN0cmluZyk6IENvbXBvbmVudERlc2NyaXB0b3I8VD4ge1xuXG4gICAgLy8gVE9ETzogaW5zdGVhZCBvZiBoYXZpbmcgZ2V0Q29tcG9uZW50PFQ+LCB3ZSBjb3VsZCBoYXZlIGdldENvbXBvbmVudDxUIGV4dGVuZHMgQ29tcG9uZW50QmFzZT4gYW5kIHRoZW4geW91IHdvdWxkIGRvXG4gICAgLy8gVC5hc1ZpZXcgdGh1cyByZWR1Y2luZyB0aGUgbmVlZCBmb3IgdGVtcGxhdGUgYXJndW1lbnQsIGJ1dCBsb29rcyBsaWtlIHR5cGVzY3JpcHQgZG9lcyBub3Qgc3VwcG9ydCB0aGF0ICh5ZXQpXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy81Njc3XG5cbiAgICBjb25zdCBlbGVtZW50ID0gJGNvbXBpbGUodGVtcGxhdGUpKCRzY29wZSk7XG4gICAgJHNjb3BlLiRkaWdlc3QoKTtcblxuICAgIGxldCBjdHJsOiBUO1xuICAgIHRyeSB7XG4gICAgICAgIGN0cmwgPSAkc2NvcGVbJyQkY2hpbGRUYWlsJ10uY3RybDtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihcIlVuYWJsZSB0byBmZXRjaCBjb21wb25lbnQgY29udHJvbGxlci4gRGlkIHlvdSBsb2FkIHlvdXIgbW9kdWxlIGluIHRlc3RzP1wiKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBlbGVtZW50OiBlbGVtZW50LFxuICAgICAgICBjdHJsOiBjdHJsLFxuICAgIH07XG59XG5cbi8qKlxuICogSW50ZXJmYWNlIGV4cG9zZWQgdG8gdGVzdCBjYXNlIGZ1bmN0aW9ucywgd2hpY2ggYXJlIGNyZWF0ZWQgdXNpbmcgW1tkZXNjcmliZUNvbXBvbmVudF1dLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbXBvbmVudFRlc3RlciB7XG4gICAgLy8vIEFuZ3VsYXIgbW9kdWxlLCB3aGljaCBtYXkgYmUgdXNlZCB0byByZWdpc3RlciB0ZXN0IGNvbXBvbmVudHMgaW4uXG4gICAgbW9kdWxlOiBhbmd1bGFyLklNb2R1bGU7XG5cbiAgICAvKipcbiAgICAgKiBTZWUgW1tnZXRDb21wb25lbnRdXS5cbiAgICAgKi9cbiAgICBjcmVhdGVDb21wb25lbnQ8VD4odGVtcGxhdGU6IHN0cmluZyk6IENvbXBvbmVudERlc2NyaXB0b3I8VD47XG5cbiAgICAvKipcbiAgICAgKiBSdW5zIGFuIEFuZ3VsYXIgZGlnZXN0IGN5Y2xlLlxuICAgICAqL1xuICAgIGRpZ2VzdCgpOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgbW9jayB2ZXJzaW9uIG9mIHRoZSBBUEksIHdoaWNoIG1heSBiZSB1c2VkIHRvIHNpbXVsYXRlIHRoZSBiYWNrZW5kXG4gICAgICogd2hlbiB0ZXN0aW5nIGNvbXBvbmVudHMuIFRoZSBtb2NrIEFQSSBpcyBhdXRvbWF0aWNhbGx5IGluamVjdGVkIGludG8gY29tcG9uZW50c1xuICAgICAqIGFuZCByZXBsYWNlcyB0aGUgdXN1YWwgQVBJLlxuICAgICAqL1xuICAgIGFwaSgpOiBSZXNvbHdlQXBpICYgTW9ja0Jhc2UgJiBNb2NrQXBpU2VydmljZTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHNjb3BlLlxuICAgICAqL1xuICAgIHNjb3BlKCk6IGFuZ3VsYXIuSVNjb3BlO1xuXG4gICAgLyoqXG4gICAgICogRW5zdXJlcyB0aGF0IHRoZSB0ZXN0ZWQgY29tcG9uZW50cyBhcmUgaW5zZXJ0ZWQgaW50byBhbiBhY3R1YWwgRE9NLCBzbyB0aGluZ3NcbiAgICAgKiBsaWtlIGhlaWdodCBjYWxjdWxhdGlvbnMgd29yayBhcyBleHBlY3RlZC4gVGhpcyBmdW5jdGlvbiBtdXN0IGJlIGNhbGxlZCBiZWZvcmVcbiAgICAgKiBhbnkgW1tjcmVhdGVDb21wb25lbnRdXSBjYWxscy5cbiAgICAgKi9cbiAgICBwcm92aWRlUmVhbERPTSgpOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1vY2tBcGlGYWN0b3J5IHtcbiAgICBuZXcgKC4uLmFyZ3M6IGFueVtdKTogUmVzb2x3ZUFwaSAmIE1vY2tCYXNlO1xufVxuXG4vKipcbiAqIEEgaGVscGVyIGZ1bmN0aW9uIHRvIGVhc2UgdGVzdGluZyBvZiBjb21wb25lbnRzLiBJdCB3aWxsIHRha2UgY2FyZSBvZiBtb2NraW5nIHRoZVxuICogdXN1YWwgbW9kdWxlcyBuZWVkZWQgZm9yIHRlc3RpbmcgY29tcG9uZW50cyBhbmQgcHJlcGFyaW5nIGEgbW9kdWxlIHRoYXQgeW91IGNhbiB1c2VcbiAqIHRvIHJlZ2lzdGVyIHRlc3QgY29tcG9uZW50cy5cbiAqXG4gKiBUaGUgdGVzdCBjYXNlIGlzIHBhc3NlZCBhbiBpbnN0YW5jZSBvZiBbW0NvbXBvbmVudFRlc3Rlcl1dLCB3aGljaCBjb250YWlucyBzb21lXG4gKiB1c2VmdWwgcHJvcGVydGllcyBhbmQgbWV0aG9kcyBmb3IgdGVzdGluZyBjb21wb25lbnRzLlxuICpcbiAqIFRoZSBmb2xsb3dpbmcgbW9kdWxlcyBhcmUgYXV0b21hdGljYWxseSBsb2FkZWQ6XG4gKiAqIGByZXNvbHdlLnNlcnZpY2VzLnNoYXJlZF9zdG9yZWBcbiAqXG4gKiBJZiB5b3UgbmVlZCB0byBsb2FkIGFueSBhZGRpdGlvbmFsIG1vZHVsZXMsIHNwZWNpZnkgdGhlbSBpbiB0aGUgYG1vZHVsZXNgXG4gKiBhcmd1bWVudC5cbiAqXG4gKiBAcGFyYW0gZGVzY3JpcHRpb24gVGVzdCBjYXNlIGRlc2NyaXB0aW9uXG4gKiBAcGFyYW0gbW9kdWxlcyBMaXN0IG9mIG1vZHVsZXMgdG8gbG9hZCBmb3IgdGhpcyB0ZXN0XG4gKiBAcGFyYW0gdGVzdHMgVGVzdCBjYXNlIGJvZHlcbiAqIEBwYXJhbSBhcGlDbGFzcyBPcHRpb25hbCBtb2NrIEFQSSBjbGFzcyB0aGF0IHNob3VsZCBiZSB1c2VkXG4gKiBAcGFyYW0gYmFzZU1vZHVsZXMgT3B0aW9uYWwgbGlzdCBvZiBtb2R1bGVzIHRvIGxvYWQgYmVmb3JlIGV2ZXJ5dGhpbmcgZm9yIHRoaXMgdGVzdFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzY3JpYmVDb21wb25lbnQoZGVzY3JpcHRpb246IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2R1bGVzOiBhbnlbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXN0czogKHRlc3RlcjogQ29tcG9uZW50VGVzdGVyKSA9PiB2b2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwaUNsYXNzOiBNb2NrQXBpRmFjdG9yeSA9IE1vY2tBcGksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFzZU1vZHVsZXM6IHN0cmluZ1tdID0gW10pOiB2b2lkIHtcbiAgICBkZXNjcmliZShkZXNjcmlwdGlvbiwgKCkgPT4ge1xuICAgICAgICBsZXQgJGNvbXBpbGU6IGFuZ3VsYXIuSUNvbXBpbGVTZXJ2aWNlO1xuICAgICAgICBsZXQgJHNjb3BlOiBhbmd1bGFyLklTY29wZTtcbiAgICAgICAgbGV0IG1vY2tBcGk6IFJlc29sd2VBcGkgJiBNb2NrQmFzZSAmIE1vY2tBcGlTZXJ2aWNlO1xuXG4gICAgICAgIGNvbnN0IG1vZHVsZU5hbWUgPSAncmVzb2x3ZS50ZXN0cy4nICsgZGVzY3JpcHRpb24ucmVwbGFjZSgvIC9nLCAnLicpO1xuICAgICAgICBjb25zdCBtb2R1bGU6IGFuZ3VsYXIuSU1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKG1vZHVsZU5hbWUsIFtdKTtcblxuICAgICAgICAvLyBMb2FkIGJhc2UgbW9kdWxlcy5cbiAgICAgICAgYmVmb3JlRWFjaChhbmd1bGFyLm1vY2subW9kdWxlKCdyZXNvbHdlLnNlcnZpY2VzLnNoYXJlZF9zdG9yZScpKTtcbiAgICAgICAgYmVmb3JlRWFjaChhbmd1bGFyLm1vY2subW9kdWxlKCdyZXNvbHdlLnNlcnZpY2VzLnN0YXRlX21hbmFnZXInKSk7XG4gICAgICAgIGJhc2VNb2R1bGVzLmZvckVhY2goKGJhc2VNb2R1bGUpID0+IGJlZm9yZUVhY2goYW5ndWxhci5tb2NrLm1vZHVsZShiYXNlTW9kdWxlKSkpO1xuXG4gICAgICAgIGJlZm9yZUVhY2goYW5ndWxhci5tb2NrLm1vZHVsZSgoJHByb3ZpZGU6IGFuZ3VsYXIuYXV0by5JUHJvdmlkZVNlcnZpY2UpID0+IHtcbiAgICAgICAgICAgIC8vIFJlcGxhY2UgdXN1YWwgQVBJIHNlcnZpY2Ugd2l0aCBtb2NrIEFQSS5cbiAgICAgICAgICAgICRwcm92aWRlLnNlcnZpY2UoJ2FwaScsIGNvbXBvc2UoW2FwaUNsYXNzLCBNb2NrQXBpU2VydmljZV0pKTtcbiAgICAgICAgfSkpO1xuICAgICAgICBiZWZvcmVFYWNoKGFuZ3VsYXIubW9jay5tb2R1bGUobW9kdWxlTmFtZSkpO1xuXG4gICAgICAgIC8vIFJlZ2lzdGVyIGFueSBzaGFyZWQgc3RvcmVzLlxuICAgICAgICBsZXQgc2hhcmVkU3RvcmVzID0gXy5maWx0ZXIobW9kdWxlcywgKG0pID0+IG0uc3RvcmVJZCk7XG4gICAgICAgIG1vZHVsZXMgPSBfLmZpbHRlcihtb2R1bGVzLCAobSkgPT4gIW0uc3RvcmVJZCk7XG5cbiAgICAgICAgbW9kdWxlLmNvbmZpZygoc2hhcmVkU3RvcmVNYW5hZ2VyUHJvdmlkZXI6IFNoYXJlZFN0b3JlUHJvdmlkZXIpID0+IHtcbiAgICAgICAgICAgIHNoYXJlZFN0b3Jlcy5mb3JFYWNoKChkZXNjcmlwdG9yOiBTaGFyZWRTdG9yZURlc2NyaXB0b3IpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZGVzY3JpcHRvci5mYWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIHNoYXJlZFN0b3JlTWFuYWdlclByb3ZpZGVyLnJlZ2lzdGVyKGRlc2NyaXB0b3Iuc3RvcmVJZCwgZGVzY3JpcHRvci5mYWN0b3J5KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzaGFyZWRTdG9yZU1hbmFnZXJQcm92aWRlci5jcmVhdGUoZGVzY3JpcHRvci5zdG9yZUlkLCBkZXNjcmlwdG9yLmluaXRpYWxTdGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZvciAoY29uc3QgYWRkaXRpb25hbE1vZHVsZU5hbWUgb2YgbW9kdWxlcykge1xuICAgICAgICAgICAgYmVmb3JlRWFjaChhbmd1bGFyLm1vY2subW9kdWxlKGFkZGl0aW9uYWxNb2R1bGVOYW1lKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBIGNvbnRhaW5lciBpbiBET00gd2hlcmUgd2UgY2FuIHRlbXBvcmFyaWx5IGFwcGVuZCBjb21wb25lbnQgZWxlbWVudHMuXG4gICAgICAgIGxldCBjb250YWluZXJFbGVtZW50ID0gbnVsbDtcblxuICAgICAgICBmdW5jdGlvbiBwcm92aWRlUmVhbERPTSgpOiB2b2lkIHtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQuYm9keSk7XG4gICAgICAgICAgICBjb250YWluZXJFbGVtZW50ID0gYW5ndWxhci5lbGVtZW50KCc8ZGl2IGlkPVwidGVzdC1jb250YWluZXItZWxlbWVudFwiPjwvZGl2PicpO1xuICAgICAgICAgICAgYm9keS5yZW1vdmUoJyN0ZXN0LWNvbnRhaW5lci1lbGVtZW50Jyk7XG4gICAgICAgICAgICBib2R5LmFwcGVuZChjb250YWluZXJFbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgICAgICAgamFzbWluZS5hZGRNYXRjaGVycyhuZ0VxdWFsTWF0Y2hlcik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGJlZm9yZUVhY2goYW5ndWxhci5tb2NrLmluamVjdCgoXyRjb21waWxlXywgXyRyb290U2NvcGVfLCBfYXBpXykgPT4ge1xuICAgICAgICAgICAgJGNvbXBpbGUgPSBfJGNvbXBpbGVfO1xuICAgICAgICAgICAgJHNjb3BlID0gXyRyb290U2NvcGVfLiRuZXcoKTtcbiAgICAgICAgICAgIG1vY2tBcGkgPSBfYXBpXztcblxuICAgICAgICAgICAgLy8gQGlmbmRlZiBHRU5KU19QUk9EVUNUSU9OXG4gICAgICAgICAgICAgICAgaWYgKF8uY29udGFpbnModGVzdHMudG9TdHJpbmcoKSwgJ2RlYnVnZ2VyJykgfHwgXy5jb250YWlucyh0ZXN0cy50b1N0cmluZygpLCAnIGZpdCgnKSkge1xuICAgICAgICAgICAgICAgICAgICBwcm92aWRlUmVhbERPTSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEBlbmRpZlxuICAgICAgICB9KSk7XG5cbiAgICAgICAgYWZ0ZXJFYWNoKCgpID0+IHtcbiAgICAgICAgICAgICRzY29wZS4kZGVzdHJveSgpO1xuICAgICAgICAgICAgaWYgKGNvbnRhaW5lckVsZW1lbnQpIGNvbnRhaW5lckVsZW1lbnQuZW1wdHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGVzdHMoe1xuICAgICAgICAgICAgbW9kdWxlOiBtb2R1bGUsXG5cbiAgICAgICAgICAgIGNyZWF0ZUNvbXBvbmVudDogZnVuY3Rpb248VD4odGVtcGxhdGU6IHN0cmluZyk6IENvbXBvbmVudERlc2NyaXB0b3I8VD4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IGdldENvbXBvbmVudDxUPigkY29tcGlsZSwgJHNjb3BlLCB0ZW1wbGF0ZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoY29udGFpbmVyRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBBcHBlbmQgY29tcG9uZW50IGVsZW1lbnQgdG8gYWN0dWFsIERPTS4gT3RoZXJ3aXNlLCBjb21wdXRhdGlvbnMgbGlrZSBoZWlnaHQgd2lsbCBub3Qgd29yay5cbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudC5hcHBlbmQoY29tcG9uZW50LmVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGRpZ2VzdCgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBjb21wb25lbnQ7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBkaWdlc3Q6IGZ1bmN0aW9uKCk6IHZvaWQge1xuICAgICAgICAgICAgICAgICRzY29wZS4kZGlnZXN0KCk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBhcGk6IGZ1bmN0aW9uKCk6IFJlc29sd2VBcGkgJiBNb2NrQmFzZSAmIE1vY2tBcGlTZXJ2aWNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbW9ja0FwaTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHNjb3BlOiBmdW5jdGlvbigpOiBhbmd1bGFyLklTY29wZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRzY29wZTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHByb3ZpZGVSZWFsRE9NOiBwcm92aWRlUmVhbERPTSxcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG4iXX0=
