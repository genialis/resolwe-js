import * as Rx from 'rx';
import { GenError } from '../../../core/errors/error';
import { Connection } from '../../connection';
import * as types from '../../types/modules';
import { ModuleResource } from './module_resource';
export declare class MultipleFeaturesFoundError extends GenError {
    constructor(message: string);
}
export declare class NoFeatureFoundError extends GenError {
    constructor(message: string);
}
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
     * Gets a single feature. Returns undefined if feature not found.
     *
     * @param query Feature query
     * @returns Feature
     * @throws `MultipleFeaturesFoundError` is thrown if multiple features found
     * @throws `NoFeatureFoundError` is thrown if feature not found
     */
    getFeature(query: types.FeatureQuery): Rx.Observable<types.Feature>;
    /**
     * Searches for features.
     *
     * @param query Feature search query
     */
    search(query: types.FeatureSearchQuery): Rx.Observable<types.Feature[]>;
    /**
     * Performs an autocomplete query for features.
     *
     * @param query Feature autocomplete query
     */
    autocomplete(query: types.FeatureAutocompleteQuery): Rx.Observable<types.Feature[]>;
}
