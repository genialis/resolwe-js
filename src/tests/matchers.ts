import * as angular from 'angular';

export const ngEqualMatcher = {
    toNgEqual: function() {
        return {
            compare: function(actual, expected) {
                return { pass: angular.equals(actual, expected) };
            },
        };
    },
};

declare global {
    export namespace jasmine {
        interface Matchers {
            toNgEqual(expected: any): boolean;
        }
    }
}
