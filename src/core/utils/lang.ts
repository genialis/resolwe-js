import * as _ from 'lodash';
import * as immutable from 'immutable';

export interface Jsonable {
    toJSON(): any;
}

/**
 * Returns true if the given value is a promise.
 *
 * @param value Value to check
 */
export function isPromiseLike(value: any): value is Promise<any> | angular.IPromise<any> {
    const promise = <Promise<any>> value;
    return !!promise.then && typeof promise.then === 'function';
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
    let ctor = function (...args: any[]) {
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


interface AngularConstructor {
    new (...args: any[]): void;
    $inject?: ReadonlyArray<string>;
}
function getInjects(mixin: AngularConstructor): ReadonlyArray<string> {
    const numArguments = mixin.length;
    // If no arguments and no inject, pretend that inject is [].
    if (numArguments === 0 && !mixin.$inject) return [];
    return mixin.$inject;
}

/**
 * Create a constructor function for a class implementing the given mixins. All mixins
 * must have annotated injections (// @ngInject) with $inject property, so that returned
 * constructor can be instantiated with $injector.instantiate
 */
export function ngCompose(mixins: AngularConstructor[]) {
    if (!_.all(mixins, (mixin) => getInjects(mixin))) {
        throw new Error('All mixins in ngCompose must have $inject property or no arguments');
    }

    const ctor = class {
        constructor (...flattenedArgs: any[]) {
            let mutableFlattenedArgs = _.clone(flattenedArgs);
            _.each(mixins, (mixin) => {
                // Take and remove it's part of flattened args.
                const argsPart = mutableFlattenedArgs.splice(0, getInjects(mixin).length);
                // Construct
                mixin.apply(this, argsPart);
            });
        };
    };

    ctor.$inject = <string[]> _.flatten(_.map(mixins, (mixin) => getInjects(mixin)));

    // Add all mixins properties and methods to the constructor prototype for all
    // created objects to have them.
    mixins.forEach((mixin) => {
        extend(ctor.prototype, mixin.prototype);
    });

    return ctor;
}


/**
 * Traverse and transform objects by visiting every node on a recursive walk.
 * This is needed because `_.cloneDeep(value, replacer)` drops object keys when
 * replacer returns `undefined`.
 */
export function deepTraverse(tree: any, replacer: (value: any) => any): any {
    const transformedTree = replacer(tree);

    if (_.isArray(transformedTree)) {
        return _.map(transformedTree, (element) => deepTraverse(element, replacer));
    }
    if (_.isObject(transformedTree) && !_.isFunction(transformedTree) && !_.isArray(transformedTree)) {
        return _.mapValues(transformedTree, (element) => deepTraverse(element, replacer));
    }
    // Leaf node
    return transformedTree;
}
