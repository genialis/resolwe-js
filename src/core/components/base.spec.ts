import * as _ from 'lodash';
import * as Rx from 'rx';
import * as angular from 'angular';

import {ComponentBase, component} from './base';
import {describeComponent} from '../../tests/component';

describeComponent('base component', [], (tester) => {
    @component({
        module: tester.module,
        directive: 'gen-watch-observable',
    })
    class DummyComponent extends ComponentBase {
        public str: string;
        public strObservable: Rx.Observable<string>;

        public array: string[] = [];
        public arrayObservable: Rx.Observable<string[]>;

        constructor($scope: angular.IScope) {
            super($scope);

            this.strObservable = this.createWatchObservable(() => this.str);
            this.arrayObservable = this.createWatchObservable(() => this.array, true);
        }
    }

    it('should reactively update on shallow component changes', () => {
        const component = tester.createComponent<DummyComponent>(
            DummyComponent.asView().template
        );

        // Test this.str
        const strSpy = jasmine.createSpy('strSpy');
        component.ctrl.strObservable
            .distinctUntilChanged()
            .subscribe((value) => strSpy(_.cloneDeep(value)));

        component.ctrl.str = 'some value';
        tester.digest();

        expect(strSpy.calls.count()).toBe(2);
        expect(strSpy.calls.first().args[0]).toBeUndefined();
        expect(strSpy.calls.mostRecent().args[0]).toBe('some value');
    });

    it('should reactively update on deep component changes', () => {
        const component = tester.createComponent<DummyComponent>(
            DummyComponent.asView().template
        );

        // Test this.array
        const arraySpy = jasmine.createSpy('arraySpy');
        component.ctrl.arrayObservable
            .filter((value) => !_.isEmpty(value))
            .subscribe((value) => arraySpy(_.cloneDeep(value)));

        component.ctrl.array.push('some value');
        tester.digest();
        component.ctrl.array.push('some other value');
        tester.digest();

        expect(arraySpy.calls.all()[0].args[0]).toEqual(['some value']);
        expect(arraySpy.calls.all()[1].args[0]).toEqual(['some value', 'some other value']);
    });
});


