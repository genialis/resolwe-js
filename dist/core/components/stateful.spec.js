"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
    var DummyStatefulComponent = (function (_super) {
        __extends(DummyStatefulComponent, _super);
        function DummyStatefulComponent($scope, stateManager) {
            var _this = _super.call(this, $scope, stateManager) || this;
            // Set state properties.
            _this.foo = 'hello world';
            _this.bar = 42;
            return _this;
        }
        return DummyStatefulComponent;
    }(stateful_1.StatefulComponentBase));
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
    var ParentStatefulComponent = (function (_super) {
        __extends(ParentStatefulComponent, _super);
        function ParentStatefulComponent() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return ParentStatefulComponent;
    }(stateful_1.StatefulComponentBase));
    ParentStatefulComponent = __decorate([
        base_1.component({
            module: tester.module,
            directive: 'gen-parent-stateful-component',
            template: "\n            <div>\n                <gen-dummy-stateful-component state-id=\"dummy-1\"></gen-dummy-stateful-component>\n                <gen-dummy-stateful-component state-id=\"dummy-2\"></gen-dummy-stateful-component>\n                <gen-dummy-stateful-component state-id=\"dummy-3\"></gen-dummy-stateful-component>\n            </div>\n        ",
        })
    ], ParentStatefulComponent);
    var MultipleTopComponent = (function (_super) {
        __extends(MultipleTopComponent, _super);
        function MultipleTopComponent() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return MultipleTopComponent;
    }(base_1.ComponentBase));
    MultipleTopComponent = __decorate([
        base_1.component({
            module: tester.module,
            directive: 'gen-multiple-top-component',
            template: "\n            <div>\n                <gen-parent-stateful-component state-id=\"top-1\"></gen-parent-stateful-component>\n                <gen-parent-stateful-component state-id=\"top-2\"></gen-parent-stateful-component>\n            </div>\n        ",
        })
    ], MultipleTopComponent);
    var SharedStateAComponent = (function (_super) {
        __extends(SharedStateAComponent, _super);
        function SharedStateAComponent() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return SharedStateAComponent;
    }(stateful_1.StatefulComponentBase));
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
    var SharedStateBComponent = (function (_super) {
        __extends(SharedStateBComponent, _super);
        function SharedStateBComponent() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        SharedStateBComponent.prototype.testPublish = function () {
            this.bar.dispatch({ type: index_1.Actions.SET, value: 'shared store value' });
        };
        return SharedStateBComponent;
    }(stateful_1.StatefulComponentBase));
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
    var SharedStateContainer = (function (_super) {
        __extends(SharedStateContainer, _super);
        function SharedStateContainer() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return SharedStateContainer;
    }(stateful_1.StatefulComponentBase));
    SharedStateContainer = __decorate([
        base_1.component({
            module: tester.module,
            directive: 'gen-shared-state-container',
            template: "\n            <div>\n                <gen-shared-state-a store-foo=\"test-shared\"></gen-shared-state-a>\n                <gen-shared-state-b store-bar=\"test-shared\"></gen-shared-state-b>\n            </div>\n        ",
        })
    ], SharedStateContainer);
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
        var SharedStateMutableAComponent = (function (_super) {
            __extends(SharedStateMutableAComponent, _super);
            // @ngInject
            SharedStateMutableAComponent.$inject = ["$scope", "stateManager"];
            function SharedStateMutableAComponent($scope, stateManager) {
                var _this = _super.call(this, $scope, stateManager) || this;
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
            return SharedStateMutableAComponent;
        }(stateful_1.StatefulComponentBase));
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
        var SharedStateMutableBComponent = (function (_super) {
            __extends(SharedStateMutableBComponent, _super);
            // @ngInject
            SharedStateMutableBComponent.$inject = ["$scope", "stateManager"];
            function SharedStateMutableBComponent($scope, stateManager) {
                var _this = _super.call(this, $scope, stateManager) || this;
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
            return SharedStateMutableBComponent;
        }(stateful_1.StatefulComponentBase));
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
        var SharedStateMutatableContainer = (function (_super) {
            __extends(SharedStateMutatableContainer, _super);
            function SharedStateMutatableContainer() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return SharedStateMutatableContainer;
        }(stateful_1.StatefulComponentBase));
        SharedStateMutatableContainer = __decorate([
            base_1.component({
                module: tester.module,
                directive: 'gen-shared-state-mutable-container',
                template: "\n                <div>\n                    <gen-shared-state-mutable-a store-foo=\"test-shared-mutable\"></gen-shared-state-mutable-a>\n                    <gen-shared-state-mutable-b store-foo=\"test-shared-mutable\"></gen-shared-state-mutable-b>\n                </div>\n            ",
            })
        ], SharedStateMutatableContainer);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2NvbXBvbmVudHMvc3RhdGVmdWwuc3BlYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFDQSx5QkFBdUI7QUFFdkIsK0JBQWdEO0FBQ2hELHVDQUFxRTtBQUVyRSwrQ0FBaUU7QUFDakUsbURBQTJFO0FBRTNFLDZCQUFpQixDQUFDLG9CQUFvQixFQUFFO0lBQ3BDLHNDQUFzQztJQUN0Qyw2QkFBaUIsQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDO0lBQ3pDLDZCQUFpQixDQUFDLGNBQWMsRUFBRSxVQUFVLENBQUM7SUFDN0MsNkJBQWlCLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0NBQzVELEVBQUUsVUFBQyxNQUFNO0lBVU4sSUFBTSxzQkFBc0I7UUFBUywwQ0FBcUI7UUFJdEQsZ0NBQVksTUFBc0IsRUFBRSxZQUEwQjtZQUE5RCxZQUNJLGtCQUFNLE1BQU0sRUFBRSxZQUFZLENBQUMsU0FLOUI7WUFIRyx3QkFBd0I7WUFDeEIsS0FBSSxDQUFDLEdBQUcsR0FBRyxhQUFhLENBQUM7WUFDekIsS0FBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7O1FBQ2xCLENBQUM7UUFDTCw2QkFBQztJQUFELENBWEEsQUFXQyxDQVhvQyxnQ0FBcUIsR0FXekQ7SUFWWTtRQUFSLGdCQUFLLEVBQUU7dURBQW9CO0lBQ25CO1FBQVIsZ0JBQUssRUFBRTt1REFBb0I7SUFGMUIsc0JBQXNCO1FBVDNCLGdCQUFTLENBQUM7WUFDUCxNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU07WUFDckIsU0FBUyxFQUFFLDhCQUE4QjtZQUN6QyxRQUFRLEVBQUUsOEZBSVQ7U0FDSixDQUFDO09BQ0ksc0JBQXNCLENBVzNCO0lBYUQsSUFBTSx1QkFBdUI7UUFBUywyQ0FBcUI7UUFBM0Q7O1FBQ0EsQ0FBQztRQUFELDhCQUFDO0lBQUQsQ0FEQSxBQUNDLENBRHFDLGdDQUFxQixHQUMxRDtJ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UUFBUSxDQUNsRCxDQUFDO1lBRUYsSUFBTSxVQUFVLEdBQWtDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEYsSUFBTSxVQUFVLEdBQWtDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFdEYsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFbkMsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3JCLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUVoQixNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuQyxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVuQyxVQUFVLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDeEIsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBRWhCLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUMsQ0FBQyIsImZpbGUiOiJjb3JlL2NvbXBvbmVudHMvc3RhdGVmdWwuc3BlYy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFuZ3VsYXIgZnJvbSAnYW5ndWxhcic7XG5pbXBvcnQgJ2FuZ3VsYXItbW9ja3MnO1xuXG5pbXBvcnQge0NvbXBvbmVudEJhc2UsIGNvbXBvbmVudH0gZnJvbSAnLi9iYXNlJztcbmltcG9ydCB7U3RhdGVmdWxDb21wb25lbnRCYXNlLCBzdGF0ZSwgc2hhcmVkU3RhdGV9IGZyb20gJy4vc3RhdGVmdWwnO1xuaW1wb3J0IHtTdGF0ZU1hbmFnZXJ9IGZyb20gJy4vbWFuYWdlcic7XG5pbXBvcnQge0FjdGlvbnMsIFNpbXBsZVNoYXJlZFN0b3JlfSBmcm9tICcuLi9zaGFyZWRfc3RvcmUvaW5kZXgnO1xuaW1wb3J0IHtkZXNjcmliZUNvbXBvbmVudCwgY3JlYXRlU2hhcmVkU3RvcmV9IGZyb20gJy4uLy4uL3Rlc3RzL2NvbXBvbmVudCc7XG5cbmRlc2NyaWJlQ29tcG9uZW50KCdzdGF0ZWZ1bCBjb21wb25lbnQnLCBbXG4gICAgLy8gU2ltcGxlIHNoYXJlZCBzdG9yZXMgdXNlZCBpbiB0ZXN0cy5cbiAgICBjcmVhdGVTaGFyZWRTdG9yZSgndGVzdC1zaGFyZWQnLCAnd29ybGQnKSxcbiAgICBjcmVhdGVTaGFyZWRTdG9yZSgndGVzdC1hbm90aGVyJywgJ3VuaXZlcnNlJyksXG4gICAgY3JlYXRlU2hhcmVkU3RvcmUoJ3Rlc3Qtc2hhcmVkLW11dGFibGUnLCBbJ2EnLCAnYicsICdjJ10pLFxuXSwgKHRlc3RlcikgPT4ge1xuICAgIEBjb21wb25lbnQoe1xuICAgICAgICBtb2R1bGU6IHRlc3Rlci5tb2R1bGUsXG4gICAgICAgIGRpcmVjdGl2ZTogJ2dlbi1kdW1teS1zdGF0ZWZ1bC1jb21wb25lbnQnLFxuICAgICAgICB0ZW1wbGF0ZTogYFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICB7e2N0cmwuZm9vfX0ge3tjdHJsLmJhcn19XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgYCxcbiAgICB9KVxuICAgIGNsYXNzIER1bW15U3RhdGVmdWxDb21wb25lbnQgZXh0ZW5kcyBTdGF0ZWZ1bENvbXBvbmVudEJhc2Uge1xuICAgICAgICBAc3RhdGUoKSBwdWJsaWMgZm9vOiBzdHJpbmc7XG4gICAgICAgIEBzdGF0ZSgpIHB1YmxpYyBiYXI6IG51bWJlcjtcblxuICAgICAgICBjb25zdHJ1Y3Rvcigkc2NvcGU6IGFuZ3VsYXIuSVNjb3BlLCBzdGF0ZU1hbmFnZXI6IFN0YXRlTWFuYWdlcikge1xuICAgICAgICAgICAgc3VwZXIoJHNjb3BlLCBzdGF0ZU1hbmFnZXIpO1xuXG4gICAgICAgICAgICAvLyBTZXQgc3RhdGUgcHJvcGVydGllcy5cbiAgICAgICAgICAgIHRoaXMuZm9vID0gJ2hlbGxvIHdvcmxkJztcbiAgICAgICAgICAgIHRoaXMuYmFyID0gNDI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBAY29tcG9uZW50KHtcbiAgICAgICAgbW9kdWxlOiB0ZXN0ZXIubW9kdWxlLFxuICAgICAgICBkaXJlY3RpdmU6ICdnZW4tcGFyZW50LXN0YXRlZnVsLWNvbXBvbmVudCcsXG4gICAgICAgIHRlbXBsYXRlOiBgXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxnZW4tZHVtbXktc3RhdGVmdWwtY29tcG9uZW50IHN0YXRlLWlkPVwiZHVtbXktMVwiPjwvZ2VuLWR1bW15LXN0YXRlZnVsLWNvbXBvbmVudD5cbiAgICAgICAgICAgICAgICA8Z2VuLWR1bW15LXN0YXRlZnVsLWNvbXBvbmVudCBzdGF0ZS1pZD1cImR1bW15LTJcIj48L2dlbi1kdW1teS1zdGF0ZWZ1bC1jb21wb25lbnQ+XG4gICAgICAgICAgICAgICAgPGdlbi1kdW1teS1zdGF0ZWZ1bC1jb21wb25lbnQgc3RhdGUtaWQ9XCJkdW1teS0zXCI+PC9nZW4tZHVtbXktc3RhdGVmdWwtY29tcG9uZW50PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGAsXG4gICAgfSlcbiAgICBjbGFzcyBQYXJlbnRTdGF0ZWZ1bENvbXBvbmVudCBleHRlbmRzIFN0YXRlZnVsQ29tcG9uZW50QmFzZSB7XG4gICAgfVxuXG4gICAgQGNvbXBvbmVudCh7XG4gICAgICAgIG1vZHVsZTogdGVzdGVyLm1vZHVsZSxcbiAgICAgICAgZGlyZWN0aXZlOiAnZ2VuLW11bHRpcGxlLXRvcC1jb21wb25lbnQnLFxuICAgICAgICB0ZW1wbGF0ZTogYFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8Z2VuLXBhcmVudC1zdGF0ZWZ1bC1jb21wb25lbnQgc3RhdGUtaWQ9XCJ0b3AtMVwiPjwvZ2VuLXBhcmVudC1zdGF0ZWZ1bC1jb21wb25lbnQ+XG4gICAgICAgICAgICAgICAgPGdlbi1wYXJlbnQtc3RhdGVmdWwtY29tcG9uZW50IHN0YXRlLWlkPVwidG9wLTJcIj48L2dlbi1wYXJlbnQtc3RhdGVmdWwtY29tcG9uZW50PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGAsXG4gICAgfSlcbiAgICBjbGFzcyBNdWx0aXBsZVRvcENvbXBvbmVudCBleHRlbmRzIENvbXBvbmVudEJhc2Uge1xuICAgICAgICAvLyBUaGlzIGlzIG5vdCBhIHN0YXRlZnVsIGNvbXBvbmVudCBvbiBwdXJwb3NlLlxuICAgIH1cblxuICAgIEBjb21wb25lbnQoe1xuICAgICAgICBtb2R1bGU6IHRlc3Rlci5tb2R1bGUsXG4gICAgICAgIGRpcmVjdGl2ZTogJ2dlbi1zaGFyZWQtc3RhdGUtYScsXG4gICAgICAgIHRlbXBsYXRlOiBgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwidGV4dC1hXCI+SGVsbG8ge3tjdHJsLmZvby52YWx1ZSgpfX08L2Rpdj5cbiAgICAgICAgYCxcbiAgICB9KVxuICAgIGNsYXNzIFNoYXJlZFN0YXRlQUNvbXBvbmVudCBleHRlbmRzIFN0YXRlZnVsQ29tcG9uZW50QmFzZSB7XG4gICAgICAgIEBzaGFyZWRTdGF0ZSgpIHB1YmxpYyBmb286IFNpbXBsZVNoYXJlZFN0b3JlPHN0cmluZz47XG4gICAgfVxuXG4gICAgQGNvbXBvbmVudCh7XG4gICAgICAgIG1vZHVsZTogdGVzdGVyLm1vZHVsZSxcbiAgICAgICAgZGlyZWN0aXZlOiAnZ2VuLXNoYXJlZC1zdGF0ZS1iJyxcbiAgICAgICAgdGVtcGxhdGU6IGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0ZXh0LWJcIj5IZWxsbyB7e2N0cmwuYmFyLnZhbHVlKCl9fTwvZGl2PlxuICAgICAgICBgLFxuICAgIH0pXG4gICAgY2xhc3MgU2hhcmVkU3RhdGVCQ29tcG9uZW50IGV4dGVuZHMgU3RhdGVmdWxDb21wb25lbnRCYXNlIHtcbiAgICAgICAgQHNoYXJlZFN0YXRlKCkgcHVibGljIGJhcjogU2ltcGxlU2hhcmVkU3RvcmU8c3RyaW5nPjtcblxuICAgICAgICBwdWJsaWMgdGVzdFB1Ymxpc2goKTogdm9pZCB7XG4gICAgICAgICAgICB0aGlzLmJhci5kaXNwYXRjaCh7dHlwZTogQWN0aW9ucy5TRVQsIHZhbHVlOiAnc2hhcmVkIHN0b3JlIHZhbHVlJ30pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgQGNvbXBvbmVudCh7XG4gICAgICAgIG1vZHVsZTogdGVzdGVyLm1vZHVsZSxcbiAgICAgICAgZGlyZWN0aXZlOiAnZ2VuLXNoYXJlZC1zdGF0ZS1jb250YWluZXInLFxuICAgICAgICB0ZW1wbGF0ZTogYFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8Z2VuLXNoYXJlZC1zdGF0ZS1hIHN0b3JlLWZvbz1cInRlc3Qtc2hhcmVkXCI+PC9nZW4tc2hhcmVkLXN0YXRlLWE+XG4gICAgICAgICAgICAgICAgPGdlbi1zaGFyZWQtc3RhdGUtYiBzdG9yZS1iYXI9XCJ0ZXN0LXNoYXJlZFwiPjwvZ2VuLXNoYXJlZC1zdGF0ZS1iPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGAsXG4gICAgfSlcbiAgICBjbGFzcyBTaGFyZWRTdGF0ZUNvbnRhaW5lciBleHRlbmRzIFN0YXRlZnVsQ29tcG9uZW50QmFzZSB7XG4gICAgfVxuXG4gICAgLy8gRW5zdXJlIHdlIGhhdmUgYSBzdGF0ZSBtYW5hZ2VyIGZvciBlYWNoIHRlc3QuXG4gICAgbGV0IHN0YXRlTWFuYWdlcjogU3RhdGVNYW5hZ2VyO1xuICAgIGJlZm9yZUVhY2goaW5qZWN0KChfc3RhdGVNYW5hZ2VyXykgPT4ge1xuICAgICAgICBzdGF0ZU1hbmFnZXIgPSBfc3RhdGVNYW5hZ2VyXztcbiAgICB9KSk7XG5cbiAgICBpdCgnc2V0cyBjb3JyZWN0IHN0YXRlIGlkIGFuZCBwYXJlbnQnLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IHRlc3Rlci5jcmVhdGVDb21wb25lbnQ8RHVtbXlTdGF0ZWZ1bENvbXBvbmVudD4oXG4gICAgICAgICAgICBEdW1teVN0YXRlZnVsQ29tcG9uZW50LmFzVmlldygpLnRlbXBsYXRlXG4gICAgICAgICk7XG5cbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5jdHJsLnN0YXRlSWQpLnRvQmUoJ2dlbi1kdW1teS1zdGF0ZWZ1bC1jb21wb25lbnQnKTtcbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5jdHJsLmdsb2JhbFN0YXRlSWQpLnRvQmUoJ2dlbi1kdW1teS1zdGF0ZWZ1bC1jb21wb25lbnQnKTtcbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5jdHJsLmZvbykudG9CZSgnaGVsbG8gd29ybGQnKTtcbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5jdHJsLmJhcikudG9CZSg0Mik7XG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuY3RybC5wYXJlbnRDb21wb25lbnQoKSkudG9CZU51bGwoKTtcblxuICAgICAgICBjb25zdCBzdGF0ZSA9IGNvbXBvbmVudC5jdHJsLnNhdmVTdGF0ZSgpO1xuICAgICAgICBleHBlY3Qoc3RhdGVbJ2dlbi1kdW1teS1zdGF0ZWZ1bC1jb21wb25lbnQnXSkudG9FcXVhbCh7Zm9vOiAnaGVsbG8gd29ybGQnLCBiYXI6IDQyfSk7XG5cbiAgICAgICAgLy8gVGVzdCB0aGF0IGNyZWF0aW5nIGEgc2Vjb25kIGNvbXBvbmVudCB3aXRoIGEgZGlmZmVyZW50IHN0YXRlSWQgd29ya3MuXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudDIgPSB0ZXN0ZXIuY3JlYXRlQ29tcG9uZW50PER1bW15U3RhdGVmdWxDb21wb25lbnQ+KFxuICAgICAgICAgICAgRHVtbXlTdGF0ZWZ1bENvbXBvbmVudC5hc1ZpZXcoe2lucHV0czoge3N0YXRlSWQ6ICdjb21wb25lbnQtMid9fSkudGVtcGxhdGVcbiAgICAgICAgKTtcblxuICAgICAgICBleHBlY3QoY29tcG9uZW50Mi5jdHJsLnN0YXRlSWQpLnRvQmUoJ2NvbXBvbmVudC0yJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2V0cyB1cCBjb3JyZWN0IGhpZXJhcmNoeScsICgpID0+IHtcbiAgICAgICAgY29uc3QgY29tcG9uZW50ID0gdGVzdGVyLmNyZWF0ZUNvbXBvbmVudDxQYXJlbnRTdGF0ZWZ1bENvbXBvbmVudD4oXG4gICAgICAgICAgICBQYXJlbnRTdGF0ZWZ1bENvbXBvbmVudC5hc1ZpZXcoKS50ZW1wbGF0ZVxuICAgICAgICApO1xuXG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuY3RybC5zdGF0ZUlkKS50b0JlKCdnZW4tcGFyZW50LXN0YXRlZnVsLWNvbXBvbmVudCcpO1xuICAgICAgICBleHBlY3QoY29tcG9uZW50LmN0cmwuY2hpbGRDb21wb25lbnRzKCkubGVuZ3RoKS50b0JlKDMpO1xuICAgICAgICBleHBlY3QoY29tcG9uZW50LmN0cmwuY2hpbGRDb21wb25lbnRzKClbMF0uc3RhdGVJZCkudG9CZSgnZHVtbXktMScpO1xuICAgICAgICBleHBlY3QoY29tcG9uZW50LmN0cmwuY2hpbGRDb21wb25lbnRzKClbMV0uc3RhdGVJZCkudG9CZSgnZHVtbXktMicpO1xuICAgICAgICBleHBlY3QoY29tcG9uZW50LmN0cmwuY2hpbGRDb21wb25lbnRzKClbMl0uc3RhdGVJZCkudG9CZSgnZHVtbXktMycpO1xuICAgICAgICBleHBlY3QoY29tcG9uZW50LmN0cmwuY2hpbGRDb21wb25lbnRzKClbMF0uZ2xvYmFsU3RhdGVJZCkudG9CZSgnZ2VuLXBhcmVudC1zdGF0ZWZ1bC1jb21wb25lbnQtZHVtbXktMScpO1xuICAgICAgICBleHBlY3QoY29tcG9uZW50LmN0cmwuY2hpbGRDb21wb25lbnRzKClbMV0uZ2xvYmFsU3RhdGVJZCkudG9CZSgnZ2VuLXBhcmVudC1zdGF0ZWZ1bC1jb21wb25lbnQtZHVtbXktMicpO1xuICAgICAgICBleHBlY3QoY29tcG9uZW50LmN0cmwuY2hpbGRDb21wb25lbnRzKClbMl0uZ2xvYmFsU3RhdGVJZCkudG9CZSgnZ2VuLXBhcmVudC1zdGF0ZWZ1bC1jb21wb25lbnQtZHVtbXktMycpO1xuXG4gICAgICAgIGNvbnN0IHN0YXRlID0gY29tcG9uZW50LmN0cmwuc2F2ZVN0YXRlKCk7XG4gICAgICAgIGV4cGVjdChzdGF0ZVsnZ2VuLXBhcmVudC1zdGF0ZWZ1bC1jb21wb25lbnQnXSkudG9FcXVhbCh7fSk7XG4gICAgICAgIGV4cGVjdChzdGF0ZVsnZ2VuLXBhcmVudC1zdGF0ZWZ1bC1jb21wb25lbnQtZHVtbXktMSddKS50b0VxdWFsKHtmb286ICdoZWxsbyB3b3JsZCcsIGJhcjogNDJ9KTtcbiAgICAgICAgZXhwZWN0KHN0YXRlWydnZW4tcGFyZW50LXN0YXRlZnVsLWNvbXBvbmVudC1kdW1teS0yJ10pLnRvRXF1YWwoe2ZvbzogJ2hlbGxvIHdvcmxkJywgYmFyOiA0Mn0pO1xuICAgICAgICBleHBlY3Qoc3RhdGVbJ2dlbi1wYXJlbnQtc3RhdGVmdWwtY29tcG9uZW50LWR1bW15LTMnXSkudG9FcXVhbCh7Zm9vOiAnaGVsbG8gd29ybGQnLCBiYXI6IDQyfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnaGFuZGxlcyBtdWx0aXBsZSB0b3AtbGV2ZWwgY29tcG9uZW50cycsICgpID0+IHtcbiAgICAgICAgdGVzdGVyLmNyZWF0ZUNvbXBvbmVudDxNdWx0aXBsZVRvcENvbXBvbmVudD4oXG4gICAgICAgICAgICBNdWx0aXBsZVRvcENvbXBvbmVudC5hc1ZpZXcoKS50ZW1wbGF0ZVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IHRvcExldmVsID0gc3RhdGVNYW5hZ2VyLnRvcExldmVsQ29tcG9uZW50cygpO1xuICAgICAgICBleHBlY3QodG9wTGV2ZWwubGVuZ3RoKS50b0JlKDIpO1xuICAgICAgICBleHBlY3QodG9wTGV2ZWxbMF0uc3RhdGVJZCkudG9CZSgndG9wLTEnKTtcbiAgICAgICAgZXhwZWN0KHRvcExldmVsWzFdLnN0YXRlSWQpLnRvQmUoJ3RvcC0yJyk7XG5cbiAgICAgICAgY29uc3Qgc3RhdGUgPSBzdGF0ZU1hbmFnZXIuc2F2ZSgpO1xuICAgICAgICBleHBlY3Qoc3RhdGVbJ3RvcC0xJ10pLnRvRXF1YWwoe30pO1xuICAgICAgICBleHBlY3Qoc3RhdGVbJ3RvcC0xLWR1bW15LTEnXSkudG9FcXVhbCh7Zm9vOiAnaGVsbG8gd29ybGQnLCBiYXI6IDQyfSk7XG4gICAgICAgIGV4cGVjdChzdGF0ZVsndG9wLTEtZHVtbXktMiddKS50b0VxdWFsKHtmb286ICdoZWxsbyB3b3JsZCcsIGJhcjogNDJ9KTtcbiAgICAgICAgZXhwZWN0KHN0YXRlWyd0b3AtMS1kdW1teS0zJ10pLnRvRXF1YWwoe2ZvbzogJ2hlbGxvIHdvcmxkJywgYmFyOiA0Mn0pO1xuICAgICAgICBleHBlY3Qoc3RhdGVbJ3RvcC0yJ10pLnRvRXF1YWwoe30pO1xuICAgICAgICBleHBlY3Qoc3RhdGVbJ3RvcC0yLWR1bW15LTEnXSkudG9FcXVhbCh7Zm9vOiAnaGVsbG8gd29ybGQnLCBiYXI6IDQyfSk7XG4gICAgICAgIGV4cGVjdChzdGF0ZVsndG9wLTItZHVtbXktMiddKS50b0VxdWFsKHtmb286ICdoZWxsbyB3b3JsZCcsIGJhcjogNDJ9KTtcbiAgICAgICAgZXhwZWN0KHN0YXRlWyd0b3AtMi1kdW1teS0zJ10pLnRvRXF1YWwoe2ZvbzogJ2hlbGxvIHdvcmxkJywgYmFyOiA0Mn0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2xvYWRzIHN0YXRlJywgKCkgPT4ge1xuICAgICAgICBjb25zdCBjb21wb25lbnQgPSB0ZXN0ZXIuY3JlYXRlQ29tcG9uZW50PFBhcmVudFN0YXRlZnVsQ29tcG9uZW50PihcbiAgICAgICAgICAgIFBhcmVudFN0YXRlZnVsQ29tcG9uZW50LmFzVmlldygpLnRlbXBsYXRlXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gVXBkYXRlIHRoZSBzdGF0ZSBmb3Igc2Vjb25kIGR1bW15IGNvbXBvbmVudC5cbiAgICAgICAgY29uc3Qgc3RhdGUgPSBjb21wb25lbnQuY3RybC5zYXZlU3RhdGUoKTtcbiAgICAgICAgc3RhdGVbJ2dlbi1wYXJlbnQtc3RhdGVmdWwtY29tcG9uZW50LWR1bW15LTInXSA9IHtmb286ICdoZXkgd29ybGQnLCBiYXI6IDIxfTtcbiAgICAgICAgY29tcG9uZW50LmN0cmwubG9hZFN0YXRlKHN0YXRlKTtcblxuICAgICAgICBleHBlY3QoKDxEdW1teVN0YXRlZnVsQ29tcG9uZW50PiBjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVswXSkuZm9vKS50b0JlKCdoZWxsbyB3b3JsZCcpO1xuICAgICAgICBleHBlY3QoKDxEdW1teVN0YXRlZnVsQ29tcG9uZW50PiBjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVswXSkuYmFyKS50b0JlKDQyKTtcbiAgICAgICAgZXhwZWN0KCg8RHVtbXlTdGF0ZWZ1bENvbXBvbmVudD4gY29tcG9uZW50LmN0cmwuY2hpbGRDb21wb25lbnRzKClbMV0pLmZvbykudG9CZSgnaGV5IHdvcmxkJyk7XG4gICAgICAgIGV4cGVjdCgoPER1bW15U3RhdGVmdWxDb21wb25lbnQ+IGNvbXBvbmVudC5jdHJsLmNoaWxkQ29tcG9uZW50cygpWzFdKS5iYXIpLnRvQmUoMjEpO1xuICAgICAgICBleHBlY3QoKDxEdW1teVN0YXRlZnVsQ29tcG9uZW50PiBjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVsyXSkuZm9vKS50b0JlKCdoZWxsbyB3b3JsZCcpO1xuICAgICAgICBleHBlY3QoKDxEdW1teVN0YXRlZnVsQ29tcG9uZW50PiBjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVsyXSkuYmFyKS50b0JlKDQyKTtcbiAgICB9KTtcblxuICAgIGl0KCdoYW5kbGVzIHNoYXJlZCBzdGF0ZScsICgpID0+IHtcbiAgICAgICAgY29uc3QgY29tcG9uZW50ID0gdGVzdGVyLmNyZWF0ZUNvbXBvbmVudDxTaGFyZWRTdGF0ZUNvbnRhaW5lcj4oXG4gICAgICAgICAgICBTaGFyZWRTdGF0ZUNvbnRhaW5lci5hc1ZpZXcoKS50ZW1wbGF0ZVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIENvbXBvbmVudHMgc2hvdWxkIGRpc3BsYXkgJ0hlbGxvIHdvcmxkJy5cbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5lbGVtZW50LmZpbmQoJy50ZXh0LWEnKS50ZXh0KCkpLnRvQmUoJ0hlbGxvIHdvcmxkJyk7XG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuZWxlbWVudC5maW5kKCcudGV4dC1iJykudGV4dCgpKS50b0JlKCdIZWxsbyB3b3JsZCcpO1xuXG4gICAgICAgICg8U2hhcmVkU3RhdGVCQ29tcG9uZW50PiBjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVsxXSkudGVzdFB1Ymxpc2goKTtcbiAgICAgICAgdGVzdGVyLmRpZ2VzdCgpO1xuXG4gICAgICAgIC8vIENvbXBvbmVudHMgc2hvdWxkIG5vdyBkaXNwbGF5ICdIZWxsbyBzaGFyZWQgc3RvcmUgdmFsdWUnLlxuICAgICAgICBleHBlY3QoY29tcG9uZW50LmVsZW1lbnQuZmluZCgnLnRleHQtYScpLnRleHQoKSkudG9CZSgnSGVsbG8gc2hhcmVkIHN0b3JlIHZhbHVlJyk7XG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuZWxlbWVudC5maW5kKCcudGV4dC1iJykudGV4dCgpKS50b0JlKCdIZWxsbyBzaGFyZWQgc3RvcmUgdmFsdWUnKTtcblxuICAgICAgICAvLyBTYXZlIGNvbXBvbmVudCBzdGF0ZSwgY2hhbmdlIHRoZSB1c2VkIHN0b3JlIGFuZCBsb2FkIGl0IGJhY2suXG4gICAgICAgIGNvbnN0IHN0YXRlID0gY29tcG9uZW50LmN0cmwuc2F2ZVN0YXRlKCk7XG4gICAgICAgIGV4cGVjdChzdGF0ZVsnZ2VuLXNoYXJlZC1zdGF0ZS1jb250YWluZXItZ2VuLXNoYXJlZC1zdGF0ZS1hJ10uZm9vKS50b0JlKCd0ZXN0LXNoYXJlZCcpO1xuICAgICAgICBleHBlY3Qoc3RhdGVbJ2dlbi1zaGFyZWQtc3RhdGUtY29udGFpbmVyLWdlbi1zaGFyZWQtc3RhdGUtYiddLmJhcikudG9CZSgndGVzdC1zaGFyZWQnKTtcbiAgICAgICAgc3RhdGVbJ2dlbi1zaGFyZWQtc3RhdGUtY29udGFpbmVyLWdlbi1zaGFyZWQtc3RhdGUtYSddLmZvbyA9ICd0ZXN0LWFub3RoZXInO1xuICAgICAgICBjb21wb25lbnQuY3RybC5sb2FkU3RhdGUoc3RhdGUpO1xuICAgICAgICB0ZXN0ZXIuZGlnZXN0KCk7XG5cbiAgICAgICAgLy8gU2VlIGlmIGNvbXBvbmVudHMgaGF2ZSBsb2FkZWQgY29ycmVjdCBzdGF0ZS5cbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5lbGVtZW50LmZpbmQoJy50ZXh0LWEnKS50ZXh0KCkpLnRvQmUoJ0hlbGxvIHVuaXZlcnNlJyk7XG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuZWxlbWVudC5maW5kKCcudGV4dC1iJykudGV4dCgpKS50b0JlKCdIZWxsbyBzaGFyZWQgc3RvcmUgdmFsdWUnKTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCd3aXRoIG11dGFibGUgZGF0YScsICgpID0+IHtcbiAgICAgICAgQGNvbXBvbmVudCh7XG4gICAgICAgICAgICBtb2R1bGU6IHRlc3Rlci5tb2R1bGUsXG4gICAgICAgICAgICBkaXJlY3RpdmU6ICdnZW4tc2hhcmVkLXN0YXRlLW11dGFibGUtYScsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogYGAsXG4gICAgICAgIH0pXG4gICAgICAgIGNsYXNzIFNoYXJlZFN0YXRlTXV0YWJsZUFDb21wb25lbnQgZXh0ZW5kcyBTdGF0ZWZ1bENvbXBvbmVudEJhc2Uge1xuICAgICAgICAgICAgcHVibGljIHVwZGF0ZXM6IG51bWJlciA9IDA7XG4gICAgICAgICAgICBwdWJsaWMgdmFsdWU6IHN0cmluZ1tdID0gW107XG4gICAgICAgICAgICBAc2hhcmVkU3RhdGUoKSBwdWJsaWMgZm9vOiBTaW1wbGVTaGFyZWRTdG9yZTxzdHJpbmdbXT47XG5cbiAgICAgICAgICAgIC8vIEBuZ0luamVjdFxuICAgICAgICAgICAgY29uc3RydWN0b3IoJHNjb3BlOiBhbmd1bGFyLklTY29wZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlTWFuYWdlcjogU3RhdGVNYW5hZ2VyKSB7IC8vIHRzbGludDpkaXNhYmxlLWxpbmU6bm8tc2hhZG93ZWQtdmFyaWFibGVcbiAgICAgICAgICAgICAgICBzdXBlcigkc2NvcGUsIHN0YXRlTWFuYWdlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyBvbkNvbXBvbmVudEluaXQoKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIub25Db21wb25lbnRJbml0KCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLndhdGNoQ29sbGVjdGlvbigoKSA9PiB0aGlzLnZhbHVlLCAoY29tcHV0YXRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mb28uZGlzcGF0Y2goe3R5cGU6IEFjdGlvbnMuU0VULCB2YWx1ZTogdGhpcy52YWx1ZX0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpYmVTaGFyZWRTdGF0ZU11dGFibGUoJ2ZvbycsIChmb286IHN0cmluZ1tdKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSBmb287XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlcysrO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgdGVzdFNldCgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gWydhJywgJ2InXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIHRlc3RNdXRhdGUoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZS5wb3AoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIEBjb21wb25lbnQoe1xuICAgICAgICAgICAgbW9kdWxlOiB0ZXN0ZXIubW9kdWxlLFxuICAgICAgICAgICAgZGlyZWN0aXZlOiAnZ2VuLXNoYXJlZC1zdGF0ZS1tdXRhYmxlLWInLFxuICAgICAgICAgICAgdGVtcGxhdGU6IGBgLFxuICAgICAgICB9KVxuICAgICAgICBjbGFzcyBTaGFyZWRTdGF0ZU11dGFibGVCQ29tcG9uZW50IGV4dGVuZHMgU3RhdGVmdWxDb21wb25lbnRCYXNlIHtcbiAgICAgICAgICAgIHB1YmxpYyB1cGRhdGVzOiBudW1iZXIgPSAwO1xuICAgICAgICAgICAgQHNoYXJlZFN0YXRlKCkgcHVibGljIGZvbzogU2ltcGxlU2hhcmVkU3RvcmU8c3RyaW5nW10+O1xuXG4gICAgICAgICAgICAvLyBAbmdJbmplY3RcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKCRzY29wZTogYW5ndWxhci5JU2NvcGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZU1hbmFnZXI6IFN0YXRlTWFuYWdlcikgeyAvLyB0c2xpbnQ6ZGlzYWJsZS1saW5lOm5vLXNoYWRvd2VkLXZhcmlhYmxlXG4gICAgICAgICAgICAgICAgc3VwZXIoJHNjb3BlLCBzdGF0ZU1hbmFnZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgb25Db21wb25lbnRJbml0KCkge1xuICAgICAgICAgICAgICAgIHN1cGVyLm9uQ29tcG9uZW50SW5pdCgpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpYmVTaGFyZWRTdGF0ZSgnZm9vJywgKGZvbzogc3RyaW5nW10pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVzKys7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBAY29tcG9uZW50KHtcbiAgICAgICAgICAgIG1vZHVsZTogdGVzdGVyLm1vZHVsZSxcbiAgICAgICAgICAgIGRpcmVjdGl2ZTogJ2dlbi1zaGFyZWQtc3RhdGUtbXV0YWJsZS1jb250YWluZXInLFxuICAgICAgICAgICAgdGVtcGxhdGU6IGBcbiAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICA8Z2VuLXNoYXJlZC1zdGF0ZS1tdXRhYmxlLWEgc3RvcmUtZm9vPVwidGVzdC1zaGFyZWQtbXV0YWJsZVwiPjwvZ2VuLXNoYXJlZC1zdGF0ZS1tdXRhYmxlLWE+XG4gICAgICAgICAgICAgICAgICAgIDxnZW4tc2hhcmVkLXN0YXRlLW11dGFibGUtYiBzdG9yZS1mb289XCJ0ZXN0LXNoYXJlZC1tdXRhYmxlXCI+PC9nZW4tc2hhcmVkLXN0YXRlLW11dGFibGUtYj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIGAsXG4gICAgICAgIH0pXG4gICAgICAgIGNsYXNzIFNoYXJlZFN0YXRlTXV0YXRhYmxlQ29udGFpbmVyIGV4dGVuZHMgU3RhdGVmdWxDb21wb25lbnRCYXNlIHtcbiAgICAgICAgfVxuXG4gICAgICAgIGl0KCdoYW5kbGVzIHNoYXJlZCBzdGF0ZScsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IHRlc3Rlci5jcmVhdGVDb21wb25lbnQ8U2hhcmVkU3RhdGVNdXRhdGFibGVDb250YWluZXI+KFxuICAgICAgICAgICAgICAgIFNoYXJlZFN0YXRlTXV0YXRhYmxlQ29udGFpbmVyLmFzVmlldygpLnRlbXBsYXRlXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQxID0gPFNoYXJlZFN0YXRlTXV0YWJsZUFDb21wb25lbnQ+IGNvbXBvbmVudC5jdHJsLmNoaWxkQ29tcG9uZW50cygpWzBdO1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50MiA9IDxTaGFyZWRTdGF0ZU11dGFibGVBQ29tcG9uZW50PiBjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVsxXTtcblxuICAgICAgICAgICAgZXhwZWN0KGNvbXBvbmVudDEudXBkYXRlcykudG9CZSgxKTtcbiAgICAgICAgICAgIGV4cGVjdChjb21wb25lbnQyLnVwZGF0ZXMpLnRvQmUoMSk7XG5cbiAgICAgICAgICAgIGNvbXBvbmVudDEudGVzdFNldCgpO1xuICAgICAgICAgICAgdGVzdGVyLmRpZ2VzdCgpO1xuXG4gICAgICAgICAgICBleHBlY3QoY29tcG9uZW50MS51cGRhdGVzKS50b0JlKDIpO1xuICAgICAgICAgICAgZXhwZWN0KGNvbXBvbmVudDIudXBkYXRlcykudG9CZSgyKTtcblxuICAgICAgICAgICAgY29tcG9uZW50MS50ZXN0TXV0YXRlKCk7XG4gICAgICAgICAgICB0ZXN0ZXIuZGlnZXN0KCk7XG5cbiAgICAgICAgICAgIGV4cGVjdChjb21wb25lbnQxLnVwZGF0ZXMpLnRvQmUoMyk7XG4gICAgICAgICAgICBleHBlY3QoY29tcG9uZW50Mi51cGRhdGVzKS50b0JlKDMpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn0pO1xuIl19
