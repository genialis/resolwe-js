import * as Rx from 'rx';
import { Connection } from '../../connection';
import { ModuleResource } from './module_resource';
import * as types from '../../types/modules';
/**
 * Abstract base class for knowledge base resources.
 */
export declare abstract class KnowledgeBaseResource extends ModuleResource {
    /**
     * @inheritdoc
     */
    protected getModulesBasePath(): string;
}
/**
 * Knowledge base feature resource.
 */
export declare class FeatureResource extends KnowledgeBaseResource {
    constructor(connection: Connection);
    /**
     * Searches for features.
     *
     * @param query Feature search query
     */
    search(query: types.FeatureQuery): Rx.Observable<types.Feature[]>;
    /**
     * Performs an autocomplete query for features.
     *
     * @param query Feature autocomplete query
     */
    autocomplete(query: types.FeatureAutocompleteQuery): Rx.Observable<types.Feature[]>;
}
