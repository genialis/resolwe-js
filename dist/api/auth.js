"use strict";
var _ = require("lodash");
var Auth = (function () {
    /**
     * Constructs auth.
     *
     * @param {Connection} connection Connection with the genesis platform server
     */
    function Auth(connection) {
        this._connection = connection;
    }
    /**
     * Performs user login.
     *
     * @param username username
     * @param password password
     */
    Auth.prototype.login = function (username, password) {
        var _this = this;
        var authData = {
            username: username,
            password: password,
        };
        var response = this._connection.post('/rest-auth/login/', authData).publish().refCount();
        response.subscribe(function () {
            // Connection state has changed, reinitialize query observers.
            _this._connection.queryObserverManager().reinitialize();
        }, _.noop); // Do nothing on error.
        return response;
    };
    /**
     * Logs the user out.
     */
    Auth.prototype.logout = function () {
        var _this = this;
        var response = this._connection.post('/rest-auth/logout/', {}).publish().refCount();
        response.subscribe(function () {
            // Connection state has changed, reinitialize query observers.
            _this._connection.queryObserverManager().reinitialize();
        });
        return response;
    };
    return Auth;
}());
exports.Auth = Auth;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvYXV0aC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsMEJBQTRCO0FBTTVCO0lBR0k7Ozs7T0FJRztJQUNILGNBQVksVUFBc0I7UUFDOUIsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7SUFDbEMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ksb0JBQUssR0FBWixVQUFhLFFBQWdCLEVBQUUsUUFBZ0I7UUFBL0MsaUJBWUM7UUFYRyxJQUFNLFFBQVEsR0FBRztZQUNiLFFBQVEsRUFBRSxRQUFRO1lBQ2xCLFFBQVEsRUFBRSxRQUFRO1NBQ3JCLENBQUM7UUFFRixJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBc0IsbUJBQW1CLEVBQUUsUUFBUSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDaEgsUUFBUSxDQUFDLFNBQVMsQ0FBQztZQUNmLDhEQUE4RDtZQUM5RCxLQUFJLENBQUMsV0FBVyxDQUFDLG9CQUFvQixFQUFFLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDM0QsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFFLHVCQUF1QjtRQUNwQyxNQUFNLENBQUMsUUFBUSxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7T0FFRztJQUNJLHFCQUFNLEdBQWI7UUFBQSxpQkFPQztRQU5HLElBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUF1QixvQkFBb0IsRUFBRSxFQUFFLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM1RyxRQUFRLENBQUMsU0FBUyxDQUFDO1lBQ2YsOERBQThEO1lBQzlELEtBQUksQ0FBQyxXQUFXLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUMzRCxDQUFDLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxRQUFRLENBQUM7SUFDcEIsQ0FBQztJQUNMLFdBQUM7QUFBRCxDQTNDQSxBQTJDQyxJQUFBO0FBM0NZLG9CQUFJIiwiZmlsZSI6ImFwaS9hdXRoLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgUnggZnJvbSAncngnO1xuXG5pbXBvcnQge0Nvbm5lY3Rpb259IGZyb20gJy4vY29ubmVjdGlvbic7XG5pbXBvcnQgKiBhcyB0eXBlcyBmcm9tICcuL3R5cGVzL3Jlc3QnO1xuXG5leHBvcnQgY2xhc3MgQXV0aCB7XG4gICAgcHJpdmF0ZSBfY29ubmVjdGlvbjogQ29ubmVjdGlvbjtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdHMgYXV0aC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Q29ubmVjdGlvbn0gY29ubmVjdGlvbiBDb25uZWN0aW9uIHdpdGggdGhlIGdlbmVzaXMgcGxhdGZvcm0gc2VydmVyXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29ubmVjdGlvbjogQ29ubmVjdGlvbikge1xuICAgICAgICB0aGlzLl9jb25uZWN0aW9uID0gY29ubmVjdGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtcyB1c2VyIGxvZ2luLlxuICAgICAqXG4gICAgICogQHBhcmFtIHVzZXJuYW1lIHVzZXJuYW1lXG4gICAgICogQHBhcmFtIHBhc3N3b3JkIHBhc3N3b3JkXG4gICAgICovXG4gICAgcHVibGljIGxvZ2luKHVzZXJuYW1lOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLkxvZ2luUmVzcG9uc2U+IHtcbiAgICAgICAgY29uc3QgYXV0aERhdGEgPSB7XG4gICAgICAgICAgICB1c2VybmFtZTogdXNlcm5hbWUsXG4gICAgICAgICAgICBwYXNzd29yZDogcGFzc3dvcmQsXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSB0aGlzLl9jb25uZWN0aW9uLnBvc3Q8dHlwZXMuTG9naW5SZXNwb25zZT4oJy9yZXN0LWF1dGgvbG9naW4vJywgYXV0aERhdGEpLnB1Ymxpc2goKS5yZWZDb3VudCgpO1xuICAgICAgICByZXNwb25zZS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgLy8gQ29ubmVjdGlvbiBzdGF0ZSBoYXMgY2hhbmdlZCwgcmVpbml0aWFsaXplIHF1ZXJ5IG9ic2VydmVycy5cbiAgICAgICAgICAgIHRoaXMuX2Nvbm5lY3Rpb24ucXVlcnlPYnNlcnZlck1hbmFnZXIoKS5yZWluaXRpYWxpemUoKTtcbiAgICAgICAgfSwgXy5ub29wKTsgIC8vIERvIG5vdGhpbmcgb24gZXJyb3IuXG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb2dzIHRoZSB1c2VyIG91dC5cbiAgICAgKi9cbiAgICBwdWJsaWMgbG9nb3V0KCk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuTG9nb3V0UmVzcG9uc2U+IHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSB0aGlzLl9jb25uZWN0aW9uLnBvc3Q8dHlwZXMuTG9nb3V0UmVzcG9uc2U+KCcvcmVzdC1hdXRoL2xvZ291dC8nLCB7fSkucHVibGlzaCgpLnJlZkNvdW50KCk7XG4gICAgICAgIHJlc3BvbnNlLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICAvLyBDb25uZWN0aW9uIHN0YXRlIGhhcyBjaGFuZ2VkLCByZWluaXRpYWxpemUgcXVlcnkgb2JzZXJ2ZXJzLlxuICAgICAgICAgICAgdGhpcy5fY29ubmVjdGlvbi5xdWVyeU9ic2VydmVyTWFuYWdlcigpLnJlaW5pdGlhbGl6ZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH1cbn1cbiJdfQ==
