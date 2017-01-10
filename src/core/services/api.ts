import * as angular from 'angular';
import 'ng-file-upload';

import {GenError} from '../errors/error';
import {ResolweApi} from '../../api';
import {Connection} from '../../api/connection';
import {FileUploadResponse} from '../../api/types/modules';
import {compose} from '../utils/lang';
import * as random from '../utils/random';

const module: angular.IModule = angular.module('resolwe.services.api', [
    'ngFileUpload',
]);

/**
 * Base API service class providing additional features like file
 * upload support. It should be used as a mixin together with an
 * actual API class.
 */
export class APIServiceBase {
    // Note that this connection property is not initialized anywhere as it will
    // be initialized by the actual API which is mixed in by the provider.
    public connection: Connection;

    private _upload: angular.angularFileUpload.IUploadService;
    private _q: angular.IQService;
    private _http: angular.IHttpService;

    constructor(Upload: angular.angularFileUpload.IUploadService,
                $q: angular.IQService,
                $http: angular.IHttpService) {
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
    public upload<T>(data: any, fileUID: string = ''): angular.angularFileUpload.IUploadPromise<T> {
        const http = this._http;
        const url = this.connection.createUriFromPath('/upload/');
        const headers: angular.IHttpRequestConfigHeaders = {
            'Session-Id': this.connection.sessionId(),
            'X-File-Uid': fileUID,
            'X-CSRFToken': this.connection.csrfCookie(),
        };

        return this._upload.upload<T>({
            url: url,
            method: 'POST',
            headers: headers,
            withCredentials: true,
            resumeSize: function () {
                // There is a reason that this function does not use the fat arrow syntax. We need
                // to get a reference to the internal config object (via 'this') due to a bug in
                // the ng-file-upload library: https://github.com/danialfarid/ng-file-upload/issues/1392
                const config = this;

                return http.get(url, {
                    headers: headers,
                    withCredentials: true,
                }).then((response) => {
                    // Set _end as it is otherwise not set due to the above bug.
                    const resumeOffset: number = (<any> response.data).resume_offset;
                    if (config._chunkSize) {
                        config._end = resumeOffset + config._chunkSize;
                    }
                    return resumeOffset;
                });
            },
            resumeChunkSize: '1MB',
            data: data,
        });
    }

    /**
     * Uploads string content as a file.
     */
    public uploadString(filename: string, content: string): angular.angularFileUpload.IUploadPromise<FileUploadResponse> {
        let file: File;
        try {
            file = new File([content], filename, {type: 'text/plain', lastModified: Date.now()});
        } catch (e) {
            // Simple fallback for Safari 9 and IE/Edge, because they don't
            // support File constructor.
            file = <File> _.assign(new Blob([content], {type: 'text/plain'}), {name: filename});
        }

        return this.upload<FileUploadResponse>({file: file}, 'string-' + random.randomUuid());
    }
}

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
export class APIServiceProvider {
    // API instance that should be used by the service.
    private _api: typeof ResolweApi;
    private _connection: Connection;
    private _restUri: string;
    private _websocketUri: string;

    public setAPI(api: typeof ResolweApi,
                  connection: Connection,
                  restUri: string,
                  websocketUri: string) {
        this._api = api;
        this._connection = connection;
        this._restUri = restUri;
        this._websocketUri = websocketUri;
    }

    // @ngInject
    public $get(Upload: angular.angularFileUpload.IUploadService,
                $q: angular.IQService,
                $http: angular.IHttpService) {
        // TODO: Use error notifciation service instead.
        if (!this._api) throw new GenError("API not configured.");

        // Mix together the API and the APIServiceBase.
        let serviceClass = compose([this._api, APIServiceBase], true);
        return new serviceClass(
            // Arguments for the API part.
            [this._connection, this._restUri, this._websocketUri],
            // Arguments for APIServiceBase part.
            [Upload, $q, $http]
        );
    }
}

module.provider('api', APIServiceProvider);
