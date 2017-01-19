"use strict";
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
var APIServiceBase = (function () {
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
var APIServiceProvider = (function () {
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL3NlcnZpY2VzL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsaUNBQW1DO0FBQ25DLDBCQUF3QjtBQUV4Qix5Q0FBeUM7QUFJekMsc0NBQXNDO0FBQ3RDLHdDQUEwQztBQUUxQyxJQUFNLGFBQWEsR0FBb0IsT0FBTyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRTtJQUMxRSxjQUFjO0NBQ2pCLENBQUMsQ0FBQztBQUVIOzs7O0dBSUc7QUFDSDtJQVNJLHdCQUFZLE1BQWdELEVBQ2hELEVBQXFCLEVBQ3JCLEtBQTJCO1FBQ25DLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ2IsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDdkIsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7O09BYUc7SUFDSSwrQkFBTSxHQUFiLFVBQWlCLElBQVMsRUFBRSxPQUFvQjtRQUFwQix3QkFBQSxFQUFBLFlBQW9CO1FBQzVDLElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDeEIsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMxRCxJQUFNLE9BQU8sR0FBc0M7WUFDL0MsWUFBWSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxFQUFFO1lBQ3pDLFlBQVksRUFBRSxPQUFPO1lBQ3JCLGFBQWEsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRTtTQUM5QyxDQUFDO1FBRUYsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFJO1lBQzFCLEdBQUcsRUFBRSxHQUFHO1lBQ1IsTUFBTSxFQUFFLE1BQU07WUFDZCxPQUFPLEVBQUUsT0FBTztZQUNoQixlQUFlLEVBQUUsSUFBSTtZQUNyQixVQUFVLEVBQUU7Z0JBQ1Isa0ZBQWtGO2dCQUNsRixnRkFBZ0Y7Z0JBQ2hGLHdGQUF3RjtnQkFDeEYsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDO2dCQUVwQixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUU7b0JBQ2pCLE9BQU8sRUFBRSxPQUFPO29CQUNoQixlQUFlLEVBQUUsSUFBSTtpQkFDeEIsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFDLFFBQVE7b0JBQ2IsNERBQTREO29CQUM1RCxJQUFNLFlBQVksR0FBa0IsUUFBUSxDQUFDLElBQUssQ0FBQyxhQUFhLENBQUM7b0JBQ2pFLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO3dCQUNwQixNQUFNLENBQUMsSUFBSSxHQUFHLFlBQVksR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDO29CQUNuRCxDQUFDO29CQUNELE1BQU0sQ0FBQyxZQUFZLENBQUM7Z0JBQ3hCLENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQztZQUNELGVBQWUsRUFBRSxLQUFLO1lBQ3RCLElBQUksRUFBRSxJQUFJO1NBQ2IsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVEOztPQUVHO0lBQ0kscUNBQVksR0FBbkIsVUFBb0IsUUFBZ0IsRUFBRSxPQUFlO1FBQ2pELElBQUksSUFBVSxDQUFDO1FBQ2YsSUFBSSxDQUFDO1lBQ0QsSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFDLENBQUMsQ0FBQztRQUN6RixDQUFDO1FBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNULCtEQUErRDtZQUMvRCw0QkFBNEI7WUFDNUIsSUFBSSxHQUFVLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFDLElBQUksRUFBRSxZQUFZLEVBQUMsQ0FBQyxFQUFFLEVBQUMsSUFBSSxFQUFFLFFBQVEsRUFBQyxDQUFDLENBQUM7UUFDeEYsQ0FBQztRQUVELE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFxQixFQUFDLElBQUksRUFBRSxJQUFJLEVBQUMsRUFBRSxTQUFTLEdBQUcsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFDMUYsQ0FBQztJQUNMLHFCQUFDO0FBQUQsQ0FuRkEsQUFtRkMsSUFBQTtBQW5GWSx3Q0FBYztBQXFGM0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FzQkc7QUFDSDtJQUFBO0lBaUNBLENBQUM7SUExQlUsbUNBQU0sR0FBYixVQUFjLEdBQXNCLEVBQ3RCLFVBQXNCLEVBQ3RCLE9BQWUsRUFDZixZQUFvQjtRQUM5QixJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUNoQixJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztRQUM5QixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztRQUN4QixJQUFJLENBQUMsYUFBYSxHQUFHLFlBQVksQ0FBQztJQUN0QyxDQUFDO0lBRUQsWUFBWTtJQUNMLGlDQUFJLEdBQVgsVUFBWSxNQUFnRCxFQUNoRCxFQUFxQixFQUNyQixLQUEyQjtRQUNuQyxnREFBZ0Q7UUFDaEQsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQUMsTUFBTSxJQUFJLGdCQUFRLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUUxRCwrQ0FBK0M7UUFDL0MsSUFBSSxZQUFZLEdBQUcsY0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxjQUFjLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM5RCxNQUFNLENBQUMsSUFBSSxZQUFZO1FBQ25CLDhCQUE4QjtRQUM5QixDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDO1FBQ3JELHFDQUFxQztRQUNyQyxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQ3RCLENBQUM7SUFDTixDQUFDO0lBQ0wseUJBQUM7QUFBRCxDQWpDQSxBQWlDQyxJQUFBO0FBakNZLGdEQUFrQjtBQW1DL0IsYUFBYSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyIsImZpbGUiOiJjb3JlL3NlcnZpY2VzL2FwaS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFuZ3VsYXIgZnJvbSAnYW5ndWxhcic7XG5pbXBvcnQgJ25nLWZpbGUtdXBsb2FkJztcblxuaW1wb3J0IHtHZW5FcnJvcn0gZnJvbSAnLi4vZXJyb3JzL2Vycm9yJztcbmltcG9ydCB7UmVzb2x3ZUFwaX0gZnJvbSAnLi4vLi4vYXBpJztcbmltcG9ydCB7Q29ubmVjdGlvbn0gZnJvbSAnLi4vLi4vYXBpL2Nvbm5lY3Rpb24nO1xuaW1wb3J0IHtGaWxlVXBsb2FkUmVzcG9uc2V9IGZyb20gJy4uLy4uL2FwaS90eXBlcy9tb2R1bGVzJztcbmltcG9ydCB7Y29tcG9zZX0gZnJvbSAnLi4vdXRpbHMvbGFuZyc7XG5pbXBvcnQgKiBhcyByYW5kb20gZnJvbSAnLi4vdXRpbHMvcmFuZG9tJztcblxuY29uc3QgYW5ndWxhck1vZHVsZTogYW5ndWxhci5JTW9kdWxlID0gYW5ndWxhci5tb2R1bGUoJ3Jlc29sd2Uuc2VydmljZXMuYXBpJywgW1xuICAgICduZ0ZpbGVVcGxvYWQnLFxuXSk7XG5cbi8qKlxuICogQmFzZSBBUEkgc2VydmljZSBjbGFzcyBwcm92aWRpbmcgYWRkaXRpb25hbCBmZWF0dXJlcyBsaWtlIGZpbGVcbiAqIHVwbG9hZCBzdXBwb3J0LiBJdCBzaG91bGQgYmUgdXNlZCBhcyBhIG1peGluIHRvZ2V0aGVyIHdpdGggYW5cbiAqIGFjdHVhbCBBUEkgY2xhc3MuXG4gKi9cbmV4cG9ydCBjbGFzcyBBUElTZXJ2aWNlQmFzZSB7XG4gICAgLy8gTm90ZSB0aGF0IHRoaXMgY29ubmVjdGlvbiBwcm9wZXJ0eSBpcyBub3QgaW5pdGlhbGl6ZWQgYW55d2hlcmUgYXMgaXQgd2lsbFxuICAgIC8vIGJlIGluaXRpYWxpemVkIGJ5IHRoZSBhY3R1YWwgQVBJIHdoaWNoIGlzIG1peGVkIGluIGJ5IHRoZSBwcm92aWRlci5cbiAgICBwdWJsaWMgY29ubmVjdGlvbjogQ29ubmVjdGlvbjtcblxuICAgIHByaXZhdGUgX3VwbG9hZDogYW5ndWxhci5hbmd1bGFyRmlsZVVwbG9hZC5JVXBsb2FkU2VydmljZTtcbiAgICBwcml2YXRlIF9xOiBhbmd1bGFyLklRU2VydmljZTtcbiAgICBwcml2YXRlIF9odHRwOiBhbmd1bGFyLklIdHRwU2VydmljZTtcblxuICAgIGNvbnN0cnVjdG9yKFVwbG9hZDogYW5ndWxhci5hbmd1bGFyRmlsZVVwbG9hZC5JVXBsb2FkU2VydmljZSxcbiAgICAgICAgICAgICAgICAkcTogYW5ndWxhci5JUVNlcnZpY2UsXG4gICAgICAgICAgICAgICAgJGh0dHA6IGFuZ3VsYXIuSUh0dHBTZXJ2aWNlKSB7XG4gICAgICAgIHRoaXMuX3VwbG9hZCA9IFVwbG9hZDtcbiAgICAgICAgdGhpcy5fcSA9ICRxO1xuICAgICAgICB0aGlzLl9odHRwID0gJGh0dHA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGVyZm9ybXMgYSBkYXRhIHVwbG9hZC5cbiAgICAgKlxuICAgICAqIEVhY2ggZmllbGQgaW5jbHVkaW5nIG5lc3RlZCBvYmplY3RzIHdpbGwgYmUgc2VudCBhcyBhIGZvcm0gZGF0YSBtdWx0aXBhcnQuXG4gICAgICogU2FtcGxlczpcbiAgICAgKiAgIHtwaWM6IGZpbGUsIHVzZXJuYW1lOiB1c2VybmFtZX1cbiAgICAgKiAgIHtmaWxlczogZmlsZXMsIG90aGVySW5mbzoge2lkOiBpZCwgcGVyc29uOiBwZXJzb24sLi4ufX0gbXVsdGlwbGUgZmlsZXMgKGh0bWw1KVxuICAgICAqICAge3Byb2ZpbGVzOiB7W3twaWM6IGZpbGUxLCB1c2VybmFtZTogdXNlcm5hbWUxfSwge3BpYzogZmlsZTIsIHVzZXJuYW1lOiB1c2VybmFtZTJ9XX0gbmVzdGVkIGFycmF5IG11bHRpcGxlIGZpbGVzIChodG1sNSlcbiAgICAgKiAgIHtmaWxlOiBmaWxlLCBpbmZvOiBVcGxvYWQuanNvbih7aWQ6IGlkLCBuYW1lOiBuYW1lLCAuLi59KX0gc2VuZCBmaWVsZHMgYXMganNvbiBzdHJpbmdcbiAgICAgKiAgIHtmaWxlOiBmaWxlLCBpbmZvOiBVcGxvYWQuanNvbkJsb2Ioe2lkOiBpZCwgbmFtZTogbmFtZSwgLi4ufSl9IHNlbmQgZmllbGRzIGFzIGpzb24gYmxvYiwgJ2FwcGxpY2F0aW9uL2pzb24nIGNvbnRlbnRfdHlwZVxuICAgICAqICAge3BpY0ZpbGU6IFVwbG9hZC5yZW5hbWUoZmlsZSwgJ3Byb2ZpbGUuanBnJyksIHRpdGxlOiB0aXRsZX0gc2VuZCBmaWxlIHdpdGggcGljRmlsZSBrZXkgYW5kIHByb2ZpbGUuanBnIGZpbGUgbmFtZVxuICAgICAqXG4gICAgICogQHBhcmFtIHthbnl9IGRhdGEgU2VlIGFuZ3VsYXIuYW5ndWxhckZpbGVVcGxvYWQuSUZpbGVVcGxvYWRDb25maWdGaWxlLlxuICAgICAqL1xuICAgIHB1YmxpYyB1cGxvYWQ8VD4oZGF0YTogYW55LCBmaWxlVUlEOiBzdHJpbmcgPSAnJyk6IGFuZ3VsYXIuYW5ndWxhckZpbGVVcGxvYWQuSVVwbG9hZFByb21pc2U8VD4ge1xuICAgICAgICBjb25zdCBodHRwID0gdGhpcy5faHR0cDtcbiAgICAgICAgY29uc3QgdXJsID0gdGhpcy5jb25uZWN0aW9uLmNyZWF0ZVVyaUZyb21QYXRoKCcvdXBsb2FkLycpO1xuICAgICAgICBjb25zdCBoZWFkZXJzOiBhbmd1bGFyLklIdHRwUmVxdWVzdENvbmZpZ0hlYWRlcnMgPSB7XG4gICAgICAgICAgICAnU2Vzc2lvbi1JZCc6IHRoaXMuY29ubmVjdGlvbi5zZXNzaW9uSWQoKSxcbiAgICAgICAgICAgICdYLUZpbGUtVWlkJzogZmlsZVVJRCxcbiAgICAgICAgICAgICdYLUNTUkZUb2tlbic6IHRoaXMuY29ubmVjdGlvbi5jc3JmQ29va2llKCksXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3VwbG9hZC51cGxvYWQ8VD4oe1xuICAgICAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWUsXG4gICAgICAgICAgICByZXN1bWVTaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gVGhlcmUgaXMgYSByZWFzb24gdGhhdCB0aGlzIGZ1bmN0aW9uIGRvZXMgbm90IHVzZSB0aGUgZmF0IGFycm93IHN5bnRheC4gV2UgbmVlZFxuICAgICAgICAgICAgICAgIC8vIHRvIGdldCBhIHJlZmVyZW5jZSB0byB0aGUgaW50ZXJuYWwgY29uZmlnIG9iamVjdCAodmlhICd0aGlzJykgZHVlIHRvIGEgYnVnIGluXG4gICAgICAgICAgICAgICAgLy8gdGhlIG5nLWZpbGUtdXBsb2FkIGxpYnJhcnk6IGh0dHBzOi8vZ2l0aHViLmNvbS9kYW5pYWxmYXJpZC9uZy1maWxlLXVwbG9hZC9pc3N1ZXMvMTM5MlxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQodXJsLCB7XG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICAgICAgICAgICAgICAgIHdpdGhDcmVkZW50aWFsczogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9KS50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBTZXQgX2VuZCBhcyBpdCBpcyBvdGhlcndpc2Ugbm90IHNldCBkdWUgdG8gdGhlIGFib3ZlIGJ1Zy5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdW1lT2Zmc2V0OiBudW1iZXIgPSAoPGFueT4gcmVzcG9uc2UuZGF0YSkucmVzdW1lX29mZnNldDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmZpZy5fY2h1bmtTaXplKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maWcuX2VuZCA9IHJlc3VtZU9mZnNldCArIGNvbmZpZy5fY2h1bmtTaXplO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bWVPZmZzZXQ7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzdW1lQ2h1bmtTaXplOiAnMU1CJyxcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwbG9hZHMgc3RyaW5nIGNvbnRlbnQgYXMgYSBmaWxlLlxuICAgICAqL1xuICAgIHB1YmxpYyB1cGxvYWRTdHJpbmcoZmlsZW5hbWU6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogYW5ndWxhci5hbmd1bGFyRmlsZVVwbG9hZC5JVXBsb2FkUHJvbWlzZTxGaWxlVXBsb2FkUmVzcG9uc2U+IHtcbiAgICAgICAgbGV0IGZpbGU6IEZpbGU7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBmaWxlID0gbmV3IEZpbGUoW2NvbnRlbnRdLCBmaWxlbmFtZSwge3R5cGU6ICd0ZXh0L3BsYWluJywgbGFzdE1vZGlmaWVkOiBEYXRlLm5vdygpfSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIFNpbXBsZSBmYWxsYmFjayBmb3IgU2FmYXJpIDkgYW5kIElFL0VkZ2UsIGJlY2F1c2UgdGhleSBkb24ndFxuICAgICAgICAgICAgLy8gc3VwcG9ydCBGaWxlIGNvbnN0cnVjdG9yLlxuICAgICAgICAgICAgZmlsZSA9IDxGaWxlPiBfLmFzc2lnbihuZXcgQmxvYihbY29udGVudF0sIHt0eXBlOiAndGV4dC9wbGFpbid9KSwge25hbWU6IGZpbGVuYW1lfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy51cGxvYWQ8RmlsZVVwbG9hZFJlc3BvbnNlPih7ZmlsZTogZmlsZX0sICdzdHJpbmctJyArIHJhbmRvbS5yYW5kb21VdWlkKCkpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBTZXJ2aWNlIHByb3ZpZGVyIGZvciBjb25maWd1cmluZyB0aGUgQVBJIHNlcnZpY2UuIEJlZm9yZSB1c2luZyB0aGVcbiAqIEFQSSBzZXJ2aWNlLCB0aGlzIHByb3ZpZGVyIG11c3QgYmUgY29uZmlndXJlZCB3aXRoIGFuIGFjdHVhbCBBUElcbiAqIGNsYXNzLCB3aGljaCBzaG91bGQgZGVyaXZlIGZyb20gW1tSZXNvbHdlQXBpXV0uXG4gKlxuICogRm9yIGV4YW1wbGUsIGlmIHRoZSBBUEkgY2xhc3MgaXMgY2FsbGVkIGBCYXNlQXBpYCwgd2UgY2FuIGNvbmZpZ3VyZVxuICogdGhlIEFQSSBzZXJ2aWNlIGFzIGZvbGxvd3M6XG4gKiBgYGBcbiAqIC8vIENyZWF0ZSBhIHR5cGUgZm9yIHRoZSBzZXJ2aWNlLlxuICogZXhwb3J0IGludGVyZmFjZSBBUElTZXJ2aWNlIGV4dGVuZHMgQVBJU2VydmljZUJhc2UsIEJhc2VBcGkge1xuICogfVxuICpcbiAqIC8vIENvbmZpZ3VyZSB0aGUgQVBJIHByb3ZpZGVyIHdpdGggb3VyIEFQSSBpbnN0YW5jZS5cbiAqIG1vZHVsZS5jb25maWcoKGFwaVByb3ZpZGVyOiBBUElTZXJ2aWNlUHJvdmlkZXIpID0+IHtcbiAqICAgICBhcGlQcm92aWRlci5zZXRBUEkoXG4gKiAgICAgICAgIEJhc2VBcGksXG4gKiAgICAgICAgIG5ldyBTaW1wbGVDb25uZWN0aW9uKCksXG4gKiAgICAgICAgIFJFU1RfVVJMLFxuICogICAgICAgICBXRUJTT0NLRVRfVVJMXG4gKiAgICAgKTtcbiAqIH0pO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBBUElTZXJ2aWNlUHJvdmlkZXIge1xuICAgIC8vIEFQSSBpbnN0YW5jZSB0aGF0IHNob3VsZCBiZSB1c2VkIGJ5IHRoZSBzZXJ2aWNlLlxuICAgIHByaXZhdGUgX2FwaTogdHlwZW9mIFJlc29sd2VBcGk7XG4gICAgcHJpdmF0ZSBfY29ubmVjdGlvbjogQ29ubmVjdGlvbjtcbiAgICBwcml2YXRlIF9yZXN0VXJpOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBfd2Vic29ja2V0VXJpOiBzdHJpbmc7XG5cbiAgICBwdWJsaWMgc2V0QVBJKGFwaTogdHlwZW9mIFJlc29sd2VBcGksXG4gICAgICAgICAgICAgICAgICBjb25uZWN0aW9uOiBDb25uZWN0aW9uLFxuICAgICAgICAgICAgICAgICAgcmVzdFVyaTogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgd2Vic29ja2V0VXJpOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5fYXBpID0gYXBpO1xuICAgICAgICB0aGlzLl9jb25uZWN0aW9uID0gY29ubmVjdGlvbjtcbiAgICAgICAgdGhpcy5fcmVzdFVyaSA9IHJlc3RVcmk7XG4gICAgICAgIHRoaXMuX3dlYnNvY2tldFVyaSA9IHdlYnNvY2tldFVyaTtcbiAgICB9XG5cbiAgICAvLyBAbmdJbmplY3RcbiAgICBwdWJsaWMgJGdldChVcGxvYWQ6IGFuZ3VsYXIuYW5ndWxhckZpbGVVcGxvYWQuSVVwbG9hZFNlcnZpY2UsXG4gICAgICAgICAgICAgICAgJHE6IGFuZ3VsYXIuSVFTZXJ2aWNlLFxuICAgICAgICAgICAgICAgICRodHRwOiBhbmd1bGFyLklIdHRwU2VydmljZSkge1xuICAgICAgICAvLyBUT0RPOiBVc2UgZXJyb3Igbm90aWZjaWF0aW9uIHNlcnZpY2UgaW5zdGVhZC5cbiAgICAgICAgaWYgKCF0aGlzLl9hcGkpIHRocm93IG5ldyBHZW5FcnJvcihcIkFQSSBub3QgY29uZmlndXJlZC5cIik7XG5cbiAgICAgICAgLy8gTWl4IHRvZ2V0aGVyIHRoZSBBUEkgYW5kIHRoZSBBUElTZXJ2aWNlQmFzZS5cbiAgICAgICAgbGV0IHNlcnZpY2VDbGFzcyA9IGNvbXBvc2UoW3RoaXMuX2FwaSwgQVBJU2VydmljZUJhc2VdLCB0cnVlKTtcbiAgICAgICAgcmV0dXJuIG5ldyBzZXJ2aWNlQ2xhc3MoXG4gICAgICAgICAgICAvLyBBcmd1bWVudHMgZm9yIHRoZSBBUEkgcGFydC5cbiAgICAgICAgICAgIFt0aGlzLl9jb25uZWN0aW9uLCB0aGlzLl9yZXN0VXJpLCB0aGlzLl93ZWJzb2NrZXRVcmldLFxuICAgICAgICAgICAgLy8gQXJndW1lbnRzIGZvciBBUElTZXJ2aWNlQmFzZSBwYXJ0LlxuICAgICAgICAgICAgW1VwbG9hZCwgJHEsICRodHRwXVxuICAgICAgICApO1xuICAgIH1cbn1cblxuYW5ndWxhck1vZHVsZS5wcm92aWRlcignYXBpJywgQVBJU2VydmljZVByb3ZpZGVyKTtcbiJdfQ==
