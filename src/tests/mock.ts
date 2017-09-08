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
export class MockApiService {
    // Mock upload handler.
    private _uploadHandler: MockUploadHandler<any> = () => { return <angular.IHttpResponse<string>> {data: null}; }

    /**
     * Performs a mock data upload.
     */
    public upload<T>(data: any, fileUID: string = ''): angular.angularFileUpload.IUploadPromise<T> {
        // TODO: Augment the promise to enable upload-specific functions (or make them noops).
        return <angular.angularFileUpload.IUploadPromise<T>> new Promise<angular.IHttpPromiseCallbackArg<T>>(
            (resolve, reject) => {
                try {
                    resolve(this._uploadHandler(data, fileUID));
                } catch (error) {
                    reject(error);
                }
            }
        );
    }

    /**
     * Registers a mock upload request handler.
     *
     * @param handler Upload handler
     */
    public whenUpload<T>(handler: MockUploadHandler<T>): void {
        this._uploadHandler = handler;
    }
}
