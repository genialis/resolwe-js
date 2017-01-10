"use strict";
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy90ZXN0cy9tYXRjaGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsaUNBQW1DO0FBRXRCLFFBQUEsY0FBYyxHQUFHO0lBQzFCLFNBQVMsRUFBRTtRQUNQLE1BQU0sQ0FBQztZQUNILE9BQU8sRUFBRSxVQUFTLE1BQU0sRUFBRSxRQUFRO2dCQUM5QixNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUN0RCxDQUFDO1NBQ0osQ0FBQztJQUNOLENBQUM7Q0FDSixDQUFDIiwiZmlsZSI6InRlc3RzL21hdGNoZXJzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYW5ndWxhciBmcm9tICdhbmd1bGFyJztcblxuZXhwb3J0IGNvbnN0IG5nRXF1YWxNYXRjaGVyID0ge1xuICAgIHRvTmdFcXVhbDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb21wYXJlOiBmdW5jdGlvbihhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgcGFzczogYW5ndWxhci5lcXVhbHMoYWN0dWFsLCBleHBlY3RlZCkgfTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgfSxcbn07XG5cbmRlY2xhcmUgZ2xvYmFsIHtcbiAgICBleHBvcnQgbmFtZXNwYWNlIGphc21pbmUge1xuICAgICAgICBpbnRlcmZhY2UgTWF0Y2hlcnMge1xuICAgICAgICAgICAgdG9OZ0VxdWFsKGV4cGVjdGVkOiBhbnkpOiBib29sZWFuO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19
