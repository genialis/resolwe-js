"use strict";
var _ = require("lodash");
/**
 * Error severity level.
 */
var SeverityLevel;
(function (SeverityLevel) {
    SeverityLevel[SeverityLevel["ERROR"] = 0] = "ERROR";
})(SeverityLevel = exports.SeverityLevel || (exports.SeverityLevel = {}));
function errorLog(errorMessages, associatedObject, severity) {
    if (errorMessages === void 0) { errorMessages = []; }
    if (severity === void 0) { severity = SeverityLevel.ERROR; }
    var messages = _.isArray(errorMessages) ? errorMessages : [errorMessages];
    // TODO: properly handle errors once error handling service (Sentry) is available.
    _.each(messages, function (error) {
        console.error(error, associatedObject || '');
    });
}
exports.errorLog = errorLog;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL3V0aWxzL2Vycm9yX2xvZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsMEJBQTRCO0FBRTVCOztHQUVHO0FBQ0gsSUFBWSxhQUVYO0FBRkQsV0FBWSxhQUFhO0lBQ3JCLG1EQUFLLENBQUE7QUFDVCxDQUFDLEVBRlcsYUFBYSxHQUFiLHFCQUFhLEtBQWIscUJBQWEsUUFFeEI7QUFFRCxrQkFBeUIsYUFBcUMsRUFDckMsZ0JBQXlCLEVBQ3pCLFFBQTZDO0lBRjdDLDhCQUFBLEVBQUEsa0JBQXFDO0lBRXJDLHlCQUFBLEVBQUEsV0FBMEIsYUFBYSxDQUFDLEtBQUs7SUFFbEUsSUFBTSxRQUFRLEdBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsR0FBRyxhQUFhLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUV0RixrRkFBa0Y7SUFDbEYsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsVUFBQyxLQUFLO1FBQ25CLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLGdCQUFnQixJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ2pELENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQVZELDRCQVVDIiwiZmlsZSI6ImNvcmUvdXRpbHMvZXJyb3JfbG9nLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuXG4vKipcbiAqIEVycm9yIHNldmVyaXR5IGxldmVsLlxuICovXG5leHBvcnQgZW51bSBTZXZlcml0eUxldmVsIHtcbiAgICBFUlJPUlxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXJyb3JMb2coZXJyb3JNZXNzYWdlczogc3RyaW5nIHwgc3RyaW5nW10gPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICBhc3NvY2lhdGVkT2JqZWN0PzogT2JqZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgIHNldmVyaXR5OiBTZXZlcml0eUxldmVsID0gU2V2ZXJpdHlMZXZlbC5FUlJPUik6IHZvaWQge1xuXG4gICAgY29uc3QgbWVzc2FnZXM6IHN0cmluZ1tdID0gXy5pc0FycmF5KGVycm9yTWVzc2FnZXMpID8gZXJyb3JNZXNzYWdlcyA6IFtlcnJvck1lc3NhZ2VzXTtcblxuICAgIC8vIFRPRE86IHByb3Blcmx5IGhhbmRsZSBlcnJvcnMgb25jZSBlcnJvciBoYW5kbGluZyBzZXJ2aWNlIChTZW50cnkpIGlzIGF2YWlsYWJsZS5cbiAgICBfLmVhY2gobWVzc2FnZXMsIChlcnJvcikgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yLCBhc3NvY2lhdGVkT2JqZWN0IHx8ICcnKTtcbiAgICB9KTtcbn1cbiJdfQ==
