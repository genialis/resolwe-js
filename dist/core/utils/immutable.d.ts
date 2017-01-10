/**
 * Makes an object deeply immutable by using Object.freeze. The passed object
 * will be changed so that it will now be immutable and the same object will
 * be returned.
 *
 * @param {T} object The object to make immutable
 * @return {T} The same object that was passed as an argument
 */
export declare function makeImmutable<T>(object: T): T;
