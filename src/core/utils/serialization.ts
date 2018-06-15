import * as _ from 'lodash';
import {deepTraverse} from './lang';

export class SerializationError extends Error {
    constructor(message: string, public serializedValue: string) {
        super(message);
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object['setPrototypeOf'](this, SerializationError.prototype);
    }
}

const RESERVED_KEYWORDS = {
    '__undefined__': true,
    '__Infinity__': true,
    '__-Infinity__': true,
    '__NaN__': true,
};
// A mini test of typings. Checks that `reserved` dict contains all
{ let x: keyof typeof RESERVED_KEYWORDS | 'a'; const ret = serializeUnsupportedJsonValue('a'); let y: typeof ret; x = y; y = x; }

function serializeUnsupportedJsonValue<T>(value: T): T | keyof typeof RESERVED_KEYWORDS {
    if (typeof value === 'undefined') return '__undefined__';
    if (typeof value === 'number' && value === Infinity) return '__Infinity__';
    if (typeof value === 'number' && value === -Infinity) return '__-Infinity__';
    if (typeof value === 'number' && isNaN(value)) return '__NaN__';
    return value;
}

function parseUnsupportedJsonValue<T>(value: T | keyof typeof RESERVED_KEYWORDS): T | undefined | number {
    if (value === '__undefined__') return undefined;
    if (value === '__Infinity__') return Infinity;
    if (value === '__-Infinity__') return -Infinity;
    if (value === '__NaN__') return NaN;
    return value;
}

/**
 * Custom partial serialization for fields that JSON.stringify / JSON.parse doesn't support.
 * The returned object can then be used in JSON.stringify. Fields that can not be losslessly
 * serialized / parsed throw an error (functions and non-plain objects).
 */
export function makeSafelySerializable(tree: any): any {
    const result = deepTraverse(tree, (value) => {
        // Throw error when value can't be serialized / parsed.
        if (typeof value === 'function') {
            throw new SerializationError('Functions can not be serialized', value.toString());
        }
        if (_.isObject(value) && !_.isArray(value) && !_.isFunction(value) && !_.isPlainObject(value)) {
            throw new SerializationError('Non-plain objects can not preserve prototype during serialization', verboseSerialize(value));
        }
        if (typeof value === 'string' && RESERVED_KEYWORDS.hasOwnProperty(value)) {
            throw new SerializationError('Encountered a reserved keyword during serialization', value);
        }
        return serializeUnsupportedJsonValue(value);
    });

    if (!_.isEqual(parseSafelySerializable(JSON.parse(JSON.stringify(result))), tree)) {
        // A generic check if errors above miss anything.
        throw new SerializationError('Encountered an unserializable field', verboseSerialize(tree));
    }

    return result;
}

/**
 * Custom partial deserialization of fields serialized by `makeSafelySerializable`.
 */
export function parseSafelySerializable(tree: any): any {
    return deepTraverse(tree, (value) => {
        return parseUnsupportedJsonValue(value);
    });
}

/**
 * Serialize as many fields as possible, without ensuring it is deserializable.
 */
export function verboseSerialize(tree: any): any {
    return JSON.stringify(tree, (key, value) => {
        // Print, even if value is not deserializable.
        if (typeof value === 'function') return value.toString();
        return serializeUnsupportedJsonValue(value);
    });
}
