import {makeSafelySerializable, parseSafelySerializable, verboseSerialize, SerializationError} from './serialization';
import {describeComponent} from '../../tests/component';

describeComponent('serialization', [], () => {
    const jsonSupported = {
        a: 1,
        b: [null, 'b'],
    };
    const jsonUnsupported = {
        a: 1,
        b: undefined,
        c: {
            d: NaN,
            e: [NaN, 5, null],
        },
    };
    const jsonUnsupportable = {
        a: () => 1,
        b: new class B { public a = 2; },
        c: Promise.resolve(3),
    };
    const jsonKeyword = {
        a: '__undefined__',
    };

    function jsonClone(value: any): any {
        return JSON.parse(JSON.stringify(value));
    }
    function partialSerializationClone(value: any): any {
        return parseSafelySerializable(JSON.parse(JSON.stringify(makeSafelySerializable(value))));
    }

    describe('makeSafelySerializable and parseSafelySerializable', () => {
        it('should not change objects supported by JSON.stringify', () => {
            expect(makeSafelySerializable(jsonSupported)).toEqual(jsonSupported);
        });

        it('should retain more information than just JSON.stringify', () => {
            expect(jsonClone(jsonSupported)).toEqual(jsonSupported);
            expect(partialSerializationClone(jsonSupported)).toEqual(jsonSupported);

            expect(jsonClone(jsonUnsupported)).not.toEqual(jsonUnsupported);
            expect(partialSerializationClone(jsonUnsupported)).toEqual(jsonUnsupported);
        });

        it('should warn about non-serializable input', () => {
            expect(jsonClone(jsonUnsupportable)).not.toEqual(jsonUnsupportable);
            expect(() => partialSerializationClone(jsonUnsupportable)).toThrowError(SerializationError);
            expect(() => partialSerializationClone(jsonUnsupportable.a)).toThrowError(SerializationError);
            expect(() => partialSerializationClone(jsonUnsupportable.b)).toThrowError(SerializationError);
            expect(() => partialSerializationClone(jsonUnsupportable.c)).toThrowError(SerializationError);
            expect(() => partialSerializationClone(jsonKeyword)).toThrowError(SerializationError);
        });
    });

    describe('verboseSerialize', () => {
        it('should retain more information than partial serialization', () => {
            expect(verboseSerialize(jsonSupported)).toEqual('{"a":1,"b":[null,"b"]}');
            expect(verboseSerialize(jsonUnsupported)).toEqual('{"a":1,"b":"__undefined__","c":{"d":"__NaN__","e":["__NaN__",5,null]}}');
            expect(verboseSerialize(jsonUnsupportable)).toEqual(
                '{"a":"function () { return 1; }","b":{"a":2},"c":{"_handler":{"handler":{"value":3}}}}'
            );
            expect(verboseSerialize(jsonKeyword)).toEqual('{"a":"__undefined__"}');
        });
    });
});
