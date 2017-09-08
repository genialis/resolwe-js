"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var angular = require("angular");
require("ng-file-upload");
var error_1 = require("../errors/error");
var lang_1 = require("../utils/lang");
var random = require("../utils/random");
var angularModule = angular.module('resolwe.services.api', [
    'ngFileUpload',
]);
/**
 * Base API service class providing additional features like file
 * upload support. It should be used as a mixin together with an
 * actual API class.
 */
var APIServiceBase = /** @class */ (function () {
    function APIServiceBase(Upload, $q, $http) {
        this._upload = Upload;
        this._q = $q;
        this._http = $http;
    }
    /**
     * Performs a data upload.
     *
     * Each field including nested objects will be sent as a form data multipart.
     * Samples:
     *   {pic: file, username: username}
     *   {files: files, otherInfo: {id: id, person: person,...}} multiple files (html5)
     *   {profiles: {[{pic: file1, username: username1}, {pic: file2, username: username2}]} nested array multiple files (html5)
     *   {file: file, info: Upload.json({id: id, name: name, ...})} send fields as json string
     *   {file: file, info: Upload.jsonBlob({id: id, name: name, ...})} send fields as json blob, 'application/json' content_type
     *   {picFile: Upload.rename(file, 'profile.jpg'), title: title} send file with picFile key and profile.jpg file name
     *
     * @param {any} data See angular.angularFileUpload.IFileUploadConfigFile.
     */
    APIServiceBase.prototype.upload = function (data, fileUID) {
        if (fileUID === void 0) { fileUID = ''; }
        var http = this._http;
        var url = this.connection.createUriFromPath('/upload/');
        var headers = {
            'Session-Id': this.connection.sessionId(),
            'X-File-Uid': fileUID,
            'X-CSRFToken': this.connection.csrfCookie(),
        };
        return this._upload.upload({
            url: url,
            method: 'POST',
            headers: headers,
            withCredentials: true,
            resumeSize: function () {
                // There is a reason that this function does not use the fat arrow syntax. We need
                // to get a reference to the internal config object (via 'this') due to a bug in
                // the ng-file-upload library: https://github.com/danialfarid/ng-file-upload/issues/1392
                var config = this;
                return http.get(url, {
                    headers: headers,
                    withCredentials: true,
                }).then(function (response) {
                    // Set _end as it is otherwise not set due to the above bug.
                    var resumeOffset = response.data.resume_offset;
                    if (config._chunkSize) {
                        config._end = resumeOffset + config._chunkSize;
                    }
                    return resumeOffset;
                });
            },
            resumeChunkSize: '1MB',
            data: data,
        });
    };
    /**
     * Uploads string content as a file.
     */
    APIServiceBase.prototype.uploadString = function (filename, content) {
        var file;
        try {
            file = new File([content], filename, { type: 'text/plain', lastModified: Date.now() });
        }
        catch (e) {
            // Simple fallback for Safari 9 and IE/Edge, because they don't
            // support File constructor.
            file = _.assign(new Blob([content], { type: 'text/plain' }), { name: filename });
        }
        return this.upload({ file: file }, 'string-' + random.randomUuid());
    };
    return APIServiceBase;
}());
exports.APIServiceBase = APIServiceBase;
/**
 * Service provider for configuring the API service. Before using the
 * API service, this provider must be configured with an actual API
 * class, which should derive from [[ResolweApi]].
 *
 * For example, if the API class is called `BaseApi`, we can configure
 * the API service as follows:
 * ```
 * // Create a type for the service.
 * export interface APIService extends APIServiceBase, BaseApi {
 * }
 *
 * // Configure the API provider with our API instance.
 * module.config((apiProvider: APIServiceProvider) => {
 *     apiProvider.setAPI(
 *         BaseApi,
 *         new SimpleConnection(),
 *         REST_URL,
 *         WEBSOCKET_URL
 *     );
 * });
 * ```
 */
var APIServiceProvider = /** @class */ (function () {
    function APIServiceProvider() {
    }
    APIServiceProvider.prototype.setAPI = function (api, connection, restUri, websocketUri) {
        this._api = api;
        this._connection = connection;
        this._restUri = restUri;
        this._websocketUri = websocketUri;
    };
    // @ngInject
    APIServiceProvider.prototype.$get = function (Upload, $q, $http) {
        // TODO: Use error notifciation service instead.
        if (!this._api)
            throw new error_1.GenError("API not configured.");
        // Mix together the API and the APIServiceBase.
        var serviceClass = lang_1.compose([this._api, APIServiceBase], true);
        return new serviceClass(
        // Arguments for the API part.
        [this._connection, this._restUri, this._websocketUri], 
        // Arguments for APIServiceBase part.
        [Upload, $q, $http]);
    };
    APIServiceProvider.prototype.$get.$inject = ["Upload", "$q", "$http"];
    return APIServiceProvider;
}());
exports.APIServiceProvider = APIServiceProvider;
angularModule.provider('api', APIServiceProvider);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL3NlcnZpY2VzL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlDQUFtQztBQUNuQywwQkFBd0I7QUFFeEIseUNBQXlDO0FBSXpDLHNDQUFzQztBQUN0Qyx3Q0FBMEM7QUFFMUMsSUFBTSxhQUFhLEdBQW9CLE9BQU8sQ0FBQyxNQUFNLENBQUMsc0JBQXNCLEVBQUU7SUFDMUUsY0FBYztDQUNqQixDQUFDLENBQUM7QUFFSDs7OztHQUlHO0FBQ0g7SUFTSSx3QkFBWSxNQUFnRCxFQUNoRCxFQUFxQixFQUNyQixLQUEyQjtRQUNuQyxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztRQUN0QixJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNiLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ3ZCLENBQUM7SUFFRDs7Ozs7Ozs7Ozs7OztPQWFHO0lBQ0ksK0JBQU0sR0FBYixVQUFpQixJQUFTLEVBQUUsT0FBb0I7UUFBcEIsd0JBQUEsRUFBQSxZQUFvQjtRQUM1QyxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ3hCLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDMUQsSUFBTSxPQUFPLEdBQXNDO1lBQy9DLFlBQVksRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRTtZQUN6QyxZQUFZLEVBQUUsT0FBTztZQUNyQixhQUFhLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUU7U0FDOUMsQ0FBQztRQUVGLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBSTtZQUMxQixHQUFHLEVBQUUsR0FBRztZQUNSLE1BQU0sRUFBRSxNQUFNO1lBQ2QsT0FBTyxFQUFFLE9BQU87WUFDaEIsZUFBZSxFQUFFLElBQUk7WUFDckIsVUFBVSxFQUFFO2dCQUNSLGtGQUFrRjtnQkFDbEYsZ0ZBQWdGO2dCQUNoRix3RkFBd0Y7Z0JBQ3hGLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQztnQkFFcEIsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFO29CQUNqQixPQUFPLEVBQUUsT0FBTztvQkFDaEIsZUFBZSxFQUFFLElBQUk7aUJBQ3hCLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQyxRQUFRO29CQUNiLDREQUE0RDtvQkFDNUQsSUFBTSxZQUFZLEdBQWtCLFFBQVEsQ0FBQyxJQUFLLENBQUMsYUFBYSxDQUFDO29CQUNqRSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQzt3QkFDcEIsTUFBTSxDQUFDLElBQUksR0FBRyxZQUFZLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQztvQkFDbkQsQ0FBQztvQkFDRCxNQUFNLENBQUMsWUFBWSxDQUFDO2dCQUN4QixDQUFDLENBQUMsQ0FBQztZQUNQLENBQUM7WUFDRCxlQUFlLEVBQUUsS0FBSztZQUN0QixJQUFJLEVBQUUsSUFBSTtTQUNiLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRDs7T0FFRztJQUNJLHFDQUFZLEdBQW5CLFVBQW9CLFFBQWdCLEVBQUUsT0FBZTtRQUNqRCxJQUFJLElBQVUsQ0FBQztRQUNmLElBQUksQ0FBQztZQUNELElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBQyxDQUFDLENBQUM7UUFDekYsQ0FBQztRQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDVCwrREFBK0Q7WUFDL0QsNEJBQTRCO1lBQzVCLElBQUksR0FBVSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBQyxJQUFJLEVBQUUsWUFBWSxFQUFDLENBQUMsRUFBRSxFQUFDLElBQUksRUFBRSxRQUFRLEVBQUMsQ0FBQyxDQUFDO1FBQ3hGLENBQUM7UUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBcUIsRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFDLEVBQUUsU0FBUyxHQUFHLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO0lBQzFGLENBQUM7SUFDTCxxQkFBQztBQUFELENBbkZBLEFBbUZDLElBQUE7QUFuRlksd0NBQWM7QUFxRjNCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBc0JHO0FBQ0g7SUFBQTtJQWlDQSxDQUFDO0lBMUJVLG1DQUFNLEdBQWIsVUFBYyxHQUFzQixFQUN0QixVQUFzQixFQUN0QixPQUFlLEVBQ2YsWUFBb0I7UUFDOUIsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7UUFDOUIsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7UUFDeEIsSUFBSSxDQUFDLGFBQWEsR0FBRyxZQUFZLENBQUM7SUFDdEMsQ0FBQztJQUVELFlBQVk7SUFDTCxpQ0FBSSxHQUFYLFVBQVksTUFBZ0QsRUFDaEQsRUFBcUIsRUFDckIsS0FBMkI7UUFDbkMsZ0RBQWdEO1FBQ2hELEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztZQUFDLE1BQU0sSUFBSSxnQkFBUSxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFFMUQsK0NBQStDO1FBQy9DLElBQUksWUFBWSxHQUFHLGNBQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDOUQsTUFBTSxDQUFDLElBQUksWUFBWTtRQUNuQiw4QkFBOEI7UUFDOUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUNyRCxxQ0FBcUM7UUFDckMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUN0QixDQUFDO0lBQ04sQ0FBQztJQUNMLHlCQUFDO0FBQUQsQ0FqQ0EsQUFpQ0MsSUFBQTtBQWpDWSxnREFBa0I7QUFtQy9CLGFBQWEsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLGtCQUFrQixDQUFDLENBQUMiLCJmaWxlIjoiY29yZS9zZXJ2aWNlcy9hcGkuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhbmd1bGFyIGZyb20gJ2FuZ3VsYXInO1xuaW1wb3J0ICduZy1maWxlLXVwbG9hZCc7XG5cbmltcG9ydCB7R2VuRXJyb3J9IGZyb20gJy4uL2Vycm9ycy9lcnJvcic7XG5pbXBvcnQge1Jlc29sd2VBcGl9IGZyb20gJy4uLy4uL2FwaSc7XG5pbXBvcnQge0Nvbm5lY3Rpb259IGZyb20gJy4uLy4uL2FwaS9jb25uZWN0aW9uJztcbmltcG9ydCB7RmlsZVVwbG9hZFJlc3BvbnNlfSBmcm9tICcuLi8uLi9hcGkvdHlwZXMvbW9kdWxlcyc7XG5pbXBvcnQge2NvbXBvc2V9IGZyb20gJy4uL3V0aWxzL2xhbmcnO1xuaW1wb3J0ICogYXMgcmFuZG9tIGZyb20gJy4uL3V0aWxzL3JhbmRvbSc7XG5cbmNvbnN0IGFuZ3VsYXJNb2R1bGU6IGFuZ3VsYXIuSU1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCdyZXNvbHdlLnNlcnZpY2VzLmFwaScsIFtcbiAgICAnbmdGaWxlVXBsb2FkJyxcbl0pO1xuXG4vKipcbiAqIEJhc2UgQVBJIHNlcnZpY2UgY2xhc3MgcHJvdmlkaW5nIGFkZGl0aW9uYWwgZmVhdHVyZXMgbGlrZSBmaWxlXG4gKiB1cGxvYWQgc3VwcG9ydC4gSXQgc2hvdWxkIGJlIHVzZWQgYXMgYSBtaXhpbiB0b2dldGhlciB3aXRoIGFuXG4gKiBhY3R1YWwgQVBJIGNsYXNzLlxuICovXG5leHBvcnQgY2xhc3MgQVBJU2VydmljZUJhc2Uge1xuICAgIC8vIE5vdGUgdGhhdCB0aGlzIGNvbm5lY3Rpb24gcHJvcGVydHkgaXMgbm90IGluaXRpYWxpemVkIGFueXdoZXJlIGFzIGl0IHdpbGxcbiAgICAvLyBiZSBpbml0aWFsaXplZCBieSB0aGUgYWN0dWFsIEFQSSB3aGljaCBpcyBtaXhlZCBpbiBieSB0aGUgcHJvdmlkZXIuXG4gICAgcHVibGljIGNvbm5lY3Rpb246IENvbm5lY3Rpb247XG5cbiAgICBwcml2YXRlIF91cGxvYWQ6IGFuZ3VsYXIuYW5ndWxhckZpbGVVcGxvYWQuSVVwbG9hZFNlcnZpY2U7XG4gICAgcHJpdmF0ZSBfcTogYW5ndWxhci5JUVNlcnZpY2U7XG4gICAgcHJpdmF0ZSBfaHR0cDogYW5ndWxhci5JSHR0cFNlcnZpY2U7XG5cbiAgICBjb25zdHJ1Y3RvcihVcGxvYWQ6IGFuZ3VsYXIuYW5ndWxhckZpbGVVcGxvYWQuSVVwbG9hZFNlcnZpY2UsXG4gICAgICAgICAgICAgICAgJHE6IGFuZ3VsYXIuSVFTZXJ2aWNlLFxuICAgICAgICAgICAgICAgICRodHRwOiBhbmd1bGFyLklIdHRwU2VydmljZSkge1xuICAgICAgICB0aGlzLl91cGxvYWQgPSBVcGxvYWQ7XG4gICAgICAgIHRoaXMuX3EgPSAkcTtcbiAgICAgICAgdGhpcy5faHR0cCA9ICRodHRwO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm1zIGEgZGF0YSB1cGxvYWQuXG4gICAgICpcbiAgICAgKiBFYWNoIGZpZWxkIGluY2x1ZGluZyBuZXN0ZWQgb2JqZWN0cyB3aWxsIGJlIHNlbnQgYXMgYSBmb3JtIGRhdGEgbXVsdGlwYXJ0LlxuICAgICAqIFNhbXBsZXM6XG4gICAgICogICB7cGljOiBmaWxlLCB1c2VybmFtZTogdXNlcm5hbWV9XG4gICAgICogICB7ZmlsZXM6IGZpbGVzLCBvdGhlckluZm86IHtpZDogaWQsIHBlcnNvbjogcGVyc29uLC4uLn19IG11bHRpcGxlIGZpbGVzIChodG1sNSlcbiAgICAgKiAgIHtwcm9maWxlczoge1t7cGljOiBmaWxlMSwgdXNlcm5hbWU6IHVzZXJuYW1lMX0sIHtwaWM6IGZpbGUyLCB1c2VybmFtZTogdXNlcm5hbWUyfV19IG5lc3RlZCBhcnJheSBtdWx0aXBsZSBmaWxlcyAoaHRtbDUpXG4gICAgICogICB7ZmlsZTogZmlsZSwgaW5mbzogVXBsb2FkLmpzb24oe2lkOiBpZCwgbmFtZTogbmFtZSwgLi4ufSl9IHNlbmQgZmllbGRzIGFzIGpzb24gc3RyaW5nXG4gICAgICogICB7ZmlsZTogZmlsZSwgaW5mbzogVXBsb2FkLmpzb25CbG9iKHtpZDogaWQsIG5hbWU6IG5hbWUsIC4uLn0pfSBzZW5kIGZpZWxkcyBhcyBqc29uIGJsb2IsICdhcHBsaWNhdGlvbi9qc29uJyBjb250ZW50X3R5cGVcbiAgICAgKiAgIHtwaWNGaWxlOiBVcGxvYWQucmVuYW1lKGZpbGUsICdwcm9maWxlLmpwZycpLCB0aXRsZTogdGl0bGV9IHNlbmQgZmlsZSB3aXRoIHBpY0ZpbGUga2V5IGFuZCBwcm9maWxlLmpwZyBmaWxlIG5hbWVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7YW55fSBkYXRhIFNlZSBhbmd1bGFyLmFuZ3VsYXJGaWxlVXBsb2FkLklGaWxlVXBsb2FkQ29uZmlnRmlsZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgdXBsb2FkPFQ+KGRhdGE6IGFueSwgZmlsZVVJRDogc3RyaW5nID0gJycpOiBhbmd1bGFyLmFuZ3VsYXJGaWxlVXBsb2FkLklVcGxvYWRQcm9taXNlPFQ+IHtcbiAgICAgICAgY29uc3QgaHR0cCA9IHRoaXMuX2h0dHA7XG4gICAgICAgIGNvbnN0IHVybCA9IHRoaXMuY29ubmVjdGlvbi5jcmVhdGVVcmlGcm9tUGF0aCgnL3VwbG9hZC8nKTtcbiAgICAgICAgY29uc3QgaGVhZGVyczogYW5ndWxhci5JSHR0cFJlcXVlc3RDb25maWdIZWFkZXJzID0ge1xuICAgICAgICAgICAgJ1Nlc3Npb24tSWQnOiB0aGlzLmNvbm5lY3Rpb24uc2Vzc2lvbklkKCksXG4gICAgICAgICAgICAnWC1GaWxlLVVpZCc6IGZpbGVVSUQsXG4gICAgICAgICAgICAnWC1DU1JGVG9rZW4nOiB0aGlzLmNvbm5lY3Rpb24uY3NyZkNvb2tpZSgpLFxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB0aGlzLl91cGxvYWQudXBsb2FkPFQ+KHtcbiAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICAgICAgcmVzdW1lU2l6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIFRoZXJlIGlzIGEgcmVhc29uIHRoYXQgdGhpcyBmdW5jdGlvbiBkb2VzIG5vdCB1c2UgdGhlIGZhdCBhcnJvdyBzeW50YXguIFdlIG5lZWRcbiAgICAgICAgICAgICAgICAvLyB0byBnZXQgYSByZWZlcmVuY2UgdG8gdGhlIGludGVybmFsIGNvbmZpZyBvYmplY3QgKHZpYSAndGhpcycpIGR1ZSB0byBhIGJ1ZyBpblxuICAgICAgICAgICAgICAgIC8vIHRoZSBuZy1maWxlLXVwbG9hZCBsaWJyYXJ5OiBodHRwczovL2dpdGh1Yi5jb20vZGFuaWFsZmFyaWQvbmctZmlsZS11cGxvYWQvaXNzdWVzLzEzOTJcbiAgICAgICAgICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KHVybCwge1xuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgICAgICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWUsXG4gICAgICAgICAgICAgICAgfSkudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gU2V0IF9lbmQgYXMgaXQgaXMgb3RoZXJ3aXNlIG5vdCBzZXQgZHVlIHRvIHRoZSBhYm92ZSBidWcuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VtZU9mZnNldDogbnVtYmVyID0gKDxhbnk+IHJlc3BvbnNlLmRhdGEpLnJlc3VtZV9vZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb25maWcuX2NodW5rU2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnLl9lbmQgPSByZXN1bWVPZmZzZXQgKyBjb25maWcuX2NodW5rU2l6ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdW1lT2Zmc2V0O1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc3VtZUNodW5rU2l6ZTogJzFNQicsXG4gICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVcGxvYWRzIHN0cmluZyBjb250ZW50IGFzIGEgZmlsZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgdXBsb2FkU3RyaW5nKGZpbGVuYW1lOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IGFuZ3VsYXIuYW5ndWxhckZpbGVVcGxvYWQuSVVwbG9hZFByb21pc2U8RmlsZVVwbG9hZFJlc3BvbnNlPiB7XG4gICAgICAgIGxldCBmaWxlOiBGaWxlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZmlsZSA9IG5ldyBGaWxlKFtjb250ZW50XSwgZmlsZW5hbWUsIHt0eXBlOiAndGV4dC9wbGFpbicsIGxhc3RNb2RpZmllZDogRGF0ZS5ub3coKX0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBTaW1wbGUgZmFsbGJhY2sgZm9yIFNhZmFyaSA5IGFuZCBJRS9FZGdlLCBiZWNhdXNlIHRoZXkgZG9uJ3RcbiAgICAgICAgICAgIC8vIHN1cHBvcnQgRmlsZSBjb25zdHJ1Y3Rvci5cbiAgICAgICAgICAgIGZpbGUgPSA8RmlsZT4gXy5hc3NpZ24obmV3IEJsb2IoW2NvbnRlbnRdLCB7dHlwZTogJ3RleHQvcGxhaW4nfSksIHtuYW1lOiBmaWxlbmFtZX0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMudXBsb2FkPEZpbGVVcGxvYWRSZXNwb25zZT4oe2ZpbGU6IGZpbGV9LCAnc3RyaW5nLScgKyByYW5kb20ucmFuZG9tVXVpZCgpKTtcbiAgICB9XG59XG5cbi8qKlxuICogU2VydmljZSBwcm92aWRlciBmb3IgY29uZmlndXJpbmcgdGhlIEFQSSBzZXJ2aWNlLiBCZWZvcmUgdXNpbmcgdGhlXG4gKiBBUEkgc2VydmljZSwgdGhpcyBwcm92aWRlciBtdXN0IGJlIGNvbmZpZ3VyZWQgd2l0aCBhbiBhY3R1YWwgQVBJXG4gKiBjbGFzcywgd2hpY2ggc2hvdWxkIGRlcml2ZSBmcm9tIFtbUmVzb2x3ZUFwaV1dLlxuICpcbiAqIEZvciBleGFtcGxlLCBpZiB0aGUgQVBJIGNsYXNzIGlzIGNhbGxlZCBgQmFzZUFwaWAsIHdlIGNhbiBjb25maWd1cmVcbiAqIHRoZSBBUEkgc2VydmljZSBhcyBmb2xsb3dzOlxuICogYGBgXG4gKiAvLyBDcmVhdGUgYSB0eXBlIGZvciB0aGUgc2VydmljZS5cbiAqIGV4cG9ydCBpbnRlcmZhY2UgQVBJU2VydmljZSBleHRlbmRzIEFQSVNlcnZpY2VCYXNlLCBCYXNlQXBpIHtcbiAqIH1cbiAqXG4gKiAvLyBDb25maWd1cmUgdGhlIEFQSSBwcm92aWRlciB3aXRoIG91ciBBUEkgaW5zdGFuY2UuXG4gKiBtb2R1bGUuY29uZmlnKChhcGlQcm92aWRlcjogQVBJU2VydmljZVByb3ZpZGVyKSA9PiB7XG4gKiAgICAgYXBpUHJvdmlkZXIuc2V0QVBJKFxuICogICAgICAgICBCYXNlQXBpLFxuICogICAgICAgICBuZXcgU2ltcGxlQ29ubmVjdGlvbigpLFxuICogICAgICAgICBSRVNUX1VSTCxcbiAqICAgICAgICAgV0VCU09DS0VUX1VSTFxuICogICAgICk7XG4gKiB9KTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgQVBJU2VydmljZVByb3ZpZGVyIHtcbiAgICAvLyBBUEkgaW5zdGFuY2UgdGhhdCBzaG91bGQgYmUgdXNlZCBieSB0aGUgc2VydmljZS5cbiAgICBwcml2YXRlIF9hcGk6IHR5cGVvZiBSZXNvbHdlQXBpO1xuICAgIHByaXZhdGUgX2Nvbm5lY3Rpb246IENvbm5lY3Rpb247XG4gICAgcHJpdmF0ZSBfcmVzdFVyaTogc3RyaW5nO1xuICAgIHByaXZhdGUgX3dlYnNvY2tldFVyaTogc3RyaW5nO1xuXG4gICAgcHVibGljIHNldEFQSShhcGk6IHR5cGVvZiBSZXNvbHdlQXBpLFxuICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbjogQ29ubmVjdGlvbixcbiAgICAgICAgICAgICAgICAgIHJlc3RVcmk6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgIHdlYnNvY2tldFVyaTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuX2FwaSA9IGFwaTtcbiAgICAgICAgdGhpcy5fY29ubmVjdGlvbiA9IGNvbm5lY3Rpb247XG4gICAgICAgIHRoaXMuX3Jlc3RVcmkgPSByZXN0VXJpO1xuICAgICAgICB0aGlzLl93ZWJzb2NrZXRVcmkgPSB3ZWJzb2NrZXRVcmk7XG4gICAgfVxuXG4gICAgLy8gQG5nSW5qZWN0XG4gICAgcHVibGljICRnZXQoVXBsb2FkOiBhbmd1bGFyLmFuZ3VsYXJGaWxlVXBsb2FkLklVcGxvYWRTZXJ2aWNlLFxuICAgICAgICAgICAgICAgICRxOiBhbmd1bGFyLklRU2VydmljZSxcbiAgICAgICAgICAgICAgICAkaHR0cDogYW5ndWxhci5JSHR0cFNlcnZpY2UpIHtcbiAgICAgICAgLy8gVE9ETzogVXNlIGVycm9yIG5vdGlmY2lhdGlvbiBzZXJ2aWNlIGluc3RlYWQuXG4gICAgICAgIGlmICghdGhpcy5fYXBpKSB0aHJvdyBuZXcgR2VuRXJyb3IoXCJBUEkgbm90IGNvbmZpZ3VyZWQuXCIpO1xuXG4gICAgICAgIC8vIE1peCB0b2dldGhlciB0aGUgQVBJIGFuZCB0aGUgQVBJU2VydmljZUJhc2UuXG4gICAgICAgIGxldCBzZXJ2aWNlQ2xhc3MgPSBjb21wb3NlKFt0aGlzLl9hcGksIEFQSVNlcnZpY2VCYXNlXSwgdHJ1ZSk7XG4gICAgICAgIHJldHVybiBuZXcgc2VydmljZUNsYXNzKFxuICAgICAgICAgICAgLy8gQXJndW1lbnRzIGZvciB0aGUgQVBJIHBhcnQuXG4gICAgICAgICAgICBbdGhpcy5fY29ubmVjdGlvbiwgdGhpcy5fcmVzdFVyaSwgdGhpcy5fd2Vic29ja2V0VXJpXSxcbiAgICAgICAgICAgIC8vIEFyZ3VtZW50cyBmb3IgQVBJU2VydmljZUJhc2UgcGFydC5cbiAgICAgICAgICAgIFtVcGxvYWQsICRxLCAkaHR0cF1cbiAgICAgICAgKTtcbiAgICB9XG59XG5cbmFuZ3VsYXJNb2R1bGUucHJvdmlkZXIoJ2FwaScsIEFQSVNlcnZpY2VQcm92aWRlcik7XG4iXX0=
