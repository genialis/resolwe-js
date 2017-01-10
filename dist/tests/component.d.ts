/// <reference types="angular" />
import * as angular from 'angular';
import 'angular-mocks';
import { ResolweApi } from '../api/index';
import { MockBase } from '../api/mock';
import { SharedStoreFactory } from '../core/shared_store/index';
import './matchers';
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
export declare function createSharedStore(storeId: string, initialState?: any): SharedStoreDescriptor;
/**
 * Helper for using shared stores in tests.
 *
 * @param storeId Identifier of the shared store (must be globally unique)
 * @param factory Shared store class
 */
export declare function useSharedStore(storeId: string, factory: SharedStoreFactory<any, any>): SharedStoreDescriptor;
/**
 * Helper function when unit testing components which compiles a component.
 *
 * @param $compile Compile service
 * @param $scope Scope service
 * @param template template in the form of a directive, e.g. `'<gen-some-component><gen-some-component>'`
 * @returns {ComponentDescriptor} Element and its controller
 */
export declare function getComponent<T>($compile: angular.ICompileService, $scope: angular.IScope, template: string): ComponentDescriptor<T>;
/**
 * Interface exposed to test case functions, which are created using [[describeComponent]].
 */
export interface ComponentTester {
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
    api(): ResolweApi & MockBase;
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
export declare function describeComponent(description: string, modules: any[], tests: (tester: ComponentTester) => void, apiClass?: MockApiFactory, baseModules?: string[]): void;
