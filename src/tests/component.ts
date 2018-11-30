import * as _ from 'lodash';
import * as angular from 'angular';
import 'angular-mocks';

import {ResolweApi} from '../api/index';
import {MockBase, MockApi} from '../api/mock';
import {ngEqualMatcher} from './matchers';
import {SharedStoreFactory, SharedStoreProvider} from '../core/shared_store/index';
import {GenError} from '../core/errors/error';
import {ngCompose} from '../core/utils/lang';
import {MockApiService} from './mock';
import './matchers';

// Service modules that should be loaded.
import '../core/shared_store/index';
import '../core/components/manager';

export interface ComponentDescriptor<T> {
    element: angular.IAugmentedJQuery;
    ctrl: T;
}

export interface SharedStoreDescriptor {
    storeId: string;
    initialState?: any;
    factory?: SharedStoreFactory<any, any>;
}

/**
 * Helper for creating simple shared stores in tests. Also see
 * [[SharedStoreProvider.create]].
 *
 * @param storeId Identifier of the shared store (must be globally unique)
 * @param initialState Optional initial state of the shared store
 */
export function createSharedStore(storeId: string, initialState: any = null): SharedStoreDescriptor {
    return {
        storeId,
        initialState,
    };
}

/**
 * Helper for using shared stores in tests.
 *
 * @param storeId Identifier of the shared store (must be globally unique)
 * @param factory Shared store class
 */
export function useSharedStore(storeId: string, factory: SharedStoreFactory<any, any>): SharedStoreDescriptor {
    return {
        storeId,
        factory,
    };
}

/**
 * Helper function when unit testing components which compiles a component.
 *
 * @param $compile Compile service
 * @param $scope Scope service
 * @param template template in the form of a directive, e.g. `'<gen-some-component><gen-some-component>'`
 * @returns {ComponentDescriptor} Element and its controller
 */
export function getComponent<T>($compile: angular.ICompileService, $scope: angular.IScope, template: string): ComponentDescriptor<T> {

    // TODO: instead of having getComponent<T>, we could have getComponent<T extends ComponentBase> and then you would do
    // T.asView thus reducing the need for template argument, but looks like typescript does not support that (yet)
    // https://github.com/Microsoft/TypeScript/issues/5677

    const element = $compile(template)($scope);
    $scope.$digest();

    let ctrl: T;
    try {
        ctrl = $scope['$$childTail'].ctrl;
    } catch (e) {
        throw new GenError("Unable to fetch component controller. Did you load your module in tests?");
    }

    return {
        element: element,
        ctrl: ctrl,
    };
}

/**
 * Interface exposed to test case functions, which are created using [[describeComponent]].
 */
export interface ComponentTester {
    /// Angular module, which may be used to register test components in.
    module: angular.IModule;

    /**
     * See [[getComponent]].
     */
    createComponent<T>(template: string): ComponentDescriptor<T>;

    /**
     * Runs an Angular digest cycle.
     */
    digest(): void;

    /**
     * Returns the mock version of the API, which may be used to simulate the backend
     * when testing components. The mock API is automatically injected into components
     * and replaces the usual API.
     */
    api(): ResolweApi & MockBase & MockApiService;

    /**
     * Returns the scope.
     */
    scope(): angular.IScope;

    /**
     * Ensures that the tested components are inserted into an actual DOM, so things
     * like height calculations work as expected. This function must be called before
     * any [[createComponent]] calls.
     */
    provideRealDOM(): void;
}

export interface MockApiFactory {
    new (...args: any[]): ResolweApi & MockBase;
}

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
export function describeComponent(description: string,
                                  modules: any[],
                                  tests: (tester: ComponentTester) => void,
                                  apiClass: MockApiFactory = MockApi,
                                  baseModules: string[] = []): void {
    describe(description, () => {
        let $compile: angular.ICompileService;
        let $scope: angular.IScope;
        let mockApi: ResolweApi & MockBase & MockApiService;

        const moduleName = 'resolwe.tests.' + description.replace(/ /g, '.');
        const module: angular.IModule = angular.module(moduleName, []);

        // Load base modules.
        beforeEach(angular.mock.module('resolwe.services.shared_store'));
        beforeEach(angular.mock.module('resolwe.services.state_manager'));
        baseModules.forEach((baseModule) => beforeEach(angular.mock.module(baseModule)));

        beforeEach(angular.mock.module(($provide: angular.auto.IProvideService) => {
            // Explicitly set root element because tests do not go through usual
            // Angular bootstrapping.
            $provide.value('$rootElement', angular.element(document.body));

            // Replace usual API service with mock API.
            $provide.service('api', ngCompose([apiClass, MockApiService]));
        }));
        beforeEach(angular.mock.module(moduleName));

        // Register any shared stores.
        const [sharedStores, additionalModules] = _.partition(modules, (m) => !!m.storeId);

        module.config((sharedStoreManagerProvider: SharedStoreProvider) => {
            _.each(sharedStores, (descriptor: SharedStoreDescriptor) => {
                if (descriptor.factory) {
                    sharedStoreManagerProvider.register(descriptor.storeId, descriptor.factory);
                } else {
                    sharedStoreManagerProvider.create(descriptor.storeId, descriptor.initialState);
                }
            });
        });

        _.each(additionalModules, (additionalModule) => {
            beforeEach(angular.mock.module(additionalModule));
        });

        // A container in DOM where we can temporarily append component elements.
        let containerElement: angular.IAugmentedJQuery = null;

        function provideRealDOM(): void {
            removeRealDOM();
            const body = angular.element(document.body);
            containerElement = angular.element('<div id="test-container-element"></div>');
            body.append(containerElement);
        }

        function removeRealDOM(): void {
            if (containerElement) {
                containerElement.remove();
                containerElement = null;
            }
        }

        beforeEach(() => {
            jasmine.addMatchers(ngEqualMatcher);
        });

        beforeEach(angular.mock.inject((_$compile_, _$rootScope_, _api_) => {
            $compile = _$compile_;
            $scope = _$rootScope_.$new();
            mockApi = _api_;

            // @ifndef GENJS_PRODUCTION
                if (_.contains(tests.toString(), 'debugger') || _.contains(tests.toString(), ' fit(')) {
                    provideRealDOM();
                }
            // @endif
        }));

        afterEach(() => {
            $scope.$destroy();
            removeRealDOM();
        });

        tests({
            module: module,

            createComponent: function<T>(template: string): ComponentDescriptor<T> {
                const component = getComponent<T>($compile, $scope, template);

                if (containerElement) {
                    // Append component element to actual DOM. Otherwise, computations like height will not work.
                    containerElement.append(component.element);
                    $scope.$digest();
                }

                return component;
            },

            digest: function(): void {
                $scope.$digest();
            },

            api: function(): ResolweApi & MockBase & MockApiService {
                return mockApi;
            },

            scope: function(): angular.IScope {
                return $scope;
            },

            provideRealDOM: provideRealDOM,
        });
    });
}
