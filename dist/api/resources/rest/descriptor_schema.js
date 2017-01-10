"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var rest_resource_1 = require("./rest_resource");
var permissions_1 = require("../addons/permissions");
/**
 * Data resource class for dealing with descriptor schema endpoint.
 */
var DescriptorSchemaResource = (function (_super) {
    __extends(DescriptorSchemaResource, _super);
    function DescriptorSchemaResource(connection) {
        return _super.call(this, 'descriptorschema', connection) || this;
    }
    DescriptorSchemaResource.prototype.getPermissions = function (id) {
        return permissions_1.getPermissions(this, id);
    };
    DescriptorSchemaResource.prototype.setPermissions = function (id, permissions) {
        return permissions_1.setPermissions(this, id, permissions);
    };
    return DescriptorSchemaResource;
}(rest_resource_1.RESTResource));
exports.DescriptorSchemaResource = DescriptorSchemaResource;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL3Jlc3QvZGVzY3JpcHRvcl9zY2hlbWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsaURBQTZDO0FBRTdDLHFEQUFxRjtBQUdyRjs7R0FFRztBQUNIO0lBQThDLDRDQUFvQztJQUU5RSxrQ0FBWSxVQUFzQjtlQUM5QixrQkFBTSxrQkFBa0IsRUFBRSxVQUFVLENBQUM7SUFDekMsQ0FBQztJQUVNLGlEQUFjLEdBQXJCLFVBQXNCLEVBQVU7UUFDNUIsTUFBTSxDQUFDLDRCQUFjLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFTSxpREFBYyxHQUFyQixVQUFzQixFQUFVLEVBQUUsV0FBd0M7UUFDdEUsTUFBTSxDQUFDLDRCQUFjLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBQ0wsK0JBQUM7QUFBRCxDQWJBLEFBYUMsQ0FiNkMsNEJBQVksR0FhekQ7QUFiWSw0REFBd0IiLCJmaWxlIjoiYXBpL3Jlc291cmNlcy9yZXN0L2Rlc2NyaXB0b3Jfc2NoZW1hLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtSRVNUUmVzb3VyY2V9IGZyb20gJy4vcmVzdF9yZXNvdXJjZSc7XG5pbXBvcnQge0Nvbm5lY3Rpb259IGZyb20gJy4uLy4uL2Nvbm5lY3Rpb24nO1xuaW1wb3J0IHtQZXJtaXNzaW9uYWJsZSwgZ2V0UGVybWlzc2lvbnMsIHNldFBlcm1pc3Npb25zfSBmcm9tICcuLi9hZGRvbnMvcGVybWlzc2lvbnMnO1xuaW1wb3J0ICogYXMgdHlwZXMgZnJvbSAnLi4vLi4vdHlwZXMvcmVzdCc7XG5cbi8qKlxuICogRGF0YSByZXNvdXJjZSBjbGFzcyBmb3IgZGVhbGluZyB3aXRoIGRlc2NyaXB0b3Igc2NoZW1hIGVuZHBvaW50LlxuICovXG5leHBvcnQgY2xhc3MgRGVzY3JpcHRvclNjaGVtYVJlc291cmNlIGV4dGVuZHMgUkVTVFJlc291cmNlPHR5cGVzLkRlc2NyaXB0b3JTY2hlbWE+IGltcGxlbWVudHMgUGVybWlzc2lvbmFibGUge1xuXG4gICAgY29uc3RydWN0b3IoY29ubmVjdGlvbjogQ29ubmVjdGlvbikge1xuICAgICAgICBzdXBlcignZGVzY3JpcHRvcnNjaGVtYScsIGNvbm5lY3Rpb24pO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRQZXJtaXNzaW9ucyhpZDogbnVtYmVyKTogUnguT2JzZXJ2YWJsZTx0eXBlcy5JdGVtUGVybWlzc2lvbnNbXT4ge1xuICAgICAgICByZXR1cm4gZ2V0UGVybWlzc2lvbnModGhpcywgaWQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXRQZXJtaXNzaW9ucyhpZDogbnVtYmVyLCBwZXJtaXNzaW9uczogdHlwZXMuU2V0UGVybWlzc2lvbnNSZXF1ZXN0KTogUnguT2JzZXJ2YWJsZTx0eXBlcy5JdGVtUGVybWlzc2lvbnNbXT4ge1xuICAgICAgICByZXR1cm4gc2V0UGVybWlzc2lvbnModGhpcywgaWQsIHBlcm1pc3Npb25zKTtcbiAgICB9XG59XG4iXX0=
