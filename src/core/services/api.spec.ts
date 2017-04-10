import * as _ from 'lodash';
import * as Rx from 'rx';
import * as angular from 'angular';

import {APIServiceBase} from './api';
import {ResolweApi} from '../../api/index';
import {MockApi} from '../../api/mock';
import {component, ComponentBase} from '../components/base';
import {describeComponent} from '../../tests/component';

export interface APIService extends APIServiceBase, ResolweApi {
}

describe('mock api', () => {
    it('mocks basic non-reactive queries', () => {
        const mockApi = new MockApi();
        const subscriber = jasmine.createSpy('subscriber');

        mockApi.createResource('collection');

        // Queries are not reactive by default.
        mockApi.Collection.query().subscribe(subscriber);
        expect(subscriber).toHaveBeenCalledTimes(1);
        expect(subscriber.calls.mostRecent().args[0]).toEqual([]);

        // Add an item.
        mockApi.addItem('collection', {id: 1, name: 'Hello world'});
        expect(subscriber).toHaveBeenCalledTimes(1);

        // Since it is a non-reactive query, we need to repeat the query.
        mockApi.Collection.query().subscribe(subscriber);
        expect(subscriber).toHaveBeenCalledTimes(2);
        expect(subscriber.calls.mostRecent().args[0]).toEqual([{id: 1, name: 'Hello world'}]);
    });

    it('mocks basic reactive queries', () => {
        const mockApi = new MockApi();
        const subscriber = jasmine.createSpy('subscriber');

        mockApi.createResource('collection');

        mockApi.Collection.query({}, {reactive: true}).subscribe(subscriber);
        expect(subscriber).toHaveBeenCalledTimes(1);
        expect(subscriber.calls.mostRecent().args[0]).toEqual([]);

        // Add an item.
        mockApi.addItem('collection', {id: 1, name: 'Hello world'});
        expect(subscriber).toHaveBeenCalledTimes(2);
        expect(subscriber.calls.mostRecent().args[0]).toEqual([{id: 1, name: 'Hello world'}]);

        // Update an item.
        mockApi.updateItem('collection', {id: 1, name: 'Hello mockups'});
        expect(subscriber).toHaveBeenCalledTimes(3);
        expect(subscriber.calls.mostRecent().args[0]).toEqual([{id: 1, name: 'Hello mockups'}]);

        // Remove an item.
        mockApi.removeItem('collection', 1);
        expect(subscriber).toHaveBeenCalledTimes(4);
        expect(subscriber.calls.mostRecent().args[0]).toEqual([]);
    });

    it('mocks complex reactive queries', () => {
        const mockApi = new MockApi();
        const subscriberPlain = jasmine.createSpy('subscriberPlain');
        const subscriberWithFilter = jasmine.createSpy('subscriberWithFilter');

        mockApi.createResource('collection', 'id', (query, items) => {
            if (_.isEmpty(query)) return items;

            return _.filter(items, (item: any) => item.name === query.name);
        });

        mockApi.Collection.query({}, {reactive: true}).subscribe(subscriberPlain);
        mockApi.Collection.query({name: 'Hello'}, {reactive: true}).subscribe(subscriberWithFilter);

        mockApi.addItem('collection', {id: 1, name: 'Collection A'});
        mockApi.addItem('collection', {id: 2, name: 'Another one'});
        mockApi.addItem('collection', {id: 3, name: 'Hello'});
        mockApi.addItem('collection', {id: 4, name: 'Hello world'});

        expect(subscriberPlain).toHaveBeenCalledTimes(5);
        expect(subscriberWithFilter).toHaveBeenCalledTimes(2);
    });

    it('mocks non-query operations', () => {
        const mockApi = new MockApi();
        const subscriber = jasmine.createSpy('subscriber');

        mockApi.whenPost('/api/collection', subscriber);
        mockApi.Collection.create({name: 'Foo'});

        expect(subscriber).toHaveBeenCalledTimes(1);
        expect(subscriber.calls.mostRecent().args[0]).toEqual({});
        expect(subscriber.calls.mostRecent().args[1]).toEqual({name: 'Foo'});

        mockApi.whenPost(/^\/api\/collection\/(.+?)\/add_data/, subscriber);
        mockApi.Collection.addData(1, [1, 2, 3, 4]);

        expect(subscriber).toHaveBeenCalledTimes(2);
        expect(subscriber.calls.mostRecent().args[1]).toEqual({ids: [1, 2, 3, 4]});
        expect(subscriber.calls.mostRecent().args[2][1]).toEqual('1');

        mockApi.whenGet('/api/collection/slug_exists', (parameters, data): boolean => {
            return parameters.name === 'hello';
        });

        mockApi.Collection.slugExists('bar').subscribe(subscriber);
        expect(subscriber).toHaveBeenCalledTimes(3);
        expect(subscriber.calls.mostRecent().args[0]).toBe(false);

        mockApi.Collection.slugExists('hello').subscribe(subscriber);
        expect(subscriber).toHaveBeenCalledTimes(4);
        expect(subscriber.calls.mostRecent().args[0]).toBe(true);
    });

    it('supports zip operation', () => {
        const mockApi = new MockApi();
        const subscriber = jasmine.createSpy('subscriber');

        mockApi.createResource('collection');
        mockApi.addItem('collection', { id: 1 });

        Rx.Observable.zip(mockApi.Collection.query(), mockApi.Collection.query()).subscribe(subscriber);
        expect(subscriber).toHaveBeenCalledTimes(1);
        expect(subscriber.calls.mostRecent().args[0]).toEqual([ [ { id: 1 } ], [ { id: 1 } ] ]);
    });
});

describeComponent('angular mock api', [], (tester) => {
    @component({
        module: tester.module,
        directive: 'gen-test-component',
        template: `<div class="text-name">Collection name is {{ctrl.collection.name}}</div>`,
    })
    class TestComponent extends ComponentBase {
        public collection: any;

        // @ngInject
        constructor($scope: angular.IScope, api: APIService) {
            super($scope);

            this.subscribe('collection', api.Collection.queryOne());
        }
    }

    it('replaces api service', () => {
        tester.api().createResource('collection');
        tester.api().addItem('collection', {id: 1, name: 'Hello world'});

        const component = tester.createComponent<TestComponent>(
            TestComponent.asView().template
        );

        expect(component.ctrl.collection.id).toBe(1);
        expect(component.ctrl.collection.name).toBe('Hello world');
        expect(component.element.find('.text-name').text()).toBe('Collection name is Hello world');
    });

    it('mocks uploads', (done) => {
        let uploaded: boolean = false;

        tester.api().whenUpload((data: any, fileUID: string) => {
            uploaded = true;
            return {data: 'hello'};
        });

        tester.api().upload({}, 'test-uuid').then((response) => {
            expect(uploaded).toEqual(true);
            expect(response.data).toEqual('hello');
            done();
        });
    });
});

describe('resource', () => {
    it('correctly caches reactive queries', (done) => {
        let called = 0;
        const mockApi = new MockApi();
        const subscriber = () => {
            if (++called === 3) { // tslint:disable-line:no-constant-condition
                done();
            }
        };

        mockApi.createResource('process');
        mockApi.simulateDelay(true);

        mockApi.Process.query({}, {reactive: true}).take(1).subscribe(subscriber);
        mockApi.Process.query({}, {reactive: true}).take(1).subscribe(subscriber);
        mockApi.Process.query({}, {reactive: true}).take(1).subscribe(subscriber);

        // Ensure these queries have been delayed.
        expect(called).toEqual(0);
    });
});
