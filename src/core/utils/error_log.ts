import * as _ from 'lodash';

/**
 * Error severity level.
 */
export enum SeverityLevel {
    ERROR
}

export function errorLog(errorMessages: string | string[] = [],
                         associatedObject?: Object,
                         severity: SeverityLevel = SeverityLevel.ERROR): void {

    const messages: string[] = _.isArray(errorMessages) ? errorMessages : [errorMessages];

    // TODO: properly handle errors once error handling service (Sentry) is available.
    _.each(messages, (error) => {
        console.error(error, associatedObject || '');
    });
}
