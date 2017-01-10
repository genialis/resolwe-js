import * as Rx from 'rx';
import { RESTResource } from './rest_resource';
import { Connection } from '../../connection';
import * as types from '../../types/rest';
export declare class FileResource extends RESTResource<string> {
    constructor(connection: Connection);
    /**
     * Downloads the file from server (it also decompresses gzipped files).
     *
     * @param {string} filename
     * @return {Rx.Observable<{ data: string }>}
     */
    download(id: number, filename: string): Rx.Observable<types.Download>;
    private _getFileUrl(id, filename);
    getForcedDownloadUrl(id: number, filename: string): string;
    getViewUrl(id: number, filename: string): string;
    getUngzippedUrl(id: number, filename: string): string;
    create(data: Object): Rx.Observable<any>;
    update(primaryKey: number | string, data: Object): Rx.Observable<any>;
    replace(primaryKey: number | string, data: Object): Rx.Observable<any>;
    delete(primaryKey: number | string): Rx.Observable<any>;
}
