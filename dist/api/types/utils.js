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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvdHlwZXMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsMEJBQTRCO0FBTTVCOztHQUVHO0FBQ0gsMEJBQTBCLE9BQWdCO0lBQ3RDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUEyQixFQUFFLEVBQUUsT0FBTyxFQUFFO1FBQ25ELEVBQUUsRUFBSyxPQUFPLENBQUMsTUFBTSxTQUFJLE9BQU8sQ0FBQyxVQUFZO0tBQ2hELENBQUMsQ0FBQztBQUNQLENBQUM7QUFFRDs7O0dBR0c7QUFDSCwyQkFBa0MsUUFBa0M7SUFDaEUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQ2YsVUFBQyxZQUFZLElBQUssT0FBQSxDQUFDLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxVQUFDLE9BQU8sSUFBSyxPQUFBLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxFQUF6QixDQUF5QixDQUFDLEVBQTNELENBQTJELENBQ2hGLENBQUM7QUFDTixDQUFDO0FBSkQsOENBSUM7QUFFRDs7O0dBR0c7QUFDSCxvQ0FBMkMsUUFBbUQ7SUFDMUYsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBQyxRQUFRO1FBQ3pCLElBQU0sYUFBYSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxVQUFDLE9BQU8sSUFBSyxPQUFBLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxFQUF6QixDQUF5QixDQUFDLENBQUM7UUFFdEYsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQ1gsRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLE9BQU8sRUFBRSxhQUFhLEVBQUUsQ0FDM0MsQ0FBQztJQUNOLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQVJELGdFQVFDO0FBRUQ7O0dBRUc7QUFDSCwwQkFBaUMsS0FBWSxFQUFFLE1BQWdCO0lBQzNELE1BQU0sY0FBSyxLQUFLLElBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUU7QUFDaEQsQ0FBQztBQUZELDRDQUVDIiwiZmlsZSI6ImFwaS90eXBlcy91dGlscy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIFJ4IGZyb20gJ3J4JztcblxuaW1wb3J0IHtRdWVyeSwgUGFnaW5hdGVkUmVzcG9uc2V9IGZyb20gJy4vcmVzdCc7XG5pbXBvcnQge0ZlYXR1cmV9IGZyb20gJy4vbW9kdWxlcyc7XG5cbi8qKlxuICogVHJhbnNmb3JtcyBhIGZlYXR1cmUgaW50byBvbmUgd2l0aCBzb21lIGF1Z21lbnRlZCBhdHRyaWJ1dGVzLlxuICovXG5mdW5jdGlvbiB0cmFuc2Zvcm1GZWF0dXJlKGZlYXR1cmU6IEZlYXR1cmUpOiBGZWF0dXJlIHtcbiAgICByZXR1cm4gXy5hc3NpZ248e30sIEZlYXR1cmUsIHt9LCBGZWF0dXJlPih7fSwgZmVhdHVyZSwge1xuICAgICAgICBpZDogYCR7ZmVhdHVyZS5zb3VyY2V9OiR7ZmVhdHVyZS5mZWF0dXJlX2lkfWAsXG4gICAgfSk7XG59XG5cbi8qKlxuICogVHJhbnNmb3JtcyBmZWF0dXJlcyByZXR1cm5lZCBmcm9tIHRoZSBBUEkgaW50byBvbmUgd2l0aCBzb21lXG4gKiBhdWdtZW50ZWQgYXR0cmlidXRlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zZm9ybUZlYXR1cmVzKGZlYXR1cmVzOiBSeC5PYnNlcnZhYmxlPEZlYXR1cmVbXT4pOiBSeC5PYnNlcnZhYmxlPEZlYXR1cmVbXT4ge1xuICAgIHJldHVybiBmZWF0dXJlcy5tYXAoXG4gICAgICAgIChmZWF0dXJlc0xpc3QpID0+IF8ubWFwKGZlYXR1cmVzTGlzdCwgKGZlYXR1cmUpID0+IHRyYW5zZm9ybUZlYXR1cmUoZmVhdHVyZSkpXG4gICAgKTtcbn1cblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHBhZ2luYXRlZCBmZWF0dXJlcyByZXR1cm5lZCBmcm9tIHRoZSBBUEkgaW50byBvbmUgd2l0aCBzb21lXG4gKiBhdWdtZW50ZWQgYXR0cmlidXRlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zZm9ybUZlYXR1cmVzUGFnaW5hdGVkKGZlYXR1cmVzOiBSeC5PYnNlcnZhYmxlPFBhZ2luYXRlZFJlc3BvbnNlPEZlYXR1cmU+Pik6IFJ4Lk9ic2VydmFibGU8UGFnaW5hdGVkUmVzcG9uc2U8RmVhdHVyZT4+IHtcbiAgICByZXR1cm4gZmVhdHVyZXMubWFwKChyZXNwb25zZSkgPT4ge1xuICAgICAgICBjb25zdCBtYXBwZWRSZXN1bHRzID0gXy5tYXAocmVzcG9uc2UucmVzdWx0cywgKGZlYXR1cmUpID0+IHRyYW5zZm9ybUZlYXR1cmUoZmVhdHVyZSkpO1xuXG4gICAgICAgIHJldHVybiBfLmFzc2lnbjx7fSwge30sIHsgcmVzdWx0czogRmVhdHVyZVtdIH0sIFBhZ2luYXRlZFJlc3BvbnNlPEZlYXR1cmU+PihcbiAgICAgICAgICAgIHt9LCByZXNwb25zZSwgeyByZXN1bHRzOiBtYXBwZWRSZXN1bHRzIH1cbiAgICAgICAgKTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHF1ZXJ5IHRvIHJldHVybiByZXNwb25zZSB3aXRoIGxpbWl0ZWQgc2V0IG9mIGZpZWxkcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpbWl0RmllbGRzUXVlcnkocXVlcnk6IFF1ZXJ5LCBmaWVsZHM6IHN0cmluZ1tdKTogUXVlcnkge1xuICAgIHJldHVybiB7Li4ucXVlcnksIGZpZWxkczogZmllbGRzLmpvaW4oJywnKX07XG59XG4iXX0=
