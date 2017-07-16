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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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U0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUMzQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3JCLENBQUM7Z0JBRUQsTUFBTSxDQUFDLFNBQVMsQ0FBQztZQUNyQixDQUFDO1lBRUQsTUFBTSxFQUFFO2dCQUNKLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNyQixDQUFDO1lBRUQsR0FBRyxFQUFFO2dCQUNELE1BQU0sQ0FBQyxPQUFPLENBQUM7WUFDbkIsQ0FBQztZQUVELEtBQUssRUFBRTtnQkFDSCxNQUFNLENBQUMsTUFBTSxDQUFDO1lBQ2xCLENBQUM7WUFFRCxjQUFjLEVBQUUsY0FBYztTQUNqQyxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUF0R0QsOENBc0dDIiwiZmlsZSI6InRlc3RzL2NvbXBvbmVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIGFuZ3VsYXIgZnJvbSAnYW5ndWxhcic7XG5pbXBvcnQgJ2FuZ3VsYXItbW9ja3MnO1xuXG5pbXBvcnQge1Jlc29sd2VBcGl9IGZyb20gJy4uL2FwaS9pbmRleCc7XG5pbXBvcnQge01vY2tCYXNlLCBNb2NrQXBpfSBmcm9tICcuLi9hcGkvbW9jayc7XG5pbXBvcnQge25nRXF1YWxNYXRjaGVyfSBmcm9tICcuL21hdGNoZXJzJztcbmltcG9ydCB7U2hhcmVkU3RvcmVGYWN0b3J5LCBTaGFyZWRTdG9yZVByb3ZpZGVyfSBmcm9tICcuLi9jb3JlL3NoYXJlZF9zdG9yZS9pbmRleCc7XG5pbXBvcnQge0dlbkVycm9yfSBmcm9tICcuLi9jb3JlL2Vycm9ycy9lcnJvcic7XG5pbXBvcnQge2NvbXBvc2V9IGZyb20gJy4uL2NvcmUvdXRpbHMvbGFuZyc7XG5pbXBvcnQge01vY2tBcGlTZXJ2aWNlfSBmcm9tICcuL21vY2snO1xuaW1wb3J0ICcuL21hdGNoZXJzJztcblxuLy8gU2VydmljZSBtb2R1bGVzIHRoYXQgc2hvdWxkIGJlIGxvYWRlZC5cbmltcG9ydCAnLi4vY29yZS9zaGFyZWRfc3RvcmUvaW5kZXgnO1xuaW1wb3J0ICcuLi9jb3JlL2NvbXBvbmVudHMvbWFuYWdlcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcG9uZW50RGVzY3JpcHRvcjxUPiB7XG4gICAgZWxlbWVudDogYW5ndWxhci5JQXVnbWVudGVkSlF1ZXJ5O1xuICAgIGN0cmw6IFQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2hhcmVkU3RvcmVEZXNjcmlwdG9yIHtcbiAgICBzdG9yZUlkOiBzdHJpbmc7XG4gICAgaW5pdGlhbFN0YXRlPzogYW55O1xuICAgIGZhY3Rvcnk/OiBTaGFyZWRTdG9yZUZhY3Rvcnk8YW55LCBhbnk+O1xufVxuXG4vKipcbiAqIEhlbHBlciBmb3IgY3JlYXRpbmcgc2ltcGxlIHNoYXJlZCBzdG9yZXMgaW4gdGVzdHMuIEFsc28gc2VlXG4gKiBbW1NoYXJlZFN0b3JlUHJvdmlkZXIuY3JlYXRlXV0uXG4gKlxuICogQHBhcmFtIHN0b3JlSWQgSWRlbnRpZmllciBvZiB0aGUgc2hhcmVkIHN0b3JlIChtdXN0IGJlIGdsb2JhbGx5IHVuaXF1ZSlcbiAqIEBwYXJhbSBpbml0aWFsU3RhdGUgT3B0aW9uYWwgaW5pdGlhbCBzdGF0ZSBvZiB0aGUgc2hhcmVkIHN0b3JlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTaGFyZWRTdG9yZShzdG9yZUlkOiBzdHJpbmcsIGluaXRpYWxTdGF0ZTogYW55ID0gbnVsbCk6IFNoYXJlZFN0b3JlRGVzY3JpcHRvciB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RvcmVJZCxcbiAgICAgICAgaW5pdGlhbFN0YXRlLFxuICAgIH07XG59XG5cbi8qKlxuICogSGVscGVyIGZvciB1c2luZyBzaGFyZWQgc3RvcmVzIGluIHRlc3RzLlxuICpcbiAqIEBwYXJhbSBzdG9yZUlkIElkZW50aWZpZXIgb2YgdGhlIHNoYXJlZCBzdG9yZSAobXVzdCBiZSBnbG9iYWxseSB1bmlxdWUpXG4gKiBAcGFyYW0gZmFjdG9yeSBTaGFyZWQgc3RvcmUgY2xhc3NcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZVNoYXJlZFN0b3JlKHN0b3JlSWQ6IHN0cmluZywgZmFjdG9yeTogU2hhcmVkU3RvcmVGYWN0b3J5PGFueSwgYW55Pik6IFNoYXJlZFN0b3JlRGVzY3JpcHRvciB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RvcmVJZCxcbiAgICAgICAgZmFjdG9yeSxcbiAgICB9O1xufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB3aGVuIHVuaXQgdGVzdGluZyBjb21wb25lbnRzIHdoaWNoIGNvbXBpbGVzIGEgY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSAkY29tcGlsZSBDb21waWxlIHNlcnZpY2VcbiAqIEBwYXJhbSAkc2NvcGUgU2NvcGUgc2VydmljZVxuICogQHBhcmFtIHRlbXBsYXRlIHRlbXBsYXRlIGluIHRoZSBmb3JtIG9mIGEgZGlyZWN0aXZlLCBlLmcuIGAnPGdlbi1zb21lLWNvbXBvbmVudD48Z2VuLXNvbWUtY29tcG9uZW50PidgXG4gKiBAcmV0dXJucyB7Q29tcG9uZW50RGVzY3JpcHRvcn0gRWxlbWVudCBhbmQgaXRzIGNvbnRyb2xsZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENvbXBvbmVudDxUPigkY29tcGlsZTogYW5ndWxhci5JQ29tcGlsZVNlcnZpY2UsICRzY29wZTogYW5ndWxhci5JU2NvcGUsIHRlbXBsYXRlOiBzdHJpbmcpOiBDb21wb25lbnREZXNjcmlwdG9yPFQ+IHtcblxuICAgIC8vIFRPRE86IGluc3RlYWQgb2YgaGF2aW5nIGdldENvbXBvbmVudDxUPiwgd2UgY291bGQgaGF2ZSBnZXRDb21wb25lbnQ8VCBleHRlbmRzIENvbXBvbmVudEJhc2U+IGFuZCB0aGVuIHlvdSB3b3VsZCBkb1xuICAgIC8vIFQuYXNWaWV3IHRodXMgcmVkdWNpbmcgdGhlIG5lZWQgZm9yIHRlbXBsYXRlIGFyZ3VtZW50LCBidXQgbG9va3MgbGlrZSB0eXBlc2NyaXB0IGRvZXMgbm90IHN1cHBvcnQgdGhhdCAoeWV0KVxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvNTY3N1xuXG4gICAgY29uc3QgZWxlbWVudCA9ICRjb21waWxlKHRlbXBsYXRlKSgkc2NvcGUpO1xuICAgICRzY29wZS4kZGlnZXN0KCk7XG5cbiAgICBsZXQgY3RybDogVDtcbiAgICB0cnkge1xuICAgICAgICBjdHJsID0gJHNjb3BlWyckJGNoaWxkVGFpbCddLmN0cmw7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB0aHJvdyBuZXcgR2VuRXJyb3IoXCJVbmFibGUgdG8gZmV0Y2ggY29tcG9uZW50IGNvbnRyb2xsZXIuIERpZCB5b3UgbG9hZCB5b3VyIG1vZHVsZSBpbiB0ZXN0cz9cIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZWxlbWVudDogZWxlbWVudCxcbiAgICAgICAgY3RybDogY3RybCxcbiAgICB9O1xufVxuXG4vKipcbiAqIEludGVyZmFjZSBleHBvc2VkIHRvIHRlc3QgY2FzZSBmdW5jdGlvbnMsIHdoaWNoIGFyZSBjcmVhdGVkIHVzaW5nIFtbZGVzY3JpYmVDb21wb25lbnRdXS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb21wb25lbnRUZXN0ZXIge1xuICAgIC8vLyBBbmd1bGFyIG1vZHVsZSwgd2hpY2ggbWF5IGJlIHVzZWQgdG8gcmVnaXN0ZXIgdGVzdCBjb21wb25lbnRzIGluLlxuICAgIG1vZHVsZTogYW5ndWxhci5JTW9kdWxlO1xuXG4gICAgLyoqXG4gICAgICogU2VlIFtbZ2V0Q29tcG9uZW50XV0uXG4gICAgICovXG4gICAgY3JlYXRlQ29tcG9uZW50PFQ+KHRlbXBsYXRlOiBzdHJpbmcpOiBDb21wb25lbnREZXNjcmlwdG9yPFQ+O1xuXG4gICAgLyoqXG4gICAgICogUnVucyBhbiBBbmd1bGFyIGRpZ2VzdCBjeWNsZS5cbiAgICAgKi9cbiAgICBkaWdlc3QoKTogdm9pZDtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIG1vY2sgdmVyc2lvbiBvZiB0aGUgQVBJLCB3aGljaCBtYXkgYmUgdXNlZCB0byBzaW11bGF0ZSB0aGUgYmFja2VuZFxuICAgICAqIHdoZW4gdGVzdGluZyBjb21wb25lbnRzLiBUaGUgbW9jayBBUEkgaXMgYXV0b21hdGljYWxseSBpbmplY3RlZCBpbnRvIGNvbXBvbmVudHNcbiAgICAgKiBhbmQgcmVwbGFjZXMgdGhlIHVzdWFsIEFQSS5cbiAgICAgKi9cbiAgICBhcGkoKTogUmVzb2x3ZUFwaSAmIE1vY2tCYXNlICYgTW9ja0FwaVNlcnZpY2U7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBzY29wZS5cbiAgICAgKi9cbiAgICBzY29wZSgpOiBhbmd1bGFyLklTY29wZTtcblxuICAgIC8qKlxuICAgICAqIEVuc3VyZXMgdGhhdCB0aGUgdGVzdGVkIGNvbXBvbmVudHMgYXJlIGluc2VydGVkIGludG8gYW4gYWN0dWFsIERPTSwgc28gdGhpbmdzXG4gICAgICogbGlrZSBoZWlnaHQgY2FsY3VsYXRpb25zIHdvcmsgYXMgZXhwZWN0ZWQuIFRoaXMgZnVuY3Rpb24gbXVzdCBiZSBjYWxsZWQgYmVmb3JlXG4gICAgICogYW55IFtbY3JlYXRlQ29tcG9uZW50XV0gY2FsbHMuXG4gICAgICovXG4gICAgcHJvdmlkZVJlYWxET00oKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNb2NrQXBpRmFjdG9yeSB7XG4gICAgbmV3ICguLi5hcmdzOiBhbnlbXSk6IFJlc29sd2VBcGkgJiBNb2NrQmFzZTtcbn1cblxuLyoqXG4gKiBBIGhlbHBlciBmdW5jdGlvbiB0byBlYXNlIHRlc3Rpbmcgb2YgY29tcG9uZW50cy4gSXQgd2lsbCB0YWtlIGNhcmUgb2YgbW9ja2luZyB0aGVcbiAqIHVzdWFsIG1vZHVsZXMgbmVlZGVkIGZvciB0ZXN0aW5nIGNvbXBvbmVudHMgYW5kIHByZXBhcmluZyBhIG1vZHVsZSB0aGF0IHlvdSBjYW4gdXNlXG4gKiB0byByZWdpc3RlciB0ZXN0IGNvbXBvbmVudHMuXG4gKlxuICogVGhlIHRlc3QgY2FzZSBpcyBwYXNzZWQgYW4gaW5zdGFuY2Ugb2YgW1tDb21wb25lbnRUZXN0ZXJdXSwgd2hpY2ggY29udGFpbnMgc29tZVxuICogdXNlZnVsIHByb3BlcnRpZXMgYW5kIG1ldGhvZHMgZm9yIHRlc3RpbmcgY29tcG9uZW50cy5cbiAqXG4gKiBUaGUgZm9sbG93aW5nIG1vZHVsZXMgYXJlIGF1dG9tYXRpY2FsbHkgbG9hZGVkOlxuICogKiBgcmVzb2x3ZS5zZXJ2aWNlcy5zaGFyZWRfc3RvcmVgXG4gKlxuICogSWYgeW91IG5lZWQgdG8gbG9hZCBhbnkgYWRkaXRpb25hbCBtb2R1bGVzLCBzcGVjaWZ5IHRoZW0gaW4gdGhlIGBtb2R1bGVzYFxuICogYXJndW1lbnQuXG4gKlxuICogQHBhcmFtIGRlc2NyaXB0aW9uIFRlc3QgY2FzZSBkZXNjcmlwdGlvblxuICogQHBhcmFtIG1vZHVsZXMgTGlzdCBvZiBtb2R1bGVzIHRvIGxvYWQgZm9yIHRoaXMgdGVzdFxuICogQHBhcmFtIHRlc3RzIFRlc3QgY2FzZSBib2R5XG4gKiBAcGFyYW0gYXBpQ2xhc3MgT3B0aW9uYWwgbW9jayBBUEkgY2xhc3MgdGhhdCBzaG91bGQgYmUgdXNlZFxuICogQHBhcmFtIGJhc2VNb2R1bGVzIE9wdGlvbmFsIGxpc3Qgb2YgbW9kdWxlcyB0byBsb2FkIGJlZm9yZSBldmVyeXRoaW5nIGZvciB0aGlzIHRlc3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc2NyaWJlQ29tcG9uZW50KGRlc2NyaXB0aW9uOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kdWxlczogYW55W10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVzdHM6ICh0ZXN0ZXI6IENvbXBvbmVudFRlc3RlcikgPT4gdm9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcGlDbGFzczogTW9ja0FwaUZhY3RvcnkgPSBNb2NrQXBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhc2VNb2R1bGVzOiBzdHJpbmdbXSA9IFtdKTogdm9pZCB7XG4gICAgZGVzY3JpYmUoZGVzY3JpcHRpb24sICgpID0+IHtcbiAgICAgICAgbGV0ICRjb21waWxlOiBhbmd1bGFyLklDb21waWxlU2VydmljZTtcbiAgICAgICAgbGV0ICRzY29wZTogYW5ndWxhci5JU2NvcGU7XG4gICAgICAgIGxldCBtb2NrQXBpOiBSZXNvbHdlQXBpICYgTW9ja0Jhc2UgJiBNb2NrQXBpU2VydmljZTtcblxuICAgICAgICBjb25zdCBtb2R1bGVOYW1lID0gJ3Jlc29sd2UudGVzdHMuJyArIGRlc2NyaXB0aW9uLnJlcGxhY2UoLyAvZywgJy4nKTtcbiAgICAgICAgY29uc3QgbW9kdWxlOiBhbmd1bGFyLklNb2R1bGUgPSBhbmd1bGFyLm1vZHVsZShtb2R1bGVOYW1lLCBbXSk7XG5cbiAgICAgICAgLy8gTG9hZCBiYXNlIG1vZHVsZXMuXG4gICAgICAgIGJlZm9yZUVhY2goYW5ndWxhci5tb2NrLm1vZHVsZSgncmVzb2x3ZS5zZXJ2aWNlcy5zaGFyZWRfc3RvcmUnKSk7XG4gICAgICAgIGJlZm9yZUVhY2goYW5ndWxhci5tb2NrLm1vZHVsZSgncmVzb2x3ZS5zZXJ2aWNlcy5zdGF0ZV9tYW5hZ2VyJykpO1xuICAgICAgICBiYXNlTW9kdWxlcy5mb3JFYWNoKChiYXNlTW9kdWxlKSA9PiBiZWZvcmVFYWNoKGFuZ3VsYXIubW9jay5tb2R1bGUoYmFzZU1vZHVsZSkpKTtcblxuICAgICAgICBiZWZvcmVFYWNoKGFuZ3VsYXIubW9jay5tb2R1bGUoKCRwcm92aWRlOiBhbmd1bGFyLmF1dG8uSVByb3ZpZGVTZXJ2aWNlKSA9PiB7XG4gICAgICAgICAgICAvLyBFeHBsaWNpdGx5IHNldCByb290IGVsZW1lbnQgYmVjYXVzZSB0ZXN0cyBkbyBub3QgZ28gdGhyb3VnaCB1c3VhbFxuICAgICAgICAgICAgLy8gQW5ndWxhciBib290c3RyYXBwaW5nLlxuICAgICAgICAgICAgJHByb3ZpZGUudmFsdWUoJyRyb290RWxlbWVudCcsIGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5ib2R5KSk7XG5cbiAgICAgICAgICAgIC8vIFJlcGxhY2UgdXN1YWwgQVBJIHNlcnZpY2Ugd2l0aCBtb2NrIEFQSS5cbiAgICAgICAgICAgICRwcm92aWRlLnNlcnZpY2UoJ2FwaScsIGNvbXBvc2UoW2FwaUNsYXNzLCBNb2NrQXBpU2VydmljZV0pKTtcbiAgICAgICAgfSkpO1xuICAgICAgICBiZWZvcmVFYWNoKGFuZ3VsYXIubW9jay5tb2R1bGUobW9kdWxlTmFtZSkpO1xuXG4gICAgICAgIC8vIFJlZ2lzdGVyIGFueSBzaGFyZWQgc3RvcmVzLlxuICAgICAgICBsZXQgc2hhcmVkU3RvcmVzID0gXy5maWx0ZXIobW9kdWxlcywgKG0pID0+IG0uc3RvcmVJZCk7XG4gICAgICAgIG1vZHVsZXMgPSBfLmZpbHRlcihtb2R1bGVzLCAobSkgPT4gIW0uc3RvcmVJZCk7XG5cbiAgICAgICAgbW9kdWxlLmNvbmZpZygoc2hhcmVkU3RvcmVNYW5hZ2VyUHJvdmlkZXI6IFNoYXJlZFN0b3JlUHJvdmlkZXIpID0+IHtcbiAgICAgICAgICAgIHNoYXJlZFN0b3Jlcy5mb3JFYWNoKChkZXNjcmlwdG9yOiBTaGFyZWRTdG9yZURlc2NyaXB0b3IpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZGVzY3JpcHRvci5mYWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIHNoYXJlZFN0b3JlTWFuYWdlclByb3ZpZGVyLnJlZ2lzdGVyKGRlc2NyaXB0b3Iuc3RvcmVJZCwgZGVzY3JpcHRvci5mYWN0b3J5KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzaGFyZWRTdG9yZU1hbmFnZXJQcm92aWRlci5jcmVhdGUoZGVzY3JpcHRvci5zdG9yZUlkLCBkZXNjcmlwdG9yLmluaXRpYWxTdGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZvciAoY29uc3QgYWRkaXRpb25hbE1vZHVsZU5hbWUgb2YgbW9kdWxlcykge1xuICAgICAgICAgICAgYmVmb3JlRWFjaChhbmd1bGFyLm1vY2subW9kdWxlKGFkZGl0aW9uYWxNb2R1bGVOYW1lKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBIGNvbnRhaW5lciBpbiBET00gd2hlcmUgd2UgY2FuIHRlbXBvcmFyaWx5IGFwcGVuZCBjb21wb25lbnQgZWxlbWVudHMuXG4gICAgICAgIGxldCBjb250YWluZXJFbGVtZW50ID0gbnVsbDtcblxuICAgICAgICBmdW5jdGlvbiBwcm92aWRlUmVhbERPTSgpOiB2b2lkIHtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQuYm9keSk7XG4gICAgICAgICAgICBjb250YWluZXJFbGVtZW50ID0gYW5ndWxhci5lbGVtZW50KCc8ZGl2IGlkPVwidGVzdC1jb250YWluZXItZWxlbWVudFwiPjwvZGl2PicpO1xuICAgICAgICAgICAgYm9keS5yZW1vdmUoJyN0ZXN0LWNvbnRhaW5lci1lbGVtZW50Jyk7XG4gICAgICAgICAgICBib2R5LmFwcGVuZChjb250YWluZXJFbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgICAgICAgamFzbWluZS5hZGRNYXRjaGVycyhuZ0VxdWFsTWF0Y2hlcik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGJlZm9yZUVhY2goYW5ndWxhci5tb2NrLmluamVjdCgoXyRjb21waWxlXywgXyRyb290U2NvcGVfLCBfYXBpXykgPT4ge1xuICAgICAgICAgICAgJGNvbXBpbGUgPSBfJGNvbXBpbGVfO1xuICAgICAgICAgICAgJHNjb3BlID0gXyRyb290U2NvcGVfLiRuZXcoKTtcbiAgICAgICAgICAgIG1vY2tBcGkgPSBfYXBpXztcblxuICAgICAgICAgICAgLy8gQGlmbmRlZiBHRU5KU19QUk9EVUNUSU9OXG4gICAgICAgICAgICAgICAgaWYgKF8uY29udGFpbnModGVzdHMudG9TdHJpbmcoKSwgJ2RlYnVnZ2VyJykgfHwgXy5jb250YWlucyh0ZXN0cy50b1N0cmluZygpLCAnIGZpdCgnKSkge1xuICAgICAgICAgICAgICAgICAgICBwcm92aWRlUmVhbERPTSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEBlbmRpZlxuICAgICAgICB9KSk7XG5cbiAgICAgICAgYWZ0ZXJFYWNoKCgpID0+IHtcbiAgICAgICAgICAgICRzY29wZS4kZGVzdHJveSgpO1xuICAgICAgICAgICAgaWYgKGNvbnRhaW5lckVsZW1lbnQpIGNvbnRhaW5lckVsZW1lbnQuZW1wdHkoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGVzdHMoe1xuICAgICAgICAgICAgbW9kdWxlOiBtb2R1bGUsXG5cbiAgICAgICAgICAgIGNyZWF0ZUNvbXBvbmVudDogZnVuY3Rpb248VD4odGVtcGxhdGU6IHN0cmluZyk6IENvbXBvbmVudERlc2NyaXB0b3I8VD4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IGdldENvbXBvbmVudDxUPigkY29tcGlsZSwgJHNjb3BlLCB0ZW1wbGF0ZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoY29udGFpbmVyRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBBcHBlbmQgY29tcG9uZW50IGVsZW1lbnQgdG8gYWN0dWFsIERPTS4gT3RoZXJ3aXNlLCBjb21wdXRhdGlvbnMgbGlrZSBoZWlnaHQgd2lsbCBub3Qgd29yay5cbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudC5hcHBlbmQoY29tcG9uZW50LmVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGRpZ2VzdCgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBjb21wb25lbnQ7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBkaWdlc3Q6IGZ1bmN0aW9uKCk6IHZvaWQge1xuICAgICAgICAgICAgICAgICRzY29wZS4kZGlnZXN0KCk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBhcGk6IGZ1bmN0aW9uKCk6IFJlc29sd2VBcGkgJiBNb2NrQmFzZSAmIE1vY2tBcGlTZXJ2aWNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbW9ja0FwaTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHNjb3BlOiBmdW5jdGlvbigpOiBhbmd1bGFyLklTY29wZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRzY29wZTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHByb3ZpZGVSZWFsRE9NOiBwcm92aWRlUmVhbERPTSxcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG4iXX0=
