import * as immutable from 'immutable';
export interface Jsonable {
    toJSON(): any;
}
/**
 * Returns true if the given value is a promise.
 *
 * @param value Value to check
 */
export declare function isPromise(value: any): value is Promise<any>;
/**
 * Returns true if the given value is an observable.
 *
 * @param value Value to check
 */
export declare function isObservable(value: any): value is Rx.Observable<any>;
/**
 * Returns true if the given value has a `toJSON` method.
 *
 * @param value Value to check
 */
export declare function isJsonable(value: any): value is Jsonable;
/**
 * Returns true if the given value is an Immutable.js collection.
 *
 * @param value Value to check
 */
export declare function isImmutableCollection(value: any): value is immutable.Collection<any, any>;
/**
 * Create a constructor function for a class implementing the given mixins.
 *
 * @param mixins Array of classes to be mixed together
 * @param separateArguments Should the new construct accept separate arguments
 * @return A constructor function
 */
export declare function compose(mixins: any[], separateArguments?: boolean): (...args: any[]) => void;
