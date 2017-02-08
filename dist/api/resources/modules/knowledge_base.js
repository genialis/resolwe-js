"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var _ = require("lodash");
var module_resource_1 = require("./module_resource");
var utils_1 = require("../../types/utils");
/**
 * Abstract base class for knowledge base resources.
 */
var KnowledgeBaseResource = (function (_super) {
    __extends(KnowledgeBaseResource, _super);
    function KnowledgeBaseResource() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @inheritdoc
     */
    KnowledgeBaseResource.prototype.getModulesBasePath = function () {
        return this.getBasePath() + "/kb";
    };
    return KnowledgeBaseResource;
}(module_resource_1.ModuleResource));
exports.KnowledgeBaseResource = KnowledgeBaseResource;
/**
 * Knowledge base feature resource.
 */
var FeatureResource = (function (_super) {
    __extends(FeatureResource, _super);
    function FeatureResource(connection) {
        return _super.call(this, 'feature', connection) || this;
    }
    /**
     * Searches for features.
     *
     * @param query Feature search query
     */
    FeatureResource.prototype.search = function (query) {
        var path = this.getModuleMethodPath('search');
        var results;
        if (_.isArray(query.query)) {
            results = this.connection.post(path, query);
        }
        else {
            results = this.connection.get(path, query);
        }
        return utils_1.transformFeatures(results);
    };
    /**
     * Performs an autocomplete query for features.
     *
     * @param query Feature autocomplete query
     */
    FeatureResource.prototype.autocomplete = function (query) {
        var path = this.getModuleMethodPath('autocomplete');
        return utils_1.transformFeatures(this.connection.post(path, query));
    };
    return FeatureResource;
}(KnowledgeBaseResource));
exports.FeatureResource = FeatureResource;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL21vZHVsZXMva25vd2xlZGdlX2Jhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsMEJBQTRCO0FBSzVCLHFEQUFpRDtBQUNqRCwyQ0FBb0Q7QUFHcEQ7O0dBRUc7QUFDSDtJQUFvRCx5Q0FBYztJQUFsRTs7SUFPQSxDQUFDO0lBTkc7O09BRUc7SUFDTyxrREFBa0IsR0FBNUI7UUFDSSxNQUFNLENBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxRQUFLLENBQUM7SUFDdEMsQ0FBQztJQUNMLDRCQUFDO0FBQUQsQ0FQQSxBQU9DLENBUG1ELGdDQUFjLEdBT2pFO0FBUHFCLHNEQUFxQjtBQVMzQzs7R0FFRztBQUNIO0lBQXFDLG1DQUFxQjtJQUN0RCx5QkFBWSxVQUFzQjtlQUM5QixrQkFBTSxTQUFTLEVBQUUsVUFBVSxDQUFDO0lBQ2hDLENBQUM7SUFFRDs7OztPQUlHO0lBQ0ksZ0NBQU0sR0FBYixVQUFjLEtBQXlCO1FBQ25DLElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNoRCxJQUFJLE9BQXVDLENBQUM7UUFFNUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBa0IsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNKLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBa0IsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFFRCxNQUFNLENBQUMseUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSxzQ0FBWSxHQUFuQixVQUFvQixLQUFxQztRQUNyRCxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDdEQsTUFBTSxDQUFDLHlCQUFpQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFrQixJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNqRixDQUFDO0lBQ0wsc0JBQUM7QUFBRCxDQWhDQSxBQWdDQyxDQWhDb0MscUJBQXFCLEdBZ0N6RDtBQWhDWSwwQ0FBZSIsImZpbGUiOiJhcGkvcmVzb3VyY2VzL21vZHVsZXMva25vd2xlZGdlX2Jhc2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgKiBhcyBSeCBmcm9tICdyeCc7XG5cbmltcG9ydCB7Q29ubmVjdGlvbn0gZnJvbSAnLi4vLi4vY29ubmVjdGlvbic7XG5cbmltcG9ydCB7TW9kdWxlUmVzb3VyY2V9IGZyb20gJy4vbW9kdWxlX3Jlc291cmNlJztcbmltcG9ydCB7dHJhbnNmb3JtRmVhdHVyZXN9IGZyb20gJy4uLy4uL3R5cGVzL3V0aWxzJztcbmltcG9ydCAqIGFzIHR5cGVzIGZyb20gJy4uLy4uL3R5cGVzL21vZHVsZXMnO1xuXG4vKipcbiAqIEFic3RyYWN0IGJhc2UgY2xhc3MgZm9yIGtub3dsZWRnZSBiYXNlIHJlc291cmNlcy5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEtub3dsZWRnZUJhc2VSZXNvdXJjZSBleHRlbmRzIE1vZHVsZVJlc291cmNlIHtcbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHByb3RlY3RlZCBnZXRNb2R1bGVzQmFzZVBhdGgoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMuZ2V0QmFzZVBhdGgoKX0va2JgO1xuICAgIH1cbn1cblxuLyoqXG4gKiBLbm93bGVkZ2UgYmFzZSBmZWF0dXJlIHJlc291cmNlLlxuICovXG5leHBvcnQgY2xhc3MgRmVhdHVyZVJlc291cmNlIGV4dGVuZHMgS25vd2xlZGdlQmFzZVJlc291cmNlIHtcbiAgICBjb25zdHJ1Y3Rvcihjb25uZWN0aW9uOiBDb25uZWN0aW9uKSB7XG4gICAgICAgIHN1cGVyKCdmZWF0dXJlJywgY29ubmVjdGlvbik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VhcmNoZXMgZm9yIGZlYXR1cmVzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHF1ZXJ5IEZlYXR1cmUgc2VhcmNoIHF1ZXJ5XG4gICAgICovXG4gICAgcHVibGljIHNlYXJjaChxdWVyeTogdHlwZXMuRmVhdHVyZVF1ZXJ5KTogUnguT2JzZXJ2YWJsZTx0eXBlcy5GZWF0dXJlW10+IHtcbiAgICAgICAgY29uc3QgcGF0aCA9IHRoaXMuZ2V0TW9kdWxlTWV0aG9kUGF0aCgnc2VhcmNoJyk7XG4gICAgICAgIGxldCByZXN1bHRzOiBSeC5PYnNlcnZhYmxlPHR5cGVzLkZlYXR1cmVbXT47XG5cbiAgICAgICAgaWYgKF8uaXNBcnJheShxdWVyeS5xdWVyeSkpIHtcbiAgICAgICAgICAgIHJlc3VsdHMgPSB0aGlzLmNvbm5lY3Rpb24ucG9zdDx0eXBlcy5GZWF0dXJlW10+KHBhdGgsIHF1ZXJ5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdHMgPSB0aGlzLmNvbm5lY3Rpb24uZ2V0PHR5cGVzLkZlYXR1cmVbXT4ocGF0aCwgcXVlcnkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybUZlYXR1cmVzKHJlc3VsdHMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm1zIGFuIGF1dG9jb21wbGV0ZSBxdWVyeSBmb3IgZmVhdHVyZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcXVlcnkgRmVhdHVyZSBhdXRvY29tcGxldGUgcXVlcnlcbiAgICAgKi9cbiAgICBwdWJsaWMgYXV0b2NvbXBsZXRlKHF1ZXJ5OiB0eXBlcy5GZWF0dXJlQXV0b2NvbXBsZXRlUXVlcnkpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLkZlYXR1cmVbXT4ge1xuICAgICAgICBjb25zdCBwYXRoID0gdGhpcy5nZXRNb2R1bGVNZXRob2RQYXRoKCdhdXRvY29tcGxldGUnKTtcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybUZlYXR1cmVzKHRoaXMuY29ubmVjdGlvbi5wb3N0PHR5cGVzLkZlYXR1cmVbXT4ocGF0aCwgcXVlcnkpKTtcbiAgICB9XG59XG4iXX0=
