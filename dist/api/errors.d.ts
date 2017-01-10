import { GenError } from '../core/errors/error';
/**
 * Api error.
 */
export declare class APIError extends GenError {
    name: string;
    private _associatedObject;
    constructor(message: string, associatedObject?: Object);
    readonly associatedObject: Object;
}
/**
 * QueryOne error thrown when [[Resource]]'s queryOne method fails.
 */
export declare class QueryOneError extends APIError {
    name: string;
    constructor(message: string);
}
/**
 * Websocket error.
 */
export declare class WebsocketError extends APIError {
    name: string;
    constructor(message: string, associatedObject?: Object);
}
/**
 * Query observers error.
 */
export declare class QueryObserversError extends APIError {
    name: string;
    constructor(message: string, associatedObject?: Object);
}
