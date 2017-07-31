"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var _ = require("lodash");
var error_1 = require("../../core/errors/error");
/**
 * Transforms a feature into one with some augmented attributes.
 */
function transformFeature(feature) {
    return _.assign({}, feature, {
        id: feature.source + ":" + feature.feature_id,
    });
}
exports.transformFeature = transformFeature;
/**
 * Transforms features returned from the API into one with some
 * augmented attributes.
 */
function transformFeatures(features) {
    return features.map(function (featuresList) { return _.map(featuresList, function (feature) { return transformFeature(feature); }); });
}
exports.transformFeatures = transformFeatures;
/**
 * Transforms paginated features returned from the API into one with some
 * augmented attributes.
 */
function transformFeaturesPaginated(features) {
    return features.map(function (response) {
        var mappedResults = _.map(response.results, function (feature) { return transformFeature(feature); });
        return _.assign({}, response, { results: mappedResults });
    });
}
exports.transformFeaturesPaginated = transformFeaturesPaginated;
/**
 * Transforms query to return response with limited set of fields.
 */
function limitFieldsQuery(query, fields) {
    return __assign({}, query, { fields: fields.join(',') });
}
exports.limitFieldsQuery = limitFieldsQuery;
/**
 * Returns features' source.
 *
 * Throws `GenError` if source cannot be determined.
 *
 * @param features Features
 */
function getSourceFromFeatures(features) {
    var sources = _.unique(_.map(features, function (feature) { return feature.source; }));
    if (_.isEmpty(features)) {
        throw new error_1.GenError('No features');
    }
    if (_.size(sources) > 1) {
        throw new error_1.GenError("Features come from multiple sources (" + sources.join(', ') + ")");
    }
    return _.first(features).source;
}
exports.getSourceFromFeatures = getSourceFromFeatures;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvdHlwZXMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsMEJBQTRCO0FBRzVCLGlEQUFpRDtBQUlqRDs7R0FFRztBQUNILDBCQUFpQyxPQUFnQjtJQUM3QyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBMkIsRUFBRSxFQUFFLE9BQU8sRUFBRTtRQUNuRCxFQUFFLEVBQUssT0FBTyxDQUFDLE1BQU0sU0FBSSxPQUFPLENBQUMsVUFBWTtLQUNoRCxDQUFDLENBQUM7QUFDUCxDQUFDO0FBSkQsNENBSUM7QUFFRDs7O0dBR0c7QUFDSCwyQkFBa0MsUUFBa0M7SUFDaEUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQ2YsVUFBQyxZQUFZLElBQUssT0FBQSxDQUFDLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxVQUFDLE9BQU8sSUFBSyxPQUFBLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxFQUF6QixDQUF5QixDQUFDLEVBQTNELENBQTJELENBQ2hGLENBQUM7QUFDTixDQUFDO0FBSkQsOENBSUM7QUFFRDs7O0dBR0c7QUFDSCxvQ0FBMkMsUUFBbUQ7SUFDMUYsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBQyxRQUFRO1FBQ3pCLElBQU0sYUFBYSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxVQUFDLE9BQU8sSUFBSyxPQUFBLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxFQUF6QixDQUF5QixDQUFDLENBQUM7UUFFdEYsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQ1gsRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLE9BQU8sRUFBRSxhQUFhLEVBQUUsQ0FDM0MsQ0FBQztJQUNOLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQVJELGdFQVFDO0FBRUQ7O0dBRUc7QUFDSCwwQkFBaUMsS0FBWSxFQUFFLE1BQWdCO0lBQzNELE1BQU0sY0FBSyxLQUFLLElBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUU7QUFDaEQsQ0FBQztBQUZELDRDQUVDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsK0JBQXNDLFFBQW1CO0lBQ3JELElBQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsVUFBQyxPQUFPLElBQUssT0FBQSxPQUFPLENBQUMsTUFBTSxFQUFkLENBQWMsQ0FBQyxDQUFDLENBQUM7SUFFdkUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEIsTUFBTSxJQUFJLGdCQUFRLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUNELEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0QixNQUFNLElBQUksZ0JBQVEsQ0FBQywwQ0FBd0MsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBRyxDQUFDLENBQUM7SUFDdEYsQ0FBQztJQUVELE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUNwQyxDQUFDO0FBWEQsc0RBV0MiLCJmaWxlIjoiYXBpL3R5cGVzL3V0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgUnggZnJvbSAncngnO1xuXG5pbXBvcnQge0dlbkVycm9yfSBmcm9tICcuLi8uLi9jb3JlL2Vycm9ycy9lcnJvcic7XG5pbXBvcnQge1F1ZXJ5LCBQYWdpbmF0ZWRSZXNwb25zZX0gZnJvbSAnLi9yZXN0JztcbmltcG9ydCB7RmVhdHVyZX0gZnJvbSAnLi9tb2R1bGVzJztcblxuLyoqXG4gKiBUcmFuc2Zvcm1zIGEgZmVhdHVyZSBpbnRvIG9uZSB3aXRoIHNvbWUgYXVnbWVudGVkIGF0dHJpYnV0ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2Zvcm1GZWF0dXJlKGZlYXR1cmU6IEZlYXR1cmUpOiBGZWF0dXJlIHtcbiAgICByZXR1cm4gXy5hc3NpZ248e30sIEZlYXR1cmUsIHt9LCBGZWF0dXJlPih7fSwgZmVhdHVyZSwge1xuICAgICAgICBpZDogYCR7ZmVhdHVyZS5zb3VyY2V9OiR7ZmVhdHVyZS5mZWF0dXJlX2lkfWAsXG4gICAgfSk7XG59XG5cbi8qKlxuICogVHJhbnNmb3JtcyBmZWF0dXJlcyByZXR1cm5lZCBmcm9tIHRoZSBBUEkgaW50byBvbmUgd2l0aCBzb21lXG4gKiBhdWdtZW50ZWQgYXR0cmlidXRlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zZm9ybUZlYXR1cmVzKGZlYXR1cmVzOiBSeC5PYnNlcnZhYmxlPEZlYXR1cmVbXT4pOiBSeC5PYnNlcnZhYmxlPEZlYXR1cmVbXT4ge1xuICAgIHJldHVybiBmZWF0dXJlcy5tYXAoXG4gICAgICAgIChmZWF0dXJlc0xpc3QpID0+IF8ubWFwKGZlYXR1cmVzTGlzdCwgKGZlYXR1cmUpID0+IHRyYW5zZm9ybUZlYXR1cmUoZmVhdHVyZSkpXG4gICAgKTtcbn1cblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHBhZ2luYXRlZCBmZWF0dXJlcyByZXR1cm5lZCBmcm9tIHRoZSBBUEkgaW50byBvbmUgd2l0aCBzb21lXG4gKiBhdWdtZW50ZWQgYXR0cmlidXRlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zZm9ybUZlYXR1cmVzUGFnaW5hdGVkKGZlYXR1cmVzOiBSeC5PYnNlcnZhYmxlPFBhZ2luYXRlZFJlc3BvbnNlPEZlYXR1cmU+Pik6IFJ4Lk9ic2VydmFibGU8UGFnaW5hdGVkUmVzcG9uc2U8RmVhdHVyZT4+IHtcbiAgICByZXR1cm4gZmVhdHVyZXMubWFwKChyZXNwb25zZSkgPT4ge1xuICAgICAgICBjb25zdCBtYXBwZWRSZXN1bHRzID0gXy5tYXAocmVzcG9uc2UucmVzdWx0cywgKGZlYXR1cmUpID0+IHRyYW5zZm9ybUZlYXR1cmUoZmVhdHVyZSkpO1xuXG4gICAgICAgIHJldHVybiBfLmFzc2lnbjx7fSwge30sIHsgcmVzdWx0czogRmVhdHVyZVtdIH0sIFBhZ2luYXRlZFJlc3BvbnNlPEZlYXR1cmU+PihcbiAgICAgICAgICAgIHt9LCByZXNwb25zZSwgeyByZXN1bHRzOiBtYXBwZWRSZXN1bHRzIH1cbiAgICAgICAgKTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHF1ZXJ5IHRvIHJldHVybiByZXNwb25zZSB3aXRoIGxpbWl0ZWQgc2V0IG9mIGZpZWxkcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpbWl0RmllbGRzUXVlcnkocXVlcnk6IFF1ZXJ5LCBmaWVsZHM6IHN0cmluZ1tdKTogUXVlcnkge1xuICAgIHJldHVybiB7Li4ucXVlcnksIGZpZWxkczogZmllbGRzLmpvaW4oJywnKX07XG59XG5cbi8qKlxuICogUmV0dXJucyBmZWF0dXJlcycgc291cmNlLlxuICpcbiAqIFRocm93cyBgR2VuRXJyb3JgIGlmIHNvdXJjZSBjYW5ub3QgYmUgZGV0ZXJtaW5lZC5cbiAqXG4gKiBAcGFyYW0gZmVhdHVyZXMgRmVhdHVyZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFNvdXJjZUZyb21GZWF0dXJlcyhmZWF0dXJlczogRmVhdHVyZVtdKTogc3RyaW5nIHtcbiAgICBjb25zdCBzb3VyY2VzID0gXy51bmlxdWUoXy5tYXAoZmVhdHVyZXMsIChmZWF0dXJlKSA9PiBmZWF0dXJlLnNvdXJjZSkpO1xuXG4gICAgaWYgKF8uaXNFbXB0eShmZWF0dXJlcykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEdlbkVycm9yKCdObyBmZWF0dXJlcycpO1xuICAgIH1cbiAgICBpZiAoXy5zaXplKHNvdXJjZXMpID4gMSkge1xuICAgICAgICB0aHJvdyBuZXcgR2VuRXJyb3IoYEZlYXR1cmVzIGNvbWUgZnJvbSBtdWx0aXBsZSBzb3VyY2VzICgke3NvdXJjZXMuam9pbignLCAnKX0pYCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIF8uZmlyc3QoZmVhdHVyZXMpLnNvdXJjZTtcbn1cbiJdfQ==
