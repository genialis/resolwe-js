import * as _ from 'lodash';
import * as Rx from 'rx';

import {GenError} from '../../../core/errors/error';
import {Connection} from '../../connection';
import {transformFeature, transformFeatures, transformFeaturesPaginated} from '../../types/utils';
import {PaginatedResponse} from '../../types/rest';
import * as types from '../../types/modules';
import {ModuleResource} from './module_resource';

export class MultipleFeaturesFoundError extends GenError {
    constructor(message: string) {
        super(message);
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object['setPrototypeOf'](this, MultipleFeaturesFoundError.prototype);
    }
}
export class NoFeatureFoundError extends GenError {
    constructor(message: string) {
        super(message);
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object['setPrototypeOf'](this, NoFeatureFoundError.prototype);
    }
}

/**
 * Abstract base class for knowledge base resources.
 */
export abstract class KnowledgeBaseResource extends ModuleResource {
    /**
     * @inheritdoc
     */
    protected getModulesBasePath(): string {
        return `${this.getBasePath()}/kb`;
    }
}

/**
 * Knowledge base feature resource.
 */
export class FeatureResource extends KnowledgeBaseResource {
    constructor(connection: Connection) {
        super('feature', connection);
    }

    /**
     * Gets a single feature. Returns undefined if feature not found.
     *
     * @param query Feature query
     * @returns Feature
     * @throws `MultipleFeaturesFoundError` is thrown if multiple features found
     * @throws `NoFeatureFoundError` is thrown if feature not found
     */
    public getFeature(query: types.FeatureQuery): Rx.Observable<types.Feature> {
        const path = this.getModuleMethodPath('search');

        return this.connection.get<types.Feature[]>(path, query).map((features) => {
            if (features.length > 1) {
                throw new MultipleFeaturesFoundError(
                    `Multiple features identified by feature id ${query.feature_id}, source ${query.source}
                    and species ${query.species}`
                );
            }
            if (features.length === 0) {
                throw new NoFeatureFoundError(
                    `Feature identified by feature id ${query.feature_id},source ${query.source} and
                    species ${query.species} not found`
                );
            }

            return transformFeature(_.first(features));
        });
    }

    public getFeatures(query: types.FeaturesQuery): Rx.Observable<types.Feature[]> {
        const path = this.getModuleMethodPath('search');
        const features = this.connection.post<types.Feature[]>(path, query);
        return transformFeatures(features);
    }

    /**
     * Searches for features.
     *
     * @param query Feature search query
     */
    public search(query: types.FeatureSearchQuery): Rx.Observable<types.Feature[]> {
        const path = this.getModuleMethodPath('search');
        let results: Rx.Observable<types.Feature[]>;

        if (_.isArray(query.query)) {
            results = this.connection.post<types.Feature[]>(path, query);
        } else {
            results = this.connection.get<types.Feature[]>(path, query);
        }

        return transformFeatures(results);
    }

    /**
     * Performs an autocomplete query for features.
     *
     * @param query Feature autocomplete query
     */
    public autocomplete(query: types.FeatureAutocompleteQuery & { limit: number }): Rx.Observable<PaginatedResponse<types.Feature>>;
    public autocomplete(query: types.FeatureAutocompleteQuery): Rx.Observable<types.Feature[]>;
    public autocomplete(query: types.FeatureAutocompleteQuery): Rx.Observable<types.Feature[] | PaginatedResponse<types.Feature>> {
        const path = this.getModuleMethodPath('autocomplete');
        const observable = this.connection.post<types.Feature[] | PaginatedResponse<types.Feature>>(path, query);
        const isPaginated = _.has(query, 'limit');
        return isPaginated
            ? transformFeaturesPaginated(<Rx.Observable<PaginatedResponse<types.Feature>>> observable)
            : transformFeatures(<Rx.Observable<types.Feature[]>> observable);
    }
}
