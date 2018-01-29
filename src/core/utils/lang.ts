import * as _ from 'lodash';
import * as Rx from 'rx';
import * as immutable from 'immutable';

export interface Jsonable {
    toJSON(): any;
}

/**
 * Returns true if the given value is a promise.
 *
 * @param value Value to check
 */
export function isPromise(value: any): value is Promise<any> {
    return Rx.helpers.isPromise(value);
}

/**
 * Returns true if the given value is an observable.
 *
 * @param value Value to check
 */
export function isObservable(value: any): value is Rx.Observable<any> {
    return _.isObject(value) && value.subscribe;
}

/**
 * Returns true if the given value has a `toJSON` method.
 *
 * @param value Value to check
 */
export function isJsonable(value: any): value is Jsonable {
    return _.isObject(value) && value.toJSON;
}

/**
 * Returns true if the given value is an Immutable.js collection.
 *
 * @param value Value to check
 */
export function isImmutableCollection(value: any): value is immutable.Collection<any, any> {
    return _.isObject(value) && value.toJS;
}

/**
 * Copy properties of source object to target object excluding constructor.
 * If a property with the same exists on the target it is NOT overwritten.
 *
 * @param target
 * @param source
 */
function extend(target: any, source: any) {
    do {
        Object.getOwnPropertyNames(source).forEach((name) => {
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
export function compose(mixins: any[], separateArguments: boolean = false) {
    // Constructor function that will be called every time a new composed object is created.
    let ctor = function(...args: any[]) {
        if (separateArguments) {
            // Call each construction function with respective arguments.
            _.zip(mixins, args).forEach(([mixin, mixinArgs]) => {
                mixin.apply(this, mixinArgs);
            });
        } else {
            // Call the constructor function of all the mixins, in order.
            mixins.forEach((mixin) => {
                mixin.apply(this, args);
            });
        }
    };

    // Add all mixins properties and methods to the constructor prototype for all
    // created objects to have them.
    mixins.forEach((mixin) => {
        extend(ctor.prototype, mixin.prototype);
    });

    return ctor;
}
