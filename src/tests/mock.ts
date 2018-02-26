import * as Rx from 'rx';
import {UploadEvent, UploadEventType} from '../core/services/api';
import 'ng-file-upload';


/**
 * Mock upload handler function. It receives any query arguments and data that
 * was used to make the request.
 *
 * @param data Request data
 * @param fileUID Unique file identifier
 */
export interface MockUploadHandler<T> {
    (data: any, fileUID: string): T;
}

/**
 * Mock API service.
 */
export class MockApiService {
    // Mock upload handler.
    private _uploadHandler: MockUploadHandler<any> = () => ({ data: null });

    /**
     * Performs a mock data upload.
     */
    public upload<T>(data: any, fileUID: string = ''): Rx.Observable<UploadEvent<T>> {
        return Rx.Observable.create<UploadEvent<T>>((observer) => {
            try {
                observer.onNext({
                    result: this._uploadHandler(data, fileUID),
                    type: UploadEventType.RESULT,
                });
                observer.onCompleted();
            } catch (error) {
                observer.onError(error);
            }
        });
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
