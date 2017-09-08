"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var resource_1 = require("../../resource");
/**
 * A base class for all module endpoint resources.
 *
 * Module is not a resource in REST sense, but a helper endpoint
 * that is used for a specific use case.
 */
var ModuleResource = /** @class */ (function (_super) {
    __extends(ModuleResource, _super);
    /**
     * Constructs a new module resource.
     *
     * @param _module Module name
     * @param connection Connection with the genesis platform server
     */
    function ModuleResource(_moduleName, connection) {
        var _this = _super.call(this, connection) || this;
        _this._moduleName = _moduleName;
        return _this;
    }
    Object.defineProperty(ModuleResource.prototype, "name", {
        /**
         * Gets module's name.
         */
        get: function () {
            return this._moduleName;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Returns modules' base path.
     */
    ModuleResource.prototype.getModulesBasePath = function () {
        return this.getBasePath() + "/_modules";
    };
    /**
     * Returns module's path.
     */
    ModuleResource.prototype.getModulePath = function () {
        return this.getModulesBasePath() + "/" + this.name;
    };
    /**
     * Returns the path used for requesting a module's method.
     *
     * @param method Module's method.
     * @returns Module's method path.
     */
    ModuleResource.prototype.getModuleMethodPath = function (method) {
        return this.getModulePath() + "/" + method;
    };
    return ModuleResource;
}(resource_1.Resource));
exports.ModuleResource = ModuleResource;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL21vZHVsZXMvbW9kdWxlX3Jlc291cmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUNBLDJDQUF3QztBQUV4Qzs7Ozs7R0FLRztBQUNIO0lBQTZDLGtDQUFRO0lBQ2pEOzs7OztPQUtHO0lBQ0gsd0JBQW9CLFdBQW1CLEVBQUUsVUFBc0I7UUFBL0QsWUFDSSxrQkFBTSxVQUFVLENBQUMsU0FDcEI7UUFGbUIsaUJBQVcsR0FBWCxXQUFXLENBQVE7O0lBRXZDLENBQUM7SUFLRCxzQkFBVyxnQ0FBSTtRQUhmOztXQUVHO2FBQ0g7WUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUM1QixDQUFDOzs7T0FBQTtJQUVEOztPQUVHO0lBQ08sMkNBQWtCLEdBQTVCO1FBQ0ksTUFBTSxDQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsY0FBVyxDQUFDO0lBQzVDLENBQUM7SUFFRDs7T0FFRztJQUNPLHNDQUFhLEdBQXZCO1FBQ0ksTUFBTSxDQUFJLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxTQUFJLElBQUksQ0FBQyxJQUFNLENBQUM7SUFDdkQsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ08sNENBQW1CLEdBQTdCLFVBQThCLE1BQWM7UUFDeEMsTUFBTSxDQUFJLElBQUksQ0FBQyxhQUFhLEVBQUUsU0FBSSxNQUFRLENBQUM7SUFDL0MsQ0FBQztJQUNMLHFCQUFDO0FBQUQsQ0F6Q0EsQUF5Q0MsQ0F6QzRDLG1CQUFRLEdBeUNwRDtBQXpDcUIsd0NBQWMiLCJmaWxlIjoiYXBpL3Jlc291cmNlcy9tb2R1bGVzL21vZHVsZV9yZXNvdXJjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Q29ubmVjdGlvbn0gZnJvbSAnLi4vLi4vY29ubmVjdGlvbic7XG5pbXBvcnQge1Jlc291cmNlfSBmcm9tICcuLi8uLi9yZXNvdXJjZSc7XG5cbi8qKlxuICogQSBiYXNlIGNsYXNzIGZvciBhbGwgbW9kdWxlIGVuZHBvaW50IHJlc291cmNlcy5cbiAqXG4gKiBNb2R1bGUgaXMgbm90IGEgcmVzb3VyY2UgaW4gUkVTVCBzZW5zZSwgYnV0IGEgaGVscGVyIGVuZHBvaW50XG4gKiB0aGF0IGlzIHVzZWQgZm9yIGEgc3BlY2lmaWMgdXNlIGNhc2UuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBNb2R1bGVSZXNvdXJjZSBleHRlbmRzIFJlc291cmNlIHtcbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RzIGEgbmV3IG1vZHVsZSByZXNvdXJjZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBfbW9kdWxlIE1vZHVsZSBuYW1lXG4gICAgICogQHBhcmFtIGNvbm5lY3Rpb24gQ29ubmVjdGlvbiB3aXRoIHRoZSBnZW5lc2lzIHBsYXRmb3JtIHNlcnZlclxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX21vZHVsZU5hbWU6IHN0cmluZywgY29ubmVjdGlvbjogQ29ubmVjdGlvbikge1xuICAgICAgICBzdXBlcihjb25uZWN0aW9uKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG1vZHVsZSdzIG5hbWUuXG4gICAgICovXG4gICAgcHVibGljIGdldCBuYW1lKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tb2R1bGVOYW1lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgbW9kdWxlcycgYmFzZSBwYXRoLlxuICAgICAqL1xuICAgIHByb3RlY3RlZCBnZXRNb2R1bGVzQmFzZVBhdGgoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMuZ2V0QmFzZVBhdGgoKX0vX21vZHVsZXNgO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgbW9kdWxlJ3MgcGF0aC5cbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgZ2V0TW9kdWxlUGF0aCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYCR7dGhpcy5nZXRNb2R1bGVzQmFzZVBhdGgoKX0vJHt0aGlzLm5hbWV9YDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBwYXRoIHVzZWQgZm9yIHJlcXVlc3RpbmcgYSBtb2R1bGUncyBtZXRob2QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbWV0aG9kIE1vZHVsZSdzIG1ldGhvZC5cbiAgICAgKiBAcmV0dXJucyBNb2R1bGUncyBtZXRob2QgcGF0aC5cbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgZ2V0TW9kdWxlTWV0aG9kUGF0aChtZXRob2Q6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLmdldE1vZHVsZVBhdGgoKX0vJHttZXRob2R9YDtcbiAgICB9XG59XG4iXX0=
