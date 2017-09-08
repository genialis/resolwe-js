"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
            // Explicitly set root element because tests do not go through usual
            // Angular bootstrapping.
            $provide.value('$rootElement', angular.element(document.body));
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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Q0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQzNDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDckIsQ0FBQztnQkFFRCxNQUFNLENBQUMsU0FBUyxDQUFDO1lBQ3JCLENBQUM7WUFFRCxNQUFNLEVBQUU7Z0JBQ0osTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3JCLENBQUM7WUFFRCxHQUFHLEVBQUU7Z0JBQ0QsTUFBTSxDQUFDLE9BQU8sQ0FBQztZQUNuQixDQUFDO1lBRUQsS0FBSyxFQUFFO2dCQUNILE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDbEIsQ0FBQztZQUVELGNBQWMsRUFBRSxjQUFjO1NBQ2pDLENBQUMsQ0FBQztJQUNQLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQXRHRCw4Q0FzR0MiLCJmaWxlIjoidGVzdHMvY29tcG9uZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgYW5ndWxhciBmcm9tICdhbmd1bGFyJztcbmltcG9ydCAnYW5ndWxhci1tb2Nrcyc7XG5cbmltcG9ydCB7UmVzb2x3ZUFwaX0gZnJvbSAnLi4vYXBpL2luZGV4JztcbmltcG9ydCB7TW9ja0Jhc2UsIE1vY2tBcGl9IGZyb20gJy4uL2FwaS9tb2NrJztcbmltcG9ydCB7bmdFcXVhbE1hdGNoZXJ9IGZyb20gJy4vbWF0Y2hlcnMnO1xuaW1wb3J0IHtTaGFyZWRTdG9yZUZhY3RvcnksIFNoYXJlZFN0b3JlUHJvdmlkZXJ9IGZyb20gJy4uL2NvcmUvc2hhcmVkX3N0b3JlL2luZGV4JztcbmltcG9ydCB7R2VuRXJyb3J9IGZyb20gJy4uL2NvcmUvZXJyb3JzL2Vycm9yJztcbmltcG9ydCB7Y29tcG9zZX0gZnJvbSAnLi4vY29yZS91dGlscy9sYW5nJztcbmltcG9ydCB7TW9ja0FwaVNlcnZpY2V9IGZyb20gJy4vbW9jayc7XG5pbXBvcnQgJy4vbWF0Y2hlcnMnO1xuXG4vLyBTZXJ2aWNlIG1vZHVsZXMgdGhhdCBzaG91bGQgYmUgbG9hZGVkLlxuaW1wb3J0ICcuLi9jb3JlL3NoYXJlZF9zdG9yZS9pbmRleCc7XG5pbXBvcnQgJy4uL2NvcmUvY29tcG9uZW50cy9tYW5hZ2VyJztcblxuZXhwb3J0IGludGVyZmFjZSBDb21wb25lbnREZXNjcmlwdG9yPFQ+IHtcbiAgICBlbGVtZW50OiBhbmd1bGFyLklBdWdtZW50ZWRKUXVlcnk7XG4gICAgY3RybDogVDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTaGFyZWRTdG9yZURlc2NyaXB0b3Ige1xuICAgIHN0b3JlSWQ6IHN0cmluZztcbiAgICBpbml0aWFsU3RhdGU/OiBhbnk7XG4gICAgZmFjdG9yeT86IFNoYXJlZFN0b3JlRmFjdG9yeTxhbnksIGFueT47XG59XG5cbi8qKlxuICogSGVscGVyIGZvciBjcmVhdGluZyBzaW1wbGUgc2hhcmVkIHN0b3JlcyBpbiB0ZXN0cy4gQWxzbyBzZWVcbiAqIFtbU2hhcmVkU3RvcmVQcm92aWRlci5jcmVhdGVdXS5cbiAqXG4gKiBAcGFyYW0gc3RvcmVJZCBJZGVudGlmaWVyIG9mIHRoZSBzaGFyZWQgc3RvcmUgKG11c3QgYmUgZ2xvYmFsbHkgdW5pcXVlKVxuICogQHBhcmFtIGluaXRpYWxTdGF0ZSBPcHRpb25hbCBpbml0aWFsIHN0YXRlIG9mIHRoZSBzaGFyZWQgc3RvcmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNoYXJlZFN0b3JlKHN0b3JlSWQ6IHN0cmluZywgaW5pdGlhbFN0YXRlOiBhbnkgPSBudWxsKTogU2hhcmVkU3RvcmVEZXNjcmlwdG9yIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBzdG9yZUlkLFxuICAgICAgICBpbml0aWFsU3RhdGUsXG4gICAgfTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgZm9yIHVzaW5nIHNoYXJlZCBzdG9yZXMgaW4gdGVzdHMuXG4gKlxuICogQHBhcmFtIHN0b3JlSWQgSWRlbnRpZmllciBvZiB0aGUgc2hhcmVkIHN0b3JlIChtdXN0IGJlIGdsb2JhbGx5IHVuaXF1ZSlcbiAqIEBwYXJhbSBmYWN0b3J5IFNoYXJlZCBzdG9yZSBjbGFzc1xuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlU2hhcmVkU3RvcmUoc3RvcmVJZDogc3RyaW5nLCBmYWN0b3J5OiBTaGFyZWRTdG9yZUZhY3Rvcnk8YW55LCBhbnk+KTogU2hhcmVkU3RvcmVEZXNjcmlwdG9yIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBzdG9yZUlkLFxuICAgICAgICBmYWN0b3J5LFxuICAgIH07XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHdoZW4gdW5pdCB0ZXN0aW5nIGNvbXBvbmVudHMgd2hpY2ggY29tcGlsZXMgYSBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtICRjb21waWxlIENvbXBpbGUgc2VydmljZVxuICogQHBhcmFtICRzY29wZSBTY29wZSBzZXJ2aWNlXG4gKiBAcGFyYW0gdGVtcGxhdGUgdGVtcGxhdGUgaW4gdGhlIGZvcm0gb2YgYSBkaXJlY3RpdmUsIGUuZy4gYCc8Z2VuLXNvbWUtY29tcG9uZW50PjxnZW4tc29tZS1jb21wb25lbnQ+J2BcbiAqIEByZXR1cm5zIHtDb21wb25lbnREZXNjcmlwdG9yfSBFbGVtZW50IGFuZCBpdHMgY29udHJvbGxlclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tcG9uZW50PFQ+KCRjb21waWxlOiBhbmd1bGFyLklDb21waWxlU2VydmljZSwgJHNjb3BlOiBhbmd1bGFyLklTY29wZSwgdGVtcGxhdGU6IHN0cmluZyk6IENvbXBvbmVudERlc2NyaXB0b3I8VD4ge1xuXG4gICAgLy8gVE9ETzogaW5zdGVhZCBvZiBoYXZpbmcgZ2V0Q29tcG9uZW50PFQ+LCB3ZSBjb3VsZCBoYXZlIGdldENvbXBvbmVudDxUIGV4dGVuZHMgQ29tcG9uZW50QmFzZT4gYW5kIHRoZW4geW91IHdvdWxkIGRvXG4gICAgLy8gVC5hc1ZpZXcgdGh1cyByZWR1Y2luZyB0aGUgbmVlZCBmb3IgdGVtcGxhdGUgYXJndW1lbnQsIGJ1dCBsb29rcyBsaWtlIHR5cGVzY3JpcHQgZG9lcyBub3Qgc3VwcG9ydCB0aGF0ICh5ZXQpXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy81Njc3XG5cbiAgICBjb25zdCBlbGVtZW50ID0gJGNvbXBpbGUodGVtcGxhdGUpKCRzY29wZSk7XG4gICAgJHNjb3BlLiRkaWdlc3QoKTtcblxuICAgIGxldCBjdHJsOiBUO1xuICAgIHRyeSB7XG4gICAgICAgIGN0cmwgPSAkc2NvcGVbJyQkY2hpbGRUYWlsJ10uY3RybDtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihcIlVuYWJsZSB0byBmZXRjaCBjb21wb25lbnQgY29udHJvbGxlci4gRGlkIHlvdSBsb2FkIHlvdXIgbW9kdWxlIGluIHRlc3RzP1wiKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBlbGVtZW50OiBlbGVtZW50LFxuICAgICAgICBjdHJsOiBjdHJsLFxuICAgIH07XG59XG5cbi8qKlxuICogSW50ZXJmYWNlIGV4cG9zZWQgdG8gdGVzdCBjYXNlIGZ1bmN0aW9ucywgd2hpY2ggYXJlIGNyZWF0ZWQgdXNpbmcgW1tkZXNjcmliZUNvbXBvbmVudF1dLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbXBvbmVudFRlc3RlciB7XG4gICAgLy8vIEFuZ3VsYXIgbW9kdWxlLCB3aGljaCBtYXkgYmUgdXNlZCB0byByZWdpc3RlciB0ZXN0IGNvbXBvbmVudHMgaW4uXG4gICAgbW9kdWxlOiBhbmd1bGFyLklNb2R1bGU7XG5cbiAgICAvKipcbiAgICAgKiBTZWUgW1tnZXRDb21wb25lbnRdXS5cbiAgICAgKi9cbiAgICBjcmVhdGVDb21wb25lbnQ8VD4odGVtcGxhdGU6IHN0cmluZyk6IENvbXBvbmVudERlc2NyaXB0b3I8VD47XG5cbiAgICAvKipcbiAgICAgKiBSdW5zIGFuIEFuZ3VsYXIgZGlnZXN0IGN5Y2xlLlxuICAgICAqL1xuICAgIGRpZ2VzdCgpOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgbW9jayB2ZXJzaW9uIG9mIHRoZSBBUEksIHdoaWNoIG1heSBiZSB1c2VkIHRvIHNpbXVsYXRlIHRoZSBiYWNrZW5kXG4gICAgICogd2hlbiB0ZXN0aW5nIGNvbXBvbmVudHMuIFRoZSBtb2NrIEFQSSBpcyBhdXRvbWF0aWNhbGx5IGluamVjdGVkIGludG8gY29tcG9uZW50c1xuICAgICAqIGFuZCByZXBsYWNlcyB0aGUgdXN1YWwgQVBJLlxuICAgICAqL1xuICAgIGFwaSgpOiBSZXNvbHdlQXBpICYgTW9ja0Jhc2UgJiBNb2NrQXBpU2VydmljZTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHNjb3BlLlxuICAgICAqL1xuICAgIHNjb3BlKCk6IGFuZ3VsYXIuSVNjb3BlO1xuXG4gICAgLyoqXG4gICAgICogRW5zdXJlcyB0aGF0IHRoZSB0ZXN0ZWQgY29tcG9uZW50cyBhcmUgaW5zZXJ0ZWQgaW50byBhbiBhY3R1YWwgRE9NLCBzbyB0aGluZ3NcbiAgICAgKiBsaWtlIGhlaWdodCBjYWxjdWxhdGlvbnMgd29yayBhcyBleHBlY3RlZC4gVGhpcyBmdW5jdGlvbiBtdXN0IGJlIGNhbGxlZCBiZWZvcmVcbiAgICAgKiBhbnkgW1tjcmVhdGVDb21wb25lbnRdXSBjYWxscy5cbiAgICAgKi9cbiAgICBwcm92aWRlUmVhbERPTSgpOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1vY2tBcGlGYWN0b3J5IHtcbiAgICBuZXcgKC4uLmFyZ3M6IGFueVtdKTogUmVzb2x3ZUFwaSAmIE1vY2tCYXNlO1xufVxuXG4vKipcbiAqIEEgaGVscGVyIGZ1bmN0aW9uIHRvIGVhc2UgdGVzdGluZyBvZiBjb21wb25lbnRzLiBJdCB3aWxsIHRha2UgY2FyZSBvZiBtb2NraW5nIHRoZVxuICogdXN1YWwgbW9kdWxlcyBuZWVkZWQgZm9yIHRlc3RpbmcgY29tcG9uZW50cyBhbmQgcHJlcGFyaW5nIGEgbW9kdWxlIHRoYXQgeW91IGNhbiB1c2VcbiAqIHRvIHJlZ2lzdGVyIHRlc3QgY29tcG9uZW50cy5cbiAqXG4gKiBUaGUgdGVzdCBjYXNlIGlzIHBhc3NlZCBhbiBpbnN0YW5jZSBvZiBbW0NvbXBvbmVudFRlc3Rlcl1dLCB3aGljaCBjb250YWlucyBzb21lXG4gKiB1c2VmdWwgcHJvcGVydGllcyBhbmQgbWV0aG9kcyBmb3IgdGVzdGluZyBjb21wb25lbnRzLlxuICpcbiAqIFRoZSBmb2xsb3dpbmcgbW9kdWxlcyBhcmUgYXV0b21hdGljYWxseSBsb2FkZWQ6XG4gKiAqIGByZXNvbHdlLnNlcnZpY2VzLnNoYXJlZF9zdG9yZWBcbiAqXG4gKiBJZiB5b3UgbmVlZCB0byBsb2FkIGFueSBhZGRpdGlvbmFsIG1vZHVsZXMsIHNwZWNpZnkgdGhlbSBpbiB0aGUgYG1vZHVsZXNgXG4gKiBhcmd1bWVudC5cbiAqXG4gKiBAcGFyYW0gZGVzY3JpcHRpb24gVGVzdCBjYXNlIGRlc2NyaXB0aW9uXG4gKiBAcGFyYW0gbW9kdWxlcyBMaXN0IG9mIG1vZHVsZXMgdG8gbG9hZCBmb3IgdGhpcyB0ZXN0XG4gKiBAcGFyYW0gdGVzdHMgVGVzdCBjYXNlIGJvZHlcbiAqIEBwYXJhbSBhcGlDbGFzcyBPcHRpb25hbCBtb2NrIEFQSSBjbGFzcyB0aGF0IHNob3VsZCBiZSB1c2VkXG4gKiBAcGFyYW0gYmFzZU1vZHVsZXMgT3B0aW9uYWwgbGlzdCBvZiBtb2R1bGVzIHRvIGxvYWQgYmVmb3JlIGV2ZXJ5dGhpbmcgZm9yIHRoaXMgdGVzdFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzY3JpYmVDb21wb25lbnQoZGVzY3JpcHRpb246IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2R1bGVzOiBhbnlbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXN0czogKHRlc3RlcjogQ29tcG9uZW50VGVzdGVyKSA9PiB2b2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwaUNsYXNzOiBNb2NrQXBpRmFjdG9yeSA9IE1vY2tBcGksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFzZU1vZHVsZXM6IHN0cmluZ1tdID0gW10pOiB2b2lkIHtcbiAgICBkZXNjcmliZShkZXNjcmlwdGlvbiwgKCkgPT4ge1xuICAgICAgICBsZXQgJGNvbXBpbGU6IGFuZ3VsYXIuSUNvbXBpbGVTZXJ2aWNlO1xuICAgICAgICBsZXQgJHNjb3BlOiBhbmd1bGFyLklTY29wZTtcbiAgICAgICAgbGV0IG1vY2tBcGk6IFJlc29sd2VBcGkgJiBNb2NrQmFzZSAmIE1vY2tBcGlTZXJ2aWNlO1xuXG4gICAgICAgIGNvbnN0IG1vZHVsZU5hbWUgPSAncmVzb2x3ZS50ZXN0cy4nICsgZGVzY3JpcHRpb24ucmVwbGFjZSgvIC9nLCAnLicpO1xuICAgICAgICBjb25zdCBtb2R1bGU6IGFuZ3VsYXIuSU1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKG1vZHVsZU5hbWUsIFtdKTtcblxuICAgICAgICAvLyBMb2FkIGJhc2UgbW9kdWxlcy5cbiAgICAgICAgYmVmb3JlRWFjaChhbmd1bGFyLm1vY2subW9kdWxlKCdyZXNvbHdlLnNlcnZpY2VzLnNoYXJlZF9zdG9yZScpKTtcbiAgICAgICAgYmVmb3JlRWFjaChhbmd1bGFyLm1vY2subW9kdWxlKCdyZXNvbHdlLnNlcnZpY2VzLnN0YXRlX21hbmFnZXInKSk7XG4gICAgICAgIGJhc2VNb2R1bGVzLmZvckVhY2goKGJhc2VNb2R1bGUpID0+IGJlZm9yZUVhY2goYW5ndWxhci5tb2NrLm1vZHVsZShiYXNlTW9kdWxlKSkpO1xuXG4gICAgICAgIGJlZm9yZUVhY2goYW5ndWxhci5tb2NrLm1vZHVsZSgoJHByb3ZpZGU6IGFuZ3VsYXIuYXV0by5JUHJvdmlkZVNlcnZpY2UpID0+IHtcbiAgICAgICAgICAgIC8vIEV4cGxpY2l0bHkgc2V0IHJvb3QgZWxlbWVudCBiZWNhdXNlIHRlc3RzIGRvIG5vdCBnbyB0aHJvdWdoIHVzdWFsXG4gICAgICAgICAgICAvLyBBbmd1bGFyIGJvb3RzdHJhcHBpbmcuXG4gICAgICAgICAgICAkcHJvdmlkZS52YWx1ZSgnJHJvb3RFbGVtZW50JywgYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LmJvZHkpKTtcblxuICAgICAgICAgICAgLy8gUmVwbGFjZSB1c3VhbCBBUEkgc2VydmljZSB3aXRoIG1vY2sgQVBJLlxuICAgICAgICAgICAgJHByb3ZpZGUuc2VydmljZSgnYXBpJywgY29tcG9zZShbYXBpQ2xhc3MsIE1vY2tBcGlTZXJ2aWNlXSkpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGJlZm9yZUVhY2goYW5ndWxhci5tb2NrLm1vZHVsZShtb2R1bGVOYW1lKSk7XG5cbiAgICAgICAgLy8gUmVnaXN0ZXIgYW55IHNoYXJlZCBzdG9yZXMuXG4gICAgICAgIGxldCBzaGFyZWRTdG9yZXMgPSBfLmZpbHRlcihtb2R1bGVzLCAobSkgPT4gbS5zdG9yZUlkKTtcbiAgICAgICAgbW9kdWxlcyA9IF8uZmlsdGVyKG1vZHVsZXMsIChtKSA9PiAhbS5zdG9yZUlkKTtcblxuICAgICAgICBtb2R1bGUuY29uZmlnKChzaGFyZWRTdG9yZU1hbmFnZXJQcm92aWRlcjogU2hhcmVkU3RvcmVQcm92aWRlcikgPT4ge1xuICAgICAgICAgICAgc2hhcmVkU3RvcmVzLmZvckVhY2goKGRlc2NyaXB0b3I6IFNoYXJlZFN0b3JlRGVzY3JpcHRvcikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChkZXNjcmlwdG9yLmZhY3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2hhcmVkU3RvcmVNYW5hZ2VyUHJvdmlkZXIucmVnaXN0ZXIoZGVzY3JpcHRvci5zdG9yZUlkLCBkZXNjcmlwdG9yLmZhY3RvcnkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNoYXJlZFN0b3JlTWFuYWdlclByb3ZpZGVyLmNyZWF0ZShkZXNjcmlwdG9yLnN0b3JlSWQsIGRlc2NyaXB0b3IuaW5pdGlhbFN0YXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZm9yIChjb25zdCBhZGRpdGlvbmFsTW9kdWxlTmFtZSBvZiBtb2R1bGVzKSB7XG4gICAgICAgICAgICBiZWZvcmVFYWNoKGFuZ3VsYXIubW9jay5tb2R1bGUoYWRkaXRpb25hbE1vZHVsZU5hbWUpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEEgY29udGFpbmVyIGluIERPTSB3aGVyZSB3ZSBjYW4gdGVtcG9yYXJpbHkgYXBwZW5kIGNvbXBvbmVudCBlbGVtZW50cy5cbiAgICAgICAgbGV0IGNvbnRhaW5lckVsZW1lbnQgPSBudWxsO1xuXG4gICAgICAgIGZ1bmN0aW9uIHByb3ZpZGVSZWFsRE9NKCk6IHZvaWQge1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5ib2R5KTtcbiAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQgPSBhbmd1bGFyLmVsZW1lbnQoJzxkaXYgaWQ9XCJ0ZXN0LWNvbnRhaW5lci1lbGVtZW50XCI+PC9kaXY+Jyk7XG4gICAgICAgICAgICBib2R5LnJlbW92ZSgnI3Rlc3QtY29udGFpbmVyLWVsZW1lbnQnKTtcbiAgICAgICAgICAgIGJvZHkuYXBwZW5kKGNvbnRhaW5lckVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICAgICAgICBqYXNtaW5lLmFkZE1hdGNoZXJzKG5nRXF1YWxNYXRjaGVyKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgYmVmb3JlRWFjaChhbmd1bGFyLm1vY2suaW5qZWN0KChfJGNvbXBpbGVfLCBfJHJvb3RTY29wZV8sIF9hcGlfKSA9PiB7XG4gICAgICAgICAgICAkY29tcGlsZSA9IF8kY29tcGlsZV87XG4gICAgICAgICAgICAkc2NvcGUgPSBfJHJvb3RTY29wZV8uJG5ldygpO1xuICAgICAgICAgICAgbW9ja0FwaSA9IF9hcGlfO1xuXG4gICAgICAgICAgICAvLyBAaWZuZGVmIEdFTkpTX1BST0RVQ1RJT05cbiAgICAgICAgICAgICAgICBpZiAoXy5jb250YWlucyh0ZXN0cy50b1N0cmluZygpLCAnZGVidWdnZXInKSB8fCBfLmNvbnRhaW5zKHRlc3RzLnRvU3RyaW5nKCksICcgZml0KCcpKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb3ZpZGVSZWFsRE9NKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQGVuZGlmXG4gICAgICAgIH0pKTtcblxuICAgICAgICBhZnRlckVhY2goKCkgPT4ge1xuICAgICAgICAgICAgJHNjb3BlLiRkZXN0cm95KCk7XG4gICAgICAgICAgICBpZiAoY29udGFpbmVyRWxlbWVudCkgY29udGFpbmVyRWxlbWVudC5lbXB0eSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0ZXN0cyh7XG4gICAgICAgICAgICBtb2R1bGU6IG1vZHVsZSxcblxuICAgICAgICAgICAgY3JlYXRlQ29tcG9uZW50OiBmdW5jdGlvbjxUPih0ZW1wbGF0ZTogc3RyaW5nKTogQ29tcG9uZW50RGVzY3JpcHRvcjxUPiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gZ2V0Q29tcG9uZW50PFQ+KCRjb21waWxlLCAkc2NvcGUsIHRlbXBsYXRlKTtcblxuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXJFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFwcGVuZCBjb21wb25lbnQgZWxlbWVudCB0byBhY3R1YWwgRE9NLiBPdGhlcndpc2UsIGNvbXB1dGF0aW9ucyBsaWtlIGhlaWdodCB3aWxsIG5vdCB3b3JrLlxuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJFbGVtZW50LmFwcGVuZChjb21wb25lbnQuZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kZGlnZXN0KCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbXBvbmVudDtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGRpZ2VzdDogZnVuY3Rpb24oKTogdm9pZCB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRkaWdlc3QoKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGFwaTogZnVuY3Rpb24oKTogUmVzb2x3ZUFwaSAmIE1vY2tCYXNlICYgTW9ja0FwaVNlcnZpY2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBtb2NrQXBpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgc2NvcGU6IGZ1bmN0aW9uKCk6IGFuZ3VsYXIuSVNjb3BlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHNjb3BlO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgcHJvdmlkZVJlYWxET006IHByb3ZpZGVSZWFsRE9NLFxuICAgICAgICB9KTtcbiAgICB9KTtcbn1cbiJdfQ==
