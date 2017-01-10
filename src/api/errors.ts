import {GenError} from '../core/errors/error';

/**
 * Api error.
 */
export class APIError extends GenError {
    public name = 'APIError';
    private _associatedObject: Object;

    constructor(message: string, associatedObject?: Object) {
        super(message);

        this._associatedObject = associatedObject;
    }

    public get associatedObject(): Object {
        return this._associatedObject;
    }
}

/**
 * QueryOne error thrown when [[Resource]]'s queryOne method fails.
 */
export class QueryOneError extends APIError {
    public name = 'QueryOneError';

    constructor(message: string) {
        super(message);
    }
}

/**
 * Websocket error.
 */
export class WebsocketError extends APIError {
    public name = 'WebsocketError';

    constructor(message: string, associatedObject?: Object) {
        super(message, associatedObject);
    }
}

/**
 * Query observers error.
 */
export class QueryObserversError extends APIError {
    public name = 'QueryObserversError';

    constructor(message: string, associatedObject?: Object) {
        super(message, associatedObject);
    }
}
