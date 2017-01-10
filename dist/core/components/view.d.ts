/// <reference types="angular" />
import * as angular from 'angular';
import { StatefulComponentBase } from './stateful';
/**
 * An abstract base class for components, which represent complete views. Extending
 * this component will ensure that component contents will only be rendered when
 * all the subscriptions are ready.
 *
 * Additionally, the component will render a "loading" view while subscriptions
 * are not ready. The use of this loading view may be disabled by setting the
 * `viewShowLoading` static variable to `false`. The loading template may be
 * changed by setting the `viewLoadingTemplate` static variable to a template
 * string.
 */
export declare abstract class ViewComponent extends StatefulComponentBase {
    protected static viewShowLoading: boolean;
    protected static viewLoadingTemplate: string;
    static onComponentCompile(element: angular.IAugmentedJQuery, attributes: angular.IAttributes): void;
    /**
     * This method returns whether the view should be considered ready. Its default
     * implementation simply checks if `subscriptionsReady()` returns true. Subclasses
     * may override this method to implement some specific functionality.
     */
    viewReady(): boolean;
}
