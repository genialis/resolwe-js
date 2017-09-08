"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL3V0aWxzL2xhbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwwQkFBNEI7QUFPNUI7Ozs7R0FJRztBQUNILG1CQUEwQixLQUFVO0lBQ2hDLE1BQU0sQ0FBQyxLQUFLLFlBQVksT0FBTyxDQUFDO0FBQ3BDLENBQUM7QUFGRCw4QkFFQztBQUVEOzs7O0dBSUc7QUFDSCxzQkFBNkIsS0FBVTtJQUNuQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDO0FBQ2hELENBQUM7QUFGRCxvQ0FFQztBQUVEOzs7O0dBSUc7QUFDSCxvQkFBMkIsS0FBVTtJQUNqQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDO0FBQzdDLENBQUM7QUFGRCxnQ0FFQztBQUVEOzs7O0dBSUc7QUFDSCwrQkFBc0MsS0FBVTtJQUM1QyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDO0FBQzNDLENBQUM7QUFGRCxzREFFQztBQUVEOzs7Ozs7R0FNRztBQUNILGdCQUFnQixNQUFXLEVBQUUsTUFBVztJQUNwQyxHQUFHLENBQUM7UUFDQSxNQUFNLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQUMsSUFBSTtZQUM1QyxFQUFFLENBQUMsQ0FBQyxJQUFJLEtBQUssYUFBYSxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pELE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsd0JBQXdCLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDdkYsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsbUJBQW1CO1FBQ25CLE1BQU0sR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzNDLENBQUMsUUFBUSxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxLQUFLLElBQUksRUFBRTtBQUNyRCxDQUFDO0FBR0Q7Ozs7OztHQU1HO0FBQ0gsaUJBQXdCLE1BQWEsRUFBRSxpQkFBa0M7SUFBbEMsa0NBQUEsRUFBQSx5QkFBa0M7SUFDckUsd0ZBQXdGO0lBQ3hGLElBQUksSUFBSSxHQUFHO1FBQUEsaUJBWVY7UUFabUIsY0FBYzthQUFkLFVBQWMsRUFBZCxxQkFBYyxFQUFkLElBQWM7WUFBZCx5QkFBYzs7UUFDOUIsRUFBRSxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1lBQ3BCLDZEQUE2RDtZQUM3RCxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBQyxFQUFrQjtvQkFBakIsYUFBSyxFQUFFLGlCQUFTO2dCQUMxQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNqQyxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNKLDZEQUE2RDtZQUM3RCxNQUFNLENBQUMsT0FBTyxDQUFDLFVBQUMsS0FBSztnQkFDakIsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDNUIsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO0lBQ0wsQ0FBQyxDQUFDO0lBRUYsNkVBQTZFO0lBQzdFLGdDQUFnQztJQUNoQyxNQUFNLENBQUMsT0FBTyxDQUFDLFVBQUMsS0FBSztRQUNqQixNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDNUMsQ0FBQyxDQUFDLENBQUM7SUFFSCxNQUFNLENBQUMsSUFBSSxDQUFDO0FBQ2hCLENBQUM7QUF2QkQsMEJBdUJDIiwiZmlsZSI6ImNvcmUvdXRpbHMvbGFuZy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIGltbXV0YWJsZSBmcm9tICdpbW11dGFibGUnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEpzb25hYmxlIHtcbiAgICB0b0pTT04oKTogYW55O1xufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgYSBwcm9taXNlLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byBjaGVja1xuICovXG5leHBvcnQgZnVuY3Rpb24gaXNQcm9taXNlKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFByb21pc2U7XG59XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBnaXZlbiB2YWx1ZSBpcyBhbiBvYnNlcnZhYmxlLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byBjaGVja1xuICovXG5leHBvcnQgZnVuY3Rpb24gaXNPYnNlcnZhYmxlKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBSeC5PYnNlcnZhYmxlPGFueT4ge1xuICAgIHJldHVybiBfLmlzT2JqZWN0KHZhbHVlKSAmJiB2YWx1ZS5zdWJzY3JpYmU7XG59XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBnaXZlbiB2YWx1ZSBoYXMgYSBgdG9KU09OYCBtZXRob2QuXG4gKlxuICogQHBhcmFtIHZhbHVlIFZhbHVlIHRvIGNoZWNrXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0pzb25hYmxlKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBKc29uYWJsZSB7XG4gICAgcmV0dXJuIF8uaXNPYmplY3QodmFsdWUpICYmIHZhbHVlLnRvSlNPTjtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIHZhbHVlIGlzIGFuIEltbXV0YWJsZS5qcyBjb2xsZWN0aW9uLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byBjaGVja1xuICovXG5leHBvcnQgZnVuY3Rpb24gaXNJbW11dGFibGVDb2xsZWN0aW9uKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBpbW11dGFibGUuQ29sbGVjdGlvbjxhbnksIGFueT4ge1xuICAgIHJldHVybiBfLmlzT2JqZWN0KHZhbHVlKSAmJiB2YWx1ZS50b0pTO1xufVxuXG4vKipcbiAqIENvcHkgcHJvcGVydGllcyBvZiBzb3VyY2Ugb2JqZWN0IHRvIHRhcmdldCBvYmplY3QgZXhjbHVkaW5nIGNvbnN0cnVjdG9yLlxuICogSWYgYSBwcm9wZXJ0eSB3aXRoIHRoZSBzYW1lIGV4aXN0cyBvbiB0aGUgdGFyZ2V0IGl0IGlzIE5PVCBvdmVyd3JpdHRlbi5cbiAqXG4gKiBAcGFyYW0gdGFyZ2V0XG4gKiBAcGFyYW0gc291cmNlXG4gKi9cbmZ1bmN0aW9uIGV4dGVuZCh0YXJnZXQ6IGFueSwgc291cmNlOiBhbnkpIHtcbiAgICBkbyB7XG4gICAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHNvdXJjZSkuZm9yRWFjaCgobmFtZSkgPT4ge1xuICAgICAgICAgICAgaWYgKG5hbWUgIT09ICdjb25zdHJ1Y3RvcicgJiYgIXRhcmdldC5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIG5hbWUsIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Ioc291cmNlLCBuYW1lKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFJlY3Vyc2UgdXB3YXJkcy5cbiAgICAgICAgc291cmNlID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHNvdXJjZSk7XG4gICAgfSB3aGlsZSAoT2JqZWN0LmdldFByb3RvdHlwZU9mKHNvdXJjZSkgIT09IG51bGwpO1xufVxuXG5cbi8qKlxuICogQ3JlYXRlIGEgY29uc3RydWN0b3IgZnVuY3Rpb24gZm9yIGEgY2xhc3MgaW1wbGVtZW50aW5nIHRoZSBnaXZlbiBtaXhpbnMuXG4gKlxuICogQHBhcmFtIG1peGlucyBBcnJheSBvZiBjbGFzc2VzIHRvIGJlIG1peGVkIHRvZ2V0aGVyXG4gKiBAcGFyYW0gc2VwYXJhdGVBcmd1bWVudHMgU2hvdWxkIHRoZSBuZXcgY29uc3RydWN0IGFjY2VwdCBzZXBhcmF0ZSBhcmd1bWVudHNcbiAqIEByZXR1cm4gQSBjb25zdHJ1Y3RvciBmdW5jdGlvblxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcG9zZShtaXhpbnM6IGFueVtdLCBzZXBhcmF0ZUFyZ3VtZW50czogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgLy8gQ29uc3RydWN0b3IgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBldmVyeSB0aW1lIGEgbmV3IGNvbXBvc2VkIG9iamVjdCBpcyBjcmVhdGVkLlxuICAgIGxldCBjdG9yID0gZnVuY3Rpb24oLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgaWYgKHNlcGFyYXRlQXJndW1lbnRzKSB7XG4gICAgICAgICAgICAvLyBDYWxsIGVhY2ggY29uc3RydWN0aW9uIGZ1bmN0aW9uIHdpdGggcmVzcGVjdGl2ZSBhcmd1bWVudHMuXG4gICAgICAgICAgICBfLnppcChtaXhpbnMsIGFyZ3MpLmZvckVhY2goKFttaXhpbiwgbWl4aW5BcmdzXSkgPT4ge1xuICAgICAgICAgICAgICAgIG1peGluLmFwcGx5KHRoaXMsIG1peGluQXJncyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIENhbGwgdGhlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIG9mIGFsbCB0aGUgbWl4aW5zLCBpbiBvcmRlci5cbiAgICAgICAgICAgIG1peGlucy5mb3JFYWNoKChtaXhpbikgPT4ge1xuICAgICAgICAgICAgICAgIG1peGluLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gQWRkIGFsbCBtaXhpbnMgcHJvcGVydGllcyBhbmQgbWV0aG9kcyB0byB0aGUgY29uc3RydWN0b3IgcHJvdG90eXBlIGZvciBhbGxcbiAgICAvLyBjcmVhdGVkIG9iamVjdHMgdG8gaGF2ZSB0aGVtLlxuICAgIG1peGlucy5mb3JFYWNoKChtaXhpbikgPT4ge1xuICAgICAgICBleHRlbmQoY3Rvci5wcm90b3R5cGUsIG1peGluLnByb3RvdHlwZSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gY3Rvcjtcbn1cbiJdfQ==
