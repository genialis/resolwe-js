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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBRUE7SUFHSTs7OztPQUlHO0lBQ0gsY0FBWSxVQUFzQjtRQUM5QixJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztJQUNsQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNJLDRCQUFhLEdBQXBCO1FBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFPLGdCQUFnQixDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUNMLFdBQUM7QUFBRCxDQXBCQSxBQW9CQyxJQUFBO0FBcEJZLG9CQUFJIiwiZmlsZSI6ImFwaS9iYXNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtDb25uZWN0aW9ufSBmcm9tIFwiLi9jb25uZWN0aW9uXCI7XG5cbmV4cG9ydCBjbGFzcyBCYXNlIHtcbiAgICBwcml2YXRlIF9jb25uZWN0aW9uOiBDb25uZWN0aW9uO1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0cyBiYXNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtDb25uZWN0aW9ufSBjb25uZWN0aW9uIENvbm5lY3Rpb24gd2l0aCB0aGUgZ2VuZXNpcyBwbGF0Zm9ybSBzZXJ2ZXJcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb25uZWN0aW9uOiBDb25uZWN0aW9uKSB7XG4gICAgICAgIHRoaXMuX2Nvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgQ1NSRiBjb29raWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Nvbm5lY3Rpb259IGNvbm5lY3Rpb24gQ29ubmVjdGlvbiB3aXRoIHRoZSBnZW5lc2lzIHBsYXRmb3JtIHNlcnZlclxuICAgICAqL1xuICAgIHB1YmxpYyBnZXRDU1JGQ29va2llKCk6IFJ4Lk9ic2VydmFibGU8dm9pZD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29ubmVjdGlvbi5nZXQ8dm9pZD4oJy9hcGkvYmFzZS9jc3JmJyk7XG4gICAgfVxufVxuIl19
