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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2NvbXBvbmVudHMvc3RhdGVmdWwuc3BlYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFDQSx5QkFBdUI7QUFFdkIsK0JBQWlDO0FBQ2pDLHVDQUFxRTtBQUVyRSwrQ0FBaUU7QUFDakUsbURBQTJFO0FBRTNFLDZCQUFpQixDQUFDLG9CQUFvQixFQUFFO0lBQ3BDLHNDQUFzQztJQUN0Qyw2QkFBaUIsQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDO0lBQ3pDLDZCQUFpQixDQUFDLGNBQWMsRUFBRSxVQUFVLENBQUM7SUFDN0MsNkJBQWlCLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0NBQzVELEVBQUUsVUFBQyxNQUFNO0lBVU4sSUFBTSxzQkFBc0I7UUFBUywwQ0FBcUI7UUFJdEQsZ0NBQVksTUFBc0IsRUFBRSxZQUEwQjtZQUE5RCxZQUNJLGtCQUFNLE1BQU0sRUFBRSxZQUFZLENBQUMsU0FLOUI7WUFIRyx3QkFBd0I7WUFDeEIsS0FBSSxDQUFDLEdBQUcsR0FBRyxhQUFhLENBQUM7WUFDekIsS0FBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7O1FBQ2xCLENBQUM7UUFDTCw2QkFBQztJQUFELENBWEEsQUFXQyxDQVhvQyxnQ0FBcUIsR0FXekQ7SUFWWTtRQUFSLGdCQUFLLEVBQUU7dURBQW9CO0lBQ25CO1FBQVIsZ0JBQUssRUFBRTt1REFBb0I7SUFGMUIsc0JBQXNCO1FBVDNCLGdCQUFTLENBQUM7WUFDUCxNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU07WUFDckIsU0FBUyxFQUFFLDhCQUE4QjtZQUN6QyxRQUFRLEVBQUUsOEZBSVQ7U0FDSixDQUFDO09BQ0ksc0JBQXNCLENBVzNCO0lBYUQsSUFBTSx1QkFBdUI7UUFBUywyQ0FBcUI7UUFBM0Q7O1FBQ0EsQ0FBQztRQUFELDhCQUFDO0lBQUQsQ0FEQSxBQUNDLENBRHFDLGdDQUFxQixHQUMxRDtJ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Q0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQyxDQUFDIiwiZmlsZSI6ImNvcmUvY29tcG9uZW50cy9zdGF0ZWZ1bC5zcGVjLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYW5ndWxhciBmcm9tICdhbmd1bGFyJztcbmltcG9ydCAnYW5ndWxhci1tb2Nrcyc7XG5cbmltcG9ydCB7Y29tcG9uZW50fSBmcm9tICcuL2Jhc2UnO1xuaW1wb3J0IHtTdGF0ZWZ1bENvbXBvbmVudEJhc2UsIHN0YXRlLCBzaGFyZWRTdGF0ZX0gZnJvbSAnLi9zdGF0ZWZ1bCc7XG5pbXBvcnQge1N0YXRlTWFuYWdlcn0gZnJvbSAnLi9tYW5hZ2VyJztcbmltcG9ydCB7QWN0aW9ucywgU2ltcGxlU2hhcmVkU3RvcmV9IGZyb20gJy4uL3NoYXJlZF9zdG9yZS9pbmRleCc7XG5pbXBvcnQge2Rlc2NyaWJlQ29tcG9uZW50LCBjcmVhdGVTaGFyZWRTdG9yZX0gZnJvbSAnLi4vLi4vdGVzdHMvY29tcG9uZW50JztcblxuZGVzY3JpYmVDb21wb25lbnQoJ3N0YXRlZnVsIGNvbXBvbmVudCcsIFtcbiAgICAvLyBTaW1wbGUgc2hhcmVkIHN0b3JlcyB1c2VkIGluIHRlc3RzLlxuICAgIGNyZWF0ZVNoYXJlZFN0b3JlKCd0ZXN0LXNoYXJlZCcsICd3b3JsZCcpLFxuICAgIGNyZWF0ZVNoYXJlZFN0b3JlKCd0ZXN0LWFub3RoZXInLCAndW5pdmVyc2UnKSxcbiAgICBjcmVhdGVTaGFyZWRTdG9yZSgndGVzdC1zaGFyZWQtbXV0YWJsZScsIFsnYScsICdiJywgJ2MnXSksXG5dLCAodGVzdGVyKSA9PiB7XG4gICAgQGNvbXBvbmVudCh7XG4gICAgICAgIG1vZHVsZTogdGVzdGVyLm1vZHVsZSxcbiAgICAgICAgZGlyZWN0aXZlOiAnZ2VuLWR1bW15LXN0YXRlZnVsLWNvbXBvbmVudCcsXG4gICAgICAgIHRlbXBsYXRlOiBgXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIHt7Y3RybC5mb299fSB7e2N0cmwuYmFyfX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgLFxuICAgIH0pXG4gICAgY2xhc3MgRHVtbXlTdGF0ZWZ1bENvbXBvbmVudCBleHRlbmRzIFN0YXRlZnVsQ29tcG9uZW50QmFzZSB7XG4gICAgICAgIEBzdGF0ZSgpIHB1YmxpYyBmb286IHN0cmluZztcbiAgICAgICAgQHN0YXRlKCkgcHVibGljIGJhcjogbnVtYmVyO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKCRzY29wZTogYW5ndWxhci5JU2NvcGUsIHN0YXRlTWFuYWdlcjogU3RhdGVNYW5hZ2VyKSB7XG4gICAgICAgICAgICBzdXBlcigkc2NvcGUsIHN0YXRlTWFuYWdlcik7XG5cbiAgICAgICAgICAgIC8vIFNldCBzdGF0ZSBwcm9wZXJ0aWVzLlxuICAgICAgICAgICAgdGhpcy5mb28gPSAnaGVsbG8gd29ybGQnO1xuICAgICAgICAgICAgdGhpcy5iYXIgPSA0MjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIEBjb21wb25lbnQoe1xuICAgICAgICBtb2R1bGU6IHRlc3Rlci5tb2R1bGUsXG4gICAgICAgIGRpcmVjdGl2ZTogJ2dlbi1wYXJlbnQtc3RhdGVmdWwtY29tcG9uZW50JyxcbiAgICAgICAgdGVtcGxhdGU6IGBcbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGdlbi1kdW1teS1zdGF0ZWZ1bC1jb21wb25lbnQgc3RhdGUtaWQ9XCJkdW1teS0xXCI+PC9nZW4tZHVtbXktc3RhdGVmdWwtY29tcG9uZW50PlxuICAgICAgICAgICAgICAgIDxnZW4tZHVtbXktc3RhdGVmdWwtY29tcG9uZW50IHN0YXRlLWlkPVwiZHVtbXktMlwiPjwvZ2VuLWR1bW15LXN0YXRlZnVsLWNvbXBvbmVudD5cbiAgICAgICAgICAgICAgICA8Z2VuLWR1bW15LXN0YXRlZnVsLWNvbXBvbmVudCBzdGF0ZS1pZD1cImR1bW15LTNcIj48L2dlbi1kdW1teS1zdGF0ZWZ1bC1jb21wb25lbnQ+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgYCxcbiAgICB9KVxuICAgIGNsYXNzIFBhcmVudFN0YXRlZnVsQ29tcG9uZW50IGV4dGVuZHMgU3RhdGVmdWxDb21wb25lbnRCYXNlIHtcbiAgICB9XG5cbiAgICBAY29tcG9uZW50KHtcbiAgICAgICAgbW9kdWxlOiB0ZXN0ZXIubW9kdWxlLFxuICAgICAgICBkaXJlY3RpdmU6ICdnZW4tc2hhcmVkLXN0YXRlLWEnLFxuICAgICAgICB0ZW1wbGF0ZTogYFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRleHQtYVwiPkhlbGxvIHt7Y3RybC5mb28udmFsdWUoKX19PC9kaXY+XG4gICAgICAgIGAsXG4gICAgfSlcbiAgICBjbGFzcyBTaGFyZWRTdGF0ZUFDb21wb25lbnQgZXh0ZW5kcyBTdGF0ZWZ1bENvbXBvbmVudEJhc2Uge1xuICAgICAgICBAc2hhcmVkU3RhdGUoKSBwdWJsaWMgZm9vOiBTaW1wbGVTaGFyZWRTdG9yZTxzdHJpbmc+O1xuICAgIH1cblxuICAgIEBjb21wb25lbnQoe1xuICAgICAgICBtb2R1bGU6IHRlc3Rlci5tb2R1bGUsXG4gICAgICAgIGRpcmVjdGl2ZTogJ2dlbi1zaGFyZWQtc3RhdGUtYicsXG4gICAgICAgIHRlbXBsYXRlOiBgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwidGV4dC1iXCI+SGVsbG8ge3tjdHJsLmJhci52YWx1ZSgpfX08L2Rpdj5cbiAgICAgICAgYCxcbiAgICB9KVxuICAgIGNsYXNzIFNoYXJlZFN0YXRlQkNvbXBvbmVudCBleHRlbmRzIFN0YXRlZnVsQ29tcG9uZW50QmFzZSB7XG4gICAgICAgIEBzaGFyZWRTdGF0ZSgpIHB1YmxpYyBiYXI6IFNpbXBsZVNoYXJlZFN0b3JlPHN0cmluZz47XG5cbiAgICAgICAgcHVibGljIHRlc3RQdWJsaXNoKCk6IHZvaWQge1xuICAgICAgICAgICAgdGhpcy5iYXIuZGlzcGF0Y2goe3R5cGU6IEFjdGlvbnMuU0VULCB2YWx1ZTogJ3NoYXJlZCBzdG9yZSB2YWx1ZSd9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIEBjb21wb25lbnQoe1xuICAgICAgICBtb2R1bGU6IHRlc3Rlci5tb2R1bGUsXG4gICAgICAgIGRpcmVjdGl2ZTogJ2dlbi1zaGFyZWQtc3RhdGUtY29udGFpbmVyJyxcbiAgICAgICAgdGVtcGxhdGU6IGBcbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGdlbi1zaGFyZWQtc3RhdGUtYSBzdG9yZS1mb289XCJ0ZXN0LXNoYXJlZFwiPjwvZ2VuLXNoYXJlZC1zdGF0ZS1hPlxuICAgICAgICAgICAgICAgIDxnZW4tc2hhcmVkLXN0YXRlLWIgc3RvcmUtYmFyPVwidGVzdC1zaGFyZWRcIj48L2dlbi1zaGFyZWQtc3RhdGUtYj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgLFxuICAgIH0pXG4gICAgY2xhc3MgU2hhcmVkU3RhdGVDb250YWluZXIgZXh0ZW5kcyBTdGF0ZWZ1bENvbXBvbmVudEJhc2Uge1xuICAgIH1cblxuICAgIC8vIEVuc3VyZSB3ZSBoYXZlIGEgc3RhdGUgbWFuYWdlciBmb3IgZWFjaCB0ZXN0LlxuICAgIGxldCBzdGF0ZU1hbmFnZXI6IFN0YXRlTWFuYWdlcjtcbiAgICBiZWZvcmVFYWNoKGluamVjdCgoX3N0YXRlTWFuYWdlcl8pID0+IHtcbiAgICAgICAgc3RhdGVNYW5hZ2VyID0gX3N0YXRlTWFuYWdlcl87XG4gICAgfSkpO1xuXG4gICAgaXQoJ3NldHMgY29ycmVjdCBzdGF0ZSBpZCBhbmQgcGFyZW50JywgKCkgPT4ge1xuICAgICAgICBjb25zdCBjb21wb25lbnQgPSB0ZXN0ZXIuY3JlYXRlQ29tcG9uZW50PER1bW15U3RhdGVmdWxDb21wb25lbnQ+KFxuICAgICAgICAgICAgRHVtbXlTdGF0ZWZ1bENvbXBvbmVudC5hc1ZpZXcoKS50ZW1wbGF0ZVxuICAgICAgICApO1xuXG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuY3RybC5zdGF0ZUlkKS50b0JlKCdnZW4tZHVtbXktc3RhdGVmdWwtY29tcG9uZW50Jyk7XG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuY3RybC5nbG9iYWxTdGF0ZUlkKS50b0JlKCdnZW4tZHVtbXktc3RhdGVmdWwtY29tcG9uZW50Jyk7XG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuY3RybC5mb28pLnRvQmUoJ2hlbGxvIHdvcmxkJyk7XG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuY3RybC5iYXIpLnRvQmUoNDIpO1xuICAgICAgICBleHBlY3QoY29tcG9uZW50LmN0cmwucGFyZW50Q29tcG9uZW50KCkpLnRvQmVOdWxsKCk7XG5cbiAgICAgICAgY29uc3Qgc3RhdGUgPSBjb21wb25lbnQuY3RybC5zYXZlU3RhdGUoKTtcbiAgICAgICAgZXhwZWN0KHN0YXRlWydnZW4tZHVtbXktc3RhdGVmdWwtY29tcG9uZW50J10pLnRvRXF1YWwoe2ZvbzogJ2hlbGxvIHdvcmxkJywgYmFyOiA0Mn0pO1xuXG4gICAgICAgIC8vIFRlc3QgdGhhdCBjcmVhdGluZyBhIHNlY29uZCBjb21wb25lbnQgd2l0aCBhIGRpZmZlcmVudCBzdGF0ZUlkIHdvcmtzLlxuICAgICAgICBjb25zdCBjb21wb25lbnQyID0gdGVzdGVyLmNyZWF0ZUNvbXBvbmVudDxEdW1teVN0YXRlZnVsQ29tcG9uZW50PihcbiAgICAgICAgICAgIER1bW15U3RhdGVmdWxDb21wb25lbnQuYXNWaWV3KHtpbnB1dHM6IHtzdGF0ZUlkOiAnY29tcG9uZW50LTInfX0pLnRlbXBsYXRlXG4gICAgICAgICk7XG5cbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudDIuY3RybC5zdGF0ZUlkKS50b0JlKCdjb21wb25lbnQtMicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3NldHMgdXAgY29ycmVjdCBoaWVyYXJjaHknLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IHRlc3Rlci5jcmVhdGVDb21wb25lbnQ8UGFyZW50U3RhdGVmdWxDb21wb25lbnQ+KFxuICAgICAgICAgICAgUGFyZW50U3RhdGVmdWxDb21wb25lbnQuYXNWaWV3KCkudGVtcGxhdGVcbiAgICAgICAgKTtcblxuICAgICAgICBleHBlY3QoY29tcG9uZW50LmN0cmwuc3RhdGVJZCkudG9CZSgnZ2VuLXBhcmVudC1zdGF0ZWZ1bC1jb21wb25lbnQnKTtcbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5jdHJsLmNoaWxkQ29tcG9uZW50cygpLmxlbmd0aCkudG9CZSgzKTtcbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5jdHJsLmNoaWxkQ29tcG9uZW50cygpWzBdLnN0YXRlSWQpLnRvQmUoJ2R1bW15LTEnKTtcbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5jdHJsLmNoaWxkQ29tcG9uZW50cygpWzFdLnN0YXRlSWQpLnRvQmUoJ2R1bW15LTInKTtcbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5jdHJsLmNoaWxkQ29tcG9uZW50cygpWzJdLnN0YXRlSWQpLnRvQmUoJ2R1bW15LTMnKTtcbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5jdHJsLmNoaWxkQ29tcG9uZW50cygpWzBdLmdsb2JhbFN0YXRlSWQpLnRvQmUoJ2dlbi1wYXJlbnQtc3RhdGVmdWwtY29tcG9uZW50LWR1bW15LTEnKTtcbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5jdHJsLmNoaWxkQ29tcG9uZW50cygpWzFdLmdsb2JhbFN0YXRlSWQpLnRvQmUoJ2dlbi1wYXJlbnQtc3RhdGVmdWwtY29tcG9uZW50LWR1bW15LTInKTtcbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5jdHJsLmNoaWxkQ29tcG9uZW50cygpWzJdLmdsb2JhbFN0YXRlSWQpLnRvQmUoJ2dlbi1wYXJlbnQtc3RhdGVmdWwtY29tcG9uZW50LWR1bW15LTMnKTtcblxuICAgICAgICBjb25zdCBzdGF0ZSA9IGNvbXBvbmVudC5jdHJsLnNhdmVTdGF0ZSgpO1xuICAgICAgICBleHBlY3Qoc3RhdGVbJ2dlbi1wYXJlbnQtc3RhdGVmdWwtY29tcG9uZW50J10pLnRvRXF1YWwoe30pO1xuICAgICAgICBleHBlY3Qoc3RhdGVbJ2dlbi1wYXJlbnQtc3RhdGVmdWwtY29tcG9uZW50LWR1bW15LTEnXSkudG9FcXVhbCh7Zm9vOiAnaGVsbG8gd29ybGQnLCBiYXI6IDQyfSk7XG4gICAgICAgIGV4cGVjdChzdGF0ZVsnZ2VuLXBhcmVudC1zdGF0ZWZ1bC1jb21wb25lbnQtZHVtbXktMiddKS50b0VxdWFsKHtmb286ICdoZWxsbyB3b3JsZCcsIGJhcjogNDJ9KTtcbiAgICAgICAgZXhwZWN0KHN0YXRlWydnZW4tcGFyZW50LXN0YXRlZnVsLWNvbXBvbmVudC1kdW1teS0zJ10pLnRvRXF1YWwoe2ZvbzogJ2hlbGxvIHdvcmxkJywgYmFyOiA0Mn0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2xvYWRzIHN0YXRlJywgKCkgPT4ge1xuICAgICAgICBjb25zdCBjb21wb25lbnQgPSB0ZXN0ZXIuY3JlYXRlQ29tcG9uZW50PFBhcmVudFN0YXRlZnVsQ29tcG9uZW50PihcbiAgICAgICAgICAgIFBhcmVudFN0YXRlZnVsQ29tcG9uZW50LmFzVmlldygpLnRlbXBsYXRlXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gVXBkYXRlIHRoZSBzdGF0ZSBmb3Igc2Vjb25kIGR1bW15IGNvbXBvbmVudC5cbiAgICAgICAgY29uc3Qgc3RhdGUgPSBjb21wb25lbnQuY3RybC5zYXZlU3RhdGUoKTtcbiAgICAgICAgc3RhdGVbJ2dlbi1wYXJlbnQtc3RhdGVmdWwtY29tcG9uZW50LWR1bW15LTInXSA9IHtmb286ICdoZXkgd29ybGQnLCBiYXI6IDIxfTtcbiAgICAgICAgY29tcG9uZW50LmN0cmwubG9hZFN0YXRlKHN0YXRlKTtcblxuICAgICAgICBleHBlY3QoKDxEdW1teVN0YXRlZnVsQ29tcG9uZW50PiBjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVswXSkuZm9vKS50b0JlKCdoZWxsbyB3b3JsZCcpO1xuICAgICAgICBleHBlY3QoKDxEdW1teVN0YXRlZnVsQ29tcG9uZW50PiBjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVswXSkuYmFyKS50b0JlKDQyKTtcbiAgICAgICAgZXhwZWN0KCg8RHVtbXlTdGF0ZWZ1bENvbXBvbmVudD4gY29tcG9uZW50LmN0cmwuY2hpbGRDb21wb25lbnRzKClbMV0pLmZvbykudG9CZSgnaGV5IHdvcmxkJyk7XG4gICAgICAgIGV4cGVjdCgoPER1bW15U3RhdGVmdWxDb21wb25lbnQ+IGNvbXBvbmVudC5jdHJsLmNoaWxkQ29tcG9uZW50cygpWzFdKS5iYXIpLnRvQmUoMjEpO1xuICAgICAgICBleHBlY3QoKDxEdW1teVN0YXRlZnVsQ29tcG9uZW50PiBjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVsyXSkuZm9vKS50b0JlKCdoZWxsbyB3b3JsZCcpO1xuICAgICAgICBleHBlY3QoKDxEdW1teVN0YXRlZnVsQ29tcG9uZW50PiBjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVsyXSkuYmFyKS50b0JlKDQyKTtcbiAgICB9KTtcblxuICAgIGl0KCdoYW5kbGVzIHNoYXJlZCBzdGF0ZScsICgpID0+IHtcbiAgICAgICAgY29uc3QgY29tcG9uZW50ID0gdGVzdGVyLmNyZWF0ZUNvbXBvbmVudDxTaGFyZWRTdGF0ZUNvbnRhaW5lcj4oXG4gICAgICAgICAgICBTaGFyZWRTdGF0ZUNvbnRhaW5lci5hc1ZpZXcoKS50ZW1wbGF0ZVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIENvbXBvbmVudHMgc2hvdWxkIGRpc3BsYXkgJ0hlbGxvIHdvcmxkJy5cbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5lbGVtZW50LmZpbmQoJy50ZXh0LWEnKS50ZXh0KCkpLnRvQmUoJ0hlbGxvIHdvcmxkJyk7XG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuZWxlbWVudC5maW5kKCcudGV4dC1iJykudGV4dCgpKS50b0JlKCdIZWxsbyB3b3JsZCcpO1xuXG4gICAgICAgICg8U2hhcmVkU3RhdGVCQ29tcG9uZW50PiBjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVsxXSkudGVzdFB1Ymxpc2goKTtcbiAgICAgICAgdGVzdGVyLmRpZ2VzdCgpO1xuXG4gICAgICAgIC8vIENvbXBvbmVudHMgc2hvdWxkIG5vdyBkaXNwbGF5ICdIZWxsbyBzaGFyZWQgc3RvcmUgdmFsdWUnLlxuICAgICAgICBleHBlY3QoY29tcG9uZW50LmVsZW1lbnQuZmluZCgnLnRleHQtYScpLnRleHQoKSkudG9CZSgnSGVsbG8gc2hhcmVkIHN0b3JlIHZhbHVlJyk7XG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuZWxlbWVudC5maW5kKCcudGV4dC1iJykudGV4dCgpKS50b0JlKCdIZWxsbyBzaGFyZWQgc3RvcmUgdmFsdWUnKTtcblxuICAgICAgICAvLyBTYXZlIGNvbXBvbmVudCBzdGF0ZSwgY2hhbmdlIHRoZSB1c2VkIHN0b3JlIGFuZCBsb2FkIGl0IGJhY2suXG4gICAgICAgIGNvbnN0IHN0YXRlID0gY29tcG9uZW50LmN0cmwuc2F2ZVN0YXRlKCk7XG4gICAgICAgIGV4cGVjdChzdGF0ZVsnZ2VuLXNoYXJlZC1zdGF0ZS1jb250YWluZXItZ2VuLXNoYXJlZC1zdGF0ZS1hJ10uZm9vKS50b0JlKCd0ZXN0LXNoYXJlZCcpO1xuICAgICAgICBleHBlY3Qoc3RhdGVbJ2dlbi1zaGFyZWQtc3RhdGUtY29udGFpbmVyLWdlbi1zaGFyZWQtc3RhdGUtYiddLmJhcikudG9CZSgndGVzdC1zaGFyZWQnKTtcbiAgICAgICAgc3RhdGVbJ2dlbi1zaGFyZWQtc3RhdGUtY29udGFpbmVyLWdlbi1zaGFyZWQtc3RhdGUtYSddLmZvbyA9ICd0ZXN0LWFub3RoZXInO1xuICAgICAgICBjb21wb25lbnQuY3RybC5sb2FkU3RhdGUoc3RhdGUpO1xuICAgICAgICB0ZXN0ZXIuZGlnZXN0KCk7XG5cbiAgICAgICAgLy8gU2VlIGlmIGNvbXBvbmVudHMgaGF2ZSBsb2FkZWQgY29ycmVjdCBzdGF0ZS5cbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5lbGVtZW50LmZpbmQoJy50ZXh0LWEnKS50ZXh0KCkpLnRvQmUoJ0hlbGxvIHVuaXZlcnNlJyk7XG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuZWxlbWVudC5maW5kKCcudGV4dC1iJykudGV4dCgpKS50b0JlKCdIZWxsbyBzaGFyZWQgc3RvcmUgdmFsdWUnKTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCd3aXRoIG11dGFibGUgZGF0YScsICgpID0+IHtcbiAgICAgICAgQGNvbXBvbmVudCh7XG4gICAgICAgICAgICBtb2R1bGU6IHRlc3Rlci5tb2R1bGUsXG4gICAgICAgICAgICBkaXJlY3RpdmU6ICdnZW4tc2hhcmVkLXN0YXRlLW11dGFibGUtYScsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogYGAsXG4gICAgICAgIH0pXG4gICAgICAgIGNsYXNzIFNoYXJlZFN0YXRlTXV0YWJsZUFDb21wb25lbnQgZXh0ZW5kcyBTdGF0ZWZ1bENvbXBvbmVudEJhc2Uge1xuICAgICAgICAgICAgcHVibGljIHVwZGF0ZXM6IG51bWJlciA9IDA7XG4gICAgICAgICAgICBwdWJsaWMgdmFsdWU6IHN0cmluZ1tdID0gW107XG4gICAgICAgICAgICBAc2hhcmVkU3RhdGUoKSBwdWJsaWMgZm9vOiBTaW1wbGVTaGFyZWRTdG9yZTxzdHJpbmdbXT47XG5cbiAgICAgICAgICAgIC8vIEBuZ0luamVjdFxuICAgICAgICAgICAgY29uc3RydWN0b3IoJHNjb3BlOiBhbmd1bGFyLklTY29wZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlTWFuYWdlcjogU3RhdGVNYW5hZ2VyKSB7IC8vIHRzbGludDpkaXNhYmxlLWxpbmU6bm8tc2hhZG93ZWQtdmFyaWFibGVcbiAgICAgICAgICAgICAgICBzdXBlcigkc2NvcGUsIHN0YXRlTWFuYWdlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyBvbkNvbXBvbmVudEluaXQoKSB7XG4gICAgICAgICAgICAgICAgc3VwZXIub25Db21wb25lbnRJbml0KCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLndhdGNoQ29sbGVjdGlvbigoKSA9PiB0aGlzLnZhbHVlLCAoY29tcHV0YXRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mb28uZGlzcGF0Y2goe3R5cGU6IEFjdGlvbnMuU0VULCB2YWx1ZTogdGhpcy52YWx1ZX0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpYmVTaGFyZWRTdGF0ZU11dGFibGUoJ2ZvbycsIChmb286IHN0cmluZ1tdKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSBmb287XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlcysrO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgdGVzdFNldCgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gWydhJywgJ2InXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIHRlc3RNdXRhdGUoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZS5wb3AoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIEBjb21wb25lbnQoe1xuICAgICAgICAgICAgbW9kdWxlOiB0ZXN0ZXIubW9kdWxlLFxuICAgICAgICAgICAgZGlyZWN0aXZlOiAnZ2VuLXNoYXJlZC1zdGF0ZS1tdXRhYmxlLWInLFxuICAgICAgICAgICAgdGVtcGxhdGU6IGBgLFxuICAgICAgICB9KVxuICAgICAgICBjbGFzcyBTaGFyZWRTdGF0ZU11dGFibGVCQ29tcG9uZW50IGV4dGVuZHMgU3RhdGVmdWxDb21wb25lbnRCYXNlIHtcbiAgICAgICAgICAgIHB1YmxpYyB1cGRhdGVzOiBudW1iZXIgPSAwO1xuICAgICAgICAgICAgQHNoYXJlZFN0YXRlKCkgcHVibGljIGZvbzogU2ltcGxlU2hhcmVkU3RvcmU8c3RyaW5nW10+O1xuXG4gICAgICAgICAgICAvLyBAbmdJbmplY3RcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKCRzY29wZTogYW5ndWxhci5JU2NvcGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZU1hbmFnZXI6IFN0YXRlTWFuYWdlcikgeyAvLyB0c2xpbnQ6ZGlzYWJsZS1saW5lOm5vLXNoYWRvd2VkLXZhcmlhYmxlXG4gICAgICAgICAgICAgICAgc3VwZXIoJHNjb3BlLCBzdGF0ZU1hbmFnZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgb25Db21wb25lbnRJbml0KCkge1xuICAgICAgICAgICAgICAgIHN1cGVyLm9uQ29tcG9uZW50SW5pdCgpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpYmVTaGFyZWRTdGF0ZSgnZm9vJywgKGZvbzogc3RyaW5nW10pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVzKys7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBAY29tcG9uZW50KHtcbiAgICAgICAgICAgIG1vZHVsZTogdGVzdGVyLm1vZHVsZSxcbiAgICAgICAgICAgIGRpcmVjdGl2ZTogJ2dlbi1zaGFyZWQtc3RhdGUtbXV0YWJsZS1jb250YWluZXInLFxuICAgICAgICAgICAgdGVtcGxhdGU6IGBcbiAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICA8Z2VuLXNoYXJlZC1zdGF0ZS1tdXRhYmxlLWEgc3RvcmUtZm9vPVwidGVzdC1zaGFyZWQtbXV0YWJsZVwiPjwvZ2VuLXNoYXJlZC1zdGF0ZS1tdXRhYmxlLWE+XG4gICAgICAgICAgICAgICAgICAgIDxnZW4tc2hhcmVkLXN0YXRlLW11dGFibGUtYiBzdG9yZS1mb289XCJ0ZXN0LXNoYXJlZC1tdXRhYmxlXCI+PC9nZW4tc2hhcmVkLXN0YXRlLW11dGFibGUtYj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIGAsXG4gICAgICAgIH0pXG4gICAgICAgIGNsYXNzIFNoYXJlZFN0YXRlTXV0YXRhYmxlQ29udGFpbmVyIGV4dGVuZHMgU3RhdGVmdWxDb21wb25lbnRCYXNlIHtcbiAgICAgICAgfVxuXG4gICAgICAgIGl0KCdoYW5kbGVzIHNoYXJlZCBzdGF0ZScsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IHRlc3Rlci5jcmVhdGVDb21wb25lbnQ8U2hhcmVkU3RhdGVNdXRhdGFibGVDb250YWluZXI+KFxuICAgICAgICAgICAgICAgIFNoYXJlZFN0YXRlTXV0YXRhYmxlQ29udGFpbmVyLmFzVmlldygpLnRlbXBsYXRlXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQxID0gPFNoYXJlZFN0YXRlTXV0YWJsZUFDb21wb25lbnQ+IGNvbXBvbmVudC5jdHJsLmNoaWxkQ29tcG9uZW50cygpWzBdO1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50MiA9IDxTaGFyZWRTdGF0ZU11dGFibGVBQ29tcG9uZW50PiBjb21wb25lbnQuY3RybC5jaGlsZENvbXBvbmVudHMoKVsxXTtcblxuICAgICAgICAgICAgZXhwZWN0KGNvbXBvbmVudDEudXBkYXRlcykudG9CZSgxKTtcbiAgICAgICAgICAgIGV4cGVjdChjb21wb25lbnQyLnVwZGF0ZXMpLnRvQmUoMSk7XG5cbiAgICAgICAgICAgIGNvbXBvbmVudDEudGVzdFNldCgpO1xuICAgICAgICAgICAgdGVzdGVyLmRpZ2VzdCgpO1xuXG4gICAgICAgICAgICBleHBlY3QoY29tcG9uZW50MS51cGRhdGVzKS50b0JlKDIpO1xuICAgICAgICAgICAgZXhwZWN0KGNvbXBvbmVudDIudXBkYXRlcykudG9CZSgyKTtcblxuICAgICAgICAgICAgY29tcG9uZW50MS50ZXN0TXV0YXRlKCk7XG4gICAgICAgICAgICB0ZXN0ZXIuZGlnZXN0KCk7XG5cbiAgICAgICAgICAgIGV4cGVjdChjb21wb25lbnQxLnVwZGF0ZXMpLnRvQmUoMyk7XG4gICAgICAgICAgICBleHBlY3QoY29tcG9uZW50Mi51cGRhdGVzKS50b0JlKDMpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn0pO1xuIl19
