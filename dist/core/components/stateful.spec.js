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
        function DummyStatefulComponent($scope, stateManager) {
            var _this = _super.call(this, $scope, stateManager) || this;
            // Set state properties.
            _this.foo = 'hello world';
            _this.bar = 42;
            return _this;
        }
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2NvbXBvbmVudHMvc3RhdGVmdWwuc3BlYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSx5QkFBdUI7QUFFdkIsK0JBQWdEO0FBQ2hELHVDQUFxRTtBQUVyRSwrQ0FBaUU7QUFDakUsbURBQTJFO0FBRTNFLDZCQUFpQixDQUFDLG9CQUFvQixFQUFFO0lBQ3BDLHNDQUFzQztJQUN0Qyw2QkFBaUIsQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDO0lBQ3pDLDZCQUFpQixDQUFDLGNBQWMsRUFBRSxVQUFVLENBQUM7SUFDN0MsNkJBQWlCLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0NBQzVELEVBQUUsVUFBQyxNQUFNO0lBVU47UUFBcUMsMENBQXFCO1FBSXRELGdDQUFZLE1BQXNCLEVBQUUsWUFBMEI7WUFBOUQsWUFDSSxrQkFBTSxNQUFNLEVBQUUsWUFBWSxDQUFDLFNBSzlCO1lBSEcsd0JBQXdCO1lBQ3hCLEtBQUksQ0FBQyxHQUFHLEdBQUcsYUFBYSxDQUFDO1lBQ3pCLEtBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDOztRQUNsQixDQUFDO1FBVFE7WUFBUixnQkFBSyxFQUFFOzJEQUFvQjtRQUNuQjtZQUFSLGdCQUFLLEVBQUU7MkRBQW9CO1FBRjFCLHNCQUFzQjtZQVQzQixnQkFBUyxDQUFDO2dCQUNQLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTTtnQkFDckIsU0FBUyxFQUFFLDhCQUE4QjtnQkFDekMsUUFBUSxFQUFFLDhGQUlUO2FBQ0osQ0FBQztXQUNJLHNCQUFzQixDQVczQjtRQUFELDZCQUFDO0tBWEQsQUFXQyxDQVhvQyxnQ0FBcUIsR0FXekQ7SUFhRDtRQUFzQywyQ0FBcUI7UUFBM0Q7O1FBQ0EsQ0FBQztRQURLLHVCQUF1QjtZQVg1QixnQkFBUyxDQUFDO2dCQUNQLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTTtnQkFD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QUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV0RixNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuQyxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVuQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDckIsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBRWhCLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRW5DLFVBQVUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUN4QixNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7WUFFaEIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQyxDQUFDIiwiZmlsZSI6ImNvcmUvY29tcG9uZW50cy9zdGF0ZWZ1bC5zcGVjLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYW5ndWxhciBmcm9tICdhbmd1bGFyJztcbmltcG9ydCAnYW5ndWxhci1tb2Nrcyc7XG5cbmltcG9ydCB7Q29tcG9uZW50QmFzZSwgY29tcG9uZW50fSBmcm9tICcuL2Jhc2UnO1xuaW1wb3J0IHtTdGF0ZWZ1bENvbXBvbmVudEJhc2UsIHN0YXRlLCBzaGFyZWRTdGF0ZX0gZnJvbSAnLi9zdGF0ZWZ1bCc7XG5pbXBvcnQge1N0YXRlTWFuYWdlcn0gZnJvbSAnLi9tYW5hZ2VyJztcbmltcG9ydCB7QWN0aW9ucywgU2ltcGxlU2hhcmVkU3RvcmV9IGZyb20gJy4uL3NoYXJlZF9zdG9yZS9pbmRleCc7XG5pbXBvcnQge2Rlc2NyaWJlQ29tcG9uZW50LCBjcmVhdGVTaGFyZWRTdG9yZX0gZnJvbSAnLi4vLi4vdGVzdHMvY29tcG9uZW50JztcblxuZGVzY3JpYmVDb21wb25lbnQoJ3N0YXRlZnVsIGNvbXBvbmVudCcsIFtcbiAgICAvLyBTaW1wbGUgc2hhcmVkIHN0b3JlcyB1c2VkIGluIHRlc3RzLlxuICAgIGNyZWF0ZVNoYXJlZFN0b3JlKCd0ZXN0LXNoYXJlZCcsICd3b3JsZCcpLFxuICAgIGNyZWF0ZVNoYXJlZFN0b3JlKCd0ZXN0LWFub3RoZXInLCAndW5pdmVyc2UnKSxcbiAgICBjcmVhdGVTaGFyZWRTdG9yZSgndGVzdC1zaGFyZWQtbXV0YWJsZScsIFsnYScsICdiJywgJ2MnXSksXG5dLCAodGVzdGVyKSA9PiB7XG4gICAgQGNvbXBvbmVudCh7XG4gICAgICAgIG1vZHVsZTogdGVzdGVyLm1vZHVsZSxcbiAgICAgICAgZGlyZWN0aXZlOiAnZ2VuLWR1bW15LXN0YXRlZnVsLWNvbXBvbmVudCcsXG4gICAgICAgIHRlbXBsYXRlOiBgXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIHt7Y3RybC5mb299fSB7e2N0cmwuYmFyfX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgLFxuICAgIH0pXG4gICAgY2xhc3MgRHVtbXlTdGF0ZWZ1bENvbXBvbmVudCBleHRlbmRzIFN0YXRlZnVsQ29tcG9uZW50QmFzZSB7XG4gICAgICAgIEBzdGF0ZSgpIHB1YmxpYyBmb286IHN0cmluZztcbiAgICAgICAgQHN0YXRlKCkgcHVibGljIGJhcjogbnVtYmVyO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKCRzY29wZTogYW5ndWxhci5JU2NvcGUsIHN0YXRlTWFuYWdlcjogU3RhdGVNYW5hZ2VyKSB7XG4gICAgICAgICAgICBzdXBlcigkc2NvcGUsIHN0YXRlTWFuYWdlcik7XG5cbiAgICAgICAgICAgIC8vIFNldCBzdGF0ZSBwcm9wZXJ0aWVzLlxuICAgICAgICAgICAgdGhpcy5mb28gPSAnaGVsbG8gd29ybGQnO1xuICAgICAgICAgICAgdGhpcy5iYXIgPSA0MjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIEBjb21wb25lbnQoe1xuICAgICAgICBtb2R1bGU6IHRlc3Rlci5tb2R1bGUsXG4gICAgICAgIGRpcmVjdGl2ZTogJ2dlbi1wYXJlbnQtc3RhdGVmdWwtY29tcG9uZW50JyxcbiAgICAgICAgdGVtcGxhdGU6IGBcbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGdlbi1kdW1teS1zdGF0ZWZ1bC1jb21wb25lbnQgc3RhdGUtaWQ9XCJkdW1teS0xXCI+PC9nZW4tZHVtbXktc3RhdGVmdWwtY29tcG9uZW50PlxuICAgICAgICAgICAgICAgIDxnZW4tZHVtbXktc3RhdGVmdWwtY29tcG9uZW50IHN0YXRlLWlkPVwiZHVtbXktMlwiPjwvZ2VuLWR1bW15LXN0YXRlZnVsLWNvbXBvbmVudD5cbiAgICAgICAgICAgICAgICA8Z2VuLWR1bW15LXN0YXRlZnVsLWNvbXBvbmVudCBzdGF0ZS1pZD1cImR1bW15LTNcIj48L2dlbi1kdW1teS1zdGF0ZWZ1bC1jb21wb25lbnQ+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgYCxcbiAgICB9KVxuICAgIGNsYXNzIFBhcmVudFN0YXRlZnVsQ29tcG9uZW50IGV4dGVuZHMgU3RhdGVmdWxDb21wb25lbnRCYXNlIHtcbiAgICB9XG5cbiAgICBAY29tcG9uZW50KHtcbiAgICAgICAgbW9kdWxlOiB0ZXN0ZXIubW9kdWxlLFxuICAgICAgICBkaXJlY3RpdmU6ICdnZW4tbXVsdGlwbGUtdG9wLWNvbXBvbmVudCcsXG4gICAgICAgIHRlbXBsYXRlOiBgXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxnZW4tcGFyZW50LXN0YXRlZnVsLWNvbXBvbmVudCBzdGF0ZS1pZD1cInRvcC0xXCI+PC9nZW4tcGFyZW50LXN0YXRlZnVsLWNvbXBvbmVudD5cbiAgICAgICAgICAgICAgICA8Z2VuLXBhcmVudC1zdGF0ZWZ1bC1jb21wb25lbnQgc3RhdGUtaWQ9XCJ0b3AtMlwiPjwvZ2VuLXBhcmVudC1zdGF0ZWZ1bC1jb21wb25lbnQ+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgYCxcbiAgICB9KVxuICAgIGNsYXNzIE11bHRpcGxlVG9wQ29tcG9uZW50IGV4dGVuZHMgQ29tcG9uZW50QmFzZSB7XG4gICAgICAgIC8vIFRoaXMgaXMgbm90IGEgc3RhdGVmdWwgY29tcG9uZW50IG9uIHB1cnBvc2UuXG4gICAgfVxuXG4gICAgQGNvbXBvbmVudCh7XG4gICAgICAgIG1vZHVsZTogdGVzdGVyLm1vZHVsZSxcbiAgICAgICAgZGlyZWN0aXZlOiAnZ2VuLXNoYXJlZC1zdGF0ZS1hJyxcbiAgICAgICAgdGVtcGxhdGU6IGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0ZXh0LWFcIj5IZWxsbyB7e2N0cmwuZm9vLnZhbHVlKCl9fTwvZGl2PlxuICAgICAgICBgLFxuICAgIH0pXG4gICAgY2xhc3MgU2hhcmVkU3RhdGVBQ29tcG9uZW50IGV4dGVuZHMgU3RhdGVmdWxDb21wb25lbnRCYXNlIHtcbiAgICAgICAgQHNoYXJlZFN0YXRlKCkgcHVibGljIGZvbzogU2ltcGxlU2hhcmVkU3RvcmU8c3RyaW5nPjtcbiAgICB9XG5cbiAgICBAY29tcG9uZW50KHtcbiAgICAgICAgbW9kdWxlOiB0ZXN0ZXIubW9kdWxlLFxuICAgICAgICBkaXJlY3RpdmU6ICdnZW4tc2hhcmVkLXN0YXRlLWInLFxuICAgICAgICB0ZW1wbGF0ZTogYFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRleHQtYlwiPkhlbGxvIHt7Y3RybC5iYXIudmFsdWUoKX19PC9kaXY+XG4gICAgICAgIGAsXG4gICAgfSlcbiAgICBjbGFzcyBTaGFyZWRTdGF0ZUJDb21wb25lbnQgZXh0ZW5kcyBTdGF0ZWZ1bENvbXBvbmVudEJhc2Uge1xuICAgICAgICBAc2hhcmVkU3RhdGUoKSBwdWJsaWMgYmFyOiBTaW1wbGVTaGFyZWRTdG9yZTxzdHJpbmc+O1xuXG4gICAgICAgIHB1YmxpYyB0ZXN0UHVibGlzaCgpOiB2b2lkIHtcbiAgICAgICAgICAgIHRoaXMuYmFyLmRpc3BhdGNoKHt0eXBlOiBBY3Rpb25zLlNFVCwgdmFsdWU6ICdzaGFyZWQgc3RvcmUgdmFsdWUnfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBAY29tcG9uZW50KHtcbiAgICAgICAgbW9kdWxlOiB0ZXN0ZXIubW9kdWxlLFxuICAgICAgICBkaXJlY3RpdmU6ICdnZW4tc2hhcmVkLXN0YXRlLWNvbnRhaW5lcicsXG4gICAgICAgIHRlbXBsYXRlOiBgXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxnZW4tc2hhcmVkLXN0YXRlLWEgc3RvcmUtZm9vPVwidGVzdC1zaGFyZWRcIj48L2dlbi1zaGFyZWQtc3RhdGUtYT5cbiAgICAgICAgICAgICAgICA8Z2VuLXNoYXJlZC1zdGF0ZS1iIHN0b3JlLWJhcj1cInRlc3Qtc2hhcmVkXCI+PC9nZW4tc2hhcmVkLXN0YXRlLWI+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgYCxcbiAgICB9KVxuICAgIGNsYXNzIFNoYXJlZFN0YXRlQ29udGFpbmVyIGV4dGVuZHMgU3RhdGVmdWxDb21wb25lbnRCYXNlIHtcbiAgICB9XG5cbiAgICAvLyBFbnN1cmUgd2UgaGF2ZSBhIHN0YXRlIG1hbmFnZXIgZm9yIGVhY2ggdGVzdC5cbiAgICBsZXQgc3RhdGVNYW5hZ2VyOiBTdGF0ZU1hbmFnZXI7XG4gICAgYmVmb3JlRWFjaChpbmplY3QoKF9zdGF0ZU1hbmFnZXJfKSA9PiB7XG4gICAgICAgIHN0YXRlTWFuYWdlciA9IF9zdGF0ZU1hbmFnZXJfO1xuICAgIH0pKTtcblxuICAgIGl0KCdzZXRzIGNvcnJlY3Qgc3RhdGUgaWQgYW5kIHBhcmVudCcsICgpID0+IHtcbiAgICAgICAgY29uc3QgY29tcG9uZW50ID0gdGVzdGVyLmNyZWF0ZUNvbXBvbmVudDxEdW1teVN0YXRlZnVsQ29tcG9uZW50PihcbiAgICAgICAgICAgIER1bW15U3RhdGVmdWxDb21wb25lbnQuYXNWaWV3KCkudGVtcGxhdGVcbiAgICAgICAgKTtcblxuICAgICAgICBleHBlY3QoY29tcG9uZW50LmN0cmwuc3RhdGVJZCkudG9CZSgnZ2VuLWR1bW15LXN0YXRlZnVsLWNvbXBvbmVudCcpO1xuICAgICAgICBleHBlY3QoY29tcG9uZW50LmN0cmwuZ2xvYmFsU3RhdGVJZCkudG9CZSgnZ2VuLWR1bW15LXN0YXRlZnVsLWNvbXBvbmVudCcpO1xuICAgICAgICBleHBlY3QoY29tcG9uZW50LmN0cmwuZm9vKS50b0JlKCdoZWxsbyB3b3JsZCcpO1xuICAgICAgICBleHBlY3QoY29tcG9uZW50LmN0cmwuYmFyKS50b0JlKDQyKTtcbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5jdHJsLnBhcmVudENvbXBvbmVudCgpKS50b0JlTnVsbCgpO1xuXG4gICAgICAgIGNvbnN0IHN0YXRlID0gY29tcG9uZW50LmN0cmwuc2F2ZVN0YXRlKCk7XG4gICAgICAgIGV4cGVjdChzdGF0ZVsnZ2VuLWR1bW15LXN0YXRlZnVsLWNvbXBvbmVudCddKS50b0VxdWFsKHtmb286ICdoZWxsbyB3b3JsZCcsIGJhcjogNDJ9KTtcblxuICAgICAgICAvLyBUZXN0IHRoYXQgY3JlYXRpbmcgYSBzZWNvbmQgY29tcG9uZW50IHdpdGggYSBkaWZmZXJlbnQgc3RhdGVJZCB3b3Jrcy5cbiAgICAgICAgY29uc3QgY29tcG9uZW50MiA9IHRlc3Rlci5jcmVhdGVDb21wb25lbnQ8RHVtbXlTdGF0ZWZ1bENvbXBvbmVudD4oXG4gICAgICAgICAgICBEdW1teVN0YXRlZnVsQ29tcG9uZW50LmFzVmlldyh7aW5wdXRzOiB7c3RhdGVJZDogJ2NvbXBvbmVudC0yJ319KS50ZW1wbGF0ZVxuICAgICAgICApO1xuXG4gICAgICAgIGV4cGVjdChjb21wb25lbnQyLmN0cmwuc3RhdGVJZCkudG9CZSgnY29tcG9uZW50LTInKTtcbiAgICB9KTtcblxuICAgIGl0KCdzZXRzIHVwIGNvcnJlY3QgaGllcmFyY2h5JywgKCkgPT4ge1xuICAgICAgICBjb25zdCBjb21wb25lbnQgPSB0ZXN0ZXIuY3JlYXRlQ29tcG9uZW50PFBhcmVudFN0YXRlZnVsQ29tcG9uZW50PihcbiAgICAgICAgICAgIFBhcmVudFN0YXRlZnVsQ29tcG9uZW50LmFzVmlldygpLnRlbXBsYXRlXG4gICAgICAgICk7XG5cbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5jdHJsLnN0YXRlSWQpLnRvQmUoJ2dlbi1wYXJlbnQtc3RhdGVmdWwtY29tcG9uZW50Jyk7XG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKS5sZW5ndGgpLnRvQmUoMyk7XG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVswXS5zdGF0ZUlkKS50b0JlKCdkdW1teS0xJyk7XG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVsxXS5zdGF0ZUlkKS50b0JlKCdkdW1teS0yJyk7XG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVsyXS5zdGF0ZUlkKS50b0JlKCdkdW1teS0zJyk7XG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVswXS5nbG9iYWxTdGF0ZUlkKS50b0JlKCdnZW4tcGFyZW50LXN0YXRlZnVsLWNvbXBvbmVudC1kdW1teS0xJyk7XG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVsxXS5nbG9iYWxTdGF0ZUlkKS50b0JlKCdnZW4tcGFyZW50LXN0YXRlZnVsLWNvbXBvbmVudC1kdW1teS0yJyk7XG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVsyXS5nbG9iYWxTdGF0ZUlkKS50b0JlKCdnZW4tcGFyZW50LXN0YXRlZnVsLWNvbXBvbmVudC1kdW1teS0zJyk7XG5cbiAgICAgICAgY29uc3Qgc3RhdGUgPSBjb21wb25lbnQuY3RybC5zYXZlU3RhdGUoKTtcbiAgICAgICAgZXhwZWN0KHN0YXRlWydnZW4tcGFyZW50LXN0YXRlZnVsLWNvbXBvbmVudCddKS50b0VxdWFsKHt9KTtcbiAgICAgICAgZXhwZWN0KHN0YXRlWydnZW4tcGFyZW50LXN0YXRlZnVsLWNvbXBvbmVudC1kdW1teS0xJ10pLnRvRXF1YWwoe2ZvbzogJ2hlbGxvIHdvcmxkJywgYmFyOiA0Mn0pO1xuICAgICAgICBleHBlY3Qoc3RhdGVbJ2dlbi1wYXJlbnQtc3RhdGVmdWwtY29tcG9uZW50LWR1bW15LTInXSkudG9FcXVhbCh7Zm9vOiAnaGVsbG8gd29ybGQnLCBiYXI6IDQyfSk7XG4gICAgICAgIGV4cGVjdChzdGF0ZVsnZ2VuLXBhcmVudC1zdGF0ZWZ1bC1jb21wb25lbnQtZHVtbXktMyddKS50b0VxdWFsKHtmb286ICdoZWxsbyB3b3JsZCcsIGJhcjogNDJ9KTtcbiAgICB9KTtcblxuICAgIGl0KCdoYW5kbGVzIG11bHRpcGxlIHRvcC1sZXZlbCBjb21wb25lbnRzJywgKCkgPT4ge1xuICAgICAgICB0ZXN0ZXIuY3JlYXRlQ29tcG9uZW50PE11bHRpcGxlVG9wQ29tcG9uZW50PihcbiAgICAgICAgICAgIE11bHRpcGxlVG9wQ29tcG9uZW50LmFzVmlldygpLnRlbXBsYXRlXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgdG9wTGV2ZWwgPSBzdGF0ZU1hbmFnZXIudG9wTGV2ZWxDb21wb25lbnRzKCk7XG4gICAgICAgIGV4cGVjdCh0b3BMZXZlbC5sZW5ndGgpLnRvQmUoMik7XG4gICAgICAgIGV4cGVjdCh0b3BMZXZlbFswXS5zdGF0ZUlkKS50b0JlKCd0b3AtMScpO1xuICAgICAgICBleHBlY3QodG9wTGV2ZWxbMV0uc3RhdGVJZCkudG9CZSgndG9wLTInKTtcblxuICAgICAgICBjb25zdCBzdGF0ZSA9IHN0YXRlTWFuYWdlci5zYXZlKCk7XG4gICAgICAgIGV4cGVjdChzdGF0ZVsndG9wLTEnXSkudG9FcXVhbCh7fSk7XG4gICAgICAgIGV4cGVjdChzdGF0ZVsndG9wLTEtZHVtbXktMSddKS50b0VxdWFsKHtmb286ICdoZWxsbyB3b3JsZCcsIGJhcjogNDJ9KTtcbiAgICAgICAgZXhwZWN0KHN0YXRlWyd0b3AtMS1kdW1teS0yJ10pLnRvRXF1YWwoe2ZvbzogJ2hlbGxvIHdvcmxkJywgYmFyOiA0Mn0pO1xuICAgICAgICBleHBlY3Qoc3RhdGVbJ3RvcC0xLWR1bW15LTMnXSkudG9FcXVhbCh7Zm9vOiAnaGVsbG8gd29ybGQnLCBiYXI6IDQyfSk7XG4gICAgICAgIGV4cGVjdChzdGF0ZVsndG9wLTInXSkudG9FcXVhbCh7fSk7XG4gICAgICAgIGV4cGVjdChzdGF0ZVsndG9wLTItZHVtbXktMSddKS50b0VxdWFsKHtmb286ICdoZWxsbyB3b3JsZCcsIGJhcjogNDJ9KTtcbiAgICAgICAgZXhwZWN0KHN0YXRlWyd0b3AtMi1kdW1teS0yJ10pLnRvRXF1YWwoe2ZvbzogJ2hlbGxvIHdvcmxkJywgYmFyOiA0Mn0pO1xuICAgICAgICBleHBlY3Qoc3RhdGVbJ3RvcC0yLWR1bW15LTMnXSkudG9FcXVhbCh7Zm9vOiAnaGVsbG8gd29ybGQnLCBiYXI6IDQyfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnbG9hZHMgc3RhdGUnLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IHRlc3Rlci5jcmVhdGVDb21wb25lbnQ8UGFyZW50U3RhdGVmdWxDb21wb25lbnQ+KFxuICAgICAgICAgICAgUGFyZW50U3RhdGVmdWxDb21wb25lbnQuYXNWaWV3KCkudGVtcGxhdGVcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBVcGRhdGUgdGhlIHN0YXRlIGZvciBzZWNvbmQgZHVtbXkgY29tcG9uZW50LlxuICAgICAgICBjb25zdCBzdGF0ZSA9IGNvbXBvbmVudC5jdHJsLnNhdmVTdGF0ZSgpO1xuICAgICAgICBzdGF0ZVsnZ2VuLXBhcmVudC1zdGF0ZWZ1bC1jb21wb25lbnQtZHVtbXktMiddID0ge2ZvbzogJ2hleSB3b3JsZCcsIGJhcjogMjF9O1xuICAgICAgICBjb21wb25lbnQuY3RybC5sb2FkU3RhdGUoc3RhdGUpO1xuXG4gICAgICAgIGV4cGVjdCgoPER1bW15U3RhdGVmdWxDb21wb25lbnQ+IGNvbXBvbmVudC5jdHJsLmNoaWxkQ29tcG9uZW50cygpWzBdKS5mb28pLnRvQmUoJ2hlbGxvIHdvcmxkJyk7XG4gICAgICAgIGV4cGVjdCgoPER1bW15U3RhdGVmdWxDb21wb25lbnQ+IGNvbXBvbmVudC5jdHJsLmNoaWxkQ29tcG9uZW50cygpWzBdKS5iYXIpLnRvQmUoNDIpO1xuICAgICAgICBleHBlY3QoKDxEdW1teVN0YXRlZnVsQ29tcG9uZW50PiBjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVsxXSkuZm9vKS50b0JlKCdoZXkgd29ybGQnKTtcbiAgICAgICAgZXhwZWN0KCg8RHVtbXlTdGF0ZWZ1bENvbXBvbmVudD4gY29tcG9uZW50LmN0cmwuY2hpbGRDb21wb25lbnRzKClbMV0pLmJhcikudG9CZSgyMSk7XG4gICAgICAgIGV4cGVjdCgoPER1bW15U3RhdGVmdWxDb21wb25lbnQ+IGNvbXBvbmVudC5jdHJsLmNoaWxkQ29tcG9uZW50cygpWzJdKS5mb28pLnRvQmUoJ2hlbGxvIHdvcmxkJyk7XG4gICAgICAgIGV4cGVjdCgoPER1bW15U3RhdGVmdWxDb21wb25lbnQ+IGNvbXBvbmVudC5jdHJsLmNoaWxkQ29tcG9uZW50cygpWzJdKS5iYXIpLnRvQmUoNDIpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2hhbmRsZXMgc2hhcmVkIHN0YXRlJywgKCkgPT4ge1xuICAgICAgICBjb25zdCBjb21wb25lbnQgPSB0ZXN0ZXIuY3JlYXRlQ29tcG9uZW50PFNoYXJlZFN0YXRlQ29udGFpbmVyPihcbiAgICAgICAgICAgIFNoYXJlZFN0YXRlQ29udGFpbmVyLmFzVmlldygpLnRlbXBsYXRlXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gQ29tcG9uZW50cyBzaG91bGQgZGlzcGxheSAnSGVsbG8gd29ybGQnLlxuICAgICAgICBleHBlY3QoY29tcG9uZW50LmVsZW1lbnQuZmluZCgnLnRleHQtYScpLnRleHQoKSkudG9CZSgnSGVsbG8gd29ybGQnKTtcbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5lbGVtZW50LmZpbmQoJy50ZXh0LWInKS50ZXh0KCkpLnRvQmUoJ0hlbGxvIHdvcmxkJyk7XG5cbiAgICAgICAgKDxTaGFyZWRTdGF0ZUJDb21wb25lbnQ+IGNvbXBvbmVudC5jdHJsLmNoaWxkQ29tcG9uZW50cygpWzFdKS50ZXN0UHVibGlzaCgpO1xuICAgICAgICB0ZXN0ZXIuZGlnZXN0KCk7XG5cbiAgICAgICAgLy8gQ29tcG9uZW50cyBzaG91bGQgbm93IGRpc3BsYXkgJ0hlbGxvIHNoYXJlZCBzdG9yZSB2YWx1ZScuXG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuZWxlbWVudC5maW5kKCcudGV4dC1hJykudGV4dCgpKS50b0JlKCdIZWxsbyBzaGFyZWQgc3RvcmUgdmFsdWUnKTtcbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5lbGVtZW50LmZpbmQoJy50ZXh0LWInKS50ZXh0KCkpLnRvQmUoJ0hlbGxvIHNoYXJlZCBzdG9yZSB2YWx1ZScpO1xuXG4gICAgICAgIC8vIFNhdmUgY29tcG9uZW50IHN0YXRlLCBjaGFuZ2UgdGhlIHVzZWQgc3RvcmUgYW5kIGxvYWQgaXQgYmFjay5cbiAgICAgICAgY29uc3Qgc3RhdGUgPSBjb21wb25lbnQuY3RybC5zYXZlU3RhdGUoKTtcbiAgICAgICAgZXhwZWN0KHN0YXRlWydnZW4tc2hhcmVkLXN0YXRlLWNvbnRhaW5lci1nZW4tc2hhcmVkLXN0YXRlLWEnXS5mb28pLnRvQmUoJ3Rlc3Qtc2hhcmVkJyk7XG4gICAgICAgIGV4cGVjdChzdGF0ZVsnZ2VuLXNoYXJlZC1zdGF0ZS1jb250YWluZXItZ2VuLXNoYXJlZC1zdGF0ZS1iJ10uYmFyKS50b0JlKCd0ZXN0LXNoYXJlZCcpO1xuICAgICAgICBzdGF0ZVsnZ2VuLXNoYXJlZC1zdGF0ZS1jb250YWluZXItZ2VuLXNoYXJlZC1zdGF0ZS1hJ10uZm9vID0gJ3Rlc3QtYW5vdGhlcic7XG4gICAgICAgIGNvbXBvbmVudC5jdHJsLmxvYWRTdGF0ZShzdGF0ZSk7XG4gICAgICAgIHRlc3Rlci5kaWdlc3QoKTtcblxuICAgICAgICAvLyBTZWUgaWYgY29tcG9uZW50cyBoYXZlIGxvYWRlZCBjb3JyZWN0IHN0YXRlLlxuICAgICAgICBleHBlY3QoY29tcG9uZW50LmVsZW1lbnQuZmluZCgnLnRleHQtYScpLnRleHQoKSkudG9CZSgnSGVsbG8gdW5pdmVyc2UnKTtcbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5lbGVtZW50LmZpbmQoJy50ZXh0LWInKS50ZXh0KCkpLnRvQmUoJ0hlbGxvIHNoYXJlZCBzdG9yZSB2YWx1ZScpO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ3dpdGggbXV0YWJsZSBkYXRhJywgKCkgPT4ge1xuICAgICAgICBAY29tcG9uZW50KHtcbiAgICAgICAgICAgIG1vZHVsZTogdGVzdGVyLm1vZHVsZSxcbiAgICAgICAgICAgIGRpcmVjdGl2ZTogJ2dlbi1zaGFyZWQtc3RhdGUtbXV0YWJsZS1hJyxcbiAgICAgICAgICAgIHRlbXBsYXRlOiBgYCxcbiAgICAgICAgfSlcbiAgICAgICAgY2xhc3MgU2hhcmVkU3RhdGVNdXRhYmxlQUNvbXBvbmVudCBleHRlbmRzIFN0YXRlZnVsQ29tcG9uZW50QmFzZSB7XG4gICAgICAgICAgICBwdWJsaWMgdXBkYXRlczogbnVtYmVyID0gMDtcbiAgICAgICAgICAgIHB1YmxpYyB2YWx1ZTogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgICAgIEBzaGFyZWRTdGF0ZSgpIHB1YmxpYyBmb286IFNpbXBsZVNoYXJlZFN0b3JlPHN0cmluZ1tdPjtcblxuICAgICAgICAgICAgLy8gQG5nSW5qZWN0XG4gICAgICAgICAgICBjb25zdHJ1Y3Rvcigkc2NvcGU6IGFuZ3VsYXIuSVNjb3BlLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGVNYW5hZ2VyOiBTdGF0ZU1hbmFnZXIpIHsgLy8gdHNsaW50OmRpc2FibGUtbGluZTpuby1zaGFkb3dlZC12YXJpYWJsZVxuICAgICAgICAgICAgICAgIHN1cGVyKCRzY29wZSwgc3RhdGVNYW5hZ2VyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIG9uQ29tcG9uZW50SW5pdCgpIHtcbiAgICAgICAgICAgICAgICBzdXBlci5vbkNvbXBvbmVudEluaXQoKTtcblxuICAgICAgICAgICAgICAgIHRoaXMud2F0Y2hDb2xsZWN0aW9uKCgpID0+IHRoaXMudmFsdWUsIChjb21wdXRhdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZvby5kaXNwYXRjaCh7dHlwZTogQWN0aW9ucy5TRVQsIHZhbHVlOiB0aGlzLnZhbHVlfSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmliZVNoYXJlZFN0YXRlTXV0YWJsZSgnZm9vJywgKGZvbzogc3RyaW5nW10pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IGZvbztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVzKys7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyB0ZXN0U2V0KCkge1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSBbJ2EnLCAnYiddO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgdGVzdE11dGF0ZSgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlLnBvcCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgQGNvbXBvbmVudCh7XG4gICAgICAgICAgICBtb2R1bGU6IHRlc3Rlci5tb2R1bGUsXG4gICAgICAgICAgICBkaXJlY3RpdmU6ICdnZW4tc2hhcmVkLXN0YXRlLW11dGFibGUtYicsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogYGAsXG4gICAgICAgIH0pXG4gICAgICAgIGNsYXNzIFNoYXJlZFN0YXRlTXV0YWJsZUJDb21wb25lbnQgZXh0ZW5kcyBTdGF0ZWZ1bENvbXBvbmVudEJhc2Uge1xuICAgICAgICAgICAgcHVibGljIHVwZGF0ZXM6IG51bWJlciA9IDA7XG4gICAgICAgICAgICBAc2hhcmVkU3RhdGUoKSBwdWJsaWMgZm9vOiBTaW1wbGVTaGFyZWRTdG9yZTxzdHJpbmdbXT47XG5cbiAgICAgICAgICAgIC8vIEBuZ0luamVjdFxuICAgICAgICAgICAgY29uc3RydWN0b3IoJHNjb3BlOiBhbmd1bGFyLklTY29wZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlTWFuYWdlcjogU3RhdGVNYW5hZ2VyKSB7IC8vIHRzbGludDpkaXNhYmxlLWxpbmU6bm8tc2hhZG93ZWQtdmFyaWFibGVcbiAgICAgICAgICAgICAgICBzdXBlcigkc2NvcGUsIHN0YXRlTWFuYWdlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyBvbkNvbXBvbmVudEluaXQoKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIub25Db21wb25lbnRJbml0KCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmliZVNoYXJlZFN0YXRlKCdmb28nLCAoZm9vOiBzdHJpbmdbXSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZXMrKztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIEBjb21wb25lbnQoe1xuICAgICAgICAgICAgbW9kdWxlOiB0ZXN0ZXIubW9kdWxlLFxuICAgICAgICAgICAgZGlyZWN0aXZlOiAnZ2VuLXNoYXJlZC1zdGF0ZS1tdXRhYmxlLWNvbnRhaW5lcicsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogYFxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxnZW4tc2hhcmVkLXN0YXRlLW11dGFibGUtYSBzdG9yZS1mb289XCJ0ZXN0LXNoYXJlZC1tdXRhYmxlXCI+PC9nZW4tc2hhcmVkLXN0YXRlLW11dGFibGUtYT5cbiAgICAgICAgICAgICAgICAgICAgPGdlbi1zaGFyZWQtc3RhdGUtbXV0YWJsZS1iIHN0b3JlLWZvbz1cInRlc3Qtc2hhcmVkLW11dGFibGVcIj48L2dlbi1zaGFyZWQtc3RhdGUtbXV0YWJsZS1iPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgYCxcbiAgICAgICAgfSlcbiAgICAgICAgY2xhc3MgU2hhcmVkU3RhdGVNdXRhdGFibGVDb250YWluZXIgZXh0ZW5kcyBTdGF0ZWZ1bENvbXBvbmVudEJhc2Uge1xuICAgICAgICB9XG5cbiAgICAgICAgaXQoJ2hhbmRsZXMgc2hhcmVkIHN0YXRlJywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gdGVzdGVyLmNyZWF0ZUNvbXBvbmVudDxTaGFyZWRTdGF0ZU11dGF0YWJsZUNvbnRhaW5lcj4oXG4gICAgICAgICAgICAgICAgU2hhcmVkU3RhdGVNdXRhdGFibGVDb250YWluZXIuYXNWaWV3KCkudGVtcGxhdGVcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudDEgPSA8U2hhcmVkU3RhdGVNdXRhYmxlQUNvbXBvbmVudD4gY29tcG9uZW50LmN0cmwuY2hpbGRDb21wb25lbnRzKClbMF07XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQyID0gPFNoYXJlZFN0YXRlTXV0YWJsZUFDb21wb25lbnQ+IGNvbXBvbmVudC5jdHJsLmNoaWxkQ29tcG9uZW50cygpWzFdO1xuXG4gICAgICAgICAgICBleHBlY3QoY29tcG9uZW50MS51cGRhdGVzKS50b0JlKDEpO1xuICAgICAgICAgICAgZXhwZWN0KGNvbXBvbmVudDIudXBkYXRlcykudG9CZSgxKTtcblxuICAgICAgICAgICAgY29tcG9uZW50MS50ZXN0U2V0KCk7XG4gICAgICAgICAgICB0ZXN0ZXIuZGlnZXN0KCk7XG5cbiAgICAgICAgICAgIGV4cGVjdChjb21wb25lbnQxLnVwZGF0ZXMpLnRvQmUoMik7XG4gICAgICAgICAgICBleHBlY3QoY29tcG9uZW50Mi51cGRhdGVzKS50b0JlKDIpO1xuXG4gICAgICAgICAgICBjb21wb25lbnQxLnRlc3RNdXRhdGUoKTtcbiAgICAgICAgICAgIHRlc3Rlci5kaWdlc3QoKTtcblxuICAgICAgICAgICAgZXhwZWN0KGNvbXBvbmVudDEudXBkYXRlcykudG9CZSgzKTtcbiAgICAgICAgICAgIGV4cGVjdChjb21wb25lbnQyLnVwZGF0ZXMpLnRvQmUoMyk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufSk7XG4iXX0=
