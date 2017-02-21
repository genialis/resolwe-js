"use strict";
var Base = (function () {
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBR0E7SUFHSTs7OztPQUlHO0lBQ0gsY0FBWSxVQUFzQjtRQUM5QixJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztJQUNsQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNJLDRCQUFhLEdBQXBCO1FBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFPLGdCQUFnQixDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUNMLFdBQUM7QUFBRCxDQXBCQSxBQW9CQyxJQUFBO0FBcEJZLG9CQUFJIiwiZmlsZSI6ImFwaS9iYXNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUnggZnJvbSAncngnO1xyXG5pbXBvcnQge0Nvbm5lY3Rpb259IGZyb20gXCIuL2Nvbm5lY3Rpb25cIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBCYXNlIHtcclxuICAgIHByaXZhdGUgX2Nvbm5lY3Rpb246IENvbm5lY3Rpb247XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb25zdHJ1Y3RzIGJhc2UuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtDb25uZWN0aW9ufSBjb25uZWN0aW9uIENvbm5lY3Rpb24gd2l0aCB0aGUgZ2VuZXNpcyBwbGF0Zm9ybSBzZXJ2ZXJcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoY29ubmVjdGlvbjogQ29ubmVjdGlvbikge1xyXG4gICAgICAgIHRoaXMuX2Nvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0cyBDU1JGIGNvb2tpZS5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge0Nvbm5lY3Rpb259IGNvbm5lY3Rpb24gQ29ubmVjdGlvbiB3aXRoIHRoZSBnZW5lc2lzIHBsYXRmb3JtIHNlcnZlclxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0Q1NSRkNvb2tpZSgpOiBSeC5PYnNlcnZhYmxlPHZvaWQ+IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fY29ubmVjdGlvbi5nZXQ8dm9pZD4oJy9hcGkvYmFzZS9jc3JmJyk7XHJcbiAgICB9XHJcbn1cclxuIl19
