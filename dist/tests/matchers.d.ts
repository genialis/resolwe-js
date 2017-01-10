export declare const ngEqualMatcher: {
    toNgEqual: () => {
        compare: (actual: any, expected: any) => {
            pass: boolean;
        };
    };
};
declare global  {
    namespace jasmine {
        interface Matchers {
            toNgEqual(expected: any): boolean;
        }
    }
}
export {};
