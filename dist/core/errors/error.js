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
    }
    return GenError;
}(Error));
exports.GenError = GenError;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2Vycm9ycy9lcnJvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx5Q0FBeUM7QUFDekMsZ0ZBQWdGOzs7Ozs7O0FBRWhGOzs7O0dBSUc7QUFDSDtJQUE4Qiw0QkFBSztJQUMvQixrQkFBWSxPQUFlO2VBQ3ZCLGtCQUFNLE9BQU8sQ0FBQztJQUNsQixDQUFDO0lBQ0wsZUFBQztBQUFELENBSkEsQUFJQyxDQUo2QixLQUFLLEdBSWxDO0FBSlksNEJBQVEiLCJmaWxlIjoiY29yZS9lcnJvcnMvZXJyb3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUT0RPOiBSZW5hbWUgR2VuRXJyb3IgdG8gUmVzb2x3ZUVycm9yLlxuLy8gVE9ETzogTW92ZSB0aGlzIGZpbGUgdG8gaW5kZXgudHMgc28gd2UgY2FuIGltcG9ydCBqdXN0ICdyZXNvbHdlL2NvcmUvZXJyb3JzJy5cblxuLyoqXG4gKiBCYXNlIGVycm9yIGNsYXNzLlxuICpcbiAqIEl0IHNob3VsZCBiZSB1c2VkIGZvciByZXNvbHdlIHNwZWNpZmljIGVycm9ycy5cbiAqL1xuZXhwb3J0IGNsYXNzIEdlbkVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZykge1xuICAgICAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB9XG59XG4iXX0=
