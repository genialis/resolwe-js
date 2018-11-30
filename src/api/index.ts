import {Connection} from './connection';
import {Base} from './base';
import {Auth} from './auth';

import {RESTResource} from './resources/rest/rest_resource';
import {CollectionResource} from './resources/rest/collection';
import {SampleResource} from './resources/rest/sample';
import {DataResource} from './resources/rest/data';
import {DescriptorSchemaResource} from './resources/rest/descriptor_schema';
import {UserResource} from './resources/rest/user';
import {FileResource} from './resources/rest/file';
import {StorageResource} from './resources/rest/storage';
import {FeatureResource} from './resources/modules/knowledge_base';

import * as types from './types/rest';

export class ResolweApi {
    public Base: Base = new Base(this.connection);
    public Auth: Auth = new Auth(this.connection);

    // Resolwe resources.
    public User: UserResource = new UserResource(this.connection);
    public Collection: CollectionResource = new CollectionResource(this.connection);
    public Data: DataResource = new DataResource(this.connection);
    public Process: RESTResource<types.Process> = new RESTResource<types.Process>('process', this.connection);
    public DescriptorSchema: DescriptorSchemaResource = new DescriptorSchemaResource(this.connection);
    public Sample: SampleResource = new SampleResource(this.connection);
    public File: FileResource = new FileResource(this.connection);
    public Storage: StorageResource = new StorageResource(this.connection);
    public Relation: RESTResource<types.Relation> = new RESTResource<types.Relation>('relation', this.connection);

    public KnowledgeBase = {
        Feature: new FeatureResource(this.connection),
    };

    // @ngInject
    constructor(public connection: Connection, restUri: string, websocketUri: string) {
        this.connect(restUri, websocketUri);

        this.Base.getCSRFCookie();
    }

    /**
     * Establishes a default connection with the genesis platform server.
     *
     * @param {string} uri Genesis platform server URI
     */
    private connect(restUri: string, websocketUri: string) {
        this.connection.connect(restUri, websocketUri);
    }
}
