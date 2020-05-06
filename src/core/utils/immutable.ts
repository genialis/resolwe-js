import * as _ from 'lodash';

/**
 * Makes an object deeply immutable by using Object.freeze. The passed object
 * will be changed so that it will now be immutable and the same object will
 * be returned.
 *
 * @param {T} object The object to make immutable
 * @return {T} The same object that was passed as an argument
 */
export function makeImmutable<T>(object: T): T {
    // @ifndef RESOLWE_PRODUCTION
    if (_.isObject(object)) {
        _.each(object, (property) => makeImmutable(property));
        return Object.freeze(object);
    }
    // @endif

    return object;
}
