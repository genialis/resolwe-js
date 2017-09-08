"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Base = /** @class */ (function () {
    /**
     * Constructs base.
     *
     * @param {Connection} connection Connection with the genesis platform server
     */
    function Base(connection) {
        this._connection = connection;
    }
    /**
     * Gets CSRF cookie.
     *
     * @param {Connection} connection Connection with the genesis platform server
     */
    Base.prototype.getCSRFCookie = function () {
        return this._connection.get('/api/base/csrf');
    };
    return Base;
}());
exports.Base = Base;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUdBO0lBR0k7Ozs7T0FJRztJQUNILGNBQVksVUFBc0I7UUFDOUIsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7SUFDbEMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSw0QkFBYSxHQUFwQjtRQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBTyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUFDTCxXQUFDO0FBQUQsQ0FwQkEsQUFvQkMsSUFBQTtBQXBCWSxvQkFBSSIsImZpbGUiOiJhcGkvYmFzZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJ4IGZyb20gJ3J4JztcbmltcG9ydCB7Q29ubmVjdGlvbn0gZnJvbSBcIi4vY29ubmVjdGlvblwiO1xuXG5leHBvcnQgY2xhc3MgQmFzZSB7XG4gICAgcHJpdmF0ZSBfY29ubmVjdGlvbjogQ29ubmVjdGlvbjtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdHMgYmFzZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Q29ubmVjdGlvbn0gY29ubmVjdGlvbiBDb25uZWN0aW9uIHdpdGggdGhlIGdlbmVzaXMgcGxhdGZvcm0gc2VydmVyXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29ubmVjdGlvbjogQ29ubmVjdGlvbikge1xuICAgICAgICB0aGlzLl9jb25uZWN0aW9uID0gY29ubmVjdGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIENTUkYgY29va2llLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtDb25uZWN0aW9ufSBjb25uZWN0aW9uIENvbm5lY3Rpb24gd2l0aCB0aGUgZ2VuZXNpcyBwbGF0Zm9ybSBzZXJ2ZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0Q1NSRkNvb2tpZSgpOiBSeC5PYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Nvbm5lY3Rpb24uZ2V0PHZvaWQ+KCcvYXBpL2Jhc2UvY3NyZicpO1xuICAgIH1cbn1cbiJdfQ==
