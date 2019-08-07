import {limitFieldsQuery, shallowPickType, uniteDeepPicks, UnionToIntersection, deepPickType} from './utils';
import {CollectionHydrateData, Data} from './rest';

describe('utils', () => {
    describe('shallowPickType', () => {
        it('should return a type with fewer fields', () => {
            const limitedCollection = shallowPickType(<CollectionHydrateData> null, ['id', 'data']);
            type LimitedCollection = typeof limitedCollection.type;
            const limitFields = limitedCollection.limitFields;

            // tslint:disable-next-line:no-unused-variable
            const expectKeysToBe: 'id' | 'data' = <keyof LimitedCollection> '';
            expect(limitFieldsQuery({}, limitFields)).toEqual({ fields: ['id', 'data'].join(',') });
            expect(limitedCollection.limitQuery).toEqual({ fields: ['id', 'data'].join(',') });
        });
    });

    describe('uniteDeepPicks and deepPickType', () => {
        it('should return a type with fewer fields and subfields', () => {
            const limitedCollection = uniteDeepPicks([
                deepPickType(<CollectionHydrateData> null, 'id'),
                deepPickType(<CollectionHydrateData> null, 'data', '[*]', 'process_progress'),
                deepPickType(<CollectionHydrateData> null, 'data', '[*]', 'name'),
            ]);
            type LimitedCollection = typeof limitedCollection.type;
            const limitFields = limitedCollection.limitFields;

            expect(limitFieldsQuery({}, limitFields)).toEqual({ fields: ['id', 'data__process_progress', 'data__name'].join(',') });
            expect(limitedCollection.limitQuery).toEqual({ fields: ['id', 'data__process_progress', 'data__name'].join(',') });

            { // tslint:disable:no-unused-variable interface-over-type-literal
                type A = LimitedCollection;
                type B = { id: number } & { data: {process_progress: number}[] } & { data: {name: string}[] };
                type C = { id: number, data: {process_progress: number, name: string}[] };

                const test1: A = <B> {};
                const test2: B = <A> {};
                const test3: A = <C> {};
                // TODO: union type needs to be flattened for reverse to work:
                // const test4: C = <A> {};

                const expectKeysAtDepth1: 'id' | 'data' = <keyof A> '';
                const expectKeysAtDepth2: 'process_progress' | 'name' = <keyof A['data'][number]> '';
            } // tslint:enable:no-unused-variable interface-over-type-literal
        });

        it('limited type should inherit void paths', () => {
            { // tslint:disable:no-unused-variable interface-over-type-literal
                const LimitedData = uniteDeepPicks([
                    deepPickType(<Data> null, 'contributor', 'first_name'),
                    deepPickType(<Data> null, 'collection', 'name'),
                    deepPickType(<Data> null, 'entity', 'collection', 'name'),
                ]);
                {
                    type A = typeof LimitedData.type.contributor;
                    type B = { first_name: string };
                    const test1: A = <B> {};
                    const test2: B = <A> {};
                }
                {
                    type A = typeof LimitedData.type.collection;
                    type B = void | { name: string };
                    const test1: A = <B> {};
                    const test2: B = <A> {};
                }
                {
                    type A = typeof LimitedData.type.entity;
                    type B = void | { collection: void | { name: string } };
                    const test1: A = <B> {};
                    const test2: B = <A> {};
                }
            } // tslint:enable:no-unused-variable interface-over-type-literal
        });
    });

    describe('type-only tests', () => {
        it('UnionToIntersection should merge types from a union', () => {
            { // tslint:disable:no-unused-variable interface-over-type-literal
                type A = UnionToIntersection<{ id: number } | { slug: string }>;
                type B = { id: number } & { slug: string };
                const test1: A = <B> {};
                const test2: B = <A> {};
                const testThatNotAny: 'id' | 'slug' = <keyof A> '';
            } // tslint:enable:no-unused-variable interface-over-type-literal
        });

        it('deepPickType should limit a type to a single deep path', () => {
            () => { // tslint:disable:no-unused-variable interface-over-type-literal
                // Support deep paths (up to three levels)
                deepPickType(<CollectionHydrateData> null, 'data').type.data.reduce;
                deepPickType(<CollectionHydrateData> null, 'data', 'reduce').type.data.reduce;
                deepPickType(<CollectionHydrateData> null, 'data', 'reduce', 'apply').type.data.reduce;

                // Support arrays
                deepPickType(<CollectionHydrateData[]> null, '[*]', 'data').type[0].data;
                deepPickType(<CollectionHydrateData[][]> null, '[*]', '[*]', 'data').type[0][0].data;
                deepPickType(<CollectionHydrateData> null, 'data', '[*]', 'status').type.data[0].status.charAt;

                // Limit type
                const deepType = deepPickType(<CollectionHydrateData> null, 'data', 'reduce', 'apply').type;
                const expectKeysAtDepth1: 'data' = <keyof typeof deepType> '';
                const expectKeysAtDepth2: 'reduce' = <keyof typeof deepType['data']> '';
                const expectKeysAtDepth3: 'apply' = <keyof typeof deepType['data']['reduce']> '';
            }; // tslint:enable:no-unused-variable interface-over-type-literal
        });
    });
});
