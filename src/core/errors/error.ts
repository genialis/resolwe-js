// TODO: Rename GenError to ResolweError.
// TODO: Move this file to index.ts so we can import just 'resolwe/core/errors'.

/**
 * Base error class.
 *
 * It should be used for resolwe specific errors.
 */
export class GenError extends Error {
    constructor(message: string) {
        super(message);
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object['setPrototypeOf'](this, GenError.prototype);
    }
}
