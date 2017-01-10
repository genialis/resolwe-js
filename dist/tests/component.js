"use strict";
var _ = require("lodash");
var angular = require("angular");
require("angular-mocks");
var mock_1 = require("../api/mock");
var matchers_1 = require("./matchers");
var error_1 = require("../core/errors/error");
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
            $provide.service('api', apiClass);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUFFO2dCQUNELE1BQU0sQ0FBQyxPQUFPLENBQUM7WUFDbkIsQ0FBQztZQUVELEtBQUssRUFBRTtnQkFDSCxNQUFNLENBQUMsTUFBTSxDQUFDO1lBQ2xCLENBQUM7WUFFRCxjQUFjLEVBQUUsY0FBYztTQUNqQyxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUFsR0QsOENBa0dDIiwiZmlsZSI6InRlc3RzL2NvbXBvbmVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIGFuZ3VsYXIgZnJvbSAnYW5ndWxhcic7XG5pbXBvcnQgJ2FuZ3VsYXItbW9ja3MnO1xuXG5pbXBvcnQge1Jlc29sd2VBcGl9IGZyb20gJy4uL2FwaS9pbmRleCc7XG5pbXBvcnQge01vY2tCYXNlLCBNb2NrQXBpfSBmcm9tICcuLi9hcGkvbW9jayc7XG5pbXBvcnQge25nRXF1YWxNYXRjaGVyfSBmcm9tICcuL21hdGNoZXJzJztcbmltcG9ydCB7U2hhcmVkU3RvcmVGYWN0b3J5LCBTaGFyZWRTdG9yZVByb3ZpZGVyfSBmcm9tICcuLi9jb3JlL3NoYXJlZF9zdG9yZS9pbmRleCc7XG5pbXBvcnQge0dlbkVycm9yfSBmcm9tICcuLi9jb3JlL2Vycm9ycy9lcnJvcic7XG5pbXBvcnQgJy4vbWF0Y2hlcnMnO1xuXG4vLyBTZXJ2aWNlIG1vZHVsZXMgdGhhdCBzaG91bGQgYmUgbG9hZGVkLlxuaW1wb3J0ICcuLi9jb3JlL3NoYXJlZF9zdG9yZS9pbmRleCc7XG5pbXBvcnQgJy4uL2NvcmUvY29tcG9uZW50cy9tYW5hZ2VyJztcblxuZXhwb3J0IGludGVyZmFjZSBDb21wb25lbnREZXNjcmlwdG9yPFQ+IHtcbiAgICBlbGVtZW50OiBhbmd1bGFyLklBdWdtZW50ZWRKUXVlcnk7XG4gICAgY3RybDogVDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTaGFyZWRTdG9yZURlc2NyaXB0b3Ige1xuICAgIHN0b3JlSWQ6IHN0cmluZztcbiAgICBpbml0aWFsU3RhdGU/OiBhbnk7XG4gICAgZmFjdG9yeT86IFNoYXJlZFN0b3JlRmFjdG9yeTxhbnksIGFueT47XG59XG5cbi8qKlxuICogSGVscGVyIGZvciBjcmVhdGluZyBzaW1wbGUgc2hhcmVkIHN0b3JlcyBpbiB0ZXN0cy4gQWxzbyBzZWVcbiAqIFtbU2hhcmVkU3RvcmVQcm92aWRlci5jcmVhdGVdXS5cbiAqXG4gKiBAcGFyYW0gc3RvcmVJZCBJZGVudGlmaWVyIG9mIHRoZSBzaGFyZWQgc3RvcmUgKG11c3QgYmUgZ2xvYmFsbHkgdW5pcXVlKVxuICogQHBhcmFtIGluaXRpYWxTdGF0ZSBPcHRpb25hbCBpbml0aWFsIHN0YXRlIG9mIHRoZSBzaGFyZWQgc3RvcmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNoYXJlZFN0b3JlKHN0b3JlSWQ6IHN0cmluZywgaW5pdGlhbFN0YXRlOiBhbnkgPSBudWxsKTogU2hhcmVkU3RvcmVEZXNjcmlwdG9yIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBzdG9yZUlkLFxuICAgICAgICBpbml0aWFsU3RhdGUsXG4gICAgfTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgZm9yIHVzaW5nIHNoYXJlZCBzdG9yZXMgaW4gdGVzdHMuXG4gKlxuICogQHBhcmFtIHN0b3JlSWQgSWRlbnRpZmllciBvZiB0aGUgc2hhcmVkIHN0b3JlIChtdXN0IGJlIGdsb2JhbGx5IHVuaXF1ZSlcbiAqIEBwYXJhbSBmYWN0b3J5IFNoYXJlZCBzdG9yZSBjbGFzc1xuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlU2hhcmVkU3RvcmUoc3RvcmVJZDogc3RyaW5nLCBmYWN0b3J5OiBTaGFyZWRTdG9yZUZhY3Rvcnk8YW55LCBhbnk+KTogU2hhcmVkU3RvcmVEZXNjcmlwdG9yIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBzdG9yZUlkLFxuICAgICAgICBmYWN0b3J5LFxuICAgIH07XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHdoZW4gdW5pdCB0ZXN0aW5nIGNvbXBvbmVudHMgd2hpY2ggY29tcGlsZXMgYSBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtICRjb21waWxlIENvbXBpbGUgc2VydmljZVxuICogQHBhcmFtICRzY29wZSBTY29wZSBzZXJ2aWNlXG4gKiBAcGFyYW0gdGVtcGxhdGUgdGVtcGxhdGUgaW4gdGhlIGZvcm0gb2YgYSBkaXJlY3RpdmUsIGUuZy4gYCc8Z2VuLXNvbWUtY29tcG9uZW50PjxnZW4tc29tZS1jb21wb25lbnQ+J2BcbiAqIEByZXR1cm5zIHtDb21wb25lbnREZXNjcmlwdG9yfSBFbGVtZW50IGFuZCBpdHMgY29udHJvbGxlclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tcG9uZW50PFQ+KCRjb21waWxlOiBhbmd1bGFyLklDb21waWxlU2VydmljZSwgJHNjb3BlOiBhbmd1bGFyLklTY29wZSwgdGVtcGxhdGU6IHN0cmluZyk6IENvbXBvbmVudERlc2NyaXB0b3I8VD4ge1xuXG4gICAgLy8gVE9ETzogaW5zdGVhZCBvZiBoYXZpbmcgZ2V0Q29tcG9uZW50PFQ+LCB3ZSBjb3VsZCBoYXZlIGdldENvbXBvbmVudDxUIGV4dGVuZHMgQ29tcG9uZW50QmFzZT4gYW5kIHRoZW4geW91IHdvdWxkIGRvXG4gICAgLy8gVC5hc1ZpZXcgdGh1cyByZWR1Y2luZyB0aGUgbmVlZCBmb3IgdGVtcGxhdGUgYXJndW1lbnQsIGJ1dCBsb29rcyBsaWtlIHR5cGVzY3JpcHQgZG9lcyBub3Qgc3VwcG9ydCB0aGF0ICh5ZXQpXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy81Njc3XG5cbiAgICBjb25zdCBlbGVtZW50ID0gJGNvbXBpbGUodGVtcGxhdGUpKCRzY29wZSk7XG4gICAgJHNjb3BlLiRkaWdlc3QoKTtcblxuICAgIGxldCBjdHJsOiBUO1xuICAgIHRyeSB7XG4gICAgICAgIGN0cmwgPSAkc2NvcGVbJyQkY2hpbGRUYWlsJ10uY3RybDtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHRocm93IG5ldyBHZW5FcnJvcihcIlVuYWJsZSB0byBmZXRjaCBjb21wb25lbnQgY29udHJvbGxlci4gRGlkIHlvdSBsb2FkIHlvdXIgbW9kdWxlIGluIHRlc3RzP1wiKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBlbGVtZW50OiBlbGVtZW50LFxuICAgICAgICBjdHJsOiBjdHJsLFxuICAgIH07XG59XG5cbi8qKlxuICogSW50ZXJmYWNlIGV4cG9zZWQgdG8gdGVzdCBjYXNlIGZ1bmN0aW9ucywgd2hpY2ggYXJlIGNyZWF0ZWQgdXNpbmcgW1tkZXNjcmliZUNvbXBvbmVudF1dLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbXBvbmVudFRlc3RlciB7XG4gICAgLy8vIEFuZ3VsYXIgbW9kdWxlLCB3aGljaCBtYXkgYmUgdXNlZCB0byByZWdpc3RlciB0ZXN0IGNvbXBvbmVudHMgaW4uXG4gICAgbW9kdWxlOiBhbmd1bGFyLklNb2R1bGU7XG5cbiAgICAvKipcbiAgICAgKiBTZWUgW1tnZXRDb21wb25lbnRdXS5cbiAgICAgKi9cbiAgICBjcmVhdGVDb21wb25lbnQ8VD4odGVtcGxhdGU6IHN0cmluZyk6IENvbXBvbmVudERlc2NyaXB0b3I8VD47XG5cbiAgICAvKipcbiAgICAgKiBSdW5zIGFuIEFuZ3VsYXIgZGlnZXN0IGN5Y2xlLlxuICAgICAqL1xuICAgIGRpZ2VzdCgpOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgbW9jayB2ZXJzaW9uIG9mIHRoZSBBUEksIHdoaWNoIG1heSBiZSB1c2VkIHRvIHNpbXVsYXRlIHRoZSBiYWNrZW5kXG4gICAgICogd2hlbiB0ZXN0aW5nIGNvbXBvbmVudHMuIFRoZSBtb2NrIEFQSSBpcyBhdXRvbWF0aWNhbGx5IGluamVjdGVkIGludG8gY29tcG9uZW50c1xuICAgICAqIGFuZCByZXBsYWNlcyB0aGUgdXN1YWwgQVBJLlxuICAgICAqL1xuICAgIGFwaSgpOiBSZXNvbHdlQXBpICYgTW9ja0Jhc2U7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBzY29wZS5cbiAgICAgKi9cbiAgICBzY29wZSgpOiBhbmd1bGFyLklTY29wZTtcblxuICAgIC8qKlxuICAgICAqIEVuc3VyZXMgdGhhdCB0aGUgdGVzdGVkIGNvbXBvbmVudHMgYXJlIGluc2VydGVkIGludG8gYW4gYWN0dWFsIERPTSwgc28gdGhpbmdzXG4gICAgICogbGlrZSBoZWlnaHQgY2FsY3VsYXRpb25zIHdvcmsgYXMgZXhwZWN0ZWQuIFRoaXMgZnVuY3Rpb24gbXVzdCBiZSBjYWxsZWQgYmVmb3JlXG4gICAgICogYW55IFtbY3JlYXRlQ29tcG9uZW50XV0gY2FsbHMuXG4gICAgICovXG4gICAgcHJvdmlkZVJlYWxET00oKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNb2NrQXBpRmFjdG9yeSB7XG4gICAgbmV3ICguLi5hcmdzOiBhbnlbXSk6IFJlc29sd2VBcGkgJiBNb2NrQmFzZTtcbn1cblxuLyoqXG4gKiBBIGhlbHBlciBmdW5jdGlvbiB0byBlYXNlIHRlc3Rpbmcgb2YgY29tcG9uZW50cy4gSXQgd2lsbCB0YWtlIGNhcmUgb2YgbW9ja2luZyB0aGVcbiAqIHVzdWFsIG1vZHVsZXMgbmVlZGVkIGZvciB0ZXN0aW5nIGNvbXBvbmVudHMgYW5kIHByZXBhcmluZyBhIG1vZHVsZSB0aGF0IHlvdSBjYW4gdXNlXG4gKiB0byByZWdpc3RlciB0ZXN0IGNvbXBvbmVudHMuXG4gKlxuICogVGhlIHRlc3QgY2FzZSBpcyBwYXNzZWQgYW4gaW5zdGFuY2Ugb2YgW1tDb21wb25lbnRUZXN0ZXJdXSwgd2hpY2ggY29udGFpbnMgc29tZVxuICogdXNlZnVsIHByb3BlcnRpZXMgYW5kIG1ldGhvZHMgZm9yIHRlc3RpbmcgY29tcG9uZW50cy5cbiAqXG4gKiBUaGUgZm9sbG93aW5nIG1vZHVsZXMgYXJlIGF1dG9tYXRpY2FsbHkgbG9hZGVkOlxuICogKiBgcmVzb2x3ZS5zZXJ2aWNlcy5zaGFyZWRfc3RvcmVgXG4gKlxuICogSWYgeW91IG5lZWQgdG8gbG9hZCBhbnkgYWRkaXRpb25hbCBtb2R1bGVzLCBzcGVjaWZ5IHRoZW0gaW4gdGhlIGBtb2R1bGVzYFxuICogYXJndW1lbnQuXG4gKlxuICogQHBhcmFtIGRlc2NyaXB0aW9uIFRlc3QgY2FzZSBkZXNjcmlwdGlvblxuICogQHBhcmFtIG1vZHVsZXMgTGlzdCBvZiBtb2R1bGVzIHRvIGxvYWQgZm9yIHRoaXMgdGVzdFxuICogQHBhcmFtIHRlc3RzIFRlc3QgY2FzZSBib2R5XG4gKiBAcGFyYW0gYXBpQ2xhc3MgT3B0aW9uYWwgbW9jayBBUEkgY2xhc3MgdGhhdCBzaG91bGQgYmUgdXNlZFxuICogQHBhcmFtIGJhc2VNb2R1bGVzIE9wdGlvbmFsIGxpc3Qgb2YgbW9kdWxlcyB0byBsb2FkIGJlZm9yZSBldmVyeXRoaW5nIGZvciB0aGlzIHRlc3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc2NyaWJlQ29tcG9uZW50KGRlc2NyaXB0aW9uOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kdWxlczogYW55W10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVzdHM6ICh0ZXN0ZXI6IENvbXBvbmVudFRlc3RlcikgPT4gdm9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcGlDbGFzczogTW9ja0FwaUZhY3RvcnkgPSBNb2NrQXBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhc2VNb2R1bGVzOiBzdHJpbmdbXSA9IFtdKTogdm9pZCB7XG4gICAgZGVzY3JpYmUoZGVzY3JpcHRpb24sICgpID0+IHtcbiAgICAgICAgbGV0ICRjb21waWxlOiBhbmd1bGFyLklDb21waWxlU2VydmljZTtcbiAgICAgICAgbGV0ICRzY29wZTogYW5ndWxhci5JU2NvcGU7XG4gICAgICAgIGxldCBtb2NrQXBpOiBSZXNvbHdlQXBpICYgTW9ja0Jhc2U7XG5cbiAgICAgICAgY29uc3QgbW9kdWxlTmFtZSA9ICdyZXNvbHdlLnRlc3RzLicgKyBkZXNjcmlwdGlvbi5yZXBsYWNlKC8gL2csICcuJyk7XG4gICAgICAgIGNvbnN0IG1vZHVsZTogYW5ndWxhci5JTW9kdWxlID0gYW5ndWxhci5tb2R1bGUobW9kdWxlTmFtZSwgW10pO1xuXG4gICAgICAgIC8vIExvYWQgYmFzZSBtb2R1bGVzLlxuICAgICAgICBiZWZvcmVFYWNoKGFuZ3VsYXIubW9jay5tb2R1bGUoJ3Jlc29sd2Uuc2VydmljZXMuc2hhcmVkX3N0b3JlJykpO1xuICAgICAgICBiZWZvcmVFYWNoKGFuZ3VsYXIubW9jay5tb2R1bGUoJ3Jlc29sd2Uuc2VydmljZXMuc3RhdGVfbWFuYWdlcicpKTtcbiAgICAgICAgYmFzZU1vZHVsZXMuZm9yRWFjaCgoYmFzZU1vZHVsZSkgPT4gYmVmb3JlRWFjaChhbmd1bGFyLm1vY2subW9kdWxlKGJhc2VNb2R1bGUpKSk7XG5cbiAgICAgICAgYmVmb3JlRWFjaChhbmd1bGFyLm1vY2subW9kdWxlKCgkcHJvdmlkZTogYW5ndWxhci5hdXRvLklQcm92aWRlU2VydmljZSkgPT4ge1xuICAgICAgICAgICAgLy8gUmVwbGFjZSB1c3VhbCBBUEkgc2VydmljZSB3aXRoIG1vY2sgQVBJLlxuICAgICAgICAgICAgJHByb3ZpZGUuc2VydmljZSgnYXBpJywgYXBpQ2xhc3MpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGJlZm9yZUVhY2goYW5ndWxhci5tb2NrLm1vZHVsZShtb2R1bGVOYW1lKSk7XG5cbiAgICAgICAgLy8gUmVnaXN0ZXIgYW55IHNoYXJlZCBzdG9yZXMuXG4gICAgICAgIGxldCBzaGFyZWRTdG9yZXMgPSBfLmZpbHRlcihtb2R1bGVzLCAobSkgPT4gbS5zdG9yZUlkKTtcbiAgICAgICAgbW9kdWxlcyA9IF8uZmlsdGVyKG1vZHVsZXMsIChtKSA9PiAhbS5zdG9yZUlkKTtcblxuICAgICAgICBtb2R1bGUuY29uZmlnKChzaGFyZWRTdG9yZU1hbmFnZXJQcm92aWRlcjogU2hhcmVkU3RvcmVQcm92aWRlcikgPT4ge1xuICAgICAgICAgICAgc2hhcmVkU3RvcmVzLmZvckVhY2goKGRlc2NyaXB0b3I6IFNoYXJlZFN0b3JlRGVzY3JpcHRvcikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChkZXNjcmlwdG9yLmZhY3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2hhcmVkU3RvcmVNYW5hZ2VyUHJvdmlkZXIucmVnaXN0ZXIoZGVzY3JpcHRvci5zdG9yZUlkLCBkZXNjcmlwdG9yLmZhY3RvcnkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNoYXJlZFN0b3JlTWFuYWdlclByb3ZpZGVyLmNyZWF0ZShkZXNjcmlwdG9yLnN0b3JlSWQsIGRlc2NyaXB0b3IuaW5pdGlhbFN0YXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZm9yIChjb25zdCBhZGRpdGlvbmFsTW9kdWxlTmFtZSBvZiBtb2R1bGVzKSB7XG4gICAgICAgICAgICBiZWZvcmVFYWNoKGFuZ3VsYXIubW9jay5tb2R1bGUoYWRkaXRpb25hbE1vZHVsZU5hbWUpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEEgY29udGFpbmVyIGluIERPTSB3aGVyZSB3ZSBjYW4gdGVtcG9yYXJpbHkgYXBwZW5kIGNvbXBvbmVudCBlbGVtZW50cy5cbiAgICAgICAgbGV0IGNvbnRhaW5lckVsZW1lbnQgPSBudWxsO1xuXG4gICAgICAgIGZ1bmN0aW9uIHByb3ZpZGVSZWFsRE9NKCk6IHZvaWQge1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5ib2R5KTtcbiAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQgPSBhbmd1bGFyLmVsZW1lbnQoJzxkaXYgaWQ9XCJ0ZXN0LWNvbnRhaW5lci1lbGVtZW50XCI+PC9kaXY+Jyk7XG4gICAgICAgICAgICBib2R5LnJlbW92ZSgnI3Rlc3QtY29udGFpbmVyLWVsZW1lbnQnKTtcbiAgICAgICAgICAgIGJvZHkuYXBwZW5kKGNvbnRhaW5lckVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICAgICAgICBqYXNtaW5lLmFkZE1hdGNoZXJzKG5nRXF1YWxNYXRjaGVyKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgYmVmb3JlRWFjaChhbmd1bGFyLm1vY2suaW5qZWN0KChfJGNvbXBpbGVfLCBfJHJvb3RTY29wZV8sIF9hcGlfKSA9PiB7XG4gICAgICAgICAgICAkY29tcGlsZSA9IF8kY29tcGlsZV87XG4gICAgICAgICAgICAkc2NvcGUgPSBfJHJvb3RTY29wZV8uJG5ldygpO1xuICAgICAgICAgICAgbW9ja0FwaSA9IF9hcGlfO1xuXG4gICAgICAgICAgICAvLyBAaWZuZGVmIEdFTkpTX1BST0RVQ1RJT05cbiAgICAgICAgICAgICAgICBpZiAoXy5jb250YWlucyh0ZXN0cy50b1N0cmluZygpLCAnZGVidWdnZXInKSB8fCBfLmNvbnRhaW5zKHRlc3RzLnRvU3RyaW5nKCksICcgZml0KCcpKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb3ZpZGVSZWFsRE9NKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQGVuZGlmXG4gICAgICAgIH0pKTtcblxuICAgICAgICBhZnRlckVhY2goKCkgPT4ge1xuICAgICAgICAgICAgJHNjb3BlLiRkZXN0cm95KCk7XG4gICAgICAgICAgICBpZiAoY29udGFpbmVyRWxlbWVudCkgY29udGFpbmVyRWxlbWVudC5lbXB0eSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0ZXN0cyh7XG4gICAgICAgICAgICBtb2R1bGU6IG1vZHVsZSxcblxuICAgICAgICAgICAgY3JlYXRlQ29tcG9uZW50OiBmdW5jdGlvbjxUPih0ZW1wbGF0ZTogc3RyaW5nKTogQ29tcG9uZW50RGVzY3JpcHRvcjxUPiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gZ2V0Q29tcG9uZW50PFQ+KCRjb21waWxlLCAkc2NvcGUsIHRlbXBsYXRlKTtcblxuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXJFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFwcGVuZCBjb21wb25lbnQgZWxlbWVudCB0byBhY3R1YWwgRE9NLiBPdGhlcndpc2UsIGNvbXB1dGF0aW9ucyBsaWtlIGhlaWdodCB3aWxsIG5vdCB3b3JrLlxuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJFbGVtZW50LmFwcGVuZChjb21wb25lbnQuZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kZGlnZXN0KCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbXBvbmVudDtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGRpZ2VzdDogZnVuY3Rpb24oKTogdm9pZCB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLiRkaWdlc3QoKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGFwaTogZnVuY3Rpb24oKTogUmVzb2x3ZUFwaSAmIE1vY2tCYXNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbW9ja0FwaTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHNjb3BlOiBmdW5jdGlvbigpOiBhbmd1bGFyLklTY29wZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRzY29wZTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHByb3ZpZGVSZWFsRE9NOiBwcm92aWRlUmVhbERPTSxcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG4iXX0=
