import {GenError} from '../core/errors/error';

/**
 * Api error.
 */
export class APIError extends GenError {
    public name = 'APIError';
    private _associatedObject: Object;

    constructor(message: string, associatedObject?: Object) {
        super(message);
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object['setPrototypeOf'](this, APIError.prototype);

        this._associatedObject = associatedObject;
    }

    public get associatedObject(): Object {
        return this._associatedObject;
    }
}

/**
 * Request error.
 */
export class RequestError extends APIError {
    public name = 'RequestError';

    constructor(public url: string, message: string, associatedObject?: Object) {
        super(message, associatedObject);
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object['setPrototypeOf'](this, RequestError.prototype);
    }
}

/**
 * HTTP status 500 - 599
 */
export class ServerError extends RequestError {
    public name = 'ServerError';

    constructor(public url: string, message: string, associatedObject?: Object) {
        super(url, message, associatedObject);
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object['setPrototypeOf'](this, RequestError.prototype);
    }
}


/**
 * QueryOne error thrown when [[Resource]]'s queryOne method fails.
 */
export class QueryOneError extends APIError {
    public name = 'QueryOneError';

    constructor(message: string) {
        super(message);
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object['setPrototypeOf'](this, QueryOneError.prototype);
    }
}

/**
 * Websocket error.
 */
export class WebsocketError extends APIError {
    public name = 'WebsocketError';

    constructor(message: string, associatedObject?: Object) {
        super(message, associatedObject);
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object['setPrototypeOf'](this, WebsocketError.prototype);
    }
}

/**
 * Query observers error.
 */
export class QueryObserversError extends APIError {
    public name = 'QueryObserversError';

    constructor(message: string, associatedObject?: Object) {
        super(message, associatedObject);
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object['setPrototypeOf'](this, QueryObserversError.prototype);
    }
}
