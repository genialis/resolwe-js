import { Connection } from './connection';
import { Base } from './base';
import { Auth } from './auth';
import { RESTResource } from './resources/rest/rest_resource';
import { CollectionResource } from './resources/rest/collection';
import { SampleResource } from './resources/rest/sample';
import { DataResource } from './resources/rest/data';
import { DescriptorSchemaResource } from './resources/rest/descriptor_schema';
import { UserResource } from './resources/rest/user';
import { FileResource } from './resources/rest/file';
import { StorageResource } from './resources/rest/storage';
import { FeatureResource } from './resources/modules/knowledge_base';
import * as types from './types/rest';
export declare class ResolweApi {
    connection: Connection;
    Base: Base;
    Auth: Auth;
    User: UserResource;
    Collection: CollectionResource;
    Data: DataResource;
    Process: RESTResource<types.Process>;
    DescriptorSchema: DescriptorSchemaResource;
    Sample: SampleResource;
    File: FileResource;
    Storage: StorageResource;
    Relation: RESTResource<types.Relation>;
    KnowledgeBase: {
        Feature: FeatureResource;
    };
    constructor(connection: Connection, restUri: string, websocketUri: string);
    /**
     * Establishes a default connection with the genesis platform server.
     *
     * @param {string} uri Genesis platform server URI
     */
    private connect(restUri, websocketUri);
}
