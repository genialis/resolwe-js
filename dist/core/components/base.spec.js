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
var _ = require("lodash");
var base_1 = require("./base");
var component_1 = require("../../tests/component");
component_1.describeComponent('base component', [], function (tester) {
    var DummyComponent = (function (_super) {
        __extends(DummyComponent, _super);
        function DummyComponent($scope) {
            var _this = _super.call(this, $scope) || this;
            _this.array = [];
            _this.strObservable = _this.createWatchObservable(function () { return _this.str; });
            _this.arrayObservable = _this.createWatchObservable(function () { return _this.array; }, true);
            return _this;
        }
        return DummyComponent;
    }(base_1.ComponentBase));
    DummyComponent = __decorate([
        base_1.component({
            module: tester.module,
            directive: 'gen-watch-observable',
        })
    ], DummyComponent);
    it('should reactively update on shallow component changes', function () {
        var component = tester.createComponent(DummyComponent.asView().template);
        // Test this.str
        var strSpy = jasmine.createSpy('strSpy');
        component.ctrl.strObservable
            .distinctUntilChanged()
            .subscribe(function (value) { return strSpy(_.cloneDeep(value)); });
        component.ctrl.str = 'some value';
        tester.digest();
        expect(strSpy.calls.count()).toBe(2);
        expect(strSpy.calls.first().args[0]).toBeUndefined();
        expect(strSpy.calls.mostRecent().args[0]).toBe('some value');
    });
    it('should reactively update on deep component changes', function () {
        var component = tester.createComponent(DummyComponent.asView().template);
        // Test this.array
        var arraySpy = jasmine.createSpy('arraySpy');
        component.ctrl.arrayObservable
            .filter(function (value) { return !_.isEmpty(value); })
            .subscribe(function (value) { return arraySpy(_.cloneDeep(value)); });
        component.ctrl.array.push('some value');
        tester.digest();
        component.ctrl.array.push('some other value');
        tester.digest();
        expect(arraySpy.calls.all()[0].args[0]).toEqual(['some value']);
        expect(arraySpy.calls.all()[1].args[0]).toEqual(['some value', 'some other value']);
    });
    it('should support watch', function () {
        var component = tester.createComponent(DummyComponent.asView().template);
        // No watch should be created if computation is immediately unsubscribed.
        var expression = 0;
        var executed = 0;
        var watchComputation = component.ctrl.watch(function () { return expression; }, function (computation) {
            executed++;
            expect(computation.isDone()).toBeFalsy();
            computation.unsubscribe();
        });
        expect(watchComputation.isDone()).toBeTruthy();
        expression = 1;
        tester.digest();
        expect(executed).toBe(1);
        // Check that watching works correctly.
        expression = 0;
        executed = 0;
        watchComputation = component.ctrl.watch(function () { return expression; }, function (computation) {
            executed++;
            if (executed > 2)
                computation.unsubscribe();
        });
        expect(watchComputation.isDone()).toBeFalsy();
        expression = 1;
        tester.digest();
        // Just to check that watch is only evaluated when the expression changes.
        tester.digest();
        expect(executed).toBe(2);
        expression = 2;
        tester.digest();
        expect(executed).toBe(3);
        // Check that unsubscribe actually stops the watch.
        expression = 3;
        tester.digest();
        expect(executed).toBe(3);
    });
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2NvbXBvbmVudHMvYmFzZS5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDBCQUE0QjtBQUk1QiwrQkFBZ0Q7QUFDaEQsbURBQXdEO0FBRXhELDZCQUFpQixDQUFDLGdCQUFnQixFQUFFLEVBQUUsRUFBRSxVQUFDLE1BQU07SUFLM0MsSUFBTSxjQUFjO1FBQVMsa0NBQWE7UUFPdEMsd0JBQVksTUFBc0I7WUFBbEMsWUFDSSxrQkFBTSxNQUFNLENBQUMsU0FJaEI7WUFSTSxXQUFLLEdBQWEsRUFBRSxDQUFDO1lBTXhCLEtBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSSxDQUFDLHFCQUFxQixDQUFDLGNBQU0sT0FBQSxLQUFJLENBQUMsR0FBRyxFQUFSLENBQVEsQ0FBQyxDQUFDO1lBQ2hFLEtBQUksQ0FBQyxlQUFlLEdBQUcsS0FBSSxDQUFDLHFCQUFxQixDQUFDLGNBQU0sT0FBQSxLQUFJLENBQUMsS0FBSyxFQUFWLENBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQzs7UUFDOUUsQ0FBQztRQUNMLHFCQUFDO0lBQUQsQ0FiQSxBQWFDLENBYjRCLG9CQUFhLEdBYXpDO0lBYkssY0FBYztRQUpuQixnQkFBUyxDQUFDO1lBQ1AsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNO1lBQ3JCLFNBQVMsRUFBRSxzQkFBc0I7U0FDcEMsQ0FBQztPQUNJLGNBQWMsQ0FhbkI7SUFFRCxFQUFFLENBQUMsdURBQXVELEVBQUU7UUFDeEQsSUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLGVBQWUsQ0FDcEMsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FDbkMsQ0FBQztRQUVGLGdCQUFnQjtRQUNoQixJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzNDLFNBQVMsQ0FBQyxJQUFJLENBQUMsYUFBYTthQUN2QixvQkFBb0IsRUFBRTthQUN0QixTQUFTLENBQUMsVUFBQyxLQUFL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bXBvbmVudHMvYmFzZS5zcGVjLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgUnggZnJvbSAncngnO1xuaW1wb3J0ICogYXMgYW5ndWxhciBmcm9tICdhbmd1bGFyJztcblxuaW1wb3J0IHtDb21wb25lbnRCYXNlLCBjb21wb25lbnR9IGZyb20gJy4vYmFzZSc7XG5pbXBvcnQge2Rlc2NyaWJlQ29tcG9uZW50fSBmcm9tICcuLi8uLi90ZXN0cy9jb21wb25lbnQnO1xuXG5kZXNjcmliZUNvbXBvbmVudCgnYmFzZSBjb21wb25lbnQnLCBbXSwgKHRlc3RlcikgPT4ge1xuICAgIEBjb21wb25lbnQoe1xuICAgICAgICBtb2R1bGU6IHRlc3Rlci5tb2R1bGUsXG4gICAgICAgIGRpcmVjdGl2ZTogJ2dlbi13YXRjaC1vYnNlcnZhYmxlJyxcbiAgICB9KVxuICAgIGNsYXNzIER1bW15Q29tcG9uZW50IGV4dGVuZHMgQ29tcG9uZW50QmFzZSB7XG4gICAgICAgIHB1YmxpYyBzdHI6IHN0cmluZztcbiAgICAgICAgcHVibGljIHN0ck9ic2VydmFibGU6IFJ4Lk9ic2VydmFibGU8c3RyaW5nPjtcblxuICAgICAgICBwdWJsaWMgYXJyYXk6IHN0cmluZ1tdID0gW107XG4gICAgICAgIHB1YmxpYyBhcnJheU9ic2VydmFibGU6IFJ4Lk9ic2VydmFibGU8c3RyaW5nW10+O1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKCRzY29wZTogYW5ndWxhci5JU2NvcGUpIHtcbiAgICAgICAgICAgIHN1cGVyKCRzY29wZSk7XG5cbiAgICAgICAgICAgIHRoaXMuc3RyT2JzZXJ2YWJsZSA9IHRoaXMuY3JlYXRlV2F0Y2hPYnNlcnZhYmxlKCgpID0+IHRoaXMuc3RyKTtcbiAgICAgICAgICAgIHRoaXMuYXJyYXlPYnNlcnZhYmxlID0gdGhpcy5jcmVhdGVXYXRjaE9ic2VydmFibGUoKCkgPT4gdGhpcy5hcnJheSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpdCgnc2hvdWxkIHJlYWN0aXZlbHkgdXBkYXRlIG9uIHNoYWxsb3cgY29tcG9uZW50IGNoYW5nZXMnLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IHRlc3Rlci5jcmVhdGVDb21wb25lbnQ8RHVtbXlDb21wb25lbnQ+KFxuICAgICAgICAgICAgRHVtbXlDb21wb25lbnQuYXNWaWV3KCkudGVtcGxhdGVcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBUZXN0IHRoaXMuc3RyXG4gICAgICAgIGNvbnN0IHN0clNweSA9IGphc21pbmUuY3JlYXRlU3B5KCdzdHJTcHknKTtcbiAgICAgICAgY29tcG9uZW50LmN0cmwuc3RyT2JzZXJ2YWJsZVxuICAgICAgICAgICAgLmRpc3RpbmN0VW50aWxDaGFuZ2VkKClcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKHZhbHVlKSA9PiBzdHJTcHkoXy5jbG9uZURlZXAodmFsdWUpKSk7XG5cbiAgICAgICAgY29tcG9uZW50LmN0cmwuc3RyID0gJ3NvbWUgdmFsdWUnO1xuICAgICAgICB0ZXN0ZXIuZGlnZXN0KCk7XG5cbiAgICAgICAgZXhwZWN0KHN0clNweS5jYWxscy5jb3VudCgpKS50b0JlKDIpO1xuICAgICAgICBleHBlY3Qoc3RyU3B5LmNhbGxzLmZpcnN0KCkuYXJnc1swXSkudG9CZVVuZGVmaW5lZCgpO1xuICAgICAgICBleHBlY3Qoc3RyU3B5LmNhbGxzLm1vc3RSZWNlbnQoKS5hcmdzWzBdKS50b0JlKCdzb21lIHZhbHVlJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJlYWN0aXZlbHkgdXBkYXRlIG9uIGRlZXAgY29tcG9uZW50IGNoYW5nZXMnLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IHRlc3Rlci5jcmVhdGVDb21wb25lbnQ8RHVtbXlDb21wb25lbnQ+KFxuICAgICAgICAgICAgRHVtbXlDb21wb25lbnQuYXNWaWV3KCkudGVtcGxhdGVcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBUZXN0IHRoaXMuYXJyYXlcbiAgICAgICAgY29uc3QgYXJyYXlTcHkgPSBqYXNtaW5lLmNyZWF0ZVNweSgnYXJyYXlTcHknKTtcbiAgICAgICAgY29tcG9uZW50LmN0cmwuYXJyYXlPYnNlcnZhYmxlXG4gICAgICAgICAgICAuZmlsdGVyKCh2YWx1ZSkgPT4gIV8uaXNFbXB0eSh2YWx1ZSkpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCh2YWx1ZSkgPT4gYXJyYXlTcHkoXy5jbG9uZURlZXAodmFsdWUpKSk7XG5cbiAgICAgICAgY29tcG9uZW50LmN0cmwuYXJyYXkucHVzaCgnc29tZSB2YWx1ZScpO1xuICAgICAgICB0ZXN0ZXIuZGlnZXN0KCk7XG4gICAgICAgIGNvbXBvbmVudC5jdHJsLmFycmF5LnB1c2goJ3NvbWUgb3RoZXIgdmFsdWUnKTtcbiAgICAgICAgdGVzdGVyLmRpZ2VzdCgpO1xuXG4gICAgICAgIGV4cGVjdChhcnJheVNweS5jYWxscy5hbGwoKVswXS5hcmdzWzBdKS50b0VxdWFsKFsnc29tZSB2YWx1ZSddKTtcbiAgICAgICAgZXhwZWN0KGFycmF5U3B5LmNhbGxzLmFsbCgpWzFdLmFyZ3NbMF0pLnRvRXF1YWwoWydzb21lIHZhbHVlJywgJ3NvbWUgb3RoZXIgdmFsdWUnXSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHN1cHBvcnQgd2F0Y2gnLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IHRlc3Rlci5jcmVhdGVDb21wb25lbnQ8RHVtbXlDb21wb25lbnQ+KFxuICAgICAgICAgICAgRHVtbXlDb21wb25lbnQuYXNWaWV3KCkudGVtcGxhdGVcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBObyB3YXRjaCBzaG91bGQgYmUgY3JlYXRlZCBpZiBjb21wdXRhdGlvbiBpcyBpbW1lZGlhdGVseSB1bnN1YnNjcmliZWQuXG4gICAgICAgIGxldCBleHByZXNzaW9uID0gMDtcbiAgICAgICAgbGV0IGV4ZWN1dGVkID0gMDtcbiAgICAgICAgbGV0IHdhdGNoQ29tcHV0YXRpb24gPSBjb21wb25lbnQuY3RybC53YXRjaCgoKSA9PiBleHByZXNzaW9uLCAoY29tcHV0YXRpb24pID0+IHtcbiAgICAgICAgICAgIGV4ZWN1dGVkKys7XG4gICAgICAgICAgICBleHBlY3QoY29tcHV0YXRpb24uaXNEb25lKCkpLnRvQmVGYWxzeSgpO1xuICAgICAgICAgICAgY29tcHV0YXRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh3YXRjaENvbXB1dGF0aW9uLmlzRG9uZSgpKS50b0JlVHJ1dGh5KCk7XG5cbiAgICAgICAgZXhwcmVzc2lvbiA9IDE7XG4gICAgICAgIHRlc3Rlci5kaWdlc3QoKTtcbiAgICAgICAgZXhwZWN0KGV4ZWN1dGVkKS50b0JlKDEpO1xuXG4gICAgICAgIC8vIENoZWNrIHRoYXQgd2F0Y2hpbmcgd29ya3MgY29ycmVjdGx5LlxuICAgICAgICBleHByZXNzaW9uID0gMDtcbiAgICAgICAgZXhlY3V0ZWQgPSAwO1xuICAgICAgICB3YXRjaENvbXB1dGF0aW9uID0gY29tcG9uZW50LmN0cmwud2F0Y2goKCkgPT4gZXhwcmVzc2lvbiwgKGNvbXB1dGF0aW9uKSA9PiB7XG4gICAgICAgICAgICBleGVjdXRlZCsrO1xuICAgICAgICAgICAgaWYgKGV4ZWN1dGVkID4gMikgY29tcHV0YXRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh3YXRjaENvbXB1dGF0aW9uLmlzRG9uZSgpKS50b0JlRmFsc3koKTtcblxuICAgICAgICBleHByZXNzaW9uID0gMTtcbiAgICAgICAgdGVzdGVyLmRpZ2VzdCgpO1xuICAgICAgICAvLyBKdXN0IHRvIGNoZWNrIHRoYXQgd2F0Y2ggaXMgb25seSBldmFsdWF0ZWQgd2hlbiB0aGUgZXhwcmVzc2lvbiBjaGFuZ2VzLlxuICAgICAgICB0ZXN0ZXIuZGlnZXN0KCk7XG4gICAgICAgIGV4cGVjdChleGVjdXRlZCkudG9CZSgyKTtcblxuICAgICAgICBleHByZXNzaW9uID0gMjtcbiAgICAgICAgdGVzdGVyLmRpZ2VzdCgpO1xuICAgICAgICBleHBlY3QoZXhlY3V0ZWQpLnRvQmUoMyk7XG5cbiAgICAgICAgLy8gQ2hlY2sgdGhhdCB1bnN1YnNjcmliZSBhY3R1YWxseSBzdG9wcyB0aGUgd2F0Y2guXG4gICAgICAgIGV4cHJlc3Npb24gPSAzO1xuICAgICAgICB0ZXN0ZXIuZGlnZXN0KCk7XG4gICAgICAgIGV4cGVjdChleGVjdXRlZCkudG9CZSgzKTtcbiAgICB9KTtcbn0pO1xuXG5cbiJdfQ==
