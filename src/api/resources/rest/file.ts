import * as Rx from 'rx';
import * as jQuery from 'jquery';
import {inflate} from 'pako';

import {RESTResource} from './rest_resource';
import {Connection} from '../../connection';
import {GenError} from '../../../core/errors/error';
import * as types from '../../types/rest';

export class FileResource extends RESTResource<string> {

    constructor(connection: Connection) {
        super('file', connection);
    }

    /**
     * Downloads the file from server (it also decompresses gzipped files).
     *
     * @param {string} filename
     * @return {Rx.Observable<{ data: string }>}
     */
    public download(id: number, filename: string): Rx.Observable<types.Download> {
        const isCompressed = /\.gz$/.test(filename);
        if (isCompressed) {
            return this.connection.getBinary(this._getFileUrl(id, filename))
                .map((arrayBuffer) => {
                    const data = inflate(new Uint8Array(arrayBuffer), { to: 'string' });
                    return { data };
                });
        }

        return this.connection.get<string>(this._getFileUrl(id, filename))
            .map((data) => ({ data }));
    }

    private _getFileUrl(id: number, filename: string): string {
        return `/data/${id}/${filename}`;
    }

    public getForcedDownloadUrl(id: number, filename: string): string {
        return this._getFileUrl(id, filename) + '?' + jQuery.param({ force_download: 1 });
    }

    public getViewUrl(id: number, filename: string): string {
        return this._getFileUrl(id, filename);
    }

    public create(data: Object): Rx.Observable<any> {
        throw new GenError("Create method not supported");
    }

    public update(primaryKey: number | string, data: Object): Rx.Observable<any> {
        throw new GenError("Update method not supported");
    }

    public replace(primaryKey: number | string, data: Object): Rx.Observable<any> {
        throw new GenError("Replace method not supported");
    }

    public delete(primaryKey: number | string): Rx.Observable<any> {
        throw new GenError("Delete method not supported");
    }
}
