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
    }
}
