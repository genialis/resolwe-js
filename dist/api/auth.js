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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvYXV0aC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsMEJBQTRCO0FBTTVCO0lBR0k7Ozs7T0FJRztJQUNILGNBQVksVUFBc0I7UUFDOUIsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7SUFDbEMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ksb0JBQUssR0FBWixVQUFhLFFBQWdCLEVBQUUsUUFBZ0I7UUFBL0MsaUJBaUJDO1FBaEJHLElBQU0sUUFBUSxHQUFHO1lBQ2IsUUFBUSxFQUFFLFFBQVE7WUFDbEIsUUFBUSxFQUFFLFFBQVE7U0FDckIsQ0FBQztRQUVGLGtEQUFrRDtRQUNsRCxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUIsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLFFBQVEsQ0FBQztRQUNqQyxDQUFDO1FBRUQsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQXNCLG1CQUFtQixFQUFFLFFBQVEsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2hILFFBQVEsQ0FBQyxTQUFTLENBQUM7WUFDZiw4REFBOEQ7WUFDOUQsS0FBSSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQzNELENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBRSx1QkFBdUI7UUFDcEMsTUFBTSxDQUFDLFFBQVEsQ0FBQztJQUNwQixDQUFDO0lBRUQ7O09BRUc7SUFDSSxxQkFBTSxHQUFiO1FBQUEsaUJBT0M7UUFORyxJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBdUIsb0JBQW9CLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDNUcsUUFBUSxDQUFDLFNBQVMsQ0FBQztZQUNmLDhEQUE4RDtZQUM5RCxLQUFJLENBQUMsV0FBVyxDQUFDLG9CQUFvQixFQUFFLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDM0QsQ0FBQyxDQUFDLENBQUM7UUFDSCxNQUFNLENBQUMsUUFBUSxDQUFDO0lBQ3BCLENBQUM7SUFDTCxXQUFDO0FBQUQsQ0FoREEsQUFnREMsSUFBQTtBQWhEWSxvQkFBSSIsImZpbGUiOiJhcGkvYXV0aC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIFJ4IGZyb20gJ3J4JztcblxuaW1wb3J0IHtDb25uZWN0aW9ufSBmcm9tICcuL2Nvbm5lY3Rpb24nO1xuaW1wb3J0ICogYXMgdHlwZXMgZnJvbSAnLi90eXBlcy9yZXN0JztcblxuZXhwb3J0IGNsYXNzIEF1dGgge1xuICAgIHByaXZhdGUgX2Nvbm5lY3Rpb246IENvbm5lY3Rpb247XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RzIGF1dGguXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Nvbm5lY3Rpb259IGNvbm5lY3Rpb24gQ29ubmVjdGlvbiB3aXRoIHRoZSBnZW5lc2lzIHBsYXRmb3JtIHNlcnZlclxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbm5lY3Rpb246IENvbm5lY3Rpb24pIHtcbiAgICAgICAgdGhpcy5fY29ubmVjdGlvbiA9IGNvbm5lY3Rpb247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGVyZm9ybXMgdXNlciBsb2dpbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB1c2VybmFtZSBVc2VybmFtZSBvciBlLW1haWwgYWRkcmVzc1xuICAgICAqIEBwYXJhbSBwYXNzd29yZCBQYXNzd29yZFxuICAgICAqL1xuICAgIHB1YmxpYyBsb2dpbih1c2VybmFtZTogc3RyaW5nLCBwYXNzd29yZDogc3RyaW5nKTogUnguT2JzZXJ2YWJsZTx0eXBlcy5Mb2dpblJlc3BvbnNlPiB7XG4gICAgICAgIGNvbnN0IGF1dGhEYXRhID0ge1xuICAgICAgICAgICAgdXNlcm5hbWU6IHVzZXJuYW1lLFxuICAgICAgICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkLFxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEFsbG93IGxvZ2luIHdpdGggYW4gZS1tYWlsIGFkZHJlc3MgYXMgdXNlcm5hbWUuXG4gICAgICAgIGlmIChfLmNvbnRhaW5zKHVzZXJuYW1lLCAnQCcpKSB7XG4gICAgICAgICAgICBhdXRoRGF0YVsnZW1haWwnXSA9IHVzZXJuYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSB0aGlzLl9jb25uZWN0aW9uLnBvc3Q8dHlwZXMuTG9naW5SZXNwb25zZT4oJy9yZXN0LWF1dGgvbG9naW4vJywgYXV0aERhdGEpLnB1Ymxpc2goKS5yZWZDb3VudCgpO1xuICAgICAgICByZXNwb25zZS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgLy8gQ29ubmVjdGlvbiBzdGF0ZSBoYXMgY2hhbmdlZCwgcmVpbml0aWFsaXplIHF1ZXJ5IG9ic2VydmVycy5cbiAgICAgICAgICAgIHRoaXMuX2Nvbm5lY3Rpb24ucXVlcnlPYnNlcnZlck1hbmFnZXIoKS5yZWluaXRpYWxpemUoKTtcbiAgICAgICAgfSwgXy5ub29wKTsgIC8vIERvIG5vdGhpbmcgb24gZXJyb3IuXG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb2dzIHRoZSB1c2VyIG91dC5cbiAgICAgKi9cbiAgICBwdWJsaWMgbG9nb3V0KCk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuTG9nb3V0UmVzcG9uc2U+IHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSB0aGlzLl9jb25uZWN0aW9uLnBvc3Q8dHlwZXMuTG9nb3V0UmVzcG9uc2U+KCcvcmVzdC1hdXRoL2xvZ291dC8nLCB7fSkucHVibGlzaCgpLnJlZkNvdW50KCk7XG4gICAgICAgIHJlc3BvbnNlLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICAvLyBDb25uZWN0aW9uIHN0YXRlIGhhcyBjaGFuZ2VkLCByZWluaXRpYWxpemUgcXVlcnkgb2JzZXJ2ZXJzLlxuICAgICAgICAgICAgdGhpcy5fY29ubmVjdGlvbi5xdWVyeU9ic2VydmVyTWFuYWdlcigpLnJlaW5pdGlhbGl6ZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH1cbn1cbiJdfQ==
