/*
 * Type definitions
 *
 * Here is defined everything the API returns.
 */

import * as Rx from 'rx';
import * as _ from 'lodash';

import Dictionary = _.Dictionary;
import NumericDictionary = _.NumericDictionary;


// ------------------------------------------------------------------
// Query

export interface StrictQuery {
    limit?: number;
    offset?: number;
    ordering?: string; // '-field1,-field2,field3'
    fields?: string; // 'id,slug,input__reads__file'
    id?: number;
    slug?: string;
    id__in?: string; // '13,24,35'
    slug__in?: string; // 'reads1,reads-paired-2'
    name__icontains?: string;
    status__in?: string; // 'UP,WT,RE,PR'
    text?: string; // Elastic search
    tags?: string; // 'community:universe,community:expressions'
}

export interface Query extends StrictQuery {
    [propertyName: string]: any;
}

export interface QueryObject extends Query {
    data?: "Disallow deprecated api.Sample.queryOne({ data: data.id }). Use api.Data.getSampleFromDataId(data.id) instead.";
    parents?: "Disallow deprecated api.Data.query({ parents: data.id }). Use api.Data.getChildren(data.id) instead.";
    children?: "Disallow deprecated api.Data.query({ children: data.id }). Use api.Data.getParents(data.id) instead.";
    hydrate_data?: "Disallow deprecated hydrate_data.";
    hydrate_collections?: "Disallow deprecated hydrate_collections.";
    hydrate_entities?: "Disallow deprecated hydrate_entities.";
}

export function isResponsePaginated<T>(response: T | { results: T}): response is { results: T } {
    return response.hasOwnProperty('results');
}

// LimitOffsetPagination
export interface PaginatedResponse<T> {
    count: number;
    next: string;
    previous: string;
    results: T[];
}


// ------------------------------------------------------------------
// Permissions

export type OwnerPermission = 'owner';
export type SharePermission = 'share';
export type EditPermission = 'edit';
export type DeletePermission = 'edit'; // not a typo (API doesn't support delete permission)
export type AddPermission = 'add';
export type DownloadPermission = 'download';
export type ViewPermission = 'view';

export const OWNER_PERMISSION: OwnerPermission = 'owner';
export const SHARE_PERMISSION: SharePermission = 'share';
export const EDIT_PERMISSION: EditPermission = 'edit';
export const DELETE_PERMISSION: DeletePermission = 'edit';
export const ADD_PERMISSION: AddPermission = 'add';
export const DOWNLOAD_PERMISSION: DownloadPermission = 'download';
export const VIEW_PERMISSION: ViewPermission = 'view';

export type Permission = OwnerPermission | SharePermission | EditPermission | DeletePermission | AddPermission |
    DownloadPermission | ViewPermission;


export type PublicPermissionType = 'public';
export type GroupPermissionType = 'group';
export type UserPermissionType = 'user';

export const PUBLIC_PERMISSION_TYPE: PublicPermissionType = 'public';
export const GROUP_PERMISSION_TYPE: GroupPermissionType = 'group';
export const USER_PERMISSION_TYPE: UserPermissionType = 'user';

export type PermissionType = PublicPermissionType | GroupPermissionType | UserPermissionType;

export interface ItemPermissionsOf<T> {
    type: PermissionType;
    permissions: T[];
    id?: number;
    name?: string;
}

export type ItemPermissions = ItemPermissionsOf<Permission>;

export interface SetPermissionsRequest {
    public?: {
        add?: Permission[],
        remove?: Permission[]
    };
    groups?: {
        add?: NumericDictionary<Permission[]> | Dictionary<Permission[]>
        remove?: NumericDictionary<Permission[]> | Dictionary<Permission[]>
    };
    users?: {
        add?: NumericDictionary<Permission[]> | Dictionary<Permission[]>
        remove?: NumericDictionary<Permission[]> | Dictionary<Permission[]>
    };
    share_content?: '0' | '1';
}


// ------------------------------------------------------------------
// Contributor

export interface Contributor {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
}


// ------------------------------------------------------------------
// Process

export type ProcessPermissions = ViewPermission | SharePermission;

export type RawProcessPersistence = 'RAW';
export type CachedProcessPersistence = 'CAC';
export type TempProcessPersistence = 'TMP';

export const RAW_PROCESS_PERSISTENCE: RawProcessPersistence = 'RAW';
export const CACHED_PROCESS_PERSISTENCE: CachedProcessPersistence = 'CAC';
export const TEMP_PROCESS_PERSISTENCE: TempProcessPersistence = 'TMP';

export type ProcessPersistence = RawProcessPersistence | CachedProcessPersistence | TempProcessPersistence;

export interface Process {
    id: number;
    slug: string;
    name: string;
    created: string;
    modified: string;
    version: string;
    type: string;
    category: string;
    requirements?: {
        relations?: Array<{
            type: 'compare' | 'group' | 'background' | 'series';
            category?: string;
            labels?: string[];
            required?: boolean;
        }>;
    };
    persistence: ProcessPersistence;
    description: string;
    input_schema: any;
    output_schema: any;
    run: any;
    contributor: Contributor;
    current_user_permissions: ItemPermissionsOf<ProcessPermissions>[];
    is_active: boolean;
    data_name: string;
    entity_descriptor_schema: void | string;
    entity_input: any;
    entity_type: void | string;
    scheduling_class: string;
}

// ------------------------------------------------------------------
// Relation

export interface RelationPartition {
    id: number;
    entity: number;
    position: number | null;
    label: string | null;
}

export interface Relation {
    id: number;
    created: string;
    modified: string;
    type: string;
    collection: number;
    partitions: RelationPartition[];
    category: string;
    unit: 's' | 'min' | 'hr' | 'd' | 'wk' | null;
    contributor: Contributor;
}

// ------------------------------------------------------------------
// DescriptorSchema

// Schema
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
    range?: [number, number]; // Min, max
}

export type Schema = FieldSchema[];


// DescriptorSchema
export type DescriptorSchemaPermissions = ViewPermission | EditPermission | SharePermission;

export interface DescriptorSchemaBase {
    id: number;
    created: string;
    modified: string;
    slug: string;
    name: string;
    version: string;
    schema: Schema;
    contributor: Contributor;
}

export interface DescriptorSchema extends DescriptorSchemaBase {
    current_user_permissions: ItemPermissionsOf<DescriptorSchemaPermissions>[];
}


// ------------------------------------------------------------------
// Scatter Plot Json

// ScatterPlotJson.RootObject is a type of process output. Processes (i.e. Rose2)
// save it to data.output.scatter_plot.
export namespace ScatterPlotJson {

    export interface RootObject { // This is the actual type of the json output
        points: Points;
        meta?: Meta;
        annotations?: Annotation[];
    }

    export interface Points {
        x_axis: number[];
        y_axis: number[];
        items?: any[];
    }

    export interface Meta {
        x_label?: string;
        y_label?: string;
        text?: string;
        chr_pos?: string[];
    }

    export type Annotation = AnnotationLineGeneral | AnnotationLineVertical | AnnotationLineHorizontal;

    export interface AnnotationLineGeneral {
        type: 'line';
        x1: number;
        x2: number;
        y1: number;
        y2: number;
    }
    export interface AnnotationLineVertical {
        type: 'line_vertical';
        x: number;
    }
    export interface AnnotationLineHorizontal {
        type: 'line_horizontal';
        y: number;
    }
}

// ------------------------------------------------------------------
// Data

export type DataPermissions = ViewPermission | EditPermission | SharePermission | DownloadPermission;

export type UploadingDataStatus = 'UP';
export type ResolvingDataStatus = 'RE';
export type WaitingDataStatus = 'WT';
export type ProcessingDataStatus = 'PR';
export type DoneDataStatus = 'OK';
export type ErrorDataStatus = 'ER';
export type DirtyDataStatus = 'DR';

export const UPLOADING_DATA_STATUS: UploadingDataStatus = 'UP';
export const RESOLVING_DATA_STATUS: ResolvingDataStatus = 'RE';
export const WAITING_DATA_STATUS: WaitingDataStatus = 'WT';
export const PROCESSING_DATA_STATUS: ProcessingDataStatus = 'PR';
export const DONE_DATA_STATUS: DoneDataStatus = 'OK';
export const ERROR_DATA_STATUS: ErrorDataStatus = 'ER';
export const DIRTY_DATA_STATUS: DirtyDataStatus = 'DR';

export type DataStatus = UploadingDataStatus | ResolvingDataStatus | WaitingDataStatus | ProcessingDataStatus |
    DoneDataStatus | ErrorDataStatus | DirtyDataStatus;

export interface Data {
    id: number;
    created: string;
    modified: string;
    scheduled: string;
    started: string;
    finished: string;
    duplicated: void | string;

    checksum: string;
    size: number;
    status: DataStatus;
    process_progress: number;
    process_rc: number;
    process_cores: number;
    process_memory: number;
    process_info: string[];
    process_warning: string[];
    process_error: string[];
    slug: string;
    name: string;
    input: any;
    output: any;
    descriptor_schema: DescriptorSchemaBase;
    descriptor: any;
    contributor: Contributor;
    process: Omit<Process, 'current_user_permissions'>;
    tags: string[];

    entity: void | Omit<Sample, 'current_user_permissions'>;
    collection: void | Omit<Collection, 'current_user_permissions'>;
    current_user_permissions: ItemPermissionsOf<DataPermissions>[];
}


// ------------------------------------------------------------------
// data:differentialexpression:

export interface DataDifferentialExpression extends Data {
    output: {
        de_file: { file: string, size: number };
        raw: { file: string, size: number };
        de_json: number;
        source: string;
        species: string;
    };
}

// ------------------------------------------------------------------
// data:geneset:

export interface DataGenesetOutput {
    geneset: { file: string, size: number };
    geneset_json: number; // => DataGenesetStorage
    source: string;
    species: string;
}

export interface DataGeneset extends Data {
    output: DataGenesetOutput;
}

export interface DataGenesetStorage extends Storage {
    json: {
        genes: string[];
    };
}

// ------------------------------------------------------------------
// data:geneset:venn:

export interface DataGenesetVennOutput extends DataGenesetOutput {
    venn: number; // => DataGenesetVennStorage
}

export interface DataGenesetVenn extends DataGeneset {
    output: DataGenesetVennOutput;
}

export interface DataGenesetVennStorage extends Storage {
    json: {
        parents: Array<{
            id: number;
            name: string;
            genes: string[]; // geneset_json . genes
        }>;
    };
}

// ------------------------------------------------------------------
// data:goea: Gene Ontology

export interface DataGOEnrichmentAnalysis extends Data {
    output: {
        terms: number; // => DataGOEnrichmentAnalysisStorage
        source: string;
        species: string;
    };
}

export type GOEnrichmentAspect = GOEnrichmentNode[];
export interface GOEnrichmentJson {
    total_genes: number;
    gene_associations: {
        [goTermId: string]: string[]; // term_id => gene_ids
    };
    tree: {
        [aspectSlug: string]: GOEnrichmentAspect, // "BP" | "CC" | "MF"
    };
}

export interface GOEnrichmentNode {
    gene_ids: string[]; // selected_gene_associations
    term_name: string;
    term_id: string;
    pval: number;
    score: number;
    matched: number; // Number of found elements in a single node.
    total: number; // Total number of elements (including children nodes) in a single node.
    children?: GOEnrichmentNode[];

    // Added by frontend:
    depth?: number; // Numerical representation of the level of depth. Used for offsetting the term column.
    source?: string;
    species?: string;
    score_percentage?: number; // Percentage of max score within GOEnrichmentAspect.
    gene_associations?: string[]; // all_gene_associations - Plucked from GOEnrichmentJson.gene_associations.
    collapsed?: boolean; // Boolean representation if the selected item is hidden.
}

export interface DataGOEnrichmentAnalysisStorage extends Storage {
    json: GOEnrichmentJson;
}

export interface DataGOEnrichmentAnalysisInput {
    pval_threshold: number;
    genes: string[];
    source: string;
    species: string;
    ontology: number;
    gaf: number;
}

// ------------------------------------------------------------------
// data:gaf: GAF annotation

export interface DataGafAnnotation extends Data {
    output: {
        source: string;
        species: string;
        gaf: { file: string, size: number };
        gaf_obj: { file: string, size: number };
    };
}

// ------------------------------------------------------------------
// data:varianttable:

export interface DataVariantAmpliconTable extends Data {
    input: {
        master_file: number; // data ID
        coverage: number; // data ID
        annot_vars: number[]; // data IDs
        all_amplicons: boolean;
        table_name: string;
    };
    output: {
        variant_table: number; // => DataVariantTableStorage
    };
}

export interface DataVariantTLATable extends Data {
    input: {
        tla_results: number; // data ID
    };
    output: {
        variant_table: number; // => DataVariantTableStorage
        species: string;
        build: string;
    };
}

export type DataVariantTable = DataVariantAmpliconTable | DataVariantTLATable;

export type DataVariantTableJsonValueColumn = string; // Example: MSH6_exon5_F1/2
export type DataVariantTableJsonDelimitedColumn = string; // Example: DP4=46,41,11,16;SB=4
export type DataVariantTableJsonUrlsColumn = [string, string][]; // Example: [['Gene', 'http://www.ncbi.nlm.nih.gov/gene/?term=gene']]
export type DataVariantTableJsonColumn = DataVariantTableJsonValueColumn |
                                         DataVariantTableJsonDelimitedColumn |
                                         DataVariantTableJsonUrlsColumn;
export interface DataVariantTableRow {
    columns: DataVariantTableJsonColumn[];
    pos: string;
}

export interface DataVariantTableJson { // api-typecheck:amplicon_table_output.json.gz
    column_types: Array<'value' | 'delimited' | 'urls'>;
    headers: string[];
    labels: string[];
    data: DataVariantTableRow[];
}

export interface DataVariantTableStorage extends Storage {
    json: DataVariantTableJson;
}

// ------------------------------------------------------------------
// Collection

export type CollectionPermissions = ViewPermission | EditPermission | SharePermission |
    DownloadPermission | AddPermission;

export interface Collection {
    id: number;
    created: string;
    modified: string;
    duplicated: void | string;
    slug: string;
    name: string;
    description: string;
    descriptor_schema: DescriptorSchemaBase;
    descriptor: any;
    contributor: Contributor;
    current_user_permissions: ItemPermissionsOf<CollectionPermissions>[];
    tags: string[];
    settings: any;
}

export interface Sample extends Collection {
    collection: void | Omit<Collection, 'current_user_permissions'>;
    descriptor_completed: boolean;
    type: 'sample';
}

export interface CollectionHydrateData extends Collection {
    data: Data[];
}

export interface SampleHydrateData extends Sample {
    data: Data[];
}


// ------------------------------------------------------------------
// Storage

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

export interface SampleClustering { // api-typecheck:sample_cluster_data.json.gz
    order: number[];
    linkage: number[][]; // [[node1, node2, distance, number of samples]]
    sample_ids: _.Dictionary<{ id: number }>;
}

export interface GeneClustering { // api-typecheck:gene_cluster_data.json.gz
    order: number[];
    linkage: number[][]; // [[node1, node2, distance, number of genes]]
    gene_symbols: _.Dictionary<{ gene: string }>;
}

export interface PCA { // api-typecheck:pca_plot_ncbi.json.gz
    explained_variance_ratios: number[];
    all_explained_variance_ratios: number[];
    all_components: [string, number][][];
    components: [string, number][][];
    zero_gene_symbols: string[]; // gene ids with no expressions
    flot: {
        xlabel: string;
        ylabel: string;
        data: number[][];
        sample_ids: string[];
    };
}

export interface QCStorage extends Storage {
    json: {
        status: 'PASS' | 'FAIL' | 'WARNING',
        message: string,
    };
}


// ------------------------------------------------------------------
// User

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
    last_login: string;
    date_joined: string;
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


// ------------------------------------------------------------------
// File

export interface Download {
    data: string;
}
