/// <reference types="ng-file-upload" />
/// <reference types="angular" />
import * as angular from 'angular';
import 'ng-file-upload';
import { ResolweApi } from '../../api';
import { Connection } from '../../api/connection';
import { FileUploadResponse } from '../../api/types/modules';
/**
 * Base API service class providing additional features like file
 * upload support. It should be used as a mixin together with an
 * actual API class.
 */
export declare class APIServiceBase {
    connection: Connection;
    private _upload;
    private _q;
    private _http;
    constructor(Upload: angular.angularFileUpload.IUploadService, $q: angular.IQService, $http: angular.IHttpService);
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
    upload<T>(data: any, fileUID?: string): angular.angularFileUpload.IUploadPromise<T>;
    /**
     * Uploads string content as a file.
     */
    uploadString(filename: string, content: string): angular.angularFileUpload.IUploadPromise<FileUploadResponse>;
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
export declare class APIServiceProvider {
    private _api;
    private _connection;
    private _restUri;
    private _websocketUri;
    setAPI(api: typeof ResolweApi, connection: Connection, restUri: string, websocketUri: string): void;
    $get(Upload: angular.angularFileUpload.IUploadService, $q: angular.IQService, $http: angular.IHttpService): any;
}
