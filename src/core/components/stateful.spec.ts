import * as angular from 'angular';
import 'angular-mocks';

import {component} from './base';
import {StatefulComponentBase, state, sharedState} from './stateful';
import {StateManager} from './manager';
import {Actions, SimpleSharedStore} from '../shared_store/index';
import {describeComponent, createSharedStore} from '../../tests/component';

describeComponent('stateful component', [
    // Simple shared stores used in tests.
    createSharedStore('test-shared', 'world'),
    createSharedStore('test-another', 'universe'),
    createSharedStore('test-shared-mutable', ['a', 'b', 'c']),
], (tester) => {
    @component({
        module: tester.module,
        directive: 'gen-dummy-stateful-component',
        template: `
            <div>
                {{ctrl.foo}} {{ctrl.bar}}
            </div>
        `,
    })
    class DummyStatefulComponent extends StatefulComponentBase {
        @state() public foo: string;
        @state() public bar: number;

        constructor($scope: angular.IScope, stateManager: StateManager) {
            super($scope, stateManager);

            // Set state properties.
            this.foo = 'hello world';
            this.bar = 42;
        }
    }

    @component({
        module: tester.module,
        directive: 'gen-parent-stateful-component',
        template: `
            <div>
                <gen-dummy-stateful-component state-id="dummy-1"></gen-dummy-stateful-component>
                <gen-dummy-stateful-component state-id="dummy-2"></gen-dummy-stateful-component>
                <gen-dummy-stateful-component state-id="dummy-3"></gen-dummy-stateful-component>
            </div>
        `,
    })
    class ParentStatefulComponent extends StatefulComponentBase {
    }

    @component({
        module: tester.module,
        directive: 'gen-shared-state-a',
        template: `
            <div class="text-a">Hello {{ctrl.foo.value()}}</div>
        `,
    })
    class SharedStateAComponent extends StatefulComponentBase {
        @sharedState() public foo: SimpleSharedStore<string>;
    }

    @component({
        module: tester.module,
        directive: 'gen-shared-state-b',
        template: `
            <div class="text-b">Hello {{ctrl.bar.value()}}</div>
        `,
    })
    class SharedStateBComponent extends StatefulComponentBase {
        @sharedState() public bar: SimpleSharedStore<string>;

        public testPublish(): void {
            this.bar.dispatch({type: Actions.SET, value: 'shared store value'});
        }
    }

    @component({
        module: tester.module,
        directive: 'gen-shared-state-container',
        template: `
            <div>
                <gen-shared-state-a store-foo="test-shared"></gen-shared-state-a>
                <gen-shared-state-b store-bar="test-shared"></gen-shared-state-b>
            </div>
        `,
    })
    class SharedStateContainer extends StatefulComponentBase {
    }

    // Ensure we have a state manager for each test.
    let stateManager: StateManager;
    beforeEach(inject((_stateManager_) => {
        stateManager = _stateManager_;
    }));

    it('sets correct state id and parent', () => {
        const component = tester.createComponent<DummyStatefulComponent>(
            DummyStatefulComponent.asView().template
        );

        expect(component.ctrl.stateId).toBe('gen-dummy-stateful-component');
        expect(component.ctrl.globalStateId).toBe('gen-dummy-stateful-component');
        expect(component.ctrl.foo).toBe('hello world');
        expect(component.ctrl.bar).toBe(42);
        expect(component.ctrl.parentComponent()).toBeNull();

        const state = component.ctrl.saveState();
        expect(state['gen-dummy-stateful-component']).toEqual({foo: 'hello world', bar: 42});

        // Test that creating a second component with a different stateId works.
        const component2 = tester.createComponent<DummyStatefulComponent>(
            DummyStatefulComponent.asView({inputs: {stateId: 'component-2'}}).template
        );

        expect(component2.ctrl.stateId).toBe('component-2');
    });

    it('sets up correct hierarchy', () => {
        const component = tester.createComponent<ParentStatefulComponent>(
            ParentStatefulComponent.asView().template
        );

        expect(component.ctrl.stateId).toBe('gen-parent-stateful-component');
        expect(component.ctrl.childComponents().length).toBe(3);
        expect(component.ctrl.childComponents()[0].stateId).toBe('dummy-1');
        expect(component.ctrl.childComponents()[1].stateId).toBe('dummy-2');
        expect(component.ctrl.childComponents()[2].stateId).toBe('dummy-3');
        expect(component.ctrl.childComponents()[0].globalStateId).toBe('gen-parent-stateful-component-dummy-1');
        expect(component.ctrl.childComponents()[1].globalStateId).toBe('gen-parent-stateful-component-dummy-2');
        expect(component.ctrl.childComponents()[2].globalStateId).toBe('gen-parent-stateful-component-dummy-3');

        const state = component.ctrl.saveState();
        expect(state['gen-parent-stateful-component']).toEqual({});
        expect(state['gen-parent-stateful-component-dummy-1']).toEqual({foo: 'hello world', bar: 42});
        expect(state['gen-parent-stateful-component-dummy-2']).toEqual({foo: 'hello world', bar: 42});
        expect(state['gen-parent-stateful-component-dummy-3']).toEqual({foo: 'hello world', bar: 42});
    });

    it('loads state', () => {
        const component = tester.createComponent<ParentStatefulComponent>(
            ParentStatefulComponent.asView().template
        );

        // Update the state for second dummy component.
        const state = component.ctrl.saveState();
        state['gen-parent-stateful-component-dummy-2'] = {foo: 'hey world', bar: 21};
        component.ctrl.loadState(state);

        expect((<DummyStatefulComponent> component.ctrl.childComponents()[0]).foo).toBe('hello world');
        expect((<DummyStatefulComponent> component.ctrl.childComponents()[0]).bar).toBe(42);
        expect((<DummyStatefulComponent> component.ctrl.childComponents()[1]).foo).toBe('hey world');
        expect((<DummyStatefulComponent> component.ctrl.childComponents()[1]).bar).toBe(21);
        expect((<DummyStatefulComponent> component.ctrl.childComponents()[2]).foo).toBe('hello world');
        expect((<DummyStatefulComponent> component.ctrl.childComponents()[2]).bar).toBe(42);
    });

    it('handles shared state', () => {
        const component = tester.createComponent<SharedStateContainer>(
            SharedStateContainer.asView().template
        );

        // Components should display 'Hello world'.
        expect(component.element.find('.text-a').text()).toBe('Hello world');
        expect(component.element.find('.text-b').text()).toBe('Hello world');

        (<SharedStateBComponent> component.ctrl.childComponents()[1]).testPublish();
        tester.digest();

        // Components should now display 'Hello shared store value'.
        expect(component.element.find('.text-a').text()).toBe('Hello shared store value');
        expect(component.element.find('.text-b').text()).toBe('Hello shared store value');

        // Save component state, change the used store and load it back.
        const state = component.ctrl.saveState();
        expect(state['gen-shared-state-container-gen-shared-state-a'].foo).toBe('test-shared');
        expect(state['gen-shared-state-container-gen-shared-state-b'].bar).toBe('test-shared');
        state['gen-shared-state-container-gen-shared-state-a'].foo = 'test-another';
        component.ctrl.loadState(state);
        tester.digest();

        // See if components have loaded correct state.
        expect(component.element.find('.text-a').text()).toBe('Hello universe');
        expect(component.element.find('.text-b').text()).toBe('Hello shared store value');
    });

    describe('with mutable data', () => {
        @component({
            module: tester.module,
            directive: 'gen-shared-state-mutable-a',
            template: ``,
        })
        class SharedStateMutableAComponent extends StatefulComponentBase {
            public updates: number = 0;
            public value: string[] = [];
            @sharedState() public foo: SimpleSharedStore<string[]>;

            // @ngInject
            constructor($scope: angular.IScope,
                        stateManager: StateManager) { // tslint:disable-line:no-shadowed-variable
                super($scope, stateManager);
            }

            public onComponentInit() {
                super.onComponentInit();

                this.watchCollection(() => this.value, (computation) => {
                    this.foo.dispatch({type: Actions.SET, value: this.value});
                });

                this.subscribeSharedStateMutable('foo', (foo: string[]) => {
                    this.value = foo;
                    this.updates++;
                });
            }

            public testSet() {
                this.value = ['a', 'b'];
            }

            public testMutate() {
                this.value.pop();
            }
        }

        @component({
            module: tester.module,
            directive: 'gen-shared-state-mutable-b',
            template: ``,
        })
        class SharedStateMutableBComponent extends StatefulComponentBase {
            public updates: number = 0;
            @sharedState() public foo: SimpleSharedStore<string[]>;

            // @ngInject
            constructor($scope: angular.IScope,
                        stateManager: StateManager) { // tslint:disable-line:no-shadowed-variable
                super($scope, stateManager);
            }

            public onComponentInit() {
                super.onComponentInit();

                this.subscribeSharedState('foo', (foo: string[]) => {
                    this.updates++;
                });
            }
        }

        @component({
            module: tester.module,
            directive: 'gen-shared-state-mutable-container',
            template: `
                <div>
                    <gen-shared-state-mutable-a store-foo="test-shared-mutable"></gen-shared-state-mutable-a>
                    <gen-shared-state-mutable-b store-foo="test-shared-mutable"></gen-shared-state-mutable-b>
                </div>
            `,
        })
        class SharedStateMutatableContainer extends StatefulComponentBase {
        }

        it('handles shared state', () => {
            const component = tester.createComponent<SharedStateMutatableContainer>(
                SharedStateMutatableContainer.asView().template
            );

            const component1 = <SharedStateMutableAComponent> component.ctrl.childComponents()[0];
            const component2 = <SharedStateMutableAComponent> component.ctrl.childComponents()[1];

            expect(component1.updates).toBe(1);
            expect(component2.updates).toBe(1);

            component1.testSet();
            tester.digest();

            expect(component1.updates).toBe(2);
            expect(component2.updates).toBe(2);

            component1.testMutate();
            tester.digest();

            expect(component1.updates).toBe(3);
            expect(component2.updates).toBe(3);
        });
    });
});
