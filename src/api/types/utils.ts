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

/**
 * Transforms query to return response with limited set of fields.
 */
export function limitFieldsQuery<T extends Query>(query: T, fields: string[]): T & { fields: string } {
    // TODO remove any when TypeScript supports spread on generics.
    return { ...<any> query, fields: fields.join(',') };
}

/**
 * Returns a type with limited set of fields.
 *
 * Example:
 * ```
 * const limitedCollection = shallowPickType(<CollectionHydrateData> {}, ['id', 'data']);
 * type LimitedCollection = typeof limitedCollection.type;
 * const limitFields = limitedCollection.limitFields;
 * ```
 *
 * To limit subfields look at [uniteDeepPicks]
 * @see uniteDeepPicks
 */
export function shallowPickType<T extends object, K extends keyof T>(_type: T, shallowKeys: K[]) {
    return {
        type: <Pick<T, typeof shallowKeys[number]>> undefined,
        limitFields: shallowKeys,
    };
}

// From https://stackoverflow.com/questions/50374908/transform-union-type-to-intersection-type
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

/**
 * Returns a type with limited set of fields and limited subfields.
 *
 * Example:
 * ```
 * const limitedCollection = uniteDeepPicks([
 *     deepPickType(<CollectionHydrateData> {}, 'id'),
 *     deepPickType(<CollectionHydrateData> {}, 'data', '[*]', 'process_progress'),
 *     deepPickType(<CollectionHydrateData> {}, 'data', '[*]', 'name'),
 * ]);
 * type LimitedCollection = typeof limitedCollection.type;
 * const limitFields = limitedCollection.limitFields;
 * ```
 *
 * To only limit shallow fields look at simpler [shallowPickType]
 * @see shallowPickType
 */
export function uniteDeepPicks<T extends { type: any, limitField: string }>(picks: T[]) {
    return {
        type: <UnionToIntersection<T['type']>> undefined,
        limitFields: _.map(picks, (pick) => pick.limitField),
    };
}

// tslint:disable:max-line-length

/**
 * @see uniteDeepPicks
 */
export function deepPickType<K1 extends string, T extends {[k1 in K1]: any}, R extends { [k1 in K1]: T[k1] }>(_type: T, k1: K1): { type: R, limitField: string };
export function deepPickType<K1 extends string, K2 extends string, T extends {[k1 in K1]: {[k2 in K2]: any}}, R extends { [k1 in K1]: { [k2 in K2]: T[k1][k2] } }>(_type: T, k1: K1, k2: K2): { type: R, limitField: string };
export function deepPickType<K1 extends '[*]', K2 extends string, T extends Array<{[k2 in K2]: any}>, R extends Array<{ [k2 in K2]: T[number][k2] }>>(_type: T, k1: K1, k2: K2): { type: R, limitField: string };
export function deepPickType<K1 extends string, K2 extends string, K3 extends string, T extends {[k1 in K1]: {[k2 in K2]: {[k3 in K3]: any}}}, R extends { [k1 in K1]: { [k2 in K2]: { [k3 in K3]: T[k1][k2][k3] } } }>(_type: T, k1: K1, k2: K2, k3: K3): { type: R, limitField: string };
export function deepPickType<K1 extends string, K2 extends '[*]', K3 extends string, T extends {[k1 in K1]: Array<{[k3 in K3]: any}>}, R extends { [k1 in K1]: Array<{ [k3 in K3]: T[k1][number][k3] }> }>(_type: T, k1: K1, k2: K2, k3: K3): { type: R, limitField: string };
export function deepPickType<K1 extends '[*]', K2 extends '[*]', K3 extends string, T extends Array<Array<{[k3 in K3]: any}>>, R extends Array<Array<{ [k3 in K3]: T[number][number][k3] }>>>(_type: T, k1: K1, k2: K2, k3: K3): { type: R, limitField: string };
export function deepPickType<K1 extends string, K2 extends string, K3 extends string, K4 extends string, T extends {[k1 in K1]: {[k2 in K2]: {[k3 in K3]: {[k4 in K4]: any}}}}, R extends { [k1 in K1]: { [k2 in K2]: { [k3 in K3]: { [k4 in K4]: T[k1][k2][k3][k4] } } } }>(_type: T, k1: K1, k2: K2, k3: K3, k4: K4): { type: R, limitField: string };
export function deepPickType<K1 extends string, K2 extends '[*]', K3 extends string, K4 extends string, T extends {[k1 in K1]: Array<{[k3 in K3]: {[k4 in K4]: any}}>}, R extends { [k1 in K1]: Array<{ [k3 in K3]: { [k4 in K4]: T[k1][number][k3][k4] } }> }>(_type: T, k1: K1, k2: K2, k3: K3, k4: K4): { type: R, limitField: string };
export function deepPickType<K1 extends string, K2 extends string, K3 extends '[*]', K4 extends string, T extends {[k1 in K1]: {[k2 in K2]: Array<{[k4 in K4]: any}>}}, R extends { [k1 in K1]: { [k2 in K2]: Array<{ [k4 in K4]: T[k1][k2][number][k4] }> } }>(_type: T, k1: K1, k2: K2, k3: K3, k4: K4): { type: R, limitField: string };
export function deepPickType(_type: any, ...keys: any[]): { type: any, limitField: string } {

    const keysWithoutStars = _.reject(keys, (key) => key === '[*]');
    return {
        type: undefined,
        limitField: keysWithoutStars.join('__'),
    };
}
// tslint:enable:max-line-length
