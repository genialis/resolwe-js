import * as Rx from 'rx';
import { Query, PaginatedResponse } from './rest';
import { Feature } from './modules';
/**
 * Transforms features returned from the API into one with some
 * augmented attributes.
 */
export declare function transformFeatures(features: Rx.Observable<Feature[]>): Rx.Observable<Feature[]>;
/**
 * Transforms paginated features returned from the API into one with some
 * augmented attributes.
 */
export declare function transformFeaturesPaginated(features: Rx.Observable<PaginatedResponse<Feature>>): Rx.Observable<PaginatedResponse<Feature>>;
/**
 * Transforms query to return response with limited set of fields.
 */
export declare function limitFieldsQuery(query: Query, fields: string[]): Query;
/**
 * Returns features' source.
 *
 * Throws `GenError` if source cannot be determined.
 *
 * @param features Features
 */
export declare function getSourceFromFeatures(features: Feature[]): string;
