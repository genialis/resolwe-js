import {MockApi} from './mock';
import {describeComponent} from '../tests/component';

describeComponent('reactive queries', [], () => {
    let mockApi: MockApi;
    let unsubscribeRequestedSpy: jasmine.Spy;

    beforeEach(() => {
        mockApi = new MockApi();
        unsubscribeRequestedSpy = jasmine.createSpy('unsubscribeRequestedSpy');
        mockApi.whenPost('/api/queryobserver/unsubscribe', unsubscribeRequestedSpy);

        mockApi.createResource('data');
        mockApi.simulateDelay(true);
    });

    it('should be disposable', (done) => {
        const subscriber1 = jasmine.createSpy('subscriber1');
        const subscriber2 = jasmine.createSpy('subscriber2');
        const subscriber3 = jasmine.createSpy('subscriber3');

        mockApi.Data.query({}, {reactive: true}).subscribe(subscriber1).dispose();
        mockApi.Data.query({}, {reactive: true}).subscribe(subscriber2).dispose();
        const subscription3 = mockApi.Data.query({}, {reactive: true}).subscribe(subscriber3);

        // Ensure these queries have been delayed.
        expect(subscriber1).not.toHaveBeenCalled();
        expect(subscriber2).not.toHaveBeenCalled();
        expect(subscriber3).not.toHaveBeenCalled();

        setTimeout(() => {
            expect(subscriber1).not.toHaveBeenCalled();
            expect(subscriber2).not.toHaveBeenCalled();
            expect(subscriber3).toHaveBeenCalledTimes(1);

            mockApi.addItem('data', {id: 1});
            expect(subscriber1).not.toHaveBeenCalled();
            expect(subscriber2).not.toHaveBeenCalled();
            expect(subscriber3).toHaveBeenCalledTimes(2);

            subscription3.dispose();

            mockApi.addItem('data', {id: 1});
            expect(subscriber3).toHaveBeenCalledTimes(2);

            done();
        }, 100);
    });

    describe('should make unsubscribe request', () => {
        it('after disposing the subscription', (done) => {
            const subscription1 = mockApi.Data.query({}, {reactive: true}).subscribe();

            setTimeout(() => {
                // QueryObserver is initialized.
                expect(unsubscribeRequestedSpy).not.toHaveBeenCalled();

                subscription1.dispose();
                expect(unsubscribeRequestedSpy).toHaveBeenCalled();

                done();
            }, 100);
        });

        it('after disposing all subscriptions', (done) => {
            mockApi.Data.query({}, {reactive: true}).subscribe().dispose();
            const subscription1 = mockApi.Data.query({}, {reactive: true}).subscribe();
            const subscription2 = mockApi.Data.query({}, {reactive: true}).subscribe();

            setTimeout(() => {
                // QueryObserver is initialized.
                expect(unsubscribeRequestedSpy).not.toHaveBeenCalled();

                subscription1.dispose();
                expect(unsubscribeRequestedSpy).not.toHaveBeenCalled();

                subscription2.dispose();
                expect(unsubscribeRequestedSpy).toHaveBeenCalled();

                done();
            }, 100);
        });

        it('after a subscription is disposed before QueryObserver is INITIALIZED', (done) => {
            mockApi.Data.query({}, {reactive: true}).subscribe().dispose();
            mockApi.Data.query({}, {reactive: true}).subscribe().dispose();
            expect(unsubscribeRequestedSpy).not.toHaveBeenCalled();
            setTimeout(() => {
                // QueryObserver is initialized.
                expect(unsubscribeRequestedSpy).toHaveBeenCalled();
                done();
            }, 100);
        });

        // tslint:disable-next-line:max-line-length
        it('after disposing a subscription that was made after another subscription is disposed before QueryObserver is INITIALIZED', (done) => {
            mockApi.Data.query({}, {reactive: true}).subscribe().dispose();
            mockApi.Data.query({}, {reactive: true}).subscribe().dispose();
            const subscription3 = mockApi.Data.query({}, {reactive: true}).subscribe();

            setTimeout(() => {
                // QueryObserver is initialized.
                expect(unsubscribeRequestedSpy).not.toHaveBeenCalled();

                subscription3.dispose();
                expect(unsubscribeRequestedSpy).toHaveBeenCalled();

                done();
            }, 100);
        });

        // tslint:disable-next-line:max-line-length
        it('after disposing a subscription that was made after QueryObserver is INITIALIZED after another subscription is disposed before QueryObserver is INITIALIZED', (done) => {
            mockApi.Data.query({}, {reactive: true}).subscribe().dispose();
            mockApi.Data.query({}, {reactive: true}).subscribe().dispose();
            expect(unsubscribeRequestedSpy).not.toHaveBeenCalled();
            setTimeout(() => {
                // QueryObserver is initialized.
                expect(unsubscribeRequestedSpy).toHaveBeenCalled();
                unsubscribeRequestedSpy.calls.reset();

                const subscription3 = mockApi.Data.query({}, {reactive: true}).subscribe();
                setTimeout(() => {
                    expect(unsubscribeRequestedSpy).not.toHaveBeenCalled();
                    subscription3.dispose();
                    expect(unsubscribeRequestedSpy).toHaveBeenCalled();
                    done();
                }, 100);
            }, 100);
        });
    });
});
