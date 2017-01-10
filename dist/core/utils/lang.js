"use strict";
var _ = require("lodash");
/**
 * Returns true if the given value is a promise.
 *
 * @param value Value to check
 */
function isPromise(value) {
    return value instanceof Promise;
}
exports.isPromise = isPromise;
/**
 * Returns true if the given value is an observable.
 *
 * @param value Value to check
 */
function isObservable(value) {
    return _.isObject(value) && value.subscribe;
}
exports.isObservable = isObservable;
/**
 * Returns true if the given value has a `toJSON` method.
 *
 * @param value Value to check
 */
function isJsonable(value) {
    return _.isObject(value) && value.toJSON;
}
exports.isJsonable = isJsonable;
/**
 * Returns true if the given value is an Immutable.js collection.
 *
 * @param value Value to check
 */
function isImmutableCollection(value) {
    return _.isObject(value) && value.toJS;
}
exports.isImmutableCollection = isImmutableCollection;
/**
 * Copy properties of source object to target object excluding constructor.
 * If a property with the same exists on the target it is NOT overwritten.
 *
 * @param target
 * @param source
 */
function extend(target, source) {
    do {
        Object.getOwnPropertyNames(source).forEach(function (name) {
            if (name !== 'constructor' && !target.hasOwnProperty(name)) {
                Object.defineProperty(target, name, Object.getOwnPropertyDescriptor(source, name));
            }
        });
        // Recurse upwards.
        source = Object.getPrototypeOf(source);
    } while (Object.getPrototypeOf(source) !== null);
}
/**
 * Create a constructor function for a class implementing the given mixins.
 *
 * @param mixins Array of classes to be mixed together
 * @param separateArguments Should the new construct accept separate arguments
 * @return A constructor function
 */
function compose(mixins, separateArguments) {
    if (separateArguments === void 0) { separateArguments = false; }
    // Constructor function that will be called every time a new composed object is created.
    var ctor = function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (separateArguments) {
            // Call each construction function with respective arguments.
            _.zip(mixins, args).forEach(function (_a) {
                var mixin = _a[0], mixinArgs = _a[1];
                mixin.apply(_this, mixinArgs);
            });
        }
        else {
            // Call the constructor function of all the mixins, in order.
            mixins.forEach(function (mixin) {
                mixin.apply(_this, args);
            });
        }
    };
    // Add all mixins properties and methods to the constructor prototype for all
    // created objects to have them.
    mixins.forEach(function (mixin) {
        extend(ctor.prototype, mixin.prototype);
    });
    return ctor;
}
exports.compose = compose;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL3V0aWxzL2xhbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDBCQUE0QjtBQU81Qjs7OztHQUlHO0FBQ0gsbUJBQTBCLEtBQVU7SUFDaEMsTUFBTSxDQUFDLEtBQUssWUFBWSxPQUFPLENBQUM7QUFDcEMsQ0FBQztBQUZELDhCQUVDO0FBRUQ7Ozs7R0FJRztBQUNILHNCQUE2QixLQUFVO0lBQ25DLE1BQU0sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUM7QUFDaEQsQ0FBQztBQUZELG9DQUVDO0FBRUQ7Ozs7R0FJRztBQUNILG9CQUEyQixLQUFVO0lBQ2pDLE1BQU0sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUM7QUFDN0MsQ0FBQztBQUZELGdDQUVDO0FBRUQ7Ozs7R0FJRztBQUNILCtCQUFzQyxLQUFVO0lBQzVDLE1BQU0sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUM7QUFDM0MsQ0FBQztBQUZELHNEQUVDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsZ0JBQWdCLE1BQVcsRUFBRSxNQUFXO0lBQ3BDLEdBQUcsQ0FBQztRQUNBLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBQyxJQUFJO1lBQzVDLEVBQUUsQ0FBQyxDQUFDLElBQUksS0FBSyxhQUFhLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDekQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN2RixDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxtQkFBbUI7UUFDbkIsTUFBTSxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDM0MsQ0FBQyxRQUFRLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEtBQUssSUFBSSxFQUFFO0FBQ3JELENBQUM7QUFHRDs7Ozs7O0dBTUc7QUFDSCxpQkFBd0IsTUFBYSxFQUFFLGlCQUFrQztJQUFsQyxrQ0FBQSxFQUFBLHlCQUFrQztJQUNyRSx3RkFBd0Y7SUFDeEYsSUFBSSxJQUFJLEdBQUc7UUFBQSxpQkFZVjtRQVptQixjQUFjO2FBQWQsVUFBYyxFQUFkLHFCQUFjLEVBQWQsSUFBYztZQUFkLHlCQUFjOztRQUM5QixFQUFFLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7WUFDcEIsNkRBQTZEO1lBQzdELENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFDLEVBQWtCO29CQUFqQixhQUFLLEVBQUUsaUJBQVM7Z0JBQzFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ2pDLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ0osNkRBQTZEO1lBQzdELE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBQyxLQUFLO2dCQUNqQixLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM1QixDQUFDLENBQUMsQ0FBQztRQUNQLENBQUM7SUFDTCxDQUFDLENBQUM7SUFFRiw2RUFBNkU7SUFDN0UsZ0NBQWdDO0lBQ2hDLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBQyxLQUFLO1FBQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUM1QyxDQUFDLENBQUMsQ0FBQztJQUVILE1BQU0sQ0FBQyxJQUFJLENBQUM7QUFDaEIsQ0FBQztBQXZCRCwwQkF1QkMiLCJmaWxlIjoiY29yZS91dGlscy9sYW5nLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgaW1tdXRhYmxlIGZyb20gJ2ltbXV0YWJsZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSnNvbmFibGUge1xuICAgIHRvSlNPTigpOiBhbnk7XG59XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBnaXZlbiB2YWx1ZSBpcyBhIHByb21pc2UuXG4gKlxuICogQHBhcmFtIHZhbHVlIFZhbHVlIHRvIGNoZWNrXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1Byb21pc2UodmFsdWU6IGFueSk6IHZhbHVlIGlzIFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIHZhbHVlIGlzIGFuIG9ic2VydmFibGUuXG4gKlxuICogQHBhcmFtIHZhbHVlIFZhbHVlIHRvIGNoZWNrXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc09ic2VydmFibGUodmFsdWU6IGFueSk6IHZhbHVlIGlzIFJ4Lk9ic2VydmFibGU8YW55PiB7XG4gICAgcmV0dXJuIF8uaXNPYmplY3QodmFsdWUpICYmIHZhbHVlLnN1YnNjcmliZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIHZhbHVlIGhhcyBhIGB0b0pTT05gIG1ldGhvZC5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gY2hlY2tcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzSnNvbmFibGUodmFsdWU6IGFueSk6IHZhbHVlIGlzIEpzb25hYmxlIHtcbiAgICByZXR1cm4gXy5pc09iamVjdCh2YWx1ZSkgJiYgdmFsdWUudG9KU09OO1xufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgYW4gSW1tdXRhYmxlLmpzIGNvbGxlY3Rpb24uXG4gKlxuICogQHBhcmFtIHZhbHVlIFZhbHVlIHRvIGNoZWNrXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0ltbXV0YWJsZUNvbGxlY3Rpb24odmFsdWU6IGFueSk6IHZhbHVlIGlzIGltbXV0YWJsZS5Db2xsZWN0aW9uPGFueSwgYW55PiB7XG4gICAgcmV0dXJuIF8uaXNPYmplY3QodmFsdWUpICYmIHZhbHVlLnRvSlM7XG59XG5cbi8qKlxuICogQ29weSBwcm9wZXJ0aWVzIG9mIHNvdXJjZSBvYmplY3QgdG8gdGFyZ2V0IG9iamVjdCBleGNsdWRpbmcgY29uc3RydWN0b3IuXG4gKiBJZiBhIHByb3BlcnR5IHdpdGggdGhlIHNhbWUgZXhpc3RzIG9uIHRoZSB0YXJnZXQgaXQgaXMgTk9UIG92ZXJ3cml0dGVuLlxuICpcbiAqIEBwYXJhbSB0YXJnZXRcbiAqIEBwYXJhbSBzb3VyY2VcbiAqL1xuZnVuY3Rpb24gZXh0ZW5kKHRhcmdldDogYW55LCBzb3VyY2U6IGFueSkge1xuICAgIGRvIHtcbiAgICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoc291cmNlKS5mb3JFYWNoKChuYW1lKSA9PiB7XG4gICAgICAgICAgICBpZiAobmFtZSAhPT0gJ2NvbnN0cnVjdG9yJyAmJiAhdGFyZ2V0Lmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgbmFtZSwgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihzb3VyY2UsIG5hbWUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gUmVjdXJzZSB1cHdhcmRzLlxuICAgICAgICBzb3VyY2UgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yoc291cmNlKTtcbiAgICB9IHdoaWxlIChPYmplY3QuZ2V0UHJvdG90eXBlT2Yoc291cmNlKSAhPT0gbnVsbCk7XG59XG5cblxuLyoqXG4gKiBDcmVhdGUgYSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBmb3IgYSBjbGFzcyBpbXBsZW1lbnRpbmcgdGhlIGdpdmVuIG1peGlucy5cbiAqXG4gKiBAcGFyYW0gbWl4aW5zIEFycmF5IG9mIGNsYXNzZXMgdG8gYmUgbWl4ZWQgdG9nZXRoZXJcbiAqIEBwYXJhbSBzZXBhcmF0ZUFyZ3VtZW50cyBTaG91bGQgdGhlIG5ldyBjb25zdHJ1Y3QgYWNjZXB0IHNlcGFyYXRlIGFyZ3VtZW50c1xuICogQHJldHVybiBBIGNvbnN0cnVjdG9yIGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wb3NlKG1peGluczogYW55W10sIHNlcGFyYXRlQXJndW1lbnRzOiBib29sZWFuID0gZmFsc2UpIHtcbiAgICAvLyBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIGV2ZXJ5IHRpbWUgYSBuZXcgY29tcG9zZWQgb2JqZWN0IGlzIGNyZWF0ZWQuXG4gICAgbGV0IGN0b3IgPSBmdW5jdGlvbiguLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICBpZiAoc2VwYXJhdGVBcmd1bWVudHMpIHtcbiAgICAgICAgICAgIC8vIENhbGwgZWFjaCBjb25zdHJ1Y3Rpb24gZnVuY3Rpb24gd2l0aCByZXNwZWN0aXZlIGFyZ3VtZW50cy5cbiAgICAgICAgICAgIF8uemlwKG1peGlucywgYXJncykuZm9yRWFjaCgoW21peGluLCBtaXhpbkFyZ3NdKSA9PiB7XG4gICAgICAgICAgICAgICAgbWl4aW4uYXBwbHkodGhpcywgbWl4aW5BcmdzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gQ2FsbCB0aGUgY29uc3RydWN0b3IgZnVuY3Rpb24gb2YgYWxsIHRoZSBtaXhpbnMsIGluIG9yZGVyLlxuICAgICAgICAgICAgbWl4aW5zLmZvckVhY2goKG1peGluKSA9PiB7XG4gICAgICAgICAgICAgICAgbWl4aW4uYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBBZGQgYWxsIG1peGlucyBwcm9wZXJ0aWVzIGFuZCBtZXRob2RzIHRvIHRoZSBjb25zdHJ1Y3RvciBwcm90b3R5cGUgZm9yIGFsbFxuICAgIC8vIGNyZWF0ZWQgb2JqZWN0cyB0byBoYXZlIHRoZW0uXG4gICAgbWl4aW5zLmZvckVhY2goKG1peGluKSA9PiB7XG4gICAgICAgIGV4dGVuZChjdG9yLnByb3RvdHlwZSwgbWl4aW4ucHJvdG90eXBlKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBjdG9yO1xufVxuIl19
