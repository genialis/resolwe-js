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
var _ = require("lodash");
var error_1 = require("../../../core/errors/error");
var utils_1 = require("../../types/utils");
var module_resource_1 = require("./module_resource");
var MultipleFeaturesFoundError = /** @class */ (function (_super) {
    __extends(MultipleFeaturesFoundError, _super);
    function MultipleFeaturesFoundError(message) {
        var _this = _super.call(this, message) || this;
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object['setPrototypeOf'](_this, MultipleFeaturesFoundError.prototype);
        return _this;
    }
    return MultipleFeaturesFoundError;
}(error_1.GenError));
exports.MultipleFeaturesFoundError = MultipleFeaturesFoundError;
var NoFeatureFoundError = /** @class */ (function (_super) {
    __extends(NoFeatureFoundError, _super);
    function NoFeatureFoundError(message) {
        var _this = _super.call(this, message) || this;
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object['setPrototypeOf'](_this, NoFeatureFoundError.prototype);
        return _this;
    }
    return NoFeatureFoundError;
}(error_1.GenError));
exports.NoFeatureFoundError = NoFeatureFoundError;
/**
 * Abstract base class for knowledge base resources.
 */
var KnowledgeBaseResource = /** @class */ (function (_super) {
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
var FeatureResource = /** @class */ (function (_super) {
    __extends(FeatureResource, _super);
    function FeatureResource(connection) {
        return _super.call(this, 'feature', connection) || this;
    }
    /**
     * Gets a single feature. Returns undefined if feature not found.
     *
     * @param query Feature query
     * @returns Feature
     * @throws `MultipleFeaturesFoundError` is thrown if multiple features found
     * @throws `NoFeatureFoundError` is thrown if feature not found
     */
    FeatureResource.prototype.getFeature = function (query) {
        var path = this.getModuleMethodPath('search');
        return this.connection.get(path, query).map(function (features) {
            if (features.length > 1) {
                throw new MultipleFeaturesFoundError("Multiple features identified by feature id " + query.feature_id + " and source " + query.source);
            }
            if (features.length === 0) {
                throw new NoFeatureFoundError("Feature identified by feature id " + query.feature_id + " and source " + query.source + " not found");
            }
            return utils_1.transformFeature(_.first(features));
        });
    };
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL21vZHVsZXMva25vd2xlZGdlX2Jhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsMEJBQTRCO0FBRzVCLG9EQUFvRDtBQUVwRCwyQ0FBc0U7QUFFdEUscURBQWlEO0FBRWpEO0lBQWdELDhDQUFRO0lBQ3BELG9DQUFZLE9BQWU7UUFBM0IsWUFDSSxrQkFBTSxPQUFPLENBQUMsU0FHakI7UUFGRyxnSUFBZ0k7UUFDaEksTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsS0FBSSxFQUFFLDBCQUEwQixDQUFDLFNBQVMsQ0FBQyxDQUFDOztJQUN6RSxDQUFDO0lBQ0wsaUNBQUM7QUFBRCxDQU5BLEFBTUMsQ0FOK0MsZ0JBQVEsR0FNdkQ7QUFOWSxnRUFBMEI7QUFPdkM7SUFBeUMsdUNBQVE7SUFDN0MsNkJBQVksT0FBZTtRQUEzQixZQUNJLGtCQUFNLE9BQU8sQ0FBQyxTQUdqQjtRQUZHLGdJQUFnSTtRQUNoSSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxLQUFJLEVBQUUsbUJBQW1CLENBQUMsU0FBUyxDQUFDLENBQUM7O0lBQ2xFLENBQUM7SUFDTCwwQkFBQztBQUFELENBTkEsQUFNQyxDQU53QyxnQkFBUSxHQU1oRDtBQU5ZLGtEQUFtQjtBQVFoQzs7R0FFRztBQUNIO0lBQW9ELHlDQUFjO0lBQWxFOztJQU9BLENBQUM7SUFORzs7T0FFRztJQUNPLGtEQUFrQixHQUE1QjtRQUNJLE1BQU0sQ0FBSSxJQUFJLENBQUMsV0FBVyxFQUFFLFFBQUssQ0FBQztJQUN0QyxDQUFDO0lBQ0wsNEJBQUM7QUFBRCxDQVBBLEFBT0MsQ0FQbUQsZ0NBQWMsR0FPakU7QUFQcUIsc0RBQXFCO0FBUzNDOztHQUVHO0FBQ0g7SUFBcUMsbUNBQXFCO0lBQ3RELHlCQUFZLFVBQXNCO2VBQzlCLGtCQUFNLFNBQVMsRUFBRSxVQUFVLENBQUM7SUFDaEMsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSSxvQ0FBVSxHQUFqQixVQUFrQixLQUF5QjtRQUN2QyxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFaEQsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFrQixJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUMsUUFBUTtZQUNsRSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RCLE1BQU0sSUFBSSwwQkFBMEIsQ0FDaEMsZ0RBQThDLEtBQUssQ0FBQyxVQUFVLG9CQUFlLEtBQUssQ0FBQyxNQUFRLENBQzlGLENBQUM7WUFDTixDQUFDO1lBQ0QsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN4QixNQUFNLElBQUksbUJBQW1CLENBQUMsc0NBQW9DLEtBQUssQ0FBQyxVQUFVLG9CQUFlLEtBQUssQ0FBQyxNQUFNLGVBQVksQ0FBQyxDQUFDO1lBQy9ILENBQUM7WUFFRCxNQUFNLENBQUMsd0JBQWdCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQy9DLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSxnQ0FBTSxHQUFiLFVBQWMsS0FBK0I7UUFDekMsSUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2hELElBQUksT0FBdUMsQ0FBQztRQUU1QyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekIsT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFrQixJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDakUsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ0osT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFrQixJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDaEUsQ0FBQztRQUVELE1BQU0sQ0FBQyx5QkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNJLHNDQUFZLEdBQW5CLFVBQW9CLEtBQXFDO1FBQ3JELElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUN0RCxNQUFNLENBQUMseUJBQWlCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQWtCLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ2pGLENBQUM7SUFDTCxzQkFBQztBQUFELENBekRBLEFBeURDLENBekRvQyxxQkFBcUIsR0F5RHpEO0FBekRZLDBDQUFlIiwiZmlsZSI6ImFwaS9yZXNvdXJjZXMvbW9kdWxlcy9rbm93bGVkZ2VfYmFzZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIFJ4IGZyb20gJ3J4JztcblxuaW1wb3J0IHtHZW5FcnJvcn0gZnJvbSAnLi4vLi4vLi4vY29yZS9lcnJvcnMvZXJyb3InO1xuaW1wb3J0IHtDb25uZWN0aW9ufSBmcm9tICcuLi8uLi9jb25uZWN0aW9uJztcbmltcG9ydCB7dHJhbnNmb3JtRmVhdHVyZSwgdHJhbnNmb3JtRmVhdHVyZXN9IGZyb20gJy4uLy4uL3R5cGVzL3V0aWxzJztcbmltcG9ydCAqIGFzIHR5cGVzIGZyb20gJy4uLy4uL3R5cGVzL21vZHVsZXMnO1xuaW1wb3J0IHtNb2R1bGVSZXNvdXJjZX0gZnJvbSAnLi9tb2R1bGVfcmVzb3VyY2UnO1xuXG5leHBvcnQgY2xhc3MgTXVsdGlwbGVGZWF0dXJlc0ZvdW5kRXJyb3IgZXh0ZW5kcyBHZW5FcnJvciB7XG4gICAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vTWljcm9zb2Z0L1R5cGVTY3JpcHQvd2lraS9CcmVha2luZy1DaGFuZ2VzI2V4dGVuZGluZy1idWlsdC1pbnMtbGlrZS1lcnJvci1hcnJheS1hbmQtbWFwLW1heS1uby1sb25nZXItd29ya1xuICAgICAgICBPYmplY3RbJ3NldFByb3RvdHlwZU9mJ10odGhpcywgTXVsdGlwbGVGZWF0dXJlc0ZvdW5kRXJyb3IucHJvdG90eXBlKTtcbiAgICB9XG59XG5leHBvcnQgY2xhc3MgTm9GZWF0dXJlRm91bmRFcnJvciBleHRlbmRzIEdlbkVycm9yIHtcbiAgICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICAgICAgc3VwZXIobWVzc2FnZSk7XG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWNyb3NvZnQvVHlwZVNjcmlwdC93aWtpL0JyZWFraW5nLUNoYW5nZXMjZXh0ZW5kaW5nLWJ1aWx0LWlucy1saWtlLWVycm9yLWFycmF5LWFuZC1tYXAtbWF5LW5vLWxvbmdlci13b3JrXG4gICAgICAgIE9iamVjdFsnc2V0UHJvdG90eXBlT2YnXSh0aGlzLCBOb0ZlYXR1cmVGb3VuZEVycm9yLnByb3RvdHlwZSk7XG4gICAgfVxufVxuXG4vKipcbiAqIEFic3RyYWN0IGJhc2UgY2xhc3MgZm9yIGtub3dsZWRnZSBiYXNlIHJlc291cmNlcy5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEtub3dsZWRnZUJhc2VSZXNvdXJjZSBleHRlbmRzIE1vZHVsZVJlc291cmNlIHtcbiAgICAvKipcbiAgICAgKiBAaW5oZXJpdGRvY1xuICAgICAqL1xuICAgIHByb3RlY3RlZCBnZXRNb2R1bGVzQmFzZVBhdGgoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMuZ2V0QmFzZVBhdGgoKX0va2JgO1xuICAgIH1cbn1cblxuLyoqXG4gKiBLbm93bGVkZ2UgYmFzZSBmZWF0dXJlIHJlc291cmNlLlxuICovXG5leHBvcnQgY2xhc3MgRmVhdHVyZVJlc291cmNlIGV4dGVuZHMgS25vd2xlZGdlQmFzZVJlc291cmNlIHtcbiAgICBjb25zdHJ1Y3Rvcihjb25uZWN0aW9uOiBDb25uZWN0aW9uKSB7XG4gICAgICAgIHN1cGVyKCdmZWF0dXJlJywgY29ubmVjdGlvbik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyBhIHNpbmdsZSBmZWF0dXJlLiBSZXR1cm5zIHVuZGVmaW5lZCBpZiBmZWF0dXJlIG5vdCBmb3VuZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBxdWVyeSBGZWF0dXJlIHF1ZXJ5XG4gICAgICogQHJldHVybnMgRmVhdHVyZVxuICAgICAqIEB0aHJvd3MgYE11bHRpcGxlRmVhdHVyZXNGb3VuZEVycm9yYCBpcyB0aHJvd24gaWYgbXVsdGlwbGUgZmVhdHVyZXMgZm91bmRcbiAgICAgKiBAdGhyb3dzIGBOb0ZlYXR1cmVGb3VuZEVycm9yYCBpcyB0aHJvd24gaWYgZmVhdHVyZSBub3QgZm91bmRcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0RmVhdHVyZShxdWVyeTogdHlwZXMuRmVhdHVyZVF1ZXJ5KTogUnguT2JzZXJ2YWJsZTx0eXBlcy5GZWF0dXJlPiB7XG4gICAgICAgIGNvbnN0IHBhdGggPSB0aGlzLmdldE1vZHVsZU1ldGhvZFBhdGgoJ3NlYXJjaCcpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmNvbm5lY3Rpb24uZ2V0PHR5cGVzLkZlYXR1cmVbXT4ocGF0aCwgcXVlcnkpLm1hcCgoZmVhdHVyZXMpID0+IHtcbiAgICAgICAgICAgIGlmIChmZWF0dXJlcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IE11bHRpcGxlRmVhdHVyZXNGb3VuZEVycm9yKFxuICAgICAgICAgICAgICAgICAgICBgTXVsdGlwbGUgZmVhdHVyZXMgaWRlbnRpZmllZCBieSBmZWF0dXJlIGlkICR7cXVlcnkuZmVhdHVyZV9pZH0gYW5kIHNvdXJjZSAke3F1ZXJ5LnNvdXJjZX1gXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmZWF0dXJlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTm9GZWF0dXJlRm91bmRFcnJvcihgRmVhdHVyZSBpZGVudGlmaWVkIGJ5IGZlYXR1cmUgaWQgJHtxdWVyeS5mZWF0dXJlX2lkfSBhbmQgc291cmNlICR7cXVlcnkuc291cmNlfSBub3QgZm91bmRgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRyYW5zZm9ybUZlYXR1cmUoXy5maXJzdChmZWF0dXJlcykpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZWFyY2hlcyBmb3IgZmVhdHVyZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcXVlcnkgRmVhdHVyZSBzZWFyY2ggcXVlcnlcbiAgICAgKi9cbiAgICBwdWJsaWMgc2VhcmNoKHF1ZXJ5OiB0eXBlcy5GZWF0dXJlU2VhcmNoUXVlcnkpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLkZlYXR1cmVbXT4ge1xuICAgICAgICBjb25zdCBwYXRoID0gdGhpcy5nZXRNb2R1bGVNZXRob2RQYXRoKCdzZWFyY2gnKTtcbiAgICAgICAgbGV0IHJlc3VsdHM6IFJ4Lk9ic2VydmFibGU8dHlwZXMuRmVhdHVyZVtdPjtcblxuICAgICAgICBpZiAoXy5pc0FycmF5KHF1ZXJ5LnF1ZXJ5KSkge1xuICAgICAgICAgICAgcmVzdWx0cyA9IHRoaXMuY29ubmVjdGlvbi5wb3N0PHR5cGVzLkZlYXR1cmVbXT4ocGF0aCwgcXVlcnkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0cyA9IHRoaXMuY29ubmVjdGlvbi5nZXQ8dHlwZXMuRmVhdHVyZVtdPihwYXRoLCBxdWVyeSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJhbnNmb3JtRmVhdHVyZXMocmVzdWx0cyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGVyZm9ybXMgYW4gYXV0b2NvbXBsZXRlIHF1ZXJ5IGZvciBmZWF0dXJlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBxdWVyeSBGZWF0dXJlIGF1dG9jb21wbGV0ZSBxdWVyeVxuICAgICAqL1xuICAgIHB1YmxpYyBhdXRvY29tcGxldGUocXVlcnk6IHR5cGVzLkZlYXR1cmVBdXRvY29tcGxldGVRdWVyeSk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuRmVhdHVyZVtdPiB7XG4gICAgICAgIGNvbnN0IHBhdGggPSB0aGlzLmdldE1vZHVsZU1ldGhvZFBhdGgoJ2F1dG9jb21wbGV0ZScpO1xuICAgICAgICByZXR1cm4gdHJhbnNmb3JtRmVhdHVyZXModGhpcy5jb25uZWN0aW9uLnBvc3Q8dHlwZXMuRmVhdHVyZVtdPihwYXRoLCBxdWVyeSkpO1xuICAgIH1cbn1cbiJdfQ==
