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
        id: `${feature.source}:${feature.feature_id}`,
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
export function limitFieldsQuery(query: Query, fields: string[]): Query {
    return {...query, fields: fields.join(',')};
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

    return _.first(features).source;
}
