import * as Rx from 'rx';
import { PaginatedResponse } from './rest';
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
