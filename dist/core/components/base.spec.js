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
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL2NvbXBvbmVudHMvYmFzZS5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDBCQUE0QjtBQUk1QiwrQkFBZ0Q7QUFDaEQsbURBQXdEO0FBRXhELDZCQUFpQixDQUFDLGdCQUFnQixFQUFFLEVBQUUsRUFBRSxVQUFDLE1BQU07SUFLM0MsSUFBTSxjQUFjO1FBQVMsa0NBQWE7UUFPdEMsd0JBQVksTUFBc0I7WUFBbEMsWUFDSSxrQkFBTSxNQUFNLENBQUMsU0FJaEI7WUFSTSxXQUFLLEdBQWEsRUFBRSxDQUFDO1lBTXhCLEtBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSSxDQUFDLHFCQUFxQixDQUFDLGNBQU0sT0FBQSxLQUFJLENBQUMsR0FBRyxFQUFSLENBQVEsQ0FBQyxDQUFDO1lBQ2hFLEtBQUksQ0FBQyxlQUFlLEdBQUcsS0FBSSxDQUFDLHFCQUFxQixDQUFDLGNBQU0sT0FBQSxLQUFJLENBQUMsS0FBSyxFQUFWLENBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQzs7UUFDOUUsQ0FBQztRQUNMLHFCQUFDO0lBQUQsQ0FiQSxBQWFDLENBYjRCLG9CQUFhLEdBYXpDO0lBYkssY0FBYztRQUpuQixnQkFBUyxDQUFDO1lBQ1AsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNO1lBQ3JCLFNBQVMsRUFBRSxzQkFBc0I7U0FDcEMsQ0FBQztPQUNJLGNBQWMsQ0FhbkI7SUFFRCxFQUFFLENBQUMsdURBQXVELEVBQUU7UUFDeEQsSUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLGVBQWUsQ0FDcEMsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FDbkMsQ0FBQztRQUVGLGdCQUFnQjtRQUNoQixJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzNDLFNBQVMsQ0FBQyxJQUFJLENBQUMsYUFBYTthQUN2QixvQkFBb0IsRUFBRTthQUN0QixTQUFTLENBQUMsVUFBQyxLQUFLLElBQUssT0FBQSxNQUFNLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUExQixDQUEwQixDQUFDLENBQUM7UUFFdEQsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsWUFBWSxDQUFDO1FBQ2xDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUVoQixNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyQyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUNyRCxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDakUsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsb0RBQW9ELEVBQUU7UUFDckQsSUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLGVBQWUsQ0FDcEMsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FDbkMsQ0FBQztRQUVGLGtCQUFrQjtRQUNsQixJQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQy9DLFNBQVMsQ0FBQyxJQUFJLENBQUMsZUFBZTthQUN6QixNQUFNLENBQUMsVUFBQyxLQUFLLElBQUssT0FBQSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQWpCLENBQWlCLENBQUM7YUFDcEMsU0FBUyxDQUFDLFVBQUMsS0FBSyxJQUFLLE9BQUEsUUFBUSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBNUIsQ0FBNEIsQ0FBQyxDQUFDO1FBRXhELFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUN4QyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDaEIsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDOUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBRWhCLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDaEUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsWUFBWSxFQUFFLGtCQUFrQixDQUFDLENBQUMsQ0FBQztJQUN4RixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQyxDQUFDIiwiZmlsZSI6ImNvcmUvY29tcG9uZW50cy9iYXNlLnNwZWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgKiBhcyBSeCBmcm9tICdyeCc7XG5pbXBvcnQgKiBhcyBhbmd1bGFyIGZyb20gJ2FuZ3VsYXInO1xuXG5pbXBvcnQge0NvbXBvbmVudEJhc2UsIGNvbXBvbmVudH0gZnJvbSAnLi9iYXNlJztcbmltcG9ydCB7ZGVzY3JpYmVDb21wb25lbnR9IGZyb20gJy4uLy4uL3Rlc3RzL2NvbXBvbmVudCc7XG5cbmRlc2NyaWJlQ29tcG9uZW50KCdiYXNlIGNvbXBvbmVudCcsIFtdLCAodGVzdGVyKSA9PiB7XG4gICAgQGNvbXBvbmVudCh7XG4gICAgICAgIG1vZHVsZTogdGVzdGVyLm1vZHVsZSxcbiAgICAgICAgZGlyZWN0aXZlOiAnZ2VuLXdhdGNoLW9ic2VydmFibGUnLFxuICAgIH0pXG4gICAgY2xhc3MgRHVtbXlDb21wb25lbnQgZXh0ZW5kcyBDb21wb25lbnRCYXNlIHtcbiAgICAgICAgcHVibGljIHN0cjogc3RyaW5nO1xuICAgICAgICBwdWJsaWMgc3RyT2JzZXJ2YWJsZTogUnguT2JzZXJ2YWJsZTxzdHJpbmc+O1xuXG4gICAgICAgIHB1YmxpYyBhcnJheTogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgcHVibGljIGFycmF5T2JzZXJ2YWJsZTogUnguT2JzZXJ2YWJsZTxzdHJpbmdbXT47XG5cbiAgICAgICAgY29uc3RydWN0b3IoJHNjb3BlOiBhbmd1bGFyLklTY29wZSkge1xuICAgICAgICAgICAgc3VwZXIoJHNjb3BlKTtcblxuICAgICAgICAgICAgdGhpcy5zdHJPYnNlcnZhYmxlID0gdGhpcy5jcmVhdGVXYXRjaE9ic2VydmFibGUoKCkgPT4gdGhpcy5zdHIpO1xuICAgICAgICAgICAgdGhpcy5hcnJheU9ic2VydmFibGUgPSB0aGlzLmNyZWF0ZVdhdGNoT2JzZXJ2YWJsZSgoKSA9PiB0aGlzLmFycmF5LCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGl0KCdzaG91bGQgcmVhY3RpdmVseSB1cGRhdGUgb24gc2hhbGxvdyBjb21wb25lbnQgY2hhbmdlcycsICgpID0+IHtcbiAgICAgICAgY29uc3QgY29tcG9uZW50ID0gdGVzdGVyLmNyZWF0ZUNvbXBvbmVudDxEdW1teUNvbXBvbmVudD4oXG4gICAgICAgICAgICBEdW1teUNvbXBvbmVudC5hc1ZpZXcoKS50ZW1wbGF0ZVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIFRlc3QgdGhpcy5zdHJcbiAgICAgICAgY29uc3Qgc3RyU3B5ID0gamFzbWluZS5jcmVhdGVTcHkoJ3N0clNweScpO1xuICAgICAgICBjb21wb25lbnQuY3RybC5zdHJPYnNlcnZhYmxlXG4gICAgICAgICAgICAuZGlzdGluY3RVbnRpbENoYW5nZWQoKVxuICAgICAgICAgICAgLnN1YnNjcmliZSgodmFsdWUpID0+IHN0clNweShfLmNsb25lRGVlcCh2YWx1ZSkpKTtcblxuICAgICAgICBjb21wb25lbnQuY3RybC5zdHIgPSAnc29tZSB2YWx1ZSc7XG4gICAgICAgIHRlc3Rlci5kaWdlc3QoKTtcblxuICAgICAgICBleHBlY3Qoc3RyU3B5LmNhbGxzLmNvdW50KCkpLnRvQmUoMik7XG4gICAgICAgIGV4cGVjdChzdHJTcHkuY2FsbHMuZmlyc3QoKS5hcmdzWzBdKS50b0JlVW5kZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdChzdHJTcHkuY2FsbHMubW9zdFJlY2VudCgpLmFyZ3NbMF0pLnRvQmUoJ3NvbWUgdmFsdWUnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmVhY3RpdmVseSB1cGRhdGUgb24gZGVlcCBjb21wb25lbnQgY2hhbmdlcycsICgpID0+IHtcbiAgICAgICAgY29uc3QgY29tcG9uZW50ID0gdGVzdGVyLmNyZWF0ZUNvbXBvbmVudDxEdW1teUNvbXBvbmVudD4oXG4gICAgICAgICAgICBEdW1teUNvbXBvbmVudC5hc1ZpZXcoKS50ZW1wbGF0ZVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIFRlc3QgdGhpcy5hcnJheVxuICAgICAgICBjb25zdCBhcnJheVNweSA9IGphc21pbmUuY3JlYXRlU3B5KCdhcnJheVNweScpO1xuICAgICAgICBjb21wb25lbnQuY3RybC5hcnJheU9ic2VydmFibGVcbiAgICAgICAgICAgIC5maWx0ZXIoKHZhbHVlKSA9PiAhXy5pc0VtcHR5KHZhbHVlKSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKHZhbHVlKSA9PiBhcnJheVNweShfLmNsb25lRGVlcCh2YWx1ZSkpKTtcblxuICAgICAgICBjb21wb25lbnQuY3RybC5hcnJheS5wdXNoKCdzb21lIHZhbHVlJyk7XG4gICAgICAgIHRlc3Rlci5kaWdlc3QoKTtcbiAgICAgICAgY29tcG9uZW50LmN0cmwuYXJyYXkucHVzaCgnc29tZSBvdGhlciB2YWx1ZScpO1xuICAgICAgICB0ZXN0ZXIuZGlnZXN0KCk7XG5cbiAgICAgICAgZXhwZWN0KGFycmF5U3B5LmNhbGxzLmFsbCgpWzBdLmFyZ3NbMF0pLnRvRXF1YWwoWydzb21lIHZhbHVlJ10pO1xuICAgICAgICBleHBlY3QoYXJyYXlTcHkuY2FsbHMuYWxsKClbMV0uYXJnc1swXSkudG9FcXVhbChbJ3NvbWUgdmFsdWUnLCAnc29tZSBvdGhlciB2YWx1ZSddKTtcbiAgICB9KTtcbn0pO1xuXG5cbiJdfQ==
