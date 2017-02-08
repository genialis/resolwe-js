import * as _ from 'lodash';
import * as Rx from 'rx';

import {Connection} from '../../connection';

import {ModuleResource} from './module_resource';
import {transformFeatures} from '../../types/utils';
import * as types from '../../types/modules';

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
     * Searches for features.
     *
     * @param query Feature search query
     */
    public search(query: types.FeatureQuery): Rx.Observable<types.Feature[]> {
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
    public autocomplete(query: types.FeatureAutocompleteQuery): Rx.Observable<types.Feature[]> {
        const path = this.getModuleMethodPath('autocomplete');
        return transformFeatures(this.connection.post<types.Feature[]>(path, query));
    }
}
