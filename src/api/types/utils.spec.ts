import {limitFieldsQuery, shallowPickType} from './utils';
import {CollectionHydrateData} from './rest';

describe('utils', () => {
    describe('shallowPickType', () => {
        it('should return a type with fewer fields', () => {
            const limitedCollection = shallowPickType(<CollectionHydrateData> null, ['id', 'data']);
            type LimitedCollection = typeof limitedCollection.type;
            const limitFields = limitedCollection.limitFields;

            // tslint:disable-next-line:no-unused-variable
            const expectKeysToBe: 'id' | 'data' = <keyof LimitedCollection> '';
            expect(limitFieldsQuery({}, limitFields)).toEqual({ fields: 'id,data' });
        });
    });
});
