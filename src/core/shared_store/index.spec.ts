import * as _ from 'lodash';

import {SharedStoreManager, SharedStore} from './index';
import {describeComponent, useSharedStore} from '../../tests/component';

 // Complex store actions.
const ADD_ITEM = 'add_item';
const REMOVE_ITEM = 'remove_item';

class ComplexStore extends SharedStore<string[], any> {
    protected initialState(): string[] {
        return [];
    }

    protected reduce(state: string[], action: any): string[] {
        switch (action.type) {
            case ADD_ITEM: return _.union(state, [action.item]);
            case REMOVE_ITEM: return _.without(state, action.item);
            default: fail(`${action.type} handling not implemented`);
        }
    }
}

describeComponent('shared store', [
    useSharedStore('complex', ComplexStore),
], (tester) => {
    // Ensure we have a shared store manager for each test.
    let sharedStoreManager: SharedStoreManager;
    beforeEach(inject((_sharedStoreManager_) => {
        sharedStoreManager = _sharedStoreManager_;
    }));

    it('dispatches to complex stores', () => {
        const subscriber = jasmine.createSpy('subscriber');

        const store = sharedStoreManager.getStore('complex');
        expect(store).toBeDefined();
        store.observable().subscribe(subscriber);
        expect(subscriber).toHaveBeenCalledTimes(1);

        store.dispatch({type: ADD_ITEM, item: 'hello'});
        store.dispatch({type: ADD_ITEM, item: 'world'});
        store.dispatch({type: ADD_ITEM, item: 'hello'});

        expect(store.value()).toEqual(['hello', 'world']);
        expect(subscriber).toHaveBeenCalledTimes(3);

        store.dispatch({type: REMOVE_ITEM, item: 'hello'});
        store.dispatch({type: REMOVE_ITEM, item: 'hello'});
        store.dispatch({type: REMOVE_ITEM, item: 'hello'});

        expect(store.value()).toEqual(['world']);
        expect(subscriber).toHaveBeenCalledTimes(4);

        sharedStoreManager.dispatch({type: REMOVE_ITEM, item: 'world'});
        sharedStoreManager.dispatch({type: ADD_ITEM, item: 'global'});
        sharedStoreManager.dispatch({type: ADD_ITEM, item: 'dispatch'});

        expect(store.value()).toEqual(['global', 'dispatch']);
    });
});
