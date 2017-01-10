"use strict";
var angular = require("angular");
require("ng-file-upload");
var error_1 = require("../errors/error");
var lang_1 = require("../utils/lang");
var random = require("../utils/random");
var module = angular.module('resolwe.services.api', [
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
module.provider('api', APIServiceProvider);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL3NlcnZpY2VzL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsaUNBQW1DO0FBQ25DLDBCQUF3QjtBQUV4Qix5Q0FBeUM7QUFJekMsc0NBQXNDO0FBQ3RDLHdDQUEwQztBQUUxQyxJQUFNLE1BQU0sR0FBb0IsT0FBTyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRTtJQUNuRSxjQUFjO0NBQ2pCLENBQUMsQ0FBQztBQUVIOzs7O0dBSUc7QUFDSDtJQVNJLHdCQUFZLE1BQWdELEVBQ2hELEVBQXFCLEVBQ3JCLEtBQTJCO1FBQ25DLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ2IsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDdkIsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7O09BYUc7SUFDSSwrQkFBTSxHQUFiLFVBQWlCLElBQVMsRUFBRSxPQUFvQjtRQUFwQix3QkFBQSxFQUFBLFlBQW9CO1FBQzVDLElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDeEIsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMxRCxJQUFNLE9BQU8sR0FBc0M7WUFDL0MsWUFBWSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxFQUFFO1lBQ3pDLFlBQVksRUFBRSxPQUFPO1lBQ3JCLGFBQWEsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRTtTQUM5QyxDQUFDO1FBRUYsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFJO1lBQzFCLEdBQUcsRUFBRSxHQUFHO1lBQ1IsTUFBTSxFQUFFLE1BQU07WUFDZCxPQUFPLEVBQUUsT0FBTztZQUNoQixlQUFlLEVBQUUsSUFBSTtZQUNyQixVQUFVLEVBQUU7Z0JBQ1Isa0ZBQWtGO2dCQUNs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Q3RCLENBQUM7SUFDTixDQUFDO0lBQ0wseUJBQUM7QUFBRCxDQWpDQSxBQWlDQyxJQUFBO0FBakNZLGdEQUFrQjtBQW1DL0IsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyIsImZpbGUiOiJjb3JlL3NlcnZpY2VzL2FwaS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFuZ3VsYXIgZnJvbSAnYW5ndWxhcic7XG5pbXBvcnQgJ25nLWZpbGUtdXBsb2FkJztcblxuaW1wb3J0IHtHZW5FcnJvcn0gZnJvbSAnLi4vZXJyb3JzL2Vycm9yJztcbmltcG9ydCB7UmVzb2x3ZUFwaX0gZnJvbSAnLi4vLi4vYXBpJztcbmltcG9ydCB7Q29ubmVjdGlvbn0gZnJvbSAnLi4vLi4vYXBpL2Nvbm5lY3Rpb24nO1xuaW1wb3J0IHtGaWxlVXBsb2FkUmVzcG9uc2V9IGZyb20gJy4uLy4uL2FwaS90eXBlcy9tb2R1bGVzJztcbmltcG9ydCB7Y29tcG9zZX0gZnJvbSAnLi4vdXRpbHMvbGFuZyc7XG5pbXBvcnQgKiBhcyByYW5kb20gZnJvbSAnLi4vdXRpbHMvcmFuZG9tJztcblxuY29uc3QgbW9kdWxlOiBhbmd1bGFyLklNb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgncmVzb2x3ZS5zZXJ2aWNlcy5hcGknLCBbXG4gICAgJ25nRmlsZVVwbG9hZCcsXG5dKTtcblxuLyoqXG4gKiBCYXNlIEFQSSBzZXJ2aWNlIGNsYXNzIHByb3ZpZGluZyBhZGRpdGlvbmFsIGZlYXR1cmVzIGxpa2UgZmlsZVxuICogdXBsb2FkIHN1cHBvcnQuIEl0IHNob3VsZCBiZSB1c2VkIGFzIGEgbWl4aW4gdG9nZXRoZXIgd2l0aCBhblxuICogYWN0dWFsIEFQSSBjbGFzcy5cbiAqL1xuZXhwb3J0IGNsYXNzIEFQSVNlcnZpY2VCYXNlIHtcbiAgICAvLyBOb3RlIHRoYXQgdGhpcyBjb25uZWN0aW9uIHByb3BlcnR5IGlzIG5vdCBpbml0aWFsaXplZCBhbnl3aGVyZSBhcyBpdCB3aWxsXG4gICAgLy8gYmUgaW5pdGlhbGl6ZWQgYnkgdGhlIGFjdHVhbCBBUEkgd2hpY2ggaXMgbWl4ZWQgaW4gYnkgdGhlIHByb3ZpZGVyLlxuICAgIHB1YmxpYyBjb25uZWN0aW9uOiBDb25uZWN0aW9uO1xuXG4gICAgcHJpdmF0ZSBfdXBsb2FkOiBhbmd1bGFyLmFuZ3VsYXJGaWxlVXBsb2FkLklVcGxvYWRTZXJ2aWNlO1xuICAgIHByaXZhdGUgX3E6IGFuZ3VsYXIuSVFTZXJ2aWNlO1xuICAgIHByaXZhdGUgX2h0dHA6IGFuZ3VsYXIuSUh0dHBTZXJ2aWNlO1xuXG4gICAgY29uc3RydWN0b3IoVXBsb2FkOiBhbmd1bGFyLmFuZ3VsYXJGaWxlVXBsb2FkLklVcGxvYWRTZXJ2aWNlLFxuICAgICAgICAgICAgICAgICRxOiBhbmd1bGFyLklRU2VydmljZSxcbiAgICAgICAgICAgICAgICAkaHR0cDogYW5ndWxhci5JSHR0cFNlcnZpY2UpIHtcbiAgICAgICAgdGhpcy5fdXBsb2FkID0gVXBsb2FkO1xuICAgICAgICB0aGlzLl9xID0gJHE7XG4gICAgICAgIHRoaXMuX2h0dHAgPSAkaHR0cDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtcyBhIGRhdGEgdXBsb2FkLlxuICAgICAqXG4gICAgICogRWFjaCBmaWVsZCBpbmNsdWRpbmcgbmVzdGVkIG9iamVjdHMgd2lsbCBiZSBzZW50IGFzIGEgZm9ybSBkYXRhIG11bHRpcGFydC5cbiAgICAgKiBTYW1wbGVzOlxuICAgICAqICAge3BpYzogZmlsZSwgdXNlcm5hbWU6IHVzZXJuYW1lfVxuICAgICAqICAge2ZpbGVzOiBmaWxlcywgb3RoZXJJbmZvOiB7aWQ6IGlkLCBwZXJzb246IHBlcnNvbiwuLi59fSBtdWx0aXBsZSBmaWxlcyAoaHRtbDUpXG4gICAgICogICB7cHJvZmlsZXM6IHtbe3BpYzogZmlsZTEsIHVzZXJuYW1lOiB1c2VybmFtZTF9LCB7cGljOiBmaWxlMiwgdXNlcm5hbWU6IHVzZXJuYW1lMn1dfSBuZXN0ZWQgYXJyYXkgbXVsdGlwbGUgZmlsZXMgKGh0bWw1KVxuICAgICAqICAge2ZpbGU6IGZpbGUsIGluZm86IFVwbG9hZC5qc29uKHtpZDogaWQsIG5hbWU6IG5hbWUsIC4uLn0pfSBzZW5kIGZpZWxkcyBhcyBqc29uIHN0cmluZ1xuICAgICAqICAge2ZpbGU6IGZpbGUsIGluZm86IFVwbG9hZC5qc29uQmxvYih7aWQ6IGlkLCBuYW1lOiBuYW1lLCAuLi59KX0gc2VuZCBmaWVsZHMgYXMganNvbiBibG9iLCAnYXBwbGljYXRpb24vanNvbicgY29udGVudF90eXBlXG4gICAgICogICB7cGljRmlsZTogVXBsb2FkLnJlbmFtZShmaWxlLCAncHJvZmlsZS5qcGcnKSwgdGl0bGU6IHRpdGxlfSBzZW5kIGZpbGUgd2l0aCBwaWNGaWxlIGtleSBhbmQgcHJvZmlsZS5qcGcgZmlsZSBuYW1lXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2FueX0gZGF0YSBTZWUgYW5ndWxhci5hbmd1bGFyRmlsZVVwbG9hZC5JRmlsZVVwbG9hZENvbmZpZ0ZpbGUuXG4gICAgICovXG4gICAgcHVibGljIHVwbG9hZDxUPihkYXRhOiBhbnksIGZpbGVVSUQ6IHN0cmluZyA9ICcnKTogYW5ndWxhci5hbmd1bGFyRmlsZVVwbG9hZC5JVXBsb2FkUHJvbWlzZTxUPiB7XG4gICAgICAgIGNvbnN0IGh0dHAgPSB0aGlzLl9odHRwO1xuICAgICAgICBjb25zdCB1cmwgPSB0aGlzLmNvbm5lY3Rpb24uY3JlYXRlVXJpRnJvbVBhdGgoJy91cGxvYWQvJyk7XG4gICAgICAgIGNvbnN0IGhlYWRlcnM6IGFuZ3VsYXIuSUh0dHBSZXF1ZXN0Q29uZmlnSGVhZGVycyA9IHtcbiAgICAgICAgICAgICdTZXNzaW9uLUlkJzogdGhpcy5jb25uZWN0aW9uLnNlc3Npb25JZCgpLFxuICAgICAgICAgICAgJ1gtRmlsZS1VaWQnOiBmaWxlVUlELFxuICAgICAgICAgICAgJ1gtQ1NSRlRva2VuJzogdGhpcy5jb25uZWN0aW9uLmNzcmZDb29raWUoKSxcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fdXBsb2FkLnVwbG9hZDxUPih7XG4gICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgICAgICAgIHdpdGhDcmVkZW50aWFsczogdHJ1ZSxcbiAgICAgICAgICAgIHJlc3VtZVNpemU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBUaGVyZSBpcyBhIHJlYXNvbiB0aGF0IHRoaXMgZnVuY3Rpb24gZG9lcyBub3QgdXNlIHRoZSBmYXQgYXJyb3cgc3ludGF4LiBXZSBuZWVkXG4gICAgICAgICAgICAgICAgLy8gdG8gZ2V0IGEgcmVmZXJlbmNlIHRvIHRoZSBpbnRlcm5hbCBjb25maWcgb2JqZWN0ICh2aWEgJ3RoaXMnKSBkdWUgdG8gYSBidWcgaW5cbiAgICAgICAgICAgICAgICAvLyB0aGUgbmctZmlsZS11cGxvYWQgbGlicmFyeTogaHR0cHM6Ly9naXRodWIuY29tL2RhbmlhbGZhcmlkL25nLWZpbGUtdXBsb2FkL2lzc3Vlcy8xMzkyXG4gICAgICAgICAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcblxuICAgICAgICAgICAgICAgIHJldHVybiBodHRwLmdldCh1cmwsIHtcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgICAgICAgICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0pLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFNldCBfZW5kIGFzIGl0IGlzIG90aGVyd2lzZSBub3Qgc2V0IGR1ZSB0byB0aGUgYWJvdmUgYnVnLlxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bWVPZmZzZXQ6IG51bWJlciA9ICg8YW55PiByZXNwb25zZS5kYXRhKS5yZXN1bWVfb2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29uZmlnLl9jaHVua1NpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZy5fZW5kID0gcmVzdW1lT2Zmc2V0ICsgY29uZmlnLl9jaHVua1NpemU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VtZU9mZnNldDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXN1bWVDaHVua1NpemU6ICcxTUInLFxuICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBsb2FkcyBzdHJpbmcgY29udGVudCBhcyBhIGZpbGUuXG4gICAgICovXG4gICAgcHVibGljIHVwbG9hZFN0cmluZyhmaWxlbmFtZTogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBhbmd1bGFyLmFuZ3VsYXJGaWxlVXBsb2FkLklVcGxvYWRQcm9taXNlPEZpbGVVcGxvYWRSZXNwb25zZT4ge1xuICAgICAgICBsZXQgZmlsZTogRmlsZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZpbGUgPSBuZXcgRmlsZShbY29udGVudF0sIGZpbGVuYW1lLCB7dHlwZTogJ3RleHQvcGxhaW4nLCBsYXN0TW9kaWZpZWQ6IERhdGUubm93KCl9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gU2ltcGxlIGZhbGxiYWNrIGZvciBTYWZhcmkgOSBhbmQgSUUvRWRnZSwgYmVjYXVzZSB0aGV5IGRvbid0XG4gICAgICAgICAgICAvLyBzdXBwb3J0IEZpbGUgY29uc3RydWN0b3IuXG4gICAgICAgICAgICBmaWxlID0gPEZpbGU+IF8uYXNzaWduKG5ldyBCbG9iKFtjb250ZW50XSwge3R5cGU6ICd0ZXh0L3BsYWluJ30pLCB7bmFtZTogZmlsZW5hbWV9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLnVwbG9hZDxGaWxlVXBsb2FkUmVzcG9uc2U+KHtmaWxlOiBmaWxlfSwgJ3N0cmluZy0nICsgcmFuZG9tLnJhbmRvbVV1aWQoKSk7XG4gICAgfVxufVxuXG4vKipcbiAqIFNlcnZpY2UgcHJvdmlkZXIgZm9yIGNvbmZpZ3VyaW5nIHRoZSBBUEkgc2VydmljZS4gQmVmb3JlIHVzaW5nIHRoZVxuICogQVBJIHNlcnZpY2UsIHRoaXMgcHJvdmlkZXIgbXVzdCBiZSBjb25maWd1cmVkIHdpdGggYW4gYWN0dWFsIEFQSVxuICogY2xhc3MsIHdoaWNoIHNob3VsZCBkZXJpdmUgZnJvbSBbW1Jlc29sd2VBcGldXS5cbiAqXG4gKiBGb3IgZXhhbXBsZSwgaWYgdGhlIEFQSSBjbGFzcyBpcyBjYWxsZWQgYEJhc2VBcGlgLCB3ZSBjYW4gY29uZmlndXJlXG4gKiB0aGUgQVBJIHNlcnZpY2UgYXMgZm9sbG93czpcbiAqIGBgYFxuICogLy8gQ3JlYXRlIGEgdHlwZSBmb3IgdGhlIHNlcnZpY2UuXG4gKiBleHBvcnQgaW50ZXJmYWNlIEFQSVNlcnZpY2UgZXh0ZW5kcyBBUElTZXJ2aWNlQmFzZSwgQmFzZUFwaSB7XG4gKiB9XG4gKlxuICogLy8gQ29uZmlndXJlIHRoZSBBUEkgcHJvdmlkZXIgd2l0aCBvdXIgQVBJIGluc3RhbmNlLlxuICogbW9kdWxlLmNvbmZpZygoYXBpUHJvdmlkZXI6IEFQSVNlcnZpY2VQcm92aWRlcikgPT4ge1xuICogICAgIGFwaVByb3ZpZGVyLnNldEFQSShcbiAqICAgICAgICAgQmFzZUFwaSxcbiAqICAgICAgICAgbmV3IFNpbXBsZUNvbm5lY3Rpb24oKSxcbiAqICAgICAgICAgUkVTVF9VUkwsXG4gKiAgICAgICAgIFdFQlNPQ0tFVF9VUkxcbiAqICAgICApO1xuICogfSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIEFQSVNlcnZpY2VQcm92aWRlciB7XG4gICAgLy8gQVBJIGluc3RhbmNlIHRoYXQgc2hvdWxkIGJlIHVzZWQgYnkgdGhlIHNlcnZpY2UuXG4gICAgcHJpdmF0ZSBfYXBpOiB0eXBlb2YgUmVzb2x3ZUFwaTtcbiAgICBwcml2YXRlIF9jb25uZWN0aW9uOiBDb25uZWN0aW9uO1xuICAgIHByaXZhdGUgX3Jlc3RVcmk6IHN0cmluZztcbiAgICBwcml2YXRlIF93ZWJzb2NrZXRVcmk6IHN0cmluZztcblxuICAgIHB1YmxpYyBzZXRBUEkoYXBpOiB0eXBlb2YgUmVzb2x3ZUFwaSxcbiAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb246IENvbm5lY3Rpb24sXG4gICAgICAgICAgICAgICAgICByZXN0VXJpOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICB3ZWJzb2NrZXRVcmk6IHN0cmluZykge1xuICAgICAgICB0aGlzLl9hcGkgPSBhcGk7XG4gICAgICAgIHRoaXMuX2Nvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xuICAgICAgICB0aGlzLl9yZXN0VXJpID0gcmVzdFVyaTtcbiAgICAgICAgdGhpcy5fd2Vic29ja2V0VXJpID0gd2Vic29ja2V0VXJpO1xuICAgIH1cblxuICAgIC8vIEBuZ0luamVjdFxuICAgIHB1YmxpYyAkZ2V0KFVwbG9hZDogYW5ndWxhci5hbmd1bGFyRmlsZVVwbG9hZC5JVXBsb2FkU2VydmljZSxcbiAgICAgICAgICAgICAgICAkcTogYW5ndWxhci5JUVNlcnZpY2UsXG4gICAgICAgICAgICAgICAgJGh0dHA6IGFuZ3VsYXIuSUh0dHBTZXJ2aWNlKSB7XG4gICAgICAgIC8vIFRPRE86IFVzZSBlcnJvciBub3RpZmNpYXRpb24gc2VydmljZSBpbnN0ZWFkLlxuICAgICAgICBpZiAoIXRoaXMuX2FwaSkgdGhyb3cgbmV3IEdlbkVycm9yKFwiQVBJIG5vdCBjb25maWd1cmVkLlwiKTtcblxuICAgICAgICAvLyBNaXggdG9nZXRoZXIgdGhlIEFQSSBhbmQgdGhlIEFQSVNlcnZpY2VCYXNlLlxuICAgICAgICBsZXQgc2VydmljZUNsYXNzID0gY29tcG9zZShbdGhpcy5fYXBpLCBBUElTZXJ2aWNlQmFzZV0sIHRydWUpO1xuICAgICAgICByZXR1cm4gbmV3IHNlcnZpY2VDbGFzcyhcbiAgICAgICAgICAgIC8vIEFyZ3VtZW50cyBmb3IgdGhlIEFQSSBwYXJ0LlxuICAgICAgICAgICAgW3RoaXMuX2Nvbm5lY3Rpb24sIHRoaXMuX3Jlc3RVcmksIHRoaXMuX3dlYnNvY2tldFVyaV0sXG4gICAgICAgICAgICAvLyBBcmd1bWVudHMgZm9yIEFQSVNlcnZpY2VCYXNlIHBhcnQuXG4gICAgICAgICAgICBbVXBsb2FkLCAkcSwgJGh0dHBdXG4gICAgICAgICk7XG4gICAgfVxufVxuXG5tb2R1bGUucHJvdmlkZXIoJ2FwaScsIEFQSVNlcnZpY2VQcm92aWRlcik7XG4iXX0=
