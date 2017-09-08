"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var angular = require("angular");
exports.ngEqualMatcher = {
    toNgEqual: function () {
        return {
            compare: function (actual, expected) {
                return { pass: angular.equals(actual, expected) };
            },
        };
    },
};

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy90ZXN0cy9tYXRjaGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlDQUFtQztBQUV0QixRQUFBLGNBQWMsR0FBRztJQUMxQixTQUFTLEVBQUU7UUFDUCxNQUFNLENBQUM7WUFDSCxPQUFPLEVBQUUsVUFBUyxNQUFNLEVBQUUsUUFBUTtnQkFDOUIsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDdEQsQ0FBQztTQUNKLENBQUM7SUFDTixDQUFDO0NBQ0osQ0FBQyIsImZpbGUiOiJ0ZXN0cy9tYXRjaGVycy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFuZ3VsYXIgZnJvbSAnYW5ndWxhcic7XG5cbmV4cG9ydCBjb25zdCBuZ0VxdWFsTWF0Y2hlciA9IHtcbiAgICB0b05nRXF1YWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29tcGFyZTogZnVuY3Rpb24oYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHBhc3M6IGFuZ3VsYXIuZXF1YWxzKGFjdHVhbCwgZXhwZWN0ZWQpIH07XG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgIH0sXG59O1xuXG5kZWNsYXJlIGdsb2JhbCB7XG4gICAgZXhwb3J0IG5hbWVzcGFjZSBqYXNtaW5lIHtcbiAgICAgICAgaW50ZXJmYWNlIE1hdGNoZXJzIHtcbiAgICAgICAgICAgIHRvTmdFcXVhbChleHBlY3RlZDogYW55KTogYm9vbGVhbjtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==
