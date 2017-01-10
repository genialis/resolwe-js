/**
 * Error severity level.
 */
export declare enum SeverityLevel {
    ERROR = 0,
}
export declare function errorLog(errorMessages?: string | string[], associatedObject?: Object, severity?: SeverityLevel): void;
