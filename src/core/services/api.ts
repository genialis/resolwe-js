import * as Rx from 'rx';
import * as angular from 'angular';
import * as _ from 'lodash';
import 'ng-file-upload';

import {GenError} from '../errors/error';
import {ResolweApi} from '../../api';
import {Connection} from '../../api/connection';
import {FileUploadResponse} from '../../api/types/modules';
import {compose} from '../utils/lang';
import * as random from '../utils/random';

const angularModule: angular.IModule = angular.module('resolwe.services.api', [
    'ngFileUpload',
]);

export enum UploadEventType {
    PROGRESS = 'progress',
    RETRYING = 'retrying',
    RESULT = 'result',
}

export type UploadEvent<T> = { progress: ProgressEvent, type: UploadEventType.PROGRESS } |
                             { type: UploadEventType.RETRYING } |
                             { result: T, type: UploadEventType.RESULT };

/**
 * Base API service class providing additional features like file
 * upload support. It should be used as a mixin together with an
 * actual API class.
 */
export class APIServiceBase {
    // Note that this is configurable in provider
    public consecutiveAutoretryAttempts = 5;
    public CHUNK_SIZE = 1 * 1024 * 1024; // 1MB
    public RETRY_DELAY_INCREMENT = 500;
    public MAX_RETRY_DELAY = 5000;
    public ERROR_GROUPING_TIME = () => this.RETRY_DELAY_INCREMENT * this.consecutiveAutoretryAttempts * 2;

    // Note that this connection property is not initialized anywhere as it will
    // be initialized by the actual API which is mixed in by the provider.
    public connection: Connection;

    private _upload: angular.angularFileUpload.IUploadService;
    private _q: angular.IQService;
    private _http: angular.IHttpService;

    constructor(Upload: angular.angularFileUpload.IUploadService,
                $q: angular.IQService,
                $http: angular.IHttpService,
                consecutiveAutoretryAttempts?: number) {
        this._upload = Upload;
        this._q = $q;
        this._http = $http;

        if (!_.isUndefined(consecutiveAutoretryAttempts)) {
            this.consecutiveAutoretryAttempts = consecutiveAutoretryAttempts;
        }
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
    public upload<T>(data: any, fileUID: string = ''): Rx.Observable<UploadEvent<T>> {
        const url = this.connection.createUriFromPath('/upload/');
        const headers: angular.IHttpRequestConfigHeaders = {
            'Session-Id': this.connection.sessionId(),
            'X-File-Uid': fileUID,
            'X-CSRFToken': this.connection.csrfCookie(),
        };

        return Rx.Observable.create<UploadEvent<T>>((observer) => {
            observer.onNext({ type: UploadEventType.RETRYING }); // Note: First one of these is skipped below.

            const rejectableResumeSizePromise = this._q.defer<number>();
            const fileUpload = this._upload.upload<T>({
                url: url,
                method: 'POST',
                headers: headers,
                withCredentials: true,
                resumeSize: () => {
                    const resumeSizePromise = this._http.get(url, {
                        headers: headers,
                        withCredentials: true,
                    }).then((response) => {
                        return (<any> response.data).resume_offset;
                    }, (error) => {
                        observer.onError(error); // Handled in observables
                        return this._q.defer().promise; // Never resolve
                    });

                    rejectableResumeSizePromise.resolve(resumeSizePromise);
                    return rejectableResumeSizePromise.promise;
                },
                resumeChunkSize: this.CHUNK_SIZE,
                data: data,
            });

            fileUpload.then((result) => {
                observer.onNext({ result: result.data, type: UploadEventType.RESULT });
                observer.onCompleted();
            }, (error) => {
                observer.onError(error);
            }, (progress) => {
                observer.onNext({ progress: progress, type: UploadEventType.PROGRESS });
            });

            return () => {
                // To differentiate between connections aborted by server or client (when computer
                // goes to standby/sleep), we emit a custom error. Otherwise we would have to
                // filter out all `xhrStatus === 'abort'` and couldn't auto-retry after standby.
                observer.onError({xhrStatus: 'manual-abort'});
                fileUpload.abort();
                rejectableResumeSizePromise.reject();
            };
        })
        .retryWhen((errors) => {
            return errors
                .filter((error) => error && error.xhrStatus !== 'manual-abort')
                .timeInterval()
                .scan((accumulated, value) => {
                    const error = value.value;
                    const timeSincePrevious = value.interval;

                    let consecutiveErrors = accumulated.consecutiveErrors + 1;
                    if (timeSincePrevious > this.ERROR_GROUPING_TIME()) consecutiveErrors = 1;

                    const retry = consecutiveErrors <= this.consecutiveAutoretryAttempts;
                    const delay = Math.min(consecutiveErrors * this.RETRY_DELAY_INCREMENT, this.MAX_RETRY_DELAY);

                    return { error, consecutiveErrors, timeSincePrevious, retry, delay };
                }, { error: null, consecutiveErrors: 0, timeSincePrevious: 0, retry: false, delay: 0 })
                .flatMap(({retry, delay, error}) => {
                    // This event is probably computer going to standby. Wait a bit longer.
                    if (error && error.xhrStatus === 'abort') delay = 10000;

                    if (!retry) { // Stop retrying after a while and return unwrapped error
                        return Rx.Observable.throw(error);
                    }
                    return Rx.Observable.just(error).delay(delay);
                })
                .do((error) => {
                    console.log("Retrying upload after an error", error);
                });
        })
        .skip(1) // Skip initial 'retrying' event.
        .filter((event) => {
            // If a retry request fails, it would remove the progress bar until it
            // succeeds again. With this filter we can keep the progress bar anyway.
            return !(event.type === UploadEventType.PROGRESS && event.progress.loaded === 0 && event.progress.total === 0);
        });
    }

    /**
     * Uploads string content as a file.
     */
    public uploadString(filename: string, content: string): Rx.Observable<UploadEvent<FileUploadResponse>> {
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
 *
 *     // Configure upload auto-retries to infinity
 *     apiProvider.setConsecutiveAutoretryAttempts(Infinity);
 * });
 * ```
 */
export class APIServiceProvider {
    // API instance that should be used by the service.
    private _api: typeof ResolweApi;
    private _connection: Connection;
    private _restUri: string;
    private _websocketUri: string;
    private _consecutiveAutoretryAttempts: number;

    public setAPI(api: typeof ResolweApi,
                  connection: Connection,
                  restUri: string,
                  websocketUri: string) {
        this._api = api;
        this._connection = connection;
        this._restUri = restUri;
        this._websocketUri = websocketUri;
    }

    public setConsecutiveAutoretryAttempts(retries: number) {
        this._consecutiveAutoretryAttempts = retries;
    }

    // @ngInject
    public $get(Upload: angular.angularFileUpload.IUploadService,
                $q: angular.IQService,
                $http: angular.IHttpService) {
        // TODO: Use error notification service instead.
        if (!this._api) throw new GenError("API not configured.");

        // Mix together the API and the APIServiceBase.
        let serviceClass = compose([this._api, APIServiceBase], true);
        return new serviceClass(
            // Arguments for the API part.
            [this._connection, this._restUri, this._websocketUri],
            // Arguments for APIServiceBase part.
            [Upload, $q, $http, this._consecutiveAutoretryAttempts]
        );
    }
}

angularModule.provider('api', APIServiceProvider);
