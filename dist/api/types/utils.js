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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvdHlwZXMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsMEJBQTRCO0FBRzVCLGlEQUFpRDtBQUlqRDs7R0FFRztBQUNILDBCQUEwQixPQUFnQjtJQUN0QyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBMkIsRUFBRSxFQUFFLE9BQU8sRUFBRTtRQUNuRCxFQUFFLEVBQUssT0FBTyxDQUFDLE1BQU0sU0FBSSxPQUFPLENBQUMsVUFBWTtLQUNoRCxDQUFDLENBQUM7QUFDUCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsMkJBQWtDLFFBQWtDO0lBQ2hFLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUNmLFVBQUMsWUFBWSxJQUFLLE9BQUEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsVUFBQyxPQUFPLElBQUssT0FBQSxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsRUFBekIsQ0FBeUIsQ0FBQyxFQUEzRCxDQUEyRCxDQUNoRixDQUFDO0FBQ04sQ0FBQztBQUpELDhDQUlDO0FBRUQ7OztHQUdHO0FBQ0gsb0NBQTJDLFFBQW1EO0lBQzFGLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFVBQUMsUUFBUTtRQUN6QixJQUFNLGFBQWEsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsVUFBQyxPQUFPLElBQUssT0FBQSxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsRUFBekIsQ0FBeUIsQ0FBQyxDQUFDO1FBRXRGLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUNYLEVBQUUsRUFBRSxRQUFRLEVBQUUsRUFBRSxPQUFPLEVBQUUsYUFBYSxFQUFFLENBQzNDLENBQUM7SUFDTixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUFSRCxnRUFRQztBQUVEOztHQUVHO0FBQ0gsMEJBQWlDLEtBQVksRUFBRSxNQUFnQjtJQUMzRCxNQUFNLGNBQUssS0FBSyxJQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFFO0FBQ2hELENBQUM7QUFGRCw0Q0FFQztBQUVEOzs7Ozs7R0FNRztBQUNILCtCQUFzQyxRQUFtQjtJQUNyRCxJQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLFVBQUMsT0FBTyxJQUFLLE9BQUEsT0FBTyxDQUFDLE1BQU0sRUFBZCxDQUFjLENBQUMsQ0FBQyxDQUFDO0lBRXZFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLE1BQU0sSUFBSSxnQkFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFDRCxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEIsTUFBTSxJQUFJLGdCQUFRLENBQUMsMENBQXdDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQUcsQ0FBQyxDQUFDO0lBQ3RGLENBQUM7SUFFRCxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLENBQUM7QUFDcEMsQ0FBQztBQVhELHNEQVdDIiwiZmlsZSI6ImFwaS90eXBlcy91dGlscy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIFJ4IGZyb20gJ3J4JztcblxuaW1wb3J0IHtHZW5FcnJvcn0gZnJvbSAnLi4vLi4vY29yZS9lcnJvcnMvZXJyb3InO1xuaW1wb3J0IHtRdWVyeSwgUGFnaW5hdGVkUmVzcG9uc2V9IGZyb20gJy4vcmVzdCc7XG5pbXBvcnQge0ZlYXR1cmV9IGZyb20gJy4vbW9kdWxlcyc7XG5cbi8qKlxuICogVHJhbnNmb3JtcyBhIGZlYXR1cmUgaW50byBvbmUgd2l0aCBzb21lIGF1Z21lbnRlZCBhdHRyaWJ1dGVzLlxuICovXG5mdW5jdGlvbiB0cmFuc2Zvcm1GZWF0dXJlKGZlYXR1cmU6IEZlYXR1cmUpOiBGZWF0dXJlIHtcbiAgICByZXR1cm4gXy5hc3NpZ248e30sIEZlYXR1cmUsIHt9LCBGZWF0dXJlPih7fSwgZmVhdHVyZSwge1xuICAgICAgICBpZDogYCR7ZmVhdHVyZS5zb3VyY2V9OiR7ZmVhdHVyZS5mZWF0dXJlX2lkfWAsXG4gICAgfSk7XG59XG5cbi8qKlxuICogVHJhbnNmb3JtcyBmZWF0dXJlcyByZXR1cm5lZCBmcm9tIHRoZSBBUEkgaW50byBvbmUgd2l0aCBzb21lXG4gKiBhdWdtZW50ZWQgYXR0cmlidXRlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zZm9ybUZlYXR1cmVzKGZlYXR1cmVzOiBSeC5PYnNlcnZhYmxlPEZlYXR1cmVbXT4pOiBSeC5PYnNlcnZhYmxlPEZlYXR1cmVbXT4ge1xuICAgIHJldHVybiBmZWF0dXJlcy5tYXAoXG4gICAgICAgIChmZWF0dXJlc0xpc3QpID0+IF8ubWFwKGZlYXR1cmVzTGlzdCwgKGZlYXR1cmUpID0+IHRyYW5zZm9ybUZlYXR1cmUoZmVhdHVyZSkpXG4gICAgKTtcbn1cblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHBhZ2luYXRlZCBmZWF0dXJlcyByZXR1cm5lZCBmcm9tIHRoZSBBUEkgaW50byBvbmUgd2l0aCBzb21lXG4gKiBhdWdtZW50ZWQgYXR0cmlidXRlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zZm9ybUZlYXR1cmVzUGFnaW5hdGVkKGZlYXR1cmVzOiBSeC5PYnNlcnZhYmxlPFBhZ2luYXRlZFJlc3BvbnNlPEZlYXR1cmU+Pik6IFJ4Lk9ic2VydmFibGU8UGFnaW5hdGVkUmVzcG9uc2U8RmVhdHVyZT4+IHtcbiAgICByZXR1cm4gZmVhdHVyZXMubWFwKChyZXNwb25zZSkgPT4ge1xuICAgICAgICBjb25zdCBtYXBwZWRSZXN1bHRzID0gXy5tYXAocmVzcG9uc2UucmVzdWx0cywgKGZlYXR1cmUpID0+IHRyYW5zZm9ybUZlYXR1cmUoZmVhdHVyZSkpO1xuXG4gICAgICAgIHJldHVybiBfLmFzc2lnbjx7fSwge30sIHsgcmVzdWx0czogRmVhdHVyZVtdIH0sIFBhZ2luYXRlZFJlc3BvbnNlPEZlYXR1cmU+PihcbiAgICAgICAgICAgIHt9LCByZXNwb25zZSwgeyByZXN1bHRzOiBtYXBwZWRSZXN1bHRzIH1cbiAgICAgICAgKTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHF1ZXJ5IHRvIHJldHVybiByZXNwb25zZSB3aXRoIGxpbWl0ZWQgc2V0IG9mIGZpZWxkcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpbWl0RmllbGRzUXVlcnkocXVlcnk6IFF1ZXJ5LCBmaWVsZHM6IHN0cmluZ1tdKTogUXVlcnkge1xuICAgIHJldHVybiB7Li4ucXVlcnksIGZpZWxkczogZmllbGRzLmpvaW4oJywnKX07XG59XG5cbi8qKlxuICogUmV0dXJucyBmZWF0dXJlcycgc291cmNlLlxuICpcbiAqIFRocm93cyBgR2VuRXJyb3JgIGlmIHNvdXJjZSBjYW5ub3QgYmUgZGV0ZXJtaW5lZC5cbiAqXG4gKiBAcGFyYW0gZmVhdHVyZXMgRmVhdHVyZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFNvdXJjZUZyb21GZWF0dXJlcyhmZWF0dXJlczogRmVhdHVyZVtdKTogc3RyaW5nIHtcbiAgICBjb25zdCBzb3VyY2VzID0gXy51bmlxdWUoXy5tYXAoZmVhdHVyZXMsIChmZWF0dXJlKSA9PiBmZWF0dXJlLnNvdXJjZSkpO1xuXG4gICAgaWYgKF8uaXNFbXB0eShmZWF0dXJlcykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEdlbkVycm9yKCdObyBmZWF0dXJlcycpO1xuICAgIH1cbiAgICBpZiAoXy5zaXplKHNvdXJjZXMpID4gMSkge1xuICAgICAgICB0aHJvdyBuZXcgR2VuRXJyb3IoYEZlYXR1cmVzIGNvbWUgZnJvbSBtdWx0aXBsZSBzb3VyY2VzICgke3NvdXJjZXMuam9pbignLCAnKX0pYCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIF8uZmlyc3QoZmVhdHVyZXMpLnNvdXJjZTtcbn1cbiJdfQ==
