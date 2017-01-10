import * as angular from 'angular';

import {component} from './base';
import {StatefulComponentBase} from './stateful';

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
@component({
    abstract: true,
})
export abstract class ViewComponent extends StatefulComponentBase {
    /// Should a loading view be used while subscriptions are not ready.
    protected static viewShowLoading: boolean = true;
    /// Loading template.
    protected static viewLoadingTemplate: string = `
        <div layout="row">
            <span flex></span>
            <md-progress-circular md-mode="indeterminate"></md-progress-circular>
            <span flex></span>
        </div>
    `;

    public static onComponentCompile(element: angular.IAugmentedJQuery, attributes: angular.IAttributes): void {
        // Wrap component content, so that it is shown only when views becomes ready.
        element.wrapInner('<div ng-if="ctrl.viewReady()"></div>');

        // Include a loading view when configured.
        if (this.viewShowLoading) {
            element.append('<div ng-if="!ctrl.viewReady()">' + this.viewLoadingTemplate + '</div>');
        }
    }

    /**
     * This method returns whether the view should be considered ready. Its default
     * implementation simply checks if `subscriptionsReady()` returns true. Subclasses
     * may override this method to implement some specific functionality.
     */
    public viewReady(): boolean {
        return this.subscriptionsReady();
    }
}
