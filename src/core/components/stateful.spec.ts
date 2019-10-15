import 'angular-mocks';

import * as _ from 'lodash';
import {ComponentBase, component} from './base';
import {StatefulComponentBase, state, sharedState} from './stateful';
import {StateManager} from './manager';
import {Actions, SimpleSharedStore} from '../shared_store/index';
import {describeComponent, createSharedStore} from '../../tests/component';
import {SerializationError} from '../../core/utils/serialization';

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

        public onComponentInit() {
            super.onComponentInit();

            // Set state properties.
            this.foo = 'hello world';
            this.bar = 42;
        }
    }

    @component({
        module: tester.module,
        directive: 'gen-dummy-defaults-component',
    })
    class DummyDefaultsComponent extends StatefulComponentBase {
        @state() public foo: string;
        @state() public fooPreferStateOverDefault: string;

        public onComponentInit() {
            super.onComponentInit();

            this.foo = 'hello world';

            // Prefer value from state than default.
            if (this.isPropertyNotLoadedFromStateOrIsUndefined('fooPreferStateOverDefault')) {
                this.fooPreferStateOverDefault = 'hello world';
            }
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
        directive: 'gen-parent-stateful-component-v2',
        template: `
            <div>
                <gen-dummy-stateful-component state-id="dummy-1"></gen-dummy-stateful-component>
                <gen-dummy-stateful-component state-id="dummy-2"></gen-dummy-stateful-component>
                <gen-dummy-stateful-component state-id="dummy-3"></gen-dummy-stateful-component>
                <gen-dummy-stateful-component state-id="dummy-4"></gen-dummy-stateful-component>
            </div>
        `,
    })
    class ParentStatefulComponentV2 extends ParentStatefulComponent {
    }

    @component({
        module: tester.module,
        directive: 'gen-multiple-top-component',
        template: `
            <div>
                <gen-parent-stateful-component state-id="top-1"></gen-parent-stateful-component>
                <gen-parent-stateful-component state-id="top-2"></gen-parent-stateful-component>
            </div>
        `,
    })
    class MultipleTopComponent extends ComponentBase {
        // This is not a stateful component on purpose.
    }

    @component({
        module: tester.module,
        directive: 'gen-shared-state-a',
        template: `
            <div class="text-a">Hello {{ctrl.foo.value()}}</div>
        `,
    })
    class SharedStateAComponent extends StatefulComponentBase { // tslint:disable-line:no-unused-variable
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

    @component({
        module: tester.module,
        directive: 'gen-dummy-not-saveable-stateful-component',
        template: `<div>{{ctrl.foo}}</div>`,
    })
    class DummyNotSaveableStatefulComponent extends StatefulComponentBase {
        @state() public foo: {};

        public onComponentInit() {
            super.onComponentInit();

            this.foo = { func: () => {} }; // tslint:disable-line:no-empty
        }
    }


    // Ensure we have a state manager for each test.
    let stateManager: StateManager;
    beforeEach(inject((_stateManager_) => {
        stateManager = _stateManager_;
    }));

    it('sets correct state id and parent', () => {
        const dummyComponent = tester.createComponent<DummyStatefulComponent>(
            DummyStatefulComponent.asView().template
        );

        expect(dummyComponent.ctrl.stateId).toBe('gen-dummy-stateful-component');
        expect(dummyComponent.ctrl.globalStateId).toBe('gen-dummy-stateful-component');
        expect(dummyComponent.ctrl.foo).toBe('hello world');
        expect(dummyComponent.ctrl.bar).toBe(42);
        expect(dummyComponent.ctrl.parentComponent()).toBeNull();

        const savedState = dummyComponent.ctrl.saveState();
        expect(savedState['gen-dummy-stateful-component']).toEqual({foo: 'hello world', bar: 42});

        // Test that creating a second component with a different stateId works.
        const component2 = tester.createComponent<DummyStatefulComponent>(
            DummyStatefulComponent.asView({inputs: {stateId: 'component-2'}}).template
        );

        expect(component2.ctrl.stateId).toBe('component-2');
    });

    it('sets up correct hierarchy', () => {
        const parentComponent = tester.createComponent<ParentStatefulComponent>(
            ParentStatefulComponent.asView().template
        );

        expect(parentComponent.ctrl.stateId).toBe('gen-parent-stateful-component');
        expect(parentComponent.ctrl.childComponents().length).toBe(3);
        expect(parentComponent.ctrl.childComponents()[0].stateId).toBe('dummy-1');
        expect(parentComponent.ctrl.childComponents()[1].stateId).toBe('dummy-2');
        expect(parentComponent.ctrl.childComponents()[2].stateId).toBe('dummy-3');
        expect(parentComponent.ctrl.childComponents()[0].globalStateId).toBe('gen-parent-stateful-component-dummy-1');
        expect(parentComponent.ctrl.childComponents()[1].globalStateId).toBe('gen-parent-stateful-component-dummy-2');
        expect(parentComponent.ctrl.childComponents()[2].globalStateId).toBe('gen-parent-stateful-component-dummy-3');

        const savedState = parentComponent.ctrl.saveState();
        expect(savedState['gen-parent-stateful-component']).toEqual({});
        expect(savedState['gen-parent-stateful-component-dummy-1']).toEqual({foo: 'hello world', bar: 42});
        expect(savedState['gen-parent-stateful-component-dummy-2']).toEqual({foo: 'hello world', bar: 42});
        expect(savedState['gen-parent-stateful-component-dummy-3']).toEqual({foo: 'hello world', bar: 42});
    });

    it('handles multiple top-level components', () => {
        tester.createComponent<MultipleTopComponent>(
            MultipleTopComponent.asView().template
        );

        const topLevel = stateManager.topLevelComponents();
        expect(topLevel.length).toBe(2);
        expect(topLevel[0].stateId).toBe('top-1');
        expect(topLevel[1].stateId).toBe('top-2');

        const savedState = stateManager.save();
        expect(savedState['top-1']).toEqual({});
        expect(savedState['top-1-dummy-1']).toEqual({foo: 'hello world', bar: 42});
        expect(savedState['top-1-dummy-2']).toEqual({foo: 'hello world', bar: 42});
        expect(savedState['top-1-dummy-3']).toEqual({foo: 'hello world', bar: 42});
        expect(savedState['top-2']).toEqual({});
        expect(savedState['top-2-dummy-1']).toEqual({foo: 'hello world', bar: 42});
        expect(savedState['top-2-dummy-2']).toEqual({foo: 'hello world', bar: 42});
        expect(savedState['top-2-dummy-3']).toEqual({foo: 'hello world', bar: 42});
    });

    it('loads state', () => {
        const dummyComponent = tester.createComponent<ParentStatefulComponent>(
            ParentStatefulComponent.asView().template
        );

        // Update the state for second dummy component.
        const savedState = dummyComponent.ctrl.saveState();
        savedState['gen-parent-stateful-component-dummy-2'] = {foo: 'hey world', bar: 21};
        dummyComponent.ctrl.loadState(savedState);

        expect((<DummyStatefulComponent> dummyComponent.ctrl.childComponents()[0]).foo).toBe('hello world');
        expect((<DummyStatefulComponent> dummyComponent.ctrl.childComponents()[0]).bar).toBe(42);
        expect((<DummyStatefulComponent> dummyComponent.ctrl.childComponents()[1]).foo).toBe('hey world');
        expect((<DummyStatefulComponent> dummyComponent.ctrl.childComponents()[1]).bar).toBe(21);
        expect((<DummyStatefulComponent> dummyComponent.ctrl.childComponents()[2]).foo).toBe('hello world');
        expect((<DummyStatefulComponent> dummyComponent.ctrl.childComponents()[2]).bar).toBe(42);
    });

    it('allows loading state after introducing new stateful components', () => {
        const parentComponent = tester.createComponent<ParentStatefulComponent>(
            ParentStatefulComponent.asView().template
        );
        const stateV1 = parentComponent.ctrl.saveState();

        const componentV2 = tester.createComponent<ParentStatefulComponentV2>(
            ParentStatefulComponentV2.asView().template
        );
        expect(() => componentV2.ctrl.loadState(stateV1)).not.toThrow();
    });

    it('isPropertyNotLoadedFromStateOrIsUndefined prevents defaults from overriding state', () => {
        let dummyComponent = tester.createComponent<DummyDefaultsComponent>(
            DummyDefaultsComponent.asView().template
        );
        function reload() {
            // Replace component with new value.
            dummyComponent.element.remove();
            dummyComponent.ctrl.destroy();
            dummyComponent = tester.createComponent<DummyDefaultsComponent>(
                DummyDefaultsComponent.asView().template
            );
        }

        // Without isPropertyNotLoadedFromStateOrIsUndefined
        dummyComponent.ctrl.foo = 'Foo';
        reload();
        expect(dummyComponent.ctrl.foo).toBe('hello world');

        // With isPropertyNotLoadedFromStateOrIsUndefined
        expect(dummyComponent.ctrl.fooPreferStateOverDefault).toBe('hello world');
        reload();
        expect(dummyComponent.ctrl.fooPreferStateOverDefault).toBe('hello world');

        dummyComponent.ctrl.fooPreferStateOverDefault = '';
        reload();
        expect(dummyComponent.ctrl.fooPreferStateOverDefault).toBe('');

        dummyComponent.ctrl.fooPreferStateOverDefault = 'Foo';
        reload();
        expect(dummyComponent.ctrl.fooPreferStateOverDefault).toBe('Foo');

        dummyComponent.ctrl.fooPreferStateOverDefault = undefined;
        reload();
        expect(dummyComponent.ctrl.fooPreferStateOverDefault).toBe('hello world'); // Default overrides undefined too.

        dummyComponent.ctrl.fooPreferStateOverDefault = null;
        reload();
        expect(dummyComponent.ctrl.fooPreferStateOverDefault).toBeNull();
    });

    it('serializes and loads undefined, NaN, and Infinity values', () => {
        let dummyComponent = tester.createComponent<DummyStatefulComponent>(
            DummyStatefulComponent.asView().template
        );
        function saveAndReload() {
            const savedState = JSON.stringify(stateManager.saveSerializableState());

            // Replace component with new value.
            dummyComponent.element.remove();
            dummyComponent.ctrl.destroy();
            dummyComponent = tester.createComponent<DummyStatefulComponent>(
                DummyStatefulComponent.asView().template
            );

            // Expect to be initialized with default values (they override loaded pending state).
            expect(dummyComponent.ctrl.bar).toBe(42);
            stateManager.loadSerializableState(JSON.parse(savedState)); // Explicitly load saved state.
            return savedState;
        }

        dummyComponent.ctrl.foo = undefined;
        dummyComponent.ctrl.bar = 1 / 0; // Infinity
        saveAndReload();
        expect(dummyComponent.ctrl.foo).toBeUndefined();
        expect(dummyComponent.ctrl.bar).toBe(Infinity);

        dummyComponent.ctrl.foo = null;
        dummyComponent.ctrl.bar = -1 / 0; // -Infinity
        saveAndReload();
        expect(dummyComponent.ctrl.foo).toBeNull();
        expect(dummyComponent.ctrl.bar).toBe(-Infinity);

        dummyComponent.ctrl.foo = '';
        dummyComponent.ctrl.bar = <any> 'a' / 0; // NaN
        saveAndReload();
        expect(dummyComponent.ctrl.foo).toBe('');
        expect(dummyComponent.ctrl.bar).toBeNaN();
    });

    it('throws error if the state is not serializable', () => {
        tester.createComponent<DummyNotSaveableStatefulComponent>(
            DummyNotSaveableStatefulComponent.asView().template
        );

        expect(() => stateManager.saveSerializableState()).toThrowError(SerializationError);

        // No error if it doesn't have to be serializable.
        expect(() => stateManager.save()).not.toThrow();
    });

    it('should warn about incorrect usage (serializing stateManager.save())', () => {
        const consoleError = console.error;
        spyOn(console, 'error').and.callFake((...args) => {
            // Suppress the following console errors.
            if (_.startsWith(args[0], 'stateManager.save() is not serializable')) return;
            return consoleError.apply(console, args);
        });

        tester.createComponent<DummyNotSaveableStatefulComponent>(
            DummyNotSaveableStatefulComponent.asView().template
        );

        expect(() => stateManager.save()).not.toThrow();
        expect(console.error).not.toHaveBeenCalled();

        // Soft error log about incorrect usage.
        expect(() => JSON.stringify(stateManager.save())).not.toThrow();
        expect(console.error).toHaveBeenCalled();
    });

    it('handles shared state', () => {
        const stateComponent = tester.createComponent<SharedStateContainer>(
            SharedStateContainer.asView().template
        );

        // Components should display 'Hello world'.
        expect(stateComponent.element.find('.text-a').text()).toBe('Hello world');
        expect(stateComponent.element.find('.text-b').text()).toBe('Hello world');

        (<SharedStateBComponent> stateComponent.ctrl.childComponents()[1]).testPublish();
        tester.digest();

        // Components should now display 'Hello shared store value'.
        expect(stateComponent.element.find('.text-a').text()).toBe('Hello shared store value');
        expect(stateComponent.element.find('.text-b').text()).toBe('Hello shared store value');

        // Save component state, change the used store and load it back.
        const savedState = stateComponent.ctrl.saveState();
        expect(savedState['gen-shared-state-container-gen-shared-state-a'].foo).toBe('test-shared');
        expect(savedState['gen-shared-state-container-gen-shared-state-b'].bar).toBe('test-shared');
        savedState['gen-shared-state-container-gen-shared-state-a'].foo = 'test-another';
        stateComponent.ctrl.loadState(savedState);
        tester.digest();

        // See if components have loaded correct state.
        expect(stateComponent.element.find('.text-a').text()).toBe('Hello universe');
        expect(stateComponent.element.find('.text-b').text()).toBe('Hello shared store value');
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
        class SharedStateMutableBComponent extends StatefulComponentBase { // tslint:disable-line:no-unused-variable
            public updates: number = 0;
            @sharedState() public foo: SimpleSharedStore<string[]>;

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
            const stateComponent = tester.createComponent<SharedStateMutatableContainer>(
                SharedStateMutatableContainer.asView().template
            );

            const component1 = <SharedStateMutableAComponent> stateComponent.ctrl.childComponents()[0];
            const component2 = <SharedStateMutableAComponent> stateComponent.ctrl.childComponents()[1];

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
