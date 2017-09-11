"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("angular-mocks");
var base_1 = require("./base");
var stateful_1 = require("./stateful");
var index_1 = require("../shared_store/index");
var component_1 = require("../../tests/component");
component_1.describeComponent('stateful component', [
    // Simple shared stores used in tests.
    component_1.createSharedStore('test-shared', 'world'),
    component_1.createSharedStore('test-another', 'universe'),
    component_1.createSharedStore('test-shared-mutable', ['a', 'b', 'c']),
], function (tester) {
    var DummyStatefulComponent = /** @class */ (function (_super) {
        __extends(DummyStatefulComponent, _super);
        function DummyStatefulComponent() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DummyStatefulComponent.prototype.onComponentInit = function () {
            _super.prototype.onComponentInit.call(this);
            // Set state properties.
            this.foo = 'hello world';
            this.bar = 42;
        };
        __decorate([
            stateful_1.state()
        ], DummyStatefulComponent.prototype, "foo", void 0);
        __decorate([
            stateful_1.state()
        ], DummyStatefulComponent.prototype, "bar", void 0);
        DummyStatefulComponent = __decorate([
            base_1.component({
                module: tester.module,
                directive: 'gen-dummy-stateful-component',
                template: "\n            <div>\n                {{ctrl.foo}} {{ctrl.bar}}\n            </div>\n        ",
            })
        ], DummyStatefulComponent);
        return DummyStatefulComponent;
    }(stateful_1.StatefulComponentBase));
    var ParentStatefulComponent = /** @class */ (function (_super) {
        __extends(ParentStatefulComponent, _super);
        function ParentStatefulComponent() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ParentStatefulComponent = __decorate([
            base_1.component({
                module: tester.module,
                directive: 'gen-parent-stateful-component',
                template: "\n            <div>\n                <gen-dummy-stateful-component state-id=\"dummy-1\"></gen-dummy-stateful-component>\n                <gen-dummy-stateful-component state-id=\"dummy-2\"></gen-dummy-stateful-component>\n                <gen-dummy-stateful-component state-id=\"dummy-3\"></gen-dummy-stateful-component>\n            </div>\n        ",
            })
        ], ParentStatefulComponent);
        return ParentStatefulComponent;
    }(stateful_1.StatefulComponentBase));
    var MultipleTopComponent = /** @class */ (function (_super) {
        __extends(MultipleTopComponent, _super);
        function MultipleTopComponent() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MultipleTopComponent = __decorate([
            base_1.component({
                module: tester.module,
                directive: 'gen-multiple-top-component',
                template: "\n            <div>\n                <gen-parent-stateful-component state-id=\"top-1\"></gen-parent-stateful-component>\n                <gen-parent-stateful-component state-id=\"top-2\"></gen-parent-stateful-component>\n            </div>\n        ",
            })
        ], MultipleTopComponent);
        return MultipleTopComponent;
    }(base_1.ComponentBase));
    var SharedStateAComponent = /** @class */ (function (_super) {
        __extends(SharedStateAComponent, _super);
        function SharedStateAComponent() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        __decorate([
            stateful_1.sharedState()
        ], SharedStateAComponent.prototype, "foo", void 0);
        SharedStateAComponent = __decorate([
            base_1.component({
                module: tester.module,
                directive: 'gen-shared-state-a',
                template: "\n            <div class=\"text-a\">Hello {{ctrl.foo.value()}}</div>\n        ",
            })
        ], SharedStateAComponent);
        return SharedStateAComponent;
    }(stateful_1.StatefulComponentBase));
    var SharedStateBComponent = /** @class */ (function (_super) {
        __extends(SharedStateBComponent, _super);
        function SharedStateBComponent() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        SharedStateBComponent.prototype.testPublish = function () {
            this.bar.dispatch({ type: index_1.Actions.SET, value: 'shared store value' });
        };
        __decorate([
            stateful_1.sharedState()
        ], SharedStateBComponent.prototype, "bar", void 0);
        SharedStateBComponent = __decorate([
            base_1.component({
                module: tester.module,
                directive: 'gen-shared-state-b',
                template: "\n            <div class=\"text-b\">Hello {{ctrl.bar.value()}}</div>\n        ",
            })
        ], SharedStateBComponent);
        return SharedStateBComponent;
    }(stateful_1.StatefulComponentBase));
    var SharedStateContainer = /** @class */ (function (_super) {
        __extends(SharedStateContainer, _super);
        function SharedStateContainer() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        SharedStateContainer = __decorate([
            base_1.component({
                module: tester.module,
                directive: 'gen-shared-state-container',
                template: "\n            <div>\n                <gen-shared-state-a store-foo=\"test-shared\"></gen-shared-state-a>\n                <gen-shared-state-b store-bar=\"test-shared\"></gen-shared-state-b>\n            </div>\n        ",
            })
        ], SharedStateContainer);
        return SharedStateContainer;
    }(stateful_1.StatefulComponentBase));
    // Ensure we have a state manager for each test.
    var stateManager;
    beforeEach(inject(function (_stateManager_) {
        stateManager = _stateManager_;
    }));
    it('sets correct state id and parent', function () {
        var component = tester.createComponent(DummyStatefulComponent.asView().template);
        expect(component.ctrl.stateId).toBe('gen-dummy-stateful-component');
        expect(component.ctrl.globalStateId).toBe('gen-dummy-stateful-component');
        expect(component.ctrl.foo).toBe('hello world');
        expect(component.ctrl.bar).toBe(42);
        expect(component.ctrl.parentComponent()).toBeNull();
        var state = component.ctrl.saveState();
        expect(state['gen-dummy-stateful-component']).toEqual({ foo: 'hello world', bar: 42 });
        // Test that creating a second component with a different stateId works.
        var component2 = tester.createComponent(DummyStatefulComponent.asView({ inputs: { stateId: 'component-2' } }).template);
        expect(component2.ctrl.stateId).toBe('component-2');
    });
    it('sets up correct hierarchy', function () {
        var component = tester.createComponent(ParentStatefulComponent.asView().template);
        expect(component.ctrl.stateId).toBe('gen-parent-stateful-component');
        expect(component.ctrl.childComponents().length).toBe(3);
        expect(component.ctrl.childComponents()[0].stateId).toBe('dummy-1');
        expect(component.ctrl.childComponents()[1].stateId).toBe('dummy-2');
        expect(component.ctrl.childComponents()[2].stateId).toBe('dummy-3');
        expect(component.ctrl.childComponents()[0].globalStateId).toBe('gen-parent-stateful-component-dummy-1');
        expect(component.ctrl.childComponents()[1].globalStateId).toBe('gen-parent-stateful-component-dummy-2');
        expect(component.ctrl.childComponents()[2].globalStateId).toBe('gen-parent-stateful-component-dummy-3');
        var state = component.ctrl.saveState();
        expect(state['gen-parent-stateful-component']).toEqual({});
        expect(state['gen-parent-stateful-component-dummy-1']).toEqual({ foo: 'hello world', bar: 42 });
        expect(state['gen-parent-stateful-component-dummy-2']).toEqual({ foo: 'hello world', bar: 42 });
        expect(state['gen-parent-stateful-component-dummy-3']).toEqual({ foo: 'hello world', bar: 42 });
    });
    it('handles multiple top-level components', function () {
        tester.createComponent(MultipleTopComponent.asView().template);
        var topLevel = stateManager.topLevelComponents();
        expect(topLevel.length).toBe(2);
        expect(topLevel[0].stateId).toBe('top-1');
        expect(topLevel[1].stateId).toBe('top-2');
        var state = stateManager.save();
        expect(state['top-1']).toEqual({});
        expect(state['top-1-dummy-1']).toEqual({ foo: 'hello world', bar: 42 });
        expect(state['top-1-dummy-2']).toEqual({ foo: 'hello world', bar: 42 });
        expect(state['top-1-dummy-3']).toEqual({ foo: 'hello world', bar: 42 });
        expect(state['top-2']).toEqual({});
        expect(state['top-2-dummy-1']).toEqual({ foo: 'hello world', bar: 42 });
        expect(state['top-2-dummy-2']).toEqual({ foo: 'hello world', bar: 42 });
        expect(state['top-2-dummy-3']).toEqual({ foo: 'hello world', bar: 42 });
    });
    it('loads state', function () {
        var component = tester.createComponent(ParentStatefulComponent.asView().template);
        // Update the state for second dummy component.
        var state = component.ctrl.saveState();
        state['gen-parent-stateful-component-dummy-2'] = { foo: 'hey world', bar: 21 };
        component.ctrl.loadState(state);
        expect(component.ctrl.childComponents()[0].foo).toBe('hello world');
        expect(component.ctrl.childComponents()[0].bar).toBe(42);
        expect(component.ctrl.childComponents()[1].foo).toBe('hey world');
        expect(component.ctrl.childComponents()[1].bar).toBe(21);
        expect(component.ctrl.childComponents()[2].foo).toBe('hello world');
        expect(component.ctrl.childComponents()[2].bar).toBe(42);
    });
    it('handles shared state', function () {
        var component = tester.createComponent(SharedStateContainer.asView().template);
        // Components should display 'Hello world'.
        expect(component.element.find('.text-a').text()).toBe('Hello world');
        expect(component.element.find('.text-b').text()).toBe('Hello world');
        component.ctrl.childComponents()[1].testPublish();
        tester.digest();
        // Components should now display 'Hello shared store value'.
        expect(component.element.find('.text-a').text()).toBe('Hello shared store value');
        expect(component.element.find('.text-b').text()).toBe('Hello shared store value');
        // Save component state, change the used store and load it back.
        var state = component.ctrl.saveState();
        expect(state['gen-shared-state-container-gen-shared-state-a'].foo).toBe('test-shared');
        expect(state['gen-shared-state-container-gen-shared-state-b'].bar).toBe('test-shared');
        state['gen-shared-state-container-gen-shared-state-a'].foo = 'test-another';
        component.ctrl.loadState(state);
        tester.digest();
        // See if components have loaded correct state.
        expect(component.element.find('.text-a').text()).toBe('Hello universe');
        expect(component.element.find('.text-b').text()).toBe('Hello shared store value');
    });
    describe('with mutable data', function () {
        var SharedStateMutableAComponent = /** @class */ (function (_super) {
            __extends(SharedStateMutableAComponent, _super);
            function SharedStateMutableAComponent() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.updates = 0;
                _this.value = [];
                return _this;
            }
            SharedStateMutableAComponent.prototype.onComponentInit = function () {
                var _this = this;
                _super.prototype.onComponentInit.call(this);
                this.watchCollection(function () { return _this.value; }, function (computation) {
                    _this.foo.dispatch({ type: index_1.Actions.SET, value: _this.value });
                });
                this.subscribeSharedStateMutable('foo', function (foo) {
                    _this.value = foo;
                    _this.updates++;
                });
            };
            SharedStateMutableAComponent.prototype.testSet = function () {
                this.value = ['a', 'b'];
            };
            SharedStateMutableAComponent.prototype.testMutate = function () {
                this.value.pop();
            };
            __decorate([
                stateful_1.sharedState()
            ], SharedStateMutableAComponent.prototype, "foo", void 0);
            SharedStateMutableAComponent = __decorate([
                base_1.component({
                    module: tester.module,
                    directive: 'gen-shared-state-mutable-a',
                    template: "",
                })
            ], SharedStateMutableAComponent);
            return SharedStateMutableAComponent;
        }(stateful_1.StatefulComponentBase));
        var SharedStateMutableBComponent = /** @class */ (function (_super) {
            __extends(SharedStateMutableBComponent, _super);
            function SharedStateMutableBComponent() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.updates = 0;
                return _this;
            }
            SharedStateMutableBComponent.prototype.onComponentInit = function () {
                var _this = this;
                _super.prototype.onComponentInit.call(this);
                this.subscribeSharedState('foo', function (foo) {
                    _this.updates++;
                });
            };
            __decorate([
                stateful_1.sharedState()
            ], SharedStateMutableBComponent.prototype, "foo", void 0);
            SharedStateMutableBComponent = __decorate([
                base_1.component({
                    module: tester.module,
                    directive: 'gen-shared-state-mutable-b',
                    template: "",
                })
            ], SharedStateMutableBComponent);
            return SharedStateMutableBComponent;
        }(stateful_1.StatefulComponentBase));
        var SharedStateMutatableContainer = /** @class */ (function (_super) {
            __extends(SharedStateMutatableContainer, _super);
            function SharedStateMutatableContainer() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            SharedStateMutatableContainer = __decorate([
                base_1.component({
                    module: tester.module,
                    directive: 'gen-shared-state-mutable-container',
                    template: "\n                <div>\n                    <gen-shared-state-mutable-a store-foo=\"test-shared-mutable\"></gen-shared-state-mutable-a>\n                    <gen-shared-state-mutable-b store-foo=\"test-shared-mutable\"></gen-shared-state-mutable-b>\n                </div>\n            ",
                })
            ], SharedStateMutatableContainer);
            return SharedStateMutatableContainer;
        }(stateful_1.StatefulComponentBase));
        it('handles shared state', function () {
            var component = tester.createComponent(SharedStateMutatableContainer.asView().template);
            var component1 = component.ctrl.childComponents()[0];
            var component2 = component.ctrl.childComponents()[1];
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2NvbXBvbmVudHMvc3RhdGVmdWwuc3BlYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx5QkFBdUI7QUFFdkIsK0JBQWdEO0FBQ2hELHVDQUFxRTtBQUVyRSwrQ0FBaUU7QUFDakUsbURBQTJFO0FBRTNFLDZCQUFpQixDQUFDLG9CQUFvQixFQUFFO0lBQ3BDLHNDQUFzQztJQUN0Qyw2QkFBaUIsQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDO0lBQ3pDLDZCQUFpQixDQUFDLGNBQWMsRUFBRSxVQUFVLENBQUM7SUFDN0MsNkJBQWlCLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0NBQzVELEVBQUUsVUFBQyxNQUFNO0lBVU47UUFBcUMsMENBQXFCO1FBQTFEOztRQVdBLENBQUM7UUFQVSxnREFBZSxHQUF0QjtZQUNJLGlCQUFNLGVBQWUsV0FBRSxDQUFDO1lBRXhCLHdCQUF3QjtZQUN4QixJQUFJLENBQUMsR0FBRyxHQUFHLGFBQWEsQ0FBQztZQUN6QixJQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQztRQUNsQixDQUFDO1FBVFE7WUFBUixnQkFBSyxFQUFFOzJEQUFvQjtRQUNuQjtZQUFSLGdCQUFLLEVBQUU7MkRBQW9CO1FBRjFCLHNCQUFzQjtZQVQzQixnQkFBUyxDQUFDO2dCQUNQLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTTtnQkFDckIsU0FBUyxFQUFFLDhCQUE4QjtnQkFDekMsUUFBUSxFQUFFLDhGQUlUO2FBQ0osQ0FBQztXQUNJLHNCQUFzQixDQVczQjtRQUFELDZCQUFDO0tBWEQsQUFXQyxDQVhvQyxnQ0FBcUIsR0FXekQ7SUFhRDtRQUFzQywyQ0FBcUI7UUFBM0Q7O1FBQ0EsQ0FBQztRQURLLHVCQUF1QjtZQVg1QixnQkFBUyxDQUFDO2dCQUNQLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTTtnQkFDckIsU0FBUyxFQUFF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QyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVuQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDckIsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBRWhCLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRW5DLFVBQVUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUN4QixNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7WUFFaEIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQyxDQUFDIiwiZmlsZSI6ImNvcmUvY29tcG9uZW50cy9zdGF0ZWZ1bC5zcGVjLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICdhbmd1bGFyLW1vY2tzJztcblxuaW1wb3J0IHtDb21wb25lbnRCYXNlLCBjb21wb25lbnR9IGZyb20gJy4vYmFzZSc7XG5pbXBvcnQge1N0YXRlZnVsQ29tcG9uZW50QmFzZSwgc3RhdGUsIHNoYXJlZFN0YXRlfSBmcm9tICcuL3N0YXRlZnVsJztcbmltcG9ydCB7U3RhdGVNYW5hZ2VyfSBmcm9tICcuL21hbmFnZXInO1xuaW1wb3J0IHtBY3Rpb25zLCBTaW1wbGVTaGFyZWRTdG9yZX0gZnJvbSAnLi4vc2hhcmVkX3N0b3JlL2luZGV4JztcbmltcG9ydCB7ZGVzY3JpYmVDb21wb25lbnQsIGNyZWF0ZVNoYXJlZFN0b3JlfSBmcm9tICcuLi8uLi90ZXN0cy9jb21wb25lbnQnO1xuXG5kZXNjcmliZUNvbXBvbmVudCgnc3RhdGVmdWwgY29tcG9uZW50JywgW1xuICAgIC8vIFNpbXBsZSBzaGFyZWQgc3RvcmVzIHVzZWQgaW4gdGVzdHMuXG4gICAgY3JlYXRlU2hhcmVkU3RvcmUoJ3Rlc3Qtc2hhcmVkJywgJ3dvcmxkJyksXG4gICAgY3JlYXRlU2hhcmVkU3RvcmUoJ3Rlc3QtYW5vdGhlcicsICd1bml2ZXJzZScpLFxuICAgIGNyZWF0ZVNoYXJlZFN0b3JlKCd0ZXN0LXNoYXJlZC1tdXRhYmxlJywgWydhJywgJ2InLCAnYyddKSxcbl0sICh0ZXN0ZXIpID0+IHtcbiAgICBAY29tcG9uZW50KHtcbiAgICAgICAgbW9kdWxlOiB0ZXN0ZXIubW9kdWxlLFxuICAgICAgICBkaXJlY3RpdmU6ICdnZW4tZHVtbXktc3RhdGVmdWwtY29tcG9uZW50JyxcbiAgICAgICAgdGVtcGxhdGU6IGBcbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAge3tjdHJsLmZvb319IHt7Y3RybC5iYXJ9fVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGAsXG4gICAgfSlcbiAgICBjbGFzcyBEdW1teVN0YXRlZnVsQ29tcG9uZW50IGV4dGVuZHMgU3RhdGVmdWxDb21wb25lbnRCYXNlIHtcbiAgICAgICAgQHN0YXRlKCkgcHVibGljIGZvbzogc3RyaW5nO1xuICAgICAgICBAc3RhdGUoKSBwdWJsaWMgYmFyOiBudW1iZXI7XG5cbiAgICAgICAgcHVibGljIG9uQ29tcG9uZW50SW5pdCgpIHtcbiAgICAgICAgICAgIHN1cGVyLm9uQ29tcG9uZW50SW5pdCgpO1xuXG4gICAgICAgICAgICAvLyBTZXQgc3RhdGUgcHJvcGVydGllcy5cbiAgICAgICAgICAgIHRoaXMuZm9vID0gJ2hlbGxvIHdvcmxkJztcbiAgICAgICAgICAgIHRoaXMuYmFyID0gNDI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBAY29tcG9uZW50KHtcbiAgICAgICAgbW9kdWxlOiB0ZXN0ZXIubW9kdWxlLFxuICAgICAgICBkaXJlY3RpdmU6ICdnZW4tcGFyZW50LXN0YXRlZnVsLWNvbXBvbmVudCcsXG4gICAgICAgIHRlbXBsYXRlOiBgXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxnZW4tZHVtbXktc3RhdGVmdWwtY29tcG9uZW50IHN0YXRlLWlkPVwiZHVtbXktMVwiPjwvZ2VuLWR1bW15LXN0YXRlZnVsLWNvbXBvbmVudD5cbiAgICAgICAgICAgICAgICA8Z2VuLWR1bW15LXN0YXRlZnVsLWNvbXBvbmVudCBzdGF0ZS1pZD1cImR1bW15LTJcIj48L2dlbi1kdW1teS1zdGF0ZWZ1bC1jb21wb25lbnQ+XG4gICAgICAgICAgICAgICAgPGdlbi1kdW1teS1zdGF0ZWZ1bC1jb21wb25lbnQgc3RhdGUtaWQ9XCJkdW1teS0zXCI+PC9nZW4tZHVtbXktc3RhdGVmdWwtY29tcG9uZW50PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGAsXG4gICAgfSlcbiAgICBjbGFzcyBQYXJlbnRTdGF0ZWZ1bENvbXBvbmVudCBleHRlbmRzIFN0YXRlZnVsQ29tcG9uZW50QmFzZSB7XG4gICAgfVxuXG4gICAgQGNvbXBvbmVudCh7XG4gICAgICAgIG1vZHVsZTogdGVzdGVyLm1vZHVsZSxcbiAgICAgICAgZGlyZWN0aXZlOiAnZ2VuLW11bHRpcGxlLXRvcC1jb21wb25lbnQnLFxuICAgICAgICB0ZW1wbGF0ZTogYFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8Z2VuLXBhcmVudC1zdGF0ZWZ1bC1jb21wb25lbnQgc3RhdGUtaWQ9XCJ0b3AtMVwiPjwvZ2VuLXBhcmVudC1zdGF0ZWZ1bC1jb21wb25lbnQ+XG4gICAgICAgICAgICAgICAgPGdlbi1wYXJlbnQtc3RhdGVmdWwtY29tcG9uZW50IHN0YXRlLWlkPVwidG9wLTJcIj48L2dlbi1wYXJlbnQtc3RhdGVmdWwtY29tcG9uZW50PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGAsXG4gICAgfSlcbiAgICBjbGFzcyBNdWx0aXBsZVRvcENvbXBvbmVudCBleHRlbmRzIENvbXBvbmVudEJhc2Uge1xuICAgICAgICAvLyBUaGlzIGlzIG5vdCBhIHN0YXRlZnVsIGNvbXBvbmVudCBvbiBwdXJwb3NlLlxuICAgIH1cblxuICAgIEBjb21wb25lbnQoe1xuICAgICAgICBtb2R1bGU6IHRlc3Rlci5tb2R1bGUsXG4gICAgICAgIGRpcmVjdGl2ZTogJ2dlbi1zaGFyZWQtc3RhdGUtYScsXG4gICAgICAgIHRlbXBsYXRlOiBgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwidGV4dC1hXCI+SGVsbG8ge3tjdHJsLmZvby52YWx1ZSgpfX08L2Rpdj5cbiAgICAgICAgYCxcbiAgICB9KVxuICAgIGNsYXNzIFNoYXJlZFN0YXRlQUNvbXBvbmVudCBleHRlbmRzIFN0YXRlZnVsQ29tcG9uZW50QmFzZSB7XG4gICAgICAgIEBzaGFyZWRTdGF0ZSgpIHB1YmxpYyBmb286IFNpbXBsZVNoYXJlZFN0b3JlPHN0cmluZz47XG4gICAgfVxuXG4gICAgQGNvbXBvbmVudCh7XG4gICAgICAgIG1vZHVsZTogdGVzdGVyLm1vZHVsZSxcbiAgICAgICAgZGlyZWN0aXZlOiAnZ2VuLXNoYXJlZC1zdGF0ZS1iJyxcbiAgICAgICAgdGVtcGxhdGU6IGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0ZXh0LWJcIj5IZWxsbyB7e2N0cmwuYmFyLnZhbHVlKCl9fTwvZGl2PlxuICAgICAgICBgLFxuICAgIH0pXG4gICAgY2xhc3MgU2hhcmVkU3RhdGVCQ29tcG9uZW50IGV4dGVuZHMgU3RhdGVmdWxDb21wb25lbnRCYXNlIHtcbiAgICAgICAgQHNoYXJlZFN0YXRlKCkgcHVibGljIGJhcjogU2ltcGxlU2hhcmVkU3RvcmU8c3RyaW5nPjtcblxuICAgICAgICBwdWJsaWMgdGVzdFB1Ymxpc2goKTogdm9pZCB7XG4gICAgICAgICAgICB0aGlzLmJhci5kaXNwYXRjaCh7dHlwZTogQWN0aW9ucy5TRVQsIHZhbHVlOiAnc2hhcmVkIHN0b3JlIHZhbHVlJ30pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgQGNvbXBvbmVudCh7XG4gICAgICAgIG1vZHVsZTogdGVzdGVyLm1vZHVsZSxcbiAgICAgICAgZGlyZWN0aXZlOiAnZ2VuLXNoYXJlZC1zdGF0ZS1jb250YWluZXInLFxuICAgICAgICB0ZW1wbGF0ZTogYFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8Z2VuLXNoYXJlZC1zdGF0ZS1hIHN0b3JlLWZvbz1cInRlc3Qtc2hhcmVkXCI+PC9nZW4tc2hhcmVkLXN0YXRlLWE+XG4gICAgICAgICAgICAgICAgPGdlbi1zaGFyZWQtc3RhdGUtYiBzdG9yZS1iYXI9XCJ0ZXN0LXNoYXJlZFwiPjwvZ2VuLXNoYXJlZC1zdGF0ZS1iPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGAsXG4gICAgfSlcbiAgICBjbGFzcyBTaGFyZWRTdGF0ZUNvbnRhaW5lciBleHRlbmRzIFN0YXRlZnVsQ29tcG9uZW50QmFzZSB7XG4gICAgfVxuXG4gICAgLy8gRW5zdXJlIHdlIGhhdmUgYSBzdGF0ZSBtYW5hZ2VyIGZvciBlYWNoIHRlc3QuXG4gICAgbGV0IHN0YXRlTWFuYWdlcjogU3RhdGVNYW5hZ2VyO1xuICAgIGJlZm9yZUVhY2goaW5qZWN0KChfc3RhdGVNYW5hZ2VyXykgPT4ge1xuICAgICAgICBzdGF0ZU1hbmFnZXIgPSBfc3RhdGVNYW5hZ2VyXztcbiAgICB9KSk7XG5cbiAgICBpdCgnc2V0cyBjb3JyZWN0IHN0YXRlIGlkIGFuZCBwYXJlbnQnLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IHRlc3Rlci5jcmVhdGVDb21wb25lbnQ8RHVtbXlTdGF0ZWZ1bENvbXBvbmVudD4oXG4gICAgICAgICAgICBEdW1teVN0YXRlZnVsQ29tcG9uZW50LmFzVmlldygpLnRlbXBsYXRlXG4gICAgICAgICk7XG5cbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5jdHJsLnN0YXRlSWQpLnRvQmUoJ2dlbi1kdW1teS1zdGF0ZWZ1bC1jb21wb25lbnQnKTtcbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5jdHJsLmdsb2JhbFN0YXRlSWQpLnRvQmUoJ2dlbi1kdW1teS1zdGF0ZWZ1bC1jb21wb25lbnQnKTtcbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5jdHJsLmZvbykudG9CZSgnaGVsbG8gd29ybGQnKTtcbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5jdHJsLmJhcikudG9CZSg0Mik7XG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuY3RybC5wYXJlbnRDb21wb25lbnQoKSkudG9CZU51bGwoKTtcblxuICAgICAgICBjb25zdCBzdGF0ZSA9IGNvbXBvbmVudC5jdHJsLnNhdmVTdGF0ZSgpO1xuICAgICAgICBleHBlY3Qoc3RhdGVbJ2dlbi1kdW1teS1zdGF0ZWZ1bC1jb21wb25lbnQnXSkudG9FcXVhbCh7Zm9vOiAnaGVsbG8gd29ybGQnLCBiYXI6IDQyfSk7XG5cbiAgICAgICAgLy8gVGVzdCB0aGF0IGNyZWF0aW5nIGEgc2Vjb25kIGNvbXBvbmVudCB3aXRoIGEgZGlmZmVyZW50IHN0YXRlSWQgd29ya3MuXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudDIgPSB0ZXN0ZXIuY3JlYXRlQ29tcG9uZW50PER1bW15U3RhdGVmdWxDb21wb25lbnQ+KFxuICAgICAgICAgICAgRHVtbXlTdGF0ZWZ1bENvbXBvbmVudC5hc1ZpZXcoe2lucHV0czoge3N0YXRlSWQ6ICdjb21wb25lbnQtMid9fSkudGVtcGxhdGVcbiAgICAgICAgKTtcblxuICAgICAgICBleHBlY3QoY29tcG9uZW50Mi5jdHJsLnN0YXRlSWQpLnRvQmUoJ2NvbXBvbmVudC0yJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2V0cyB1cCBjb3JyZWN0IGhpZXJhcmNoeScsICgpID0+IHtcbiAgICAgICAgY29uc3QgY29tcG9uZW50ID0gdGVzdGVyLmNyZWF0ZUNvbXBvbmVudDxQYXJlbnRTdGF0ZWZ1bENvbXBvbmVudD4oXG4gICAgICAgICAgICBQYXJlbnRTdGF0ZWZ1bENvbXBvbmVudC5hc1ZpZXcoKS50ZW1wbGF0ZVxuICAgICAgICApO1xuXG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuY3RybC5zdGF0ZUlkKS50b0JlKCdnZW4tcGFyZW50LXN0YXRlZnVsLWNvbXBvbmVudCcpO1xuICAgICAgICBleHBlY3QoY29tcG9uZW50LmN0cmwuY2hpbGRDb21wb25lbnRzKCkubGVuZ3RoKS50b0JlKDMpO1xuICAgICAgICBleHBlY3QoY29tcG9uZW50LmN0cmwuY2hpbGRDb21wb25lbnRzKClbMF0uc3RhdGVJZCkudG9CZSgnZHVtbXktMScpO1xuICAgICAgICBleHBlY3QoY29tcG9uZW50LmN0cmwuY2hpbGRDb21wb25lbnRzKClbMV0uc3RhdGVJZCkudG9CZSgnZHVtbXktMicpO1xuICAgICAgICBleHBlY3QoY29tcG9uZW50LmN0cmwuY2hpbGRDb21wb25lbnRzKClbMl0uc3RhdGVJZCkudG9CZSgnZHVtbXktMycpO1xuICAgICAgICBleHBlY3QoY29tcG9uZW50LmN0cmwuY2hpbGRDb21wb25lbnRzKClbMF0uZ2xvYmFsU3RhdGVJZCkudG9CZSgnZ2VuLXBhcmVudC1zdGF0ZWZ1bC1jb21wb25lbnQtZHVtbXktMScpO1xuICAgICAgICBleHBlY3QoY29tcG9uZW50LmN0cmwuY2hpbGRDb21wb25lbnRzKClbMV0uZ2xvYmFsU3RhdGVJZCkudG9CZSgnZ2VuLXBhcmVudC1zdGF0ZWZ1bC1jb21wb25lbnQtZHVtbXktMicpO1xuICAgICAgICBleHBlY3QoY29tcG9uZW50LmN0cmwuY2hpbGRDb21wb25lbnRzKClbMl0uZ2xvYmFsU3RhdGVJZCkudG9CZSgnZ2VuLXBhcmVudC1zdGF0ZWZ1bC1jb21wb25lbnQtZHVtbXktMycpO1xuXG4gICAgICAgIGNvbnN0IHN0YXRlID0gY29tcG9uZW50LmN0cmwuc2F2ZVN0YXRlKCk7XG4gICAgICAgIGV4cGVjdChzdGF0ZVsnZ2VuLXBhcmVudC1zdGF0ZWZ1bC1jb21wb25lbnQnXSkudG9FcXVhbCh7fSk7XG4gICAgICAgIGV4cGVjdChzdGF0ZVsnZ2VuLXBhcmVudC1zdGF0ZWZ1bC1jb21wb25lbnQtZHVtbXktMSddKS50b0VxdWFsKHtmb286ICdoZWxsbyB3b3JsZCcsIGJhcjogNDJ9KTtcbiAgICAgICAgZXhwZWN0KHN0YXRlWydnZW4tcGFyZW50LXN0YXRlZnVsLWNvbXBvbmVudC1kdW1teS0yJ10pLnRvRXF1YWwoe2ZvbzogJ2hlbGxvIHdvcmxkJywgYmFyOiA0Mn0pO1xuICAgICAgICBleHBlY3Qoc3RhdGVbJ2dlbi1wYXJlbnQtc3RhdGVmdWwtY29tcG9uZW50LWR1bW15LTMnXSkudG9FcXVhbCh7Zm9vOiAnaGVsbG8gd29ybGQnLCBiYXI6IDQyfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnaGFuZGxlcyBtdWx0aXBsZSB0b3AtbGV2ZWwgY29tcG9uZW50cycsICgpID0+IHtcbiAgICAgICAgdGVzdGVyLmNyZWF0ZUNvbXBvbmVudDxNdWx0aXBsZVRvcENvbXBvbmVudD4oXG4gICAgICAgICAgICBNdWx0aXBsZVRvcENvbXBvbmVudC5hc1ZpZXcoKS50ZW1wbGF0ZVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IHRvcExldmVsID0gc3RhdGVNYW5hZ2VyLnRvcExldmVsQ29tcG9uZW50cygpO1xuICAgICAgICBleHBlY3QodG9wTGV2ZWwubGVuZ3RoKS50b0JlKDIpO1xuICAgICAgICBleHBlY3QodG9wTGV2ZWxbMF0uc3RhdGVJZCkudG9CZSgndG9wLTEnKTtcbiAgICAgICAgZXhwZWN0KHRvcExldmVsWzFdLnN0YXRlSWQpLnRvQmUoJ3RvcC0yJyk7XG5cbiAgICAgICAgY29uc3Qgc3RhdGUgPSBzdGF0ZU1hbmFnZXIuc2F2ZSgpO1xuICAgICAgICBleHBlY3Qoc3RhdGVbJ3RvcC0xJ10pLnRvRXF1YWwoe30pO1xuICAgICAgICBleHBlY3Qoc3RhdGVbJ3RvcC0xLWR1bW15LTEnXSkudG9FcXVhbCh7Zm9vOiAnaGVsbG8gd29ybGQnLCBiYXI6IDQyfSk7XG4gICAgICAgIGV4cGVjdChzdGF0ZVsndG9wLTEtZHVtbXktMiddKS50b0VxdWFsKHtmb286ICdoZWxsbyB3b3JsZCcsIGJhcjogNDJ9KTtcbiAgICAgICAgZXhwZWN0KHN0YXRlWyd0b3AtMS1kdW1teS0zJ10pLnRvRXF1YWwoe2ZvbzogJ2hlbGxvIHdvcmxkJywgYmFyOiA0Mn0pO1xuICAgICAgICBleHBlY3Qoc3RhdGVbJ3RvcC0yJ10pLnRvRXF1YWwoe30pO1xuICAgICAgICBleHBlY3Qoc3RhdGVbJ3RvcC0yLWR1bW15LTEnXSkudG9FcXVhbCh7Zm9vOiAnaGVsbG8gd29ybGQnLCBiYXI6IDQyfSk7XG4gICAgICAgIGV4cGVjdChzdGF0ZVsndG9wLTItZHVtbXktMiddKS50b0VxdWFsKHtmb286ICdoZWxsbyB3b3JsZCcsIGJhcjogNDJ9KTtcbiAgICAgICAgZXhwZWN0KHN0YXRlWyd0b3AtMi1kdW1teS0zJ10pLnRvRXF1YWwoe2ZvbzogJ2hlbGxvIHdvcmxkJywgYmFyOiA0Mn0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2xvYWRzIHN0YXRlJywgKCkgPT4ge1xuICAgICAgICBjb25zdCBjb21wb25lbnQgPSB0ZXN0ZXIuY3JlYXRlQ29tcG9uZW50PFBhcmVudFN0YXRlZnVsQ29tcG9uZW50PihcbiAgICAgICAgICAgIFBhcmVudFN0YXRlZnVsQ29tcG9uZW50LmFzVmlldygpLnRlbXBsYXRlXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gVXBkYXRlIHRoZSBzdGF0ZSBmb3Igc2Vjb25kIGR1bW15IGNvbXBvbmVudC5cbiAgICAgICAgY29uc3Qgc3RhdGUgPSBjb21wb25lbnQuY3RybC5zYXZlU3RhdGUoKTtcbiAgICAgICAgc3RhdGVbJ2dlbi1wYXJlbnQtc3RhdGVmdWwtY29tcG9uZW50LWR1bW15LTInXSA9IHtmb286ICdoZXkgd29ybGQnLCBiYXI6IDIxfTtcbiAgICAgICAgY29tcG9uZW50LmN0cmwubG9hZFN0YXRlKHN0YXRlKTtcblxuICAgICAgICBleHBlY3QoKDxEdW1teVN0YXRlZnVsQ29tcG9uZW50PiBjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVswXSkuZm9vKS50b0JlKCdoZWxsbyB3b3JsZCcpO1xuICAgICAgICBleHBlY3QoKDxEdW1teVN0YXRlZnVsQ29tcG9uZW50PiBjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVswXSkuYmFyKS50b0JlKDQyKTtcbiAgICAgICAgZXhwZWN0KCg8RHVtbXlTdGF0ZWZ1bENvbXBvbmVudD4gY29tcG9uZW50LmN0cmwuY2hpbGRDb21wb25lbnRzKClbMV0pLmZvbykudG9CZSgnaGV5IHdvcmxkJyk7XG4gICAgICAgIGV4cGVjdCgoPER1bW15U3RhdGVmdWxDb21wb25lbnQ+IGNvbXBvbmVudC5jdHJsLmNoaWxkQ29tcG9uZW50cygpWzFdKS5iYXIpLnRvQmUoMjEpO1xuICAgICAgICBleHBlY3QoKDxEdW1teVN0YXRlZnVsQ29tcG9uZW50PiBjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVsyXSkuZm9vKS50b0JlKCdoZWxsbyB3b3JsZCcpO1xuICAgICAgICBleHBlY3QoKDxEdW1teVN0YXRlZnVsQ29tcG9uZW50PiBjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVsyXSkuYmFyKS50b0JlKDQyKTtcbiAgICB9KTtcblxuICAgIGl0KCdoYW5kbGVzIHNoYXJlZCBzdGF0ZScsICgpID0+IHtcbiAgICAgICAgY29uc3QgY29tcG9uZW50ID0gdGVzdGVyLmNyZWF0ZUNvbXBvbmVudDxTaGFyZWRTdGF0ZUNvbnRhaW5lcj4oXG4gICAgICAgICAgICBTaGFyZWRTdGF0ZUNvbnRhaW5lci5hc1ZpZXcoKS50ZW1wbGF0ZVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIENvbXBvbmVudHMgc2hvdWxkIGRpc3BsYXkgJ0hlbGxvIHdvcmxkJy5cbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5lbGVtZW50LmZpbmQoJy50ZXh0LWEnKS50ZXh0KCkpLnRvQmUoJ0hlbGxvIHdvcmxkJyk7XG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuZWxlbWVudC5maW5kKCcudGV4dC1iJykudGV4dCgpKS50b0JlKCdIZWxsbyB3b3JsZCcpO1xuXG4gICAgICAgICg8U2hhcmVkU3RhdGVCQ29tcG9uZW50PiBjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVsxXSkudGVzdFB1Ymxpc2goKTtcbiAgICAgICAgdGVzdGVyLmRpZ2VzdCgpO1xuXG4gICAgICAgIC8vIENvbXBvbmVudHMgc2hvdWxkIG5vdyBkaXNwbGF5ICdIZWxsbyBzaGFyZWQgc3RvcmUgdmFsdWUnLlxuICAgICAgICBleHBlY3QoY29tcG9uZW50LmVsZW1lbnQuZmluZCgnLnRleHQtYScpLnRleHQoKSkudG9CZSgnSGVsbG8gc2hhcmVkIHN0b3JlIHZhbHVlJyk7XG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuZWxlbWVudC5maW5kKCcudGV4dC1iJykudGV4dCgpKS50b0JlKCdIZWxsbyBzaGFyZWQgc3RvcmUgdmFsdWUnKTtcblxuICAgICAgICAvLyBTYXZlIGNvbXBvbmVudCBzdGF0ZSwgY2hhbmdlIHRoZSB1c2VkIHN0b3JlIGFuZCBsb2FkIGl0IGJhY2suXG4gICAgICAgIGNvbnN0IHN0YXRlID0gY29tcG9uZW50LmN0cmwuc2F2ZVN0YXRlKCk7XG4gICAgICAgIGV4cGVjdChzdGF0ZVsnZ2VuLXNoYXJlZC1zdGF0ZS1jb250YWluZXItZ2VuLXNoYXJlZC1zdGF0ZS1hJ10uZm9vKS50b0JlKCd0ZXN0LXNoYXJlZCcpO1xuICAgICAgICBleHBlY3Qoc3RhdGVbJ2dlbi1zaGFyZWQtc3RhdGUtY29udGFpbmVyLWdlbi1zaGFyZWQtc3RhdGUtYiddLmJhcikudG9CZSgndGVzdC1zaGFyZWQnKTtcbiAgICAgICAgc3RhdGVbJ2dlbi1zaGFyZWQtc3RhdGUtY29udGFpbmVyLWdlbi1zaGFyZWQtc3RhdGUtYSddLmZvbyA9ICd0ZXN0LWFub3RoZXInO1xuICAgICAgICBjb21wb25lbnQuY3RybC5sb2FkU3RhdGUoc3RhdGUpO1xuICAgICAgICB0ZXN0ZXIuZGlnZXN0KCk7XG5cbiAgICAgICAgLy8gU2VlIGlmIGNvbXBvbmVudHMgaGF2ZSBsb2FkZWQgY29ycmVjdCBzdGF0ZS5cbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5lbGVtZW50LmZpbmQoJy50ZXh0LWEnKS50ZXh0KCkpLnRvQmUoJ0hlbGxvIHVuaXZlcnNlJyk7XG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuZWxlbWVudC5maW5kKCcudGV4dC1iJykudGV4dCgpKS50b0JlKCdIZWxsbyBzaGFyZWQgc3RvcmUgdmFsdWUnKTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCd3aXRoIG11dGFibGUgZGF0YScsICgpID0+IHtcbiAgICAgICAgQGNvbXBvbmVudCh7XG4gICAgICAgICAgICBtb2R1bGU6IHRlc3Rlci5tb2R1bGUsXG4gICAgICAgICAgICBkaXJlY3RpdmU6ICdnZW4tc2hhcmVkLXN0YXRlLW11dGFibGUtYScsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogYGAsXG4gICAgICAgIH0pXG4gICAgICAgIGNsYXNzIFNoYXJlZFN0YXRlTXV0YWJsZUFDb21wb25lbnQgZXh0ZW5kcyBTdGF0ZWZ1bENvbXBvbmVudEJhc2Uge1xuICAgICAgICAgICAgcHVibGljIHVwZGF0ZXM6IG51bWJlciA9IDA7XG4gICAgICAgICAgICBwdWJsaWMgdmFsdWU6IHN0cmluZ1tdID0gW107XG4gICAgICAgICAgICBAc2hhcmVkU3RhdGUoKSBwdWJsaWMgZm9vOiBTaW1wbGVTaGFyZWRTdG9yZTxzdHJpbmdbXT47XG5cbiAgICAgICAgICAgIHB1YmxpYyBvbkNvbXBvbmVudEluaXQoKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIub25Db21wb25lbnRJbml0KCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLndhdGNoQ29sbGVjdGlvbigoKSA9PiB0aGlzLnZhbHVlLCAoY29tcHV0YXRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mb28uZGlzcGF0Y2goe3R5cGU6IEFjdGlvbnMuU0VULCB2YWx1ZTogdGhpcy52YWx1ZX0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpYmVTaGFyZWRTdGF0ZU11dGFibGUoJ2ZvbycsIChmb286IHN0cmluZ1tdKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSBmb287XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlcysrO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgdGVzdFNldCgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gWydhJywgJ2InXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIHRlc3RNdXRhdGUoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZS5wb3AoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIEBjb21wb25lbnQoe1xuICAgICAgICAgICAgbW9kdWxlOiB0ZXN0ZXIubW9kdWxlLFxuICAgICAgICAgICAgZGlyZWN0aXZlOiAnZ2VuLXNoYXJlZC1zdGF0ZS1tdXRhYmxlLWInLFxuICAgICAgICAgICAgdGVtcGxhdGU6IGBgLFxuICAgICAgICB9KVxuICAgICAgICBjbGFzcyBTaGFyZWRTdGF0ZU11dGFibGVCQ29tcG9uZW50IGV4dGVuZHMgU3RhdGVmdWxDb21wb25lbnRCYXNlIHtcbiAgICAgICAgICAgIHB1YmxpYyB1cGRhdGVzOiBudW1iZXIgPSAwO1xuICAgICAgICAgICAgQHNoYXJlZFN0YXRlKCkgcHVibGljIGZvbzogU2ltcGxlU2hhcmVkU3RvcmU8c3RyaW5nW10+O1xuXG4gICAgICAgICAgICBwdWJsaWMgb25Db21wb25lbnRJbml0KCkge1xuICAgICAgICAgICAgICAgIHN1cGVyLm9uQ29tcG9uZW50SW5pdCgpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpYmVTaGFyZWRTdGF0ZSgnZm9vJywgKGZvbzogc3RyaW5nW10pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVzKys7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBAY29tcG9uZW50KHtcbiAgICAgICAgICAgIG1vZHVsZTogdGVzdGVyLm1vZHVsZSxcbiAgICAgICAgICAgIGRpcmVjdGl2ZTogJ2dlbi1zaGFyZWQtc3RhdGUtbXV0YWJsZS1jb250YWluZXInLFxuICAgICAgICAgICAgdGVtcGxhdGU6IGBcbiAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICA8Z2VuLXNoYXJlZC1zdGF0ZS1tdXRhYmxlLWEgc3RvcmUtZm9vPVwidGVzdC1zaGFyZWQtbXV0YWJsZVwiPjwvZ2VuLXNoYXJlZC1zdGF0ZS1tdXRhYmxlLWE+XG4gICAgICAgICAgICAgICAgICAgIDxnZW4tc2hhcmVkLXN0YXRlLW11dGFibGUtYiBzdG9yZS1mb289XCJ0ZXN0LXNoYXJlZC1tdXRhYmxlXCI+PC9nZW4tc2hhcmVkLXN0YXRlLW11dGFibGUtYj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIGAsXG4gICAgICAgIH0pXG4gICAgICAgIGNsYXNzIFNoYXJlZFN0YXRlTXV0YXRhYmxlQ29udGFpbmVyIGV4dGVuZHMgU3RhdGVmdWxDb21wb25lbnRCYXNlIHtcbiAgICAgICAgfVxuXG4gICAgICAgIGl0KCdoYW5kbGVzIHNoYXJlZCBzdGF0ZScsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IHRlc3Rlci5jcmVhdGVDb21wb25lbnQ8U2hhcmVkU3RhdGVNdXRhdGFibGVDb250YWluZXI+KFxuICAgICAgICAgICAgICAgIFNoYXJlZFN0YXRlTXV0YXRhYmxlQ29udGFpbmVyLmFzVmlldygpLnRlbXBsYXRlXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQxID0gPFNoYXJlZFN0YXRlTXV0YWJsZUFDb21wb25lbnQ+IGNvbXBvbmVudC5jdHJsLmNoaWxkQ29tcG9uZW50cygpWzBdO1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50MiA9IDxTaGFyZWRTdGF0ZU11dGFibGVBQ29tcG9uZW50PiBjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVsxXTtcblxuICAgICAgICAgICAgZXhwZWN0KGNvbXBvbmVudDEudXBkYXRlcykudG9CZSgxKTtcbiAgICAgICAgICAgIGV4cGVjdChjb21wb25lbnQyLnVwZGF0ZXMpLnRvQmUoMSk7XG5cbiAgICAgICAgICAgIGNvbXBvbmVudDEudGVzdFNldCgpO1xuICAgICAgICAgICAgdGVzdGVyLmRpZ2VzdCgpO1xuXG4gICAgICAgICAgICBleHBlY3QoY29tcG9uZW50MS51cGRhdGVzKS50b0JlKDIpO1xuICAgICAgICAgICAgZXhwZWN0KGNvbXBvbmVudDIudXBkYXRlcykudG9CZSgyKTtcblxuICAgICAgICAgICAgY29tcG9uZW50MS50ZXN0TXV0YXRlKCk7XG4gICAgICAgICAgICB0ZXN0ZXIuZGlnZXN0KCk7XG5cbiAgICAgICAgICAgIGV4cGVjdChjb21wb25lbnQxLnVwZGF0ZXMpLnRvQmUoMyk7XG4gICAgICAgICAgICBleHBlY3QoY29tcG9uZW50Mi51cGRhdGVzKS50b0JlKDMpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn0pO1xuIl19
