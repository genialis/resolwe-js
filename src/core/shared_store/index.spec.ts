import * as _ from 'lodash';

import {SharedStoreManager, SharedStore, GetActions} from './index';
import {describeComponent, useSharedStore} from '../../tests/component';

class ComplexActions {
    public notAnAction() {
        return 'not an action';
    }

    public static ADD_ITEM = <'add_item'> 'add_item';
    public addItem(newItem: string) {
        return { type: ComplexActions.ADD_ITEM, newItem };
    }

    public static REMOVE_ITEM = <'remove_item'> 'remove_item';
    public removeItem(item: string) {
        return { type: ComplexActions.REMOVE_ITEM, item };
    }
}

class ComplexStore extends SharedStore<string[], ComplexActions> {
    protected initialState(): string[] {
        return [];
    }

    protected reduce(state: string[], action: GetActions<ComplexActions>): string[] {
        switch (action.type) {
            case ComplexActions.ADD_ITEM: return _.union(state, [action.newItem]);
            case ComplexActions.REMOVE_ITEM: return _.without(state, action.item);
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

        const store = <ComplexStore> sharedStoreManager.getStore('complex');
        expect(store).toBeDefined();
        store.observable().subscribe(subscriber);
        expect(subscriber).toHaveBeenCalledTimes(1);

        store.dispatch({type: 'add_item', newItem: 'hello'});
        store.dispatch({type: 'add_item', newItem: 'world'});
        store.dispatch({type: 'add_item', newItem: 'hello'});

        expect(store.value()).toEqual(['hello', 'world']);
        expect(subscriber).toHaveBeenCalledTimes(3);

        store.dispatch({type: 'remove_item', item: 'hello'});
        store.dispatch({type: 'remove_item', item: 'hello'});
        store.dispatch({type: 'remove_item', item: 'hello'});

        expect(store.value()).toEqual(['world']);
        expect(subscriber).toHaveBeenCalledTimes(4);

        // Not typesafe
        sharedStoreManager.dispatch({type: 'remove_item', item: 'world'});
        sharedStoreManager.dispatch({type: 'add_item', newItem: 'global'});
        sharedStoreManager.dispatch({type: 'add_item', newItem: 'dispatch'});

        expect(store.value()).toEqual(['global', 'dispatch']);
    });

    it('type-only test of GetActions', () => {
        { // tslint:disable:no-unused-variable interface-over-type-literal
            type A = GetActions<ComplexActions>;
            type B = { type: 'add_item', newItem: string } | { type: 'remove_item', item: string } | { type: '...' };
            const test1: A = <B> {};
            const test2: B = <A> {};
            const testThatNotAny: 'type' = <keyof A> '';
        } // tslint:enable:no-unused-variable interface-over-type-literal
    });
});
