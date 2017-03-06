/// <reference types="angular" />
/// <reference types="ng-file-upload" />
import * as angular from 'angular';
import 'ng-file-upload';
/**
 * Mock upload handler function. It receives any query arguments and data that
 * was used to make the request.
 *
 * @param data Request data
 * @param fileUID Unique file identifier
 */
export interface MockUploadHandler<T> {
    (data: any, fileUID: string): angular.IHttpPromiseCallbackArg<T>;
}
/**
 * Mock API service.
 */
export declare class MockApiService {
    private _uploadHandler;
    /**
     * Performs a mock data upload.
     */
    upload<T>(data: any, fileUID?: string): angular.angularFileUpload.IUploadPromise<T>;
    /**
     * Registers a mock upload request handler.
     *
     * @param handler Upload handler
     */
    whenUpload<T>(handler: MockUploadHandler<T>): void;
}
