"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var base_1 = require("./base");
var stateful_1 = require("./stateful");
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
var ViewComponent = (function (_super) {
    __extends(ViewComponent, _super);
    function ViewComponent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ViewComponent.onComponentCompile = function (element, attributes) {
        // Wrap component content, so that it is shown only when views becomes ready.
        element.wrapInner('<div ng-if="ctrl.viewReady()"></div>');
        // Include a loading view when configured.
        if (this.viewShowLoading) {
            element.append('<div ng-if="!ctrl.viewReady()">' + this.viewLoadingTemplate + '</div>');
        }
    };
    /**
     * This method returns whether the view should be considered ready. Its default
     * implementation simply checks if `subscriptionsReady()` returns true. Subclasses
     * may override this method to implement some specific functionality.
     */
    ViewComponent.prototype.viewReady = function () {
        return this.subscriptionsReady();
    };
    return ViewComponent;
}(stateful_1.StatefulComponentBase));
/// Should a loading view be used while subscriptions are not ready.
ViewComponent.viewShowLoading = true;
/// Loading template.
ViewComponent.viewLoadingTemplate = "\n        <div layout=\"row\">\n            <span flex></span>\n            <md-progress-circular md-mode=\"indeterminate\"></md-progress-circular>\n            <span flex></span>\n        </div>\n    ";
ViewComponent = __decorate([
    base_1.component({
        abstract: true,
    })
], ViewComponent);
exports.ViewComponent = ViewComponent;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2NvbXBvbmVudHMvdmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFFQSwrQkFBaUM7QUFDakMsdUNBQWlEO0FBRWpEOzs7Ozs7Ozs7O0dBVUc7QUFJSCxJQUFzQixhQUFhO0lBQVMsaUNBQXFCO0lBQWpFOztJQThCQSxDQUFDO0lBbEJpQixnQ0FBa0IsR0FBaEMsVUFBaUMsT0FBaUMsRUFBRSxVQUErQjtRQUMvRiw2RUFBNkU7UUFDN0UsT0FBTyxDQUFDLFNBQVMsQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO1FBRTFELDBDQUEwQztRQUMxQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztZQUN2QixPQUFPLENBQUMsTUFBTSxDQUFDLGlDQUFpQyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxRQUFRLENBQUMsQ0FBQztRQUM1RixDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSxpQ0FBUyxHQUFoQjtRQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztJQUNyQyxDQUFDO0lBQ0wsb0JBQUM7QUFBRCxDQTlCQSxBQThCQyxDQTlCMkMsZ0NBQXFCLEdBOEJoRTtBQTdCRyxvRUFBb0U7QUFDbkQsNkJBQWUsR0FBWSxJQUFJLENBQUM7QUFDakQscUJBQXFCO0FBQ0osaUNBQW1CLEdBQVcsMk1BTTlDLENBQUM7QUFWZ0IsYUFBYTtJQUhsQyxnQkFBUyxDQUFDO1FBQ1AsUUFBUSxFQUFFLElBQUk7S0FDakIsQ0FBQztHQUNvQixhQUFhLENBOEJsQztBQTlCcUIsc0NBQWEiLCJmaWxlIjoiY29yZS9jb21wb25lbnRzL3ZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhbmd1bGFyIGZyb20gJ2FuZ3VsYXInO1xuXG5pbXBvcnQge2NvbXBvbmVudH0gZnJvbSAnLi9iYXNlJztcbmltcG9ydCB7U3RhdGVmdWxDb21wb25lbnRCYXNlfSBmcm9tICcuL3N0YXRlZnVsJztcblxuLyoqXG4gKiBBbiBhYnN0cmFjdCBiYXNlIGNsYXNzIGZvciBjb21wb25lbnRzLCB3aGljaCByZXByZXNlbnQgY29tcGxldGUgdmlld3MuIEV4dGVuZGluZ1xuICogdGhpcyBjb21wb25lbnQgd2lsbCBlbnN1cmUgdGhhdCBjb21wb25lbnQgY29udGVudHMgd2lsbCBvbmx5IGJlIHJlbmRlcmVkIHdoZW5cbiAqIGFsbCB0aGUgc3Vic2NyaXB0aW9ucyBhcmUgcmVhZHkuXG4gKlxuICogQWRkaXRpb25hbGx5LCB0aGUgY29tcG9uZW50IHdpbGwgcmVuZGVyIGEgXCJsb2FkaW5nXCIgdmlldyB3aGlsZSBzdWJzY3JpcHRpb25zXG4gKiBhcmUgbm90IHJlYWR5LiBUaGUgdXNlIG9mIHRoaXMgbG9hZGluZyB2aWV3IG1heSBiZSBkaXNhYmxlZCBieSBzZXR0aW5nIHRoZVxuICogYHZpZXdTaG93TG9hZGluZ2Agc3RhdGljIHZhcmlhYmxlIHRvIGBmYWxzZWAuIFRoZSBsb2FkaW5nIHRlbXBsYXRlIG1heSBiZVxuICogY2hhbmdlZCBieSBzZXR0aW5nIHRoZSBgdmlld0xvYWRpbmdUZW1wbGF0ZWAgc3RhdGljIHZhcmlhYmxlIHRvIGEgdGVtcGxhdGVcbiAqIHN0cmluZy5cbiAqL1xuQGNvbXBvbmVudCh7XG4gICAgYWJzdHJhY3Q6IHRydWUsXG59KVxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFZpZXdDb21wb25lbnQgZXh0ZW5kcyBTdGF0ZWZ1bENvbXBvbmVudEJhc2Uge1xuICAgIC8vLyBTaG91bGQgYSBsb2FkaW5nIHZpZXcgYmUgdXNlZCB3aGlsZSBzdWJzY3JpcHRpb25zIGFyZSBub3QgcmVhZHkuXG4gICAgcHJvdGVjdGVkIHN0YXRpYyB2aWV3U2hvd0xvYWRpbmc6IGJvb2xlYW4gPSB0cnVlO1xuICAgIC8vLyBMb2FkaW5nIHRlbXBsYXRlLlxuICAgIHByb3RlY3RlZCBzdGF0aWMgdmlld0xvYWRpbmdUZW1wbGF0ZTogc3RyaW5nID0gYFxuICAgICAgICA8ZGl2IGxheW91dD1cInJvd1wiPlxuICAgICAgICAgICAgPHNwYW4gZmxleD48L3NwYW4+XG4gICAgICAgICAgICA8bWQtcHJvZ3Jlc3MtY2lyY3VsYXIgbWQtbW9kZT1cImluZGV0ZXJtaW5hdGVcIj48L21kLXByb2dyZXNzLWNpcmN1bGFyPlxuICAgICAgICAgICAgPHNwYW4gZmxleD48L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgIGA7XG5cbiAgICBwdWJsaWMgc3RhdGljIG9uQ29tcG9uZW50Q29tcGlsZShlbGVtZW50OiBhbmd1bGFyLklBdWdtZW50ZWRKUXVlcnksIGF0dHJpYnV0ZXM6IGFuZ3VsYXIuSUF0dHJpYnV0ZXMpOiB2b2lkIHtcbiAgICAgICAgLy8gV3JhcCBjb21wb25lbnQgY29udGVudCwgc28gdGhhdCBpdCBpcyBzaG93biBvbmx5IHdoZW4gdmlld3MgYmVjb21lcyByZWFkeS5cbiAgICAgICAgZWxlbWVudC53cmFwSW5uZXIoJzxkaXYgbmctaWY9XCJjdHJsLnZpZXdSZWFkeSgpXCI+PC9kaXY+Jyk7XG5cbiAgICAgICAgLy8gSW5jbHVkZSBhIGxvYWRpbmcgdmlldyB3aGVuIGNvbmZpZ3VyZWQuXG4gICAgICAgIGlmICh0aGlzLnZpZXdTaG93TG9hZGluZykge1xuICAgICAgICAgICAgZWxlbWVudC5hcHBlbmQoJzxkaXYgbmctaWY9XCIhY3RybC52aWV3UmVhZHkoKVwiPicgKyB0aGlzLnZpZXdMb2FkaW5nVGVtcGxhdGUgKyAnPC9kaXY+Jyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCByZXR1cm5zIHdoZXRoZXIgdGhlIHZpZXcgc2hvdWxkIGJlIGNvbnNpZGVyZWQgcmVhZHkuIEl0cyBkZWZhdWx0XG4gICAgICogaW1wbGVtZW50YXRpb24gc2ltcGx5IGNoZWNrcyBpZiBgc3Vic2NyaXB0aW9uc1JlYWR5KClgIHJldHVybnMgdHJ1ZS4gU3ViY2xhc3Nlc1xuICAgICAqIG1heSBvdmVycmlkZSB0aGlzIG1ldGhvZCB0byBpbXBsZW1lbnQgc29tZSBzcGVjaWZpYyBmdW5jdGlvbmFsaXR5LlxuICAgICAqL1xuICAgIHB1YmxpYyB2aWV3UmVhZHkoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLnN1YnNjcmlwdGlvbnNSZWFkeSgpO1xuICAgIH1cbn1cbiJdfQ==
