"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvdHlwZXMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLDBCQUE0QjtBQUc1QixpREFBaUQ7QUFJakQ7O0dBRUc7QUFDSCwwQkFBaUMsT0FBZ0I7SUFDN0MsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQTJCLEVBQUUsRUFBRSxPQUFPLEVBQUU7UUFDbkQsRUFBRSxFQUFLLE9BQU8sQ0FBQyxNQUFNLFNBQUksT0FBTyxDQUFDLFVBQVk7S0FDaEQsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQUpELDRDQUlDO0FBRUQ7OztHQUdHO0FBQ0gsMkJBQWtDLFFBQWtDO0lBQ2hFLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUNmLFVBQUMsWUFBWSxJQUFLLE9BQUEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsVUFBQyxPQUFPLElBQUssT0FBQSxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsRUFBekIsQ0FBeUIsQ0FBQyxFQUEzRCxDQUEyRCxDQUNoRixDQUFDO0FBQ04sQ0FBQztBQUpELDhDQUlDO0FBRUQ7OztHQUdHO0FBQ0gsb0NBQTJDLFFBQW1EO0lBQzFGLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFVBQUMsUUFBUTtRQUN6QixJQUFNLGFBQWEsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsVUFBQyxPQUFPLElBQUssT0FBQSxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsRUFBekIsQ0FBeUIsQ0FBQyxDQUFDO1FBRXRGLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUNYLEVBQUUsRUFBRSxRQUFRLEVBQUUsRUFBRSxPQUFPLEVBQUUsYUFBYSxFQUFFLENBQzNDLENBQUM7SUFDTixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUFSRCxnRUFRQztBQUVEOztHQUVHO0FBQ0gsMEJBQWlDLEtBQVksRUFBRSxNQUFnQjtJQUMzRCxNQUFNLGNBQUssS0FBSyxJQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFFO0FBQ2hELENBQUM7QUFGRCw0Q0FFQztBQUVEOzs7Ozs7R0FNRztBQUNILCtCQUFzQyxRQUFtQjtJQUNyRCxJQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLFVBQUMsT0FBTyxJQUFLLE9BQUEsT0FBTyxDQUFDLE1BQU0sRUFBZCxDQUFjLENBQUMsQ0FBQyxDQUFDO0lBRXZFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLE1BQU0sSUFBSSxnQkFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFDRCxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEIsTUFBTSxJQUFJLGdCQUFRLENBQUMsMENBQXdDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQUcsQ0FBQyxDQUFDO0lBQ3RGLENBQUM7SUFFRCxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLENBQUM7QUFDcEMsQ0FBQztBQVhELHNEQVdDIiwiZmlsZSI6ImFwaS90eXBlcy91dGlscy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIFJ4IGZyb20gJ3J4JztcblxuaW1wb3J0IHtHZW5FcnJvcn0gZnJvbSAnLi4vLi4vY29yZS9lcnJvcnMvZXJyb3InO1xuaW1wb3J0IHtRdWVyeSwgUGFnaW5hdGVkUmVzcG9uc2V9IGZyb20gJy4vcmVzdCc7XG5pbXBvcnQge0ZlYXR1cmV9IGZyb20gJy4vbW9kdWxlcyc7XG5cbi8qKlxuICogVHJhbnNmb3JtcyBhIGZlYXR1cmUgaW50byBvbmUgd2l0aCBzb21lIGF1Z21lbnRlZCBhdHRyaWJ1dGVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNmb3JtRmVhdHVyZShmZWF0dXJlOiBGZWF0dXJlKTogRmVhdHVyZSB7XG4gICAgcmV0dXJuIF8uYXNzaWduPHt9LCBGZWF0dXJlLCB7fSwgRmVhdHVyZT4oe30sIGZlYXR1cmUsIHtcbiAgICAgICAgaWQ6IGAke2ZlYXR1cmUuc291cmNlfToke2ZlYXR1cmUuZmVhdHVyZV9pZH1gLFxuICAgIH0pO1xufVxuXG4vKipcbiAqIFRyYW5zZm9ybXMgZmVhdHVyZXMgcmV0dXJuZWQgZnJvbSB0aGUgQVBJIGludG8gb25lIHdpdGggc29tZVxuICogYXVnbWVudGVkIGF0dHJpYnV0ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2Zvcm1GZWF0dXJlcyhmZWF0dXJlczogUnguT2JzZXJ2YWJsZTxGZWF0dXJlW10+KTogUnguT2JzZXJ2YWJsZTxGZWF0dXJlW10+IHtcbiAgICByZXR1cm4gZmVhdHVyZXMubWFwKFxuICAgICAgICAoZmVhdHVyZXNMaXN0KSA9PiBfLm1hcChmZWF0dXJlc0xpc3QsIChmZWF0dXJlKSA9PiB0cmFuc2Zvcm1GZWF0dXJlKGZlYXR1cmUpKVxuICAgICk7XG59XG5cbi8qKlxuICogVHJhbnNmb3JtcyBwYWdpbmF0ZWQgZmVhdHVyZXMgcmV0dXJuZWQgZnJvbSB0aGUgQVBJIGludG8gb25lIHdpdGggc29tZVxuICogYXVnbWVudGVkIGF0dHJpYnV0ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2Zvcm1GZWF0dXJlc1BhZ2luYXRlZChmZWF0dXJlczogUnguT2JzZXJ2YWJsZTxQYWdpbmF0ZWRSZXNwb25zZTxGZWF0dXJlPj4pOiBSeC5PYnNlcnZhYmxlPFBhZ2luYXRlZFJlc3BvbnNlPEZlYXR1cmU+PiB7XG4gICAgcmV0dXJuIGZlYXR1cmVzLm1hcCgocmVzcG9uc2UpID0+IHtcbiAgICAgICAgY29uc3QgbWFwcGVkUmVzdWx0cyA9IF8ubWFwKHJlc3BvbnNlLnJlc3VsdHMsIChmZWF0dXJlKSA9PiB0cmFuc2Zvcm1GZWF0dXJlKGZlYXR1cmUpKTtcblxuICAgICAgICByZXR1cm4gXy5hc3NpZ248e30sIHt9LCB7IHJlc3VsdHM6IEZlYXR1cmVbXSB9LCBQYWdpbmF0ZWRSZXNwb25zZTxGZWF0dXJlPj4oXG4gICAgICAgICAgICB7fSwgcmVzcG9uc2UsIHsgcmVzdWx0czogbWFwcGVkUmVzdWx0cyB9XG4gICAgICAgICk7XG4gICAgfSk7XG59XG5cbi8qKlxuICogVHJhbnNmb3JtcyBxdWVyeSB0byByZXR1cm4gcmVzcG9uc2Ugd2l0aCBsaW1pdGVkIHNldCBvZiBmaWVsZHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsaW1pdEZpZWxkc1F1ZXJ5KHF1ZXJ5OiBRdWVyeSwgZmllbGRzOiBzdHJpbmdbXSk6IFF1ZXJ5IHtcbiAgICByZXR1cm4gey4uLnF1ZXJ5LCBmaWVsZHM6IGZpZWxkcy5qb2luKCcsJyl9O1xufVxuXG4vKipcbiAqIFJldHVybnMgZmVhdHVyZXMnIHNvdXJjZS5cbiAqXG4gKiBUaHJvd3MgYEdlbkVycm9yYCBpZiBzb3VyY2UgY2Fubm90IGJlIGRldGVybWluZWQuXG4gKlxuICogQHBhcmFtIGZlYXR1cmVzIEZlYXR1cmVzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTb3VyY2VGcm9tRmVhdHVyZXMoZmVhdHVyZXM6IEZlYXR1cmVbXSk6IHN0cmluZyB7XG4gICAgY29uc3Qgc291cmNlcyA9IF8udW5pcXVlKF8ubWFwKGZlYXR1cmVzLCAoZmVhdHVyZSkgPT4gZmVhdHVyZS5zb3VyY2UpKTtcblxuICAgIGlmIChfLmlzRW1wdHkoZmVhdHVyZXMpKSB7XG4gICAgICAgIHRocm93IG5ldyBHZW5FcnJvcignTm8gZmVhdHVyZXMnKTtcbiAgICB9XG4gICAgaWYgKF8uc2l6ZShzb3VyY2VzKSA+IDEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEdlbkVycm9yKGBGZWF0dXJlcyBjb21lIGZyb20gbXVsdGlwbGUgc291cmNlcyAoJHtzb3VyY2VzLmpvaW4oJywgJyl9KWApO1xuICAgIH1cblxuICAgIHJldHVybiBfLmZpcnN0KGZlYXR1cmVzKS5zb3VyY2U7XG59XG4iXX0=
