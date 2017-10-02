/// <reference types="lodash" />
import * as Rx from 'rx';
import * as _ from 'lodash';
import Dictionary = _.Dictionary;
import NumericDictionary = _.NumericDictionary;
export interface Query {
    limit?: number;
    offset?: number;
    ordering?: string;
    fields?: string;
    [propertyName: string]: any;
}
export interface QueryObject extends Query {
    hydrate_data?: void;
}
export interface QueryObjectHydrateData extends Query {
    hydrate_data: '1';
}
export declare function isResponsePaginated<T>(response: T | {
    results: T;
}): response is {
    results: T;
};
export interface PaginatedResponse<T> {
    count: number;
    next: string;
    previous: string;
    results: T[];
}
export declare type OwnerPermission = 'owner';
export declare type SharePermission = 'share';
export declare type EditPermission = 'edit';
export declare type DeletePermission = 'edit';
export declare type AddPermission = 'add';
export declare type DownloadPermission = 'download';
export declare type ViewPermission = 'view';
export declare const OWNER_PERMISSION: OwnerPermission;
export declare const SHARE_PERMISSION: SharePermission;
export declare const EDIT_PERMISSION: EditPermission;
export declare const DELETE_PERMISSION: DeletePermission;
export declare const ADD_PERMISSION: AddPermission;
export declare const DOWNLOAD_PERMISSION: DownloadPermission;
export declare const VIEW_PERMISSION: ViewPermission;
export declare type Permission = OwnerPermission | SharePermission | EditPermission | DeletePermission | AddPermission | DownloadPermission | ViewPermission;
export declare type PublicPermissionType = 'public';
export declare type GroupPermissionType = 'group';
export declare type UserPermissionType = 'user';
export declare const PUBLIC_PERMISSION_TYPE: PublicPermissionType;
export declare const GROUP_PERMISSION_TYPE: GroupPermissionType;
export declare const USER_PERMISSION_TYPE: UserPermissionType;
export declare type PermissionType = PublicPermissionType | GroupPermissionType | UserPermissionType;
export interface ItemPermissionsOf<T> {
    type: PermissionType;
    permissions: T[];
    id?: number;
    name?: string;
}
export declare type ItemPermissions = ItemPermissionsOf<Permission>;
export interface SetPermissionsRequest {
    public?: {
        add?: Permission[];
        remove?: Permission[];
    };
    groups?: {
        add?: NumericDictionary<Permission[]> | Dictionary<Permission[]>;
        remove?: NumericDictionary<Permission[]> | Dictionary<Permission[]>;
    };
    users?: {
        add?: NumericDictionary<Permission[]> | Dictionary<Permission[]>;
        remove?: NumericDictionary<Permission[]> | Dictionary<Permission[]>;
    };
    share_content?: '0' | '1';
}
export interface Contributor {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
}
export declare type ProcessPermissions = ViewPermission | SharePermission;
export declare type RawProcessPersistence = 'RAW';
export declare type CachedProcessPersistence = 'CAC';
export declare type TempProcessPersistence = 'TMP';
export declare const RAW_PROCESS_PERSISTENCE: RawProcessPersistence;
export declare const CACHED_PROCESS_PERSISTENCE: CachedProcessPersistence;
export declare const TEMP_PROCESS_PERSISTENCE: TempProcessPersistence;
export declare type ProcessPersistence = RawProcessPersistence | CachedProcessPersistence | TempProcessPersistence;
export interface Process {
    id: number;
    slug: string;
    name: string;
    created: string;
    modified: string;
    version: number;
    type: string;
    category: string;
    persistence: ProcessPersistence;
    description: string;
    input_schema: any;
    output_schema: any;
    run: any;
    contributor: Contributor;
    current_user_permissions: ItemPermissionsOf<ProcessPermissions>[];
}
export interface RelationEntity {
    entity: number;
    position: number;
}
export interface Relation {
    id: number;
    slug: string;
    created: string;
    modified: string;
    type: string;
    collection: number;
    entities: RelationEntity[];
    positions: string[];
    label: string;
    contributor: Contributor;
}
export interface ChoiceMap {
    value: string;
    label: string;
}
export interface FieldSchema {
    disabled?: boolean | string;
    required?: boolean;
    collapsed?: boolean;
    hidden?: boolean | string;
    default?: any;
    choices?: ChoiceMap[];
    allow_custom_choice?: boolean;
    validate_regex?: string;
    slug?: {
        source?: string;
        uniqueValidator?: (slug: string) => Rx.Observable<boolean>;
    };
    type: string;
    name: string;
    label: string;
    group?: Schema;
}
export declare type Schema = FieldSchema[];
export declare type DescriptorSchemaPermissions = ViewPermission | EditPermission | SharePermission;
export interface DescriptorSchemaBase {
    id: number;
    created: string;
    modified: string;
    slug: string;
    name: string;
    version: number;
    schema: Schema;
    contributor: Contributor;
}
export interface DescriptorSchema extends DescriptorSchemaBase {
    current_user_permissions: ItemPermissionsOf<DescriptorSchemaPermissions>[];
}
export declare namespace ScatterPlotJson {
    interface RootObject {
        points: Points;
        meta?: Meta;
        annotations?: Annotation[];
    }
    interface Points {
        x_axis: number[];
        y_axis: number[];
        items?: any[];
    }
    interface Meta {
        x_label?: string;
        y_label?: string;
        text?: string;
        chr_pos?: string[];
    }
    type Annotation = AnnotationLineGeneral | AnnotationLineVertical | AnnotationLineHorizontal;
    interface AnnotationLineGeneral {
        type: 'line';
        x1: number;
        x2: number;
        y1: number;
        y2: number;
    }
    interface AnnotationLineVertical {
        type: 'line_vertical';
        x: number;
    }
    interface AnnotationLineHorizontal {
        type: 'line_horizontal';
        y: number;
    }
}
export declare type DataPermissions = ViewPermission | EditPermission | SharePermission | DownloadPermission;
export declare type UploadingDataStatus = 'UP';
export declare type ResolvingDataStatus = 'RE';
export declare type WaitingDataStatus = 'WT';
export declare type ProcessingDataStatus = 'PR';
export declare type DoneDataStatus = 'OK';
export declare type ErrorDataStatus = 'ER';
export declare type DirtyDataStatus = 'DR';
export declare const UPLOADING_DATA_STATUS: UploadingDataStatus;
export declare const RESOLVING_DATA_STATUS: ResolvingDataStatus;
export declare const WAITING_DATA_STATUS: WaitingDataStatus;
export declare const PROCESSING_DATA_STATUS: ProcessingDataStatus;
export declare const DONE_DATA_STATUS: DoneDataStatus;
export declare const ERROR_DATA_STATUS: ErrorDataStatus;
export declare const DIRTY_DATA_STATUS: DirtyDataStatus;
export declare type DataStatus = UploadingDataStatus | ResolvingDataStatus | WaitingDataStatus | ProcessingDataStatus | DoneDataStatus | ErrorDataStatus | DirtyDataStatus;
export interface DataBase {
    id: number;
    created: string;
    modified: string;
    started: string;
    finished: string;
    checksum: string;
    status: DataStatus;
    process_progress: number;
    process_rc: number;
    process_info: string[];
    process_warning: string[];
    process_error: string[];
    process_type: string;
    process_input_schema: any;
    process_output_schema: any;
    process_name: string;
    slug: string;
    name: string;
    input: any;
    output: any;
    descriptor_schema: DescriptorSchemaBase;
    descriptor: any;
    contributor: Contributor;
    process: number;
}
export interface Data extends DataBase {
    current_user_permissions: ItemPermissionsOf<DataPermissions>[];
}
export declare function isData(object: CollectionBase | SampleBase | Data): object is Data;
export interface DataDifferentialExpression extends Data {
    output: {
        de_file: {
            file: string;
            size: number;
        };
        raw: {
            file: string;
            size: number;
        };
        de_json: number;
        source: string;
    };
}
export interface DataGenesetOutput {
    geneset: {
        file: string;
        size: number;
    };
    geneset_json: number;
    source: string;
}
export interface DataGeneset extends Data {
    output: DataGenesetOutput;
}
export interface DataGenesetStorage extends Storage {
    json: {
        genes: string[];
    };
}
export interface DataGenesetVennOutput extends DataGenesetOutput {
    venn: number;
}
export interface DataGenesetVenn extends DataGeneset {
    output: DataGenesetVennOutput;
}
export interface DataGenesetVennStorage extends Storage {
    json: {
        parents: Array<{
            id: number;
            name: string;
            genes: string[];
        }>;
    };
}
export interface DataGOEnrichmentAnalysis extends Data {
    output: {
        terms: number;
        source: string;
    };
}
export declare type GOEnrichmentAspect = GOEnrichmentNode[];
export interface GOEnrichmentJson {
    total_genes: number;
    gene_associations: {
        [goTermId: string]: string[];
    };
    tree: {
        [aspectSlug: string]: GOEnrichmentAspect;
    };
}
export interface GOEnrichmentNode {
    gene_ids: string[];
    term_name: string;
    term_id: string;
    pval: number;
    score: number;
    matched: number;
    total: number;
    children?: GOEnrichmentNode[];
    depth?: number;
    source?: string;
    score_percentage?: number;
    gene_associations?: string[];
    collapsed?: boolean;
}
export interface DataGOEnrichmentAnalysisStorage extends Storage {
    json: GOEnrichmentJson;
}
export interface DataGOEnrichmentAnalysisInput {
    pval_threshold: number;
    genes: string[];
    source: string;
    ontology: number;
    gaf: number;
}
export interface DataGafAnnotation extends Data {
    output: {
        source: string;
        species: string;
        gaf: {
            file: string;
            size: number;
        };
        gaf_obj: {
            file: string;
            size: number;
        };
    };
}
export interface DataVariantTable extends Data {
    output: {
        variant_table: number;
    };
}
export declare type DataVariantTableJsonValueColumn = string;
export declare type DataVariantTableJsonDelimitedColumn = string;
export declare type DataVariantTableJsonUrlsColumn = [string, string][];
export declare type DataVariantTableJsonColumn = DataVariantTableJsonValueColumn | DataVariantTableJsonDelimitedColumn | DataVariantTableJsonUrlsColumn;
export interface DataVariantTableRow {
    columns: DataVariantTableJsonColumn[];
    pos: string;
}
export interface DataVariantTableJson {
    column_types: Array<'value' | 'delimited' | 'urls'>;
    headers: string[];
    labels: string[];
    data: DataVariantTableRow[];
}
export interface DataVariantTableStorage extends Storage {
    json: DataVariantTableJson;
}
export declare type CollectionPermissions = ViewPermission | EditPermission | SharePermission | DownloadPermission | AddPermission;
export interface CollectionBase {
    id: number;
    created: string;
    modified: string;
    slug: string;
    name: string;
    description: string;
    settings: any;
    descriptor_schema: DescriptorSchemaBase;
    descriptor: any;
    contributor: Contributor;
    current_user_permissions: ItemPermissionsOf<CollectionPermissions>[];
}
export interface Collection extends CollectionBase {
    data: number[];
}
export declare function isCollection(object: CollectionBase | SampleBase | Data): object is Collection | CollectionHydrateData;
export interface CollectionHydrateData extends CollectionBase {
    data: DataBase[];
}
export interface SampleBase extends CollectionBase {
    descriptor_completed: boolean;
}
export declare function isSampleBase(object: CollectionBase | SampleBase | Data): object is SampleBase;
export interface Sample extends Collection, SampleBase {
    descriptor_completed: true;
}
export interface SampleHydrateData extends CollectionHydrateData, SampleBase {
}
export interface Presample extends Collection, SampleBase {
    descriptor_completed: false;
}
export interface PresampleHydrateData extends CollectionHydrateData, SampleBase {
    descriptor_completed: false;
}
export interface Storage {
    id: number;
    slug: string;
    name: string;
    data: number;
    json: any;
    contributor: Contributor;
    created: string;
    modified: string;
}
export interface SampleClustering {
    sample_ids: _.Dictionary<{
        id: number;
    }>;
    order: number[];
    linkage: number[][];
    zero_sample_ids: number[];
    zero_gene_symbols: string[];
    missing_gene_symbols: string[];
}
export interface GeneClustering {
    gene_symbols: _.Dictionary<{
        gene: string;
    }>;
    order: number[];
    linkage: number[][];
    zero_sample_ids: number[];
    zero_gene_symbols: string[];
    missing_gene_symbols: string[];
}
export interface PCA {
    explained_variance_ratios: number[];
    all_explained_variance_ratios: number[];
    all_components: [string, number][][];
    components: [string, number][][];
    zero_gene_symbols: string[];
    flot: {
        xlabel: string;
        ylabel: string;
        data: number[][];
        sample_ids: string[];
    };
}
export interface QCStorage extends Storage {
    json: {
        status: 'PASS' | 'FAIL' | 'WARNING';
        message: string;
    };
}
export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    job_title: string;
    company: string;
    department: string;
    location: string;
    lab: string;
    phone_number: string;
}
export interface LoginResponse {
    key: string;
}
export interface LogoutResponse {
}
export interface CreateAccountInformation {
    username: string;
    password: string;
    email: string;
    first_name: string;
    last_name: string;
    job_title?: string;
    company?: string;
    department?: string;
    location?: string;
    lab?: string;
    phone_number?: string;
    newsletter?: boolean;
    community?: string;
}
export interface ActivateAccountResponse {
    username: string;
}
export interface Download {
    data: string;
}
