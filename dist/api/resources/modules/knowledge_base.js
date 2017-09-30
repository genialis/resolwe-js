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
    FeatureResource.prototype.getFeatures = function (query) {
        var path = this.getModuleMethodPath('search');
        var features = this.connection.post(path, query);
        return utils_1.transformFeatures(features);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL21vZHVsZXMva25vd2xlZGdlX2Jhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsMEJBQTRCO0FBRzVCLG9EQUFvRDtBQUVwRCwyQ0FBc0U7QUFFdEUscURBQWlEO0FBRWpEO0lBQWdELDhDQUFRO0lBQ3BELG9DQUFZLE9BQWU7UUFBM0IsWUFDSSxrQkFBTSxPQUFPLENBQUMsU0FHakI7UUFGRyxnSUFBZ0k7UUFDaEksTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsS0FBSSxFQUFFLDBCQUEwQixDQUFDLFNBQVMsQ0FBQyxDQUFDOztJQUN6RSxDQUFDO0lBQ0wsaUNBQUM7QUFBRCxDQU5BLEFBTUMsQ0FOK0MsZ0JBQVEsR0FNdkQ7QUFOWSxnRUFBMEI7QUFPdkM7SUFBeUMsdUNBQVE7SUFDN0MsNkJBQVksT0FBZTtRQUEzQixZQUNJLGtCQUFNLE9BQU8sQ0FBQyxTQUdqQjtRQUZHLGdJQUFnSTtRQUNoSSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxLQUFJLEVBQUUsbUJBQW1CLENBQUMsU0FBUyxDQUFDLENBQUM7O0lBQ2xFLENBQUM7SUFDTCwwQkFBQztBQUFELENBTkEsQUFNQyxDQU53QyxnQkFBUSxHQU1oRDtBQU5ZLGtEQUFtQjtBQVFoQzs7R0FFRztBQUNIO0lBQW9ELHlDQUFjO0lBQWxFOztJQU9BLENBQUM7SUFORzs7T0FFRztJQUNPLGtEQUFrQixHQUE1QjtRQUNJLE1BQU0sQ0FBSSxJQUFJLENBQUMsV0FBVyxFQUFFLFFBQUssQ0FBQztJQUN0QyxDQUFDO0lBQ0wsNEJBQUM7QUFBRCxDQVBBLEFBT0MsQ0FQbUQsZ0NBQWMsR0FPakU7QUFQcUIsc0RBQXFCO0FBUzNDOztHQUVHO0FBQ0g7SUFBcUMsbUNBQXFCO0lBQ3RELHlCQUFZLFVBQXNCO2VBQzlCLGtCQUFNLFNBQVMsRUFBRSxVQUFVLENBQUM7SUFDaEMsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSSxvQ0FBVSxHQUFqQixVQUFrQixLQUF5QjtRQUN2QyxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFaEQsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFrQixJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUMsUUFBUTtZQUNsRSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RCLE1BQU0sSUFBSSwwQkFBMEIsQ0FDaEMsZ0RBQThDLEtBQUssQ0FBQyxVQUFVLG9CQUFlLEtBQUssQ0FBQyxNQUFRLENBQzlGLENBQUM7WUFDTixDQUFDO1lBQ0QsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN4QixNQUFNLElBQUksbUJBQW1CLENBQUMsc0NBQW9DLEtBQUssQ0FBQyxVQUFVLG9CQUFlLEtBQUssQ0FBQyxNQUFNLGVBQVksQ0FBQyxDQUFDO1lBQy9ILENBQUM7WUFFRCxNQUFNLENBQUMsd0JBQWdCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQy9DLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVNLHFDQUFXLEdBQWxCLFVBQW1CLEtBQTBCO1FBQ3pDLElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNoRCxJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBa0IsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3BFLE1BQU0sQ0FBQyx5QkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNJLGdDQUFNLEdBQWIsVUFBYyxLQUErQjtRQUN6QyxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEQsSUFBSSxPQUF1QyxDQUFDO1FBRTVDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6QixPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQWtCLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNqRSxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDSixPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQWtCLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNoRSxDQUFDO1FBRUQsTUFBTSxDQUFDLHlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFRDs7OztPQUlHO0lBQ0ksc0NBQVksR0FBbkIsVUFBb0IsS0FBcUM7UUFDckQsSUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ3RELE1BQU0sQ0FBQyx5QkFBaUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBa0IsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDakYsQ0FBQztJQUNMLHNCQUFDO0FBQUQsQ0EvREEsQUErREMsQ0EvRG9DLHFCQUFxQixHQStEekQ7QUEvRFksMENBQWUiLCJmaWxlIjoiYXBpL3Jlc291cmNlcy9tb2R1bGVzL2tub3dsZWRnZV9iYXNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgUnggZnJvbSAncngnO1xuXG5pbXBvcnQge0dlbkVycm9yfSBmcm9tICcuLi8uLi8uLi9jb3JlL2Vycm9ycy9lcnJvcic7XG5pbXBvcnQge0Nvbm5lY3Rpb259IGZyb20gJy4uLy4uL2Nvbm5lY3Rpb24nO1xuaW1wb3J0IHt0cmFuc2Zvcm1GZWF0dXJlLCB0cmFuc2Zvcm1GZWF0dXJlc30gZnJvbSAnLi4vLi4vdHlwZXMvdXRpbHMnO1xuaW1wb3J0ICogYXMgdHlwZXMgZnJvbSAnLi4vLi4vdHlwZXMvbW9kdWxlcyc7XG5pbXBvcnQge01vZHVsZVJlc291cmNlfSBmcm9tICcuL21vZHVsZV9yZXNvdXJjZSc7XG5cbmV4cG9ydCBjbGFzcyBNdWx0aXBsZUZlYXR1cmVzRm91bmRFcnJvciBleHRlbmRzIEdlbkVycm9yIHtcbiAgICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICAgICAgc3VwZXIobWVzc2FnZSk7XG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWNyb3NvZnQvVHlwZVNjcmlwdC93aWtpL0JyZWFraW5nLUNoYW5nZXMjZXh0ZW5kaW5nLWJ1aWx0LWlucy1saWtlLWVycm9yLWFycmF5LWFuZC1tYXAtbWF5LW5vLWxvbmdlci13b3JrXG4gICAgICAgIE9iamVjdFsnc2V0UHJvdG90eXBlT2YnXSh0aGlzLCBNdWx0aXBsZUZlYXR1cmVzRm91bmRFcnJvci5wcm90b3R5cGUpO1xuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBOb0ZlYXR1cmVGb3VuZEVycm9yIGV4dGVuZHMgR2VuRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZykge1xuICAgICAgICBzdXBlcihtZXNzYWdlKTtcbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L3dpa2kvQnJlYWtpbmctQ2hhbmdlcyNleHRlbmRpbmctYnVpbHQtaW5zLWxpa2UtZXJyb3ItYXJyYXktYW5kLW1hcC1tYXktbm8tbG9uZ2VyLXdvcmtcbiAgICAgICAgT2JqZWN0WydzZXRQcm90b3R5cGVPZiddKHRoaXMsIE5vRmVhdHVyZUZvdW5kRXJyb3IucHJvdG90eXBlKTtcbiAgICB9XG59XG5cbi8qKlxuICogQWJzdHJhY3QgYmFzZSBjbGFzcyBmb3Iga25vd2xlZGdlIGJhc2UgcmVzb3VyY2VzLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgS25vd2xlZGdlQmFzZVJlc291cmNlIGV4dGVuZHMgTW9kdWxlUmVzb3VyY2Uge1xuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGdldE1vZHVsZXNCYXNlUGF0aCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYCR7dGhpcy5nZXRCYXNlUGF0aCgpfS9rYmA7XG4gICAgfVxufVxuXG4vKipcbiAqIEtub3dsZWRnZSBiYXNlIGZlYXR1cmUgcmVzb3VyY2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBGZWF0dXJlUmVzb3VyY2UgZXh0ZW5kcyBLbm93bGVkZ2VCYXNlUmVzb3VyY2Uge1xuICAgIGNvbnN0cnVjdG9yKGNvbm5lY3Rpb246IENvbm5lY3Rpb24pIHtcbiAgICAgICAgc3VwZXIoJ2ZlYXR1cmUnLCBjb25uZWN0aW9uKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIGEgc2luZ2xlIGZlYXR1cmUuIFJldHVybnMgdW5kZWZpbmVkIGlmIGZlYXR1cmUgbm90IGZvdW5kLlxuICAgICAqXG4gICAgICogQHBhcmFtIHF1ZXJ5IEZlYXR1cmUgcXVlcnlcbiAgICAgKiBAcmV0dXJucyBGZWF0dXJlXG4gICAgICogQHRocm93cyBgTXVsdGlwbGVGZWF0dXJlc0ZvdW5kRXJyb3JgIGlzIHRocm93biBpZiBtdWx0aXBsZSBmZWF0dXJlcyBmb3VuZFxuICAgICAqIEB0aHJvd3MgYE5vRmVhdHVyZUZvdW5kRXJyb3JgIGlzIHRocm93biBpZiBmZWF0dXJlIG5vdCBmb3VuZFxuICAgICAqL1xuICAgIHB1YmxpYyBnZXRGZWF0dXJlKHF1ZXJ5OiB0eXBlcy5GZWF0dXJlUXVlcnkpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLkZlYXR1cmU+IHtcbiAgICAgICAgY29uc3QgcGF0aCA9IHRoaXMuZ2V0TW9kdWxlTWV0aG9kUGF0aCgnc2VhcmNoJyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuY29ubmVjdGlvbi5nZXQ8dHlwZXMuRmVhdHVyZVtdPihwYXRoLCBxdWVyeSkubWFwKChmZWF0dXJlcykgPT4ge1xuICAgICAgICAgICAgaWYgKGZlYXR1cmVzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTXVsdGlwbGVGZWF0dXJlc0ZvdW5kRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgIGBNdWx0aXBsZSBmZWF0dXJlcyBpZGVudGlmaWVkIGJ5IGZlYXR1cmUgaWQgJHtxdWVyeS5mZWF0dXJlX2lkfSBhbmQgc291cmNlICR7cXVlcnkuc291cmNlfWBcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZlYXR1cmVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBOb0ZlYXR1cmVGb3VuZEVycm9yKGBGZWF0dXJlIGlkZW50aWZpZWQgYnkgZmVhdHVyZSBpZCAke3F1ZXJ5LmZlYXR1cmVfaWR9IGFuZCBzb3VyY2UgJHtxdWVyeS5zb3VyY2V9IG5vdCBmb3VuZGApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdHJhbnNmb3JtRmVhdHVyZShfLmZpcnN0KGZlYXR1cmVzKSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRGZWF0dXJlcyhxdWVyeTogdHlwZXMuRmVhdHVyZXNRdWVyeSk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuRmVhdHVyZVtdPiB7XG4gICAgICAgIGNvbnN0IHBhdGggPSB0aGlzLmdldE1vZHVsZU1ldGhvZFBhdGgoJ3NlYXJjaCcpO1xuICAgICAgICBjb25zdCBmZWF0dXJlcyA9IHRoaXMuY29ubmVjdGlvbi5wb3N0PHR5cGVzLkZlYXR1cmVbXT4ocGF0aCwgcXVlcnkpO1xuICAgICAgICByZXR1cm4gdHJhbnNmb3JtRmVhdHVyZXMoZmVhdHVyZXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlYXJjaGVzIGZvciBmZWF0dXJlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBxdWVyeSBGZWF0dXJlIHNlYXJjaCBxdWVyeVxuICAgICAqL1xuICAgIHB1YmxpYyBzZWFyY2gocXVlcnk6IHR5cGVzLkZlYXR1cmVTZWFyY2hRdWVyeSk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuRmVhdHVyZVtdPiB7XG4gICAgICAgIGNvbnN0IHBhdGggPSB0aGlzLmdldE1vZHVsZU1ldGhvZFBhdGgoJ3NlYXJjaCcpO1xuICAgICAgICBsZXQgcmVzdWx0czogUnguT2JzZXJ2YWJsZTx0eXBlcy5GZWF0dXJlW10+O1xuXG4gICAgICAgIGlmIChfLmlzQXJyYXkocXVlcnkucXVlcnkpKSB7XG4gICAgICAgICAgICByZXN1bHRzID0gdGhpcy5jb25uZWN0aW9uLnBvc3Q8dHlwZXMuRmVhdHVyZVtdPihwYXRoLCBxdWVyeSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHRzID0gdGhpcy5jb25uZWN0aW9uLmdldDx0eXBlcy5GZWF0dXJlW10+KHBhdGgsIHF1ZXJ5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cmFuc2Zvcm1GZWF0dXJlcyhyZXN1bHRzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtcyBhbiBhdXRvY29tcGxldGUgcXVlcnkgZm9yIGZlYXR1cmVzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHF1ZXJ5IEZlYXR1cmUgYXV0b2NvbXBsZXRlIHF1ZXJ5XG4gICAgICovXG4gICAgcHVibGljIGF1dG9jb21wbGV0ZShxdWVyeTogdHlwZXMuRmVhdHVyZUF1dG9jb21wbGV0ZVF1ZXJ5KTogUnguT2JzZXJ2YWJsZTx0eXBlcy5GZWF0dXJlW10+IHtcbiAgICAgICAgY29uc3QgcGF0aCA9IHRoaXMuZ2V0TW9kdWxlTWV0aG9kUGF0aCgnYXV0b2NvbXBsZXRlJyk7XG4gICAgICAgIHJldHVybiB0cmFuc2Zvcm1GZWF0dXJlcyh0aGlzLmNvbm5lY3Rpb24ucG9zdDx0eXBlcy5GZWF0dXJlW10+KHBhdGgsIHF1ZXJ5KSk7XG4gICAgfVxufVxuIl19
