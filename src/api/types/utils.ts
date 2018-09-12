import * as _ from 'lodash';
import * as Rx from 'rx';

import {GenError} from '../../core/errors/error';
import {Query, PaginatedResponse} from './rest';
import {Feature} from './modules';

/**
 * Transforms a feature into one with some augmented attributes.
 */
export function transformFeature(feature: Feature): Feature {
    return _.assign<{}, Feature, {}, Feature>({}, feature, {
        id: `${feature.source}:${feature.feature_id}:${feature.species}`,
    });
}

/**
 * Transforms features returned from the API into one with some
 * augmented attributes.
 */
export function transformFeatures(features: Rx.Observable<Feature[]>): Rx.Observable<Feature[]> {
    return features.map(
        (featuresList) => _.map(featuresList, (feature) => transformFeature(feature))
    );
}

/**
 * Transforms paginated features returned from the API into one with some
 * augmented attributes.
 */
export function transformFeaturesPaginated(features: Rx.Observable<PaginatedResponse<Feature>>): Rx.Observable<PaginatedResponse<Feature>> {
    return features.map((response) => {
        const mappedResults = _.map(response.results, (feature) => transformFeature(feature));

        return _.assign<{}, {}, { results: Feature[] }, PaginatedResponse<Feature>>(
            {}, response, { results: mappedResults }
        );
    });
}

/**
 * Transforms query to return response with limited set of fields.
 */
export function limitFieldsQuery<T extends Query>(query: T, fields: string[]): T & { fields: string } {
    // TODO remove any when TypeScript supports spread on generics.
    return { ...<any> query, fields: fields.join(',') };
}

/**
 * Returns features' source.
 *
 * Throws `GenError` if source cannot be determined.
 *
 * @param features Features
 */
export function getSourceFromFeatures(features: Feature[]): string {
    const sources = _.unique(_.map(features, (feature) => feature.source));

    if (_.isEmpty(features)) {
        throw new GenError('No features');
    }
    if (_.size(sources) > 1) {
        throw new GenError(`Features come from multiple sources (${sources.join(', ')})`);
    }

    return _.first(sources);
}

/**
 * Returns features' species.
 *
 * Throws `GenError` if species cannot be determined.
 *
 * @param features Features
 */
export function getSpeciesFromFeatures(features: Feature[]): string {
    const species = _.unique(_.map(features, (feature) => feature.species));

    if (_.isEmpty(features)) {
        throw new GenError('No features');
    }
    if (_.size(species) > 1) {
        throw new GenError(`Features come from multiple species (${species.join(', ')})`);
    }

    return _.first(species);
}
