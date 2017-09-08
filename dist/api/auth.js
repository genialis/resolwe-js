"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var Auth = /** @class */ (function () {
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
     * @param username Username or e-mail address
     * @param password Password
     */
    Auth.prototype.login = function (username, password) {
        var _this = this;
        var authData = {
            username: username,
            password: password,
        };
        // Allow login with an e-mail address as username.
        if (_.contains(username, '@')) {
            authData['email'] = username;
        }
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvYXV0aC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDBCQUE0QjtBQU01QjtJQUdJOzs7O09BSUc7SUFDSCxjQUFZLFVBQXNCO1FBQzlCLElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO0lBQ2xDLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNJLG9CQUFLLEdBQVosVUFBYSxRQUFnQixFQUFFLFFBQWdCO1FBQS9DLGlCQWlCQztRQWhCRyxJQUFNLFFBQVEsR0FBRztZQUNiLFFBQVEsRUFBRSxRQUFRO1lBQ2xCLFFBQVEsRUFBRSxRQUFRO1NBQ3JCLENBQUM7UUFFRixrREFBa0Q7UUFDbEQsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVCLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxRQUFRLENBQUM7UUFDakMsQ0FBQztRQUVELElBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFzQixtQkFBbUIsRUFBRSxRQUFRLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNoSCxRQUFRLENBQUMsU0FBUyxDQUFDO1lBQ2YsOERBQThEO1lBQzlELEtBQUksQ0FBQyxXQUFXLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUMzRCxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUUsdUJBQXVCO1FBQ3BDLE1BQU0sQ0FBQyxRQUFRLENBQUM7SUFDcEIsQ0FBQztJQUVEOztPQUVHO0lBQ0kscUJBQU0sR0FBYjtRQUFBLGlCQU9DO1FBTkcsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQXVCLG9CQUFvQixFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzVHLFFBQVEsQ0FBQyxTQUFTLENBQUM7WUFDZiw4REFBOEQ7WUFDOUQsS0FBSSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQzNELENBQUMsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxDQUFDLFFBQVEsQ0FBQztJQUNwQixDQUFDO0lBQ0wsV0FBQztBQUFELENBaERBLEFBZ0RDLElBQUE7QUFoRFksb0JBQUkiLCJmaWxlIjoiYXBpL2F1dGguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgKiBhcyBSeCBmcm9tICdyeCc7XG5cbmltcG9ydCB7Q29ubmVjdGlvbn0gZnJvbSAnLi9jb25uZWN0aW9uJztcbmltcG9ydCAqIGFzIHR5cGVzIGZyb20gJy4vdHlwZXMvcmVzdCc7XG5cbmV4cG9ydCBjbGFzcyBBdXRoIHtcbiAgICBwcml2YXRlIF9jb25uZWN0aW9uOiBDb25uZWN0aW9uO1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0cyBhdXRoLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtDb25uZWN0aW9ufSBjb25uZWN0aW9uIENvbm5lY3Rpb24gd2l0aCB0aGUgZ2VuZXNpcyBwbGF0Zm9ybSBzZXJ2ZXJcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb25uZWN0aW9uOiBDb25uZWN0aW9uKSB7XG4gICAgICAgIHRoaXMuX2Nvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm1zIHVzZXIgbG9naW4uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdXNlcm5hbWUgVXNlcm5hbWUgb3IgZS1tYWlsIGFkZHJlc3NcbiAgICAgKiBAcGFyYW0gcGFzc3dvcmQgUGFzc3dvcmRcbiAgICAgKi9cbiAgICBwdWJsaWMgbG9naW4odXNlcm5hbWU6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZyk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuTG9naW5SZXNwb25zZT4ge1xuICAgICAgICBjb25zdCBhdXRoRGF0YSA9IHtcbiAgICAgICAgICAgIHVzZXJuYW1lOiB1c2VybmFtZSxcbiAgICAgICAgICAgIHBhc3N3b3JkOiBwYXNzd29yZCxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBBbGxvdyBsb2dpbiB3aXRoIGFuIGUtbWFpbCBhZGRyZXNzIGFzIHVzZXJuYW1lLlxuICAgICAgICBpZiAoXy5jb250YWlucyh1c2VybmFtZSwgJ0AnKSkge1xuICAgICAgICAgICAgYXV0aERhdGFbJ2VtYWlsJ10gPSB1c2VybmFtZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gdGhpcy5fY29ubmVjdGlvbi5wb3N0PHR5cGVzLkxvZ2luUmVzcG9uc2U+KCcvcmVzdC1hdXRoL2xvZ2luLycsIGF1dGhEYXRhKS5wdWJsaXNoKCkucmVmQ291bnQoKTtcbiAgICAgICAgcmVzcG9uc2Uuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgIC8vIENvbm5lY3Rpb24gc3RhdGUgaGFzIGNoYW5nZWQsIHJlaW5pdGlhbGl6ZSBxdWVyeSBvYnNlcnZlcnMuXG4gICAgICAgICAgICB0aGlzLl9jb25uZWN0aW9uLnF1ZXJ5T2JzZXJ2ZXJNYW5hZ2VyKCkucmVpbml0aWFsaXplKCk7XG4gICAgICAgIH0sIF8ubm9vcCk7ICAvLyBEbyBub3RoaW5nIG9uIGVycm9yLlxuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTG9ncyB0aGUgdXNlciBvdXQuXG4gICAgICovXG4gICAgcHVibGljIGxvZ291dCgpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLkxvZ291dFJlc3BvbnNlPiB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gdGhpcy5fY29ubmVjdGlvbi5wb3N0PHR5cGVzLkxvZ291dFJlc3BvbnNlPignL3Jlc3QtYXV0aC9sb2dvdXQvJywge30pLnB1Ymxpc2goKS5yZWZDb3VudCgpO1xuICAgICAgICByZXNwb25zZS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgLy8gQ29ubmVjdGlvbiBzdGF0ZSBoYXMgY2hhbmdlZCwgcmVpbml0aWFsaXplIHF1ZXJ5IG9ic2VydmVycy5cbiAgICAgICAgICAgIHRoaXMuX2Nvbm5lY3Rpb24ucXVlcnlPYnNlcnZlck1hbmFnZXIoKS5yZWluaXRpYWxpemUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9XG59XG4iXX0=
