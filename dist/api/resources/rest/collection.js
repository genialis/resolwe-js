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
Object.defineProperty(exports, "__esModule", { value: true });
var rest_resource_1 = require("./rest_resource");
var permissions_1 = require("../addons/permissions");
/**
 * Collection resource class for dealing with collection endpoint.
 */
var CollectionResource = /** @class */ (function (_super) {
    __extends(CollectionResource, _super);
    function CollectionResource(connection) {
        return _super.call(this, 'collection', connection) || this;
    }
    /**
     * Checks if collection slug already exists.
     *
     * @param Slug to check
     */
    CollectionResource.prototype.slugExists = function (slug) {
        return this.connection.get(this.getListMethodPath('slug_exists'), { name: slug });
    };
    /**
     * Adds data objects to collection.
     *
     * @param collectionId Collection id
     * @param dataIds Array of data object ids
     */
    CollectionResource.prototype.addData = function (collectionId, dataIds) {
        return this.callMethod(collectionId, 'add_data', { ids: dataIds });
    };
    /**
     * Removes data objects from collection.
     *
     * @param collectionId Sample id
     * @param dataIds Array of data object ids
     */
    CollectionResource.prototype.removeData = function (collectionId, dataIds) {
        return this.callMethod(collectionId, 'remove_data', { ids: dataIds });
    };
    CollectionResource.prototype.query = function (query, options) {
        if (query === void 0) { query = {}; }
        return _super.prototype.query.call(this, query, options);
    };
    CollectionResource.prototype.queryOne = function (query, options) {
        if (query === void 0) { query = {}; }
        return _super.prototype.queryOne.call(this, query, options);
    };
    CollectionResource.prototype.delete = function (primaryKey, deleteContent) {
        if (deleteContent === void 0) { deleteContent = false; }
        return _super.prototype.delete.call(this, primaryKey, {}, { delete_content: deleteContent });
    };
    CollectionResource.prototype.getPermissions = function (id) {
        return permissions_1.getPermissions(this, id);
    };
    CollectionResource.prototype.setPermissions = function (id, permissions) {
        return permissions_1.setPermissions(this, id, permissions);
    };
    return CollectionResource;
}(rest_resource_1.RESTResource));
exports.CollectionResource = CollectionResource;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL3Jlc3QvY29sbGVjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFHQSxpREFBNkM7QUFFN0MscURBQXFGO0FBR3JGOztHQUVHO0FBQ0g7SUFBd0Msc0NBQThCO0lBRWxFLDRCQUFZLFVBQXNCO2VBQzlCLGtCQUFNLFlBQVksRUFBRSxVQUFVLENBQUM7SUFDbkMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSx1Q0FBVSxHQUFqQixVQUFrQixJQUFZO1FBQzFCLE1BQU0sQ0FBMEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDL0csQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ksb0NBQU8sR0FBZCxVQUFlLFlBQW9CLEVBQUUsT0FBaUI7UUFDbEQsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQU8sWUFBWSxFQUFFLFVBQVUsRUFBRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0lBQzdFLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNJLHVDQUFVLEdBQWpCLFVBQWtCLFlBQW9CLEVBQUUsT0FBaUI7UUFDckQsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQU8sWUFBWSxFQUFFLGFBQWEsRUFBRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0lBQ2hGLENBQUM7SUFJTSxrQ0FBSyxHQUFaLFVBQWEsS0FBdUIsRUFBRSxPQUFzQjtRQUEvQyxzQkFBQSxFQUFBLFVBQXVCO1FBQ2hDLE1BQU0sQ0FBQyxpQkFBTSxLQUFLLFlBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFJTSxxQ0FBUSxHQUFmLFVBQWdCLEtBQXVCLEVBQUUsT0FBc0I7UUFBL0Msc0JBQUEsRUFBQSxVQUF1QjtRQUNuQyxNQUFNLENBQUMsaUJBQU0sUUFBUSxZQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRU0sbUNBQU0sR0FBYixVQUFjLFVBQTJCLEVBQUUsYUFBOEI7UUFBOUIsOEJBQUEsRUFBQSxxQkFBOEI7UUFDckUsTUFBTSxDQUFDLGlCQUFNLE1BQU0sWUFBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLEVBQUUsY0FBYyxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUM7SUFDM0UsQ0FBQztJQUVNLDJDQUFjLEdBQXJCLFVBQXNCLEVBQVU7UUFDNUIsTUFBTSxDQUFDLDRCQUFjLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFTSwyQ0FBYyxHQUFyQixVQUFzQixFQUFVLEVBQUUsV0FBd0M7UUFDdEUsTUFBTSxDQUFDLDRCQUFjLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBQ0wseUJBQUM7QUFBRCxDQTFEQSxBQTBEQyxDQTFEdUMsNEJBQVksR0EwRG5EO0FBMURZLGdEQUFrQiIsImZpbGUiOiJhcGkvcmVzb3VyY2VzL3Jlc3QvY29sbGVjdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJ4IGZyb20gJ3J4JztcblxuaW1wb3J0IHtRdWVyeU9wdGlvbnN9IGZyb20gJy4uLy4uL3Jlc291cmNlJztcbmltcG9ydCB7UkVTVFJlc291cmNlfSBmcm9tICcuL3Jlc3RfcmVzb3VyY2UnO1xuaW1wb3J0IHtDb25uZWN0aW9ufSBmcm9tICcuLi8uLi9jb25uZWN0aW9uJztcbmltcG9ydCB7UGVybWlzc2lvbmFibGUsIGdldFBlcm1pc3Npb25zLCBzZXRQZXJtaXNzaW9uc30gZnJvbSAnLi4vYWRkb25zL3Blcm1pc3Npb25zJztcbmltcG9ydCAqIGFzIHR5cGVzIGZyb20gJy4uLy4uL3R5cGVzL3Jlc3QnO1xuXG4vKipcbiAqIENvbGxlY3Rpb24gcmVzb3VyY2UgY2xhc3MgZm9yIGRlYWxpbmcgd2l0aCBjb2xsZWN0aW9uIGVuZHBvaW50LlxuICovXG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvblJlc291cmNlIGV4dGVuZHMgUkVTVFJlc291cmNlPHR5cGVzLkNvbGxlY3Rpb24+IGltcGxlbWVudHMgUGVybWlzc2lvbmFibGUge1xuXG4gICAgY29uc3RydWN0b3IoY29ubmVjdGlvbjogQ29ubmVjdGlvbikge1xuICAgICAgICBzdXBlcignY29sbGVjdGlvbicsIGNvbm5lY3Rpb24pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBjb2xsZWN0aW9uIHNsdWcgYWxyZWFkeSBleGlzdHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gU2x1ZyB0byBjaGVja1xuICAgICAqL1xuICAgIHB1YmxpYyBzbHVnRXhpc3RzKHNsdWc6IHN0cmluZyk6IFJ4Lk9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICAgICAgICByZXR1cm4gPFJ4Lk9ic2VydmFibGU8Ym9vbGVhbj4+IHRoaXMuY29ubmVjdGlvbi5nZXQodGhpcy5nZXRMaXN0TWV0aG9kUGF0aCgnc2x1Z19leGlzdHMnKSwgeyBuYW1lOiBzbHVnIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgZGF0YSBvYmplY3RzIHRvIGNvbGxlY3Rpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29sbGVjdGlvbklkIENvbGxlY3Rpb24gaWRcbiAgICAgKiBAcGFyYW0gZGF0YUlkcyBBcnJheSBvZiBkYXRhIG9iamVjdCBpZHNcbiAgICAgKi9cbiAgICBwdWJsaWMgYWRkRGF0YShjb2xsZWN0aW9uSWQ6IG51bWJlciwgZGF0YUlkczogbnVtYmVyW10pOiBSeC5PYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZDx2b2lkPihjb2xsZWN0aW9uSWQsICdhZGRfZGF0YScsIHsgaWRzOiBkYXRhSWRzIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgZGF0YSBvYmplY3RzIGZyb20gY29sbGVjdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb2xsZWN0aW9uSWQgU2FtcGxlIGlkXG4gICAgICogQHBhcmFtIGRhdGFJZHMgQXJyYXkgb2YgZGF0YSBvYmplY3QgaWRzXG4gICAgICovXG4gICAgcHVibGljIHJlbW92ZURhdGEoY29sbGVjdGlvbklkOiBudW1iZXIsIGRhdGFJZHM6IG51bWJlcltdKTogUnguT2JzZXJ2YWJsZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2Q8dm9pZD4oY29sbGVjdGlvbklkLCAncmVtb3ZlX2RhdGEnLCB7IGlkczogZGF0YUlkcyB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcXVlcnkocXVlcnk/OiB0eXBlcy5RdWVyeU9iamVjdCwgb3B0aW9ucz86IFF1ZXJ5T3B0aW9ucyk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuQ29sbGVjdGlvbltdPjtcbiAgICBwdWJsaWMgcXVlcnkocXVlcnk6IHR5cGVzLlF1ZXJ5T2JqZWN0SHlkcmF0ZURhdGEsIG9wdGlvbnM/OiBRdWVyeU9wdGlvbnMpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLkNvbGxlY3Rpb25IeWRyYXRlRGF0YVtdPjtcbiAgICBwdWJsaWMgcXVlcnkocXVlcnk6IHR5cGVzLlF1ZXJ5ID0ge30sIG9wdGlvbnM/OiBRdWVyeU9wdGlvbnMpOiBSeC5PYnNlcnZhYmxlPGFueT4ge1xuICAgICAgICByZXR1cm4gc3VwZXIucXVlcnkocXVlcnksIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIHB1YmxpYyBxdWVyeU9uZShxdWVyeT86IHR5cGVzLlF1ZXJ5T2JqZWN0LCBvcHRpb25zPzogUXVlcnlPcHRpb25zKTogUnguT2JzZXJ2YWJsZTx0eXBlcy5Db2xsZWN0aW9uPjtcbiAgICBwdWJsaWMgcXVlcnlPbmUocXVlcnk6IHR5cGVzLlF1ZXJ5T2JqZWN0SHlkcmF0ZURhdGEsIG9wdGlvbnM/OiBRdWVyeU9wdGlvbnMpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLkNvbGxlY3Rpb25IeWRyYXRlRGF0YT47XG4gICAgcHVibGljIHF1ZXJ5T25lKHF1ZXJ5OiB0eXBlcy5RdWVyeSA9IHt9LCBvcHRpb25zPzogUXVlcnlPcHRpb25zKTogUnguT2JzZXJ2YWJsZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIHN1cGVyLnF1ZXJ5T25lKHF1ZXJ5LCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVsZXRlKHByaW1hcnlLZXk6IG51bWJlciB8IHN0cmluZywgZGVsZXRlQ29udGVudDogYm9vbGVhbiA9IGZhbHNlKTogUnguT2JzZXJ2YWJsZTxPYmplY3Q+IHtcbiAgICAgICAgcmV0dXJuIHN1cGVyLmRlbGV0ZShwcmltYXJ5S2V5LCB7fSwgeyBkZWxldGVfY29udGVudDogZGVsZXRlQ29udGVudCB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0UGVybWlzc2lvbnMoaWQ6IG51bWJlcik6IFJ4Lk9ic2VydmFibGU8dHlwZXMuSXRlbVBlcm1pc3Npb25zW10+IHtcbiAgICAgICAgcmV0dXJuIGdldFBlcm1pc3Npb25zKHRoaXMsIGlkKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0UGVybWlzc2lvbnMoaWQ6IG51bWJlciwgcGVybWlzc2lvbnM6IHR5cGVzLlNldFBlcm1pc3Npb25zUmVxdWVzdCk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuSXRlbVBlcm1pc3Npb25zW10+IHtcbiAgICAgICAgcmV0dXJuIHNldFBlcm1pc3Npb25zKHRoaXMsIGlkLCBwZXJtaXNzaW9ucyk7XG4gICAgfVxufVxuIl19
