// TODO: Rename GenError to ResolweError.
// TODO: Move this file to index.ts so we can import just 'resolwe/core/errors'.
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * Base error class.
 *
 * It should be used for resolwe specific errors.
 */
var GenError = (function (_super) {
    __extends(GenError, _super);
    function GenError(message) {
        return _super.call(this, message) || this;
        // TODO: PhantomJS does not implement setPrototypeOf. Uncomment this when we support tests on headless chrome.
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        // Object['setPrototypeOf'](this, GenError.prototype);
    }
    return GenError;
}(Error));
exports.GenError = GenError;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2Vycm9ycy9lcnJvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx5Q0FBeUM7QUFDekMsZ0ZBQWdGOzs7Ozs7O0FBRWhGOzs7O0dBSUc7QUFDSDtJQUE4Qiw0QkFBSztJQUMvQixrQkFBWSxPQUFlO2VBQ3ZCLGtCQUFNLE9BQU8sQ0FBQztRQUNkLDhHQUE4RztRQUM5RyxnSUFBZ0k7UUFDaEksc0RBQXNEO0lBQzFELENBQUM7SUFDTCxlQUFDO0FBQUQsQ0FQQSxBQU9DLENBUDZCLEtBQUssR0FPbEM7QUFQWSw0QkFBUSIsImZpbGUiOiJjb3JlL2Vycm9ycy9lcnJvci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFRPRE86IFJlbmFtZSBHZW5FcnJvciB0byBSZXNvbHdlRXJyb3IuXG4vLyBUT0RPOiBNb3ZlIHRoaXMgZmlsZSB0byBpbmRleC50cyBzbyB3ZSBjYW4gaW1wb3J0IGp1c3QgJ3Jlc29sd2UvY29yZS9lcnJvcnMnLlxuXG4vKipcbiAqIEJhc2UgZXJyb3IgY2xhc3MuXG4gKlxuICogSXQgc2hvdWxkIGJlIHVzZWQgZm9yIHJlc29sd2Ugc3BlY2lmaWMgZXJyb3JzLlxuICovXG5leHBvcnQgY2xhc3MgR2VuRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gICAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgICAgICAvLyBUT0RPOiBQaGFudG9tSlMgZG9lcyBub3QgaW1wbGVtZW50IHNldFByb3RvdHlwZU9mLiBVbmNvbW1lbnQgdGhpcyB3aGVuIHdlIHN1cHBvcnQgdGVzdHMgb24gaGVhZGxlc3MgY2hyb21lLlxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vTWljcm9zb2Z0L1R5cGVTY3JpcHQvd2lraS9CcmVha2luZy1DaGFuZ2VzI2V4dGVuZGluZy1idWlsdC1pbnMtbGlrZS1lcnJvci1hcnJheS1hbmQtbWFwLW1heS1uby1sb25nZXItd29ya1xuICAgICAgICAvLyBPYmplY3RbJ3NldFByb3RvdHlwZU9mJ10odGhpcywgR2VuRXJyb3IucHJvdG90eXBlKTtcbiAgICB9XG59XG4iXX0=
