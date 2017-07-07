"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var rest_resource_1 = require("./rest_resource");
var permissions_1 = require("../addons/permissions");
/**
 * Collection resource class for dealing with collection endpoint.
 */
var CollectionResource = (function (_super) {
    __extends(CollectionResource, _super);
    function CollectionResource(connection) {
        return _super.call(this, 'collection', connection) || this;
    }
    /**
     * Checks if collection slug already exists.
     *
     * @param {string} Slug to check
     * @return {Rx.Observable<boolean>} An observable that emits the response
     */
    CollectionResource.prototype.slugExists = function (slug) {
        return this.connection.get(this.getListMethodPath('slug_exists'), { name: slug });
    };
    /**
     * Adds data objects to collection.
     *
     * @param collectionId Collection id
     * @param dataIds Array of data object ids
     * @returns {Rx.Observable<void>}
     */
    CollectionResource.prototype.addData = function (collectionId, dataIds) {
        return this.connection.post(this.getDetailMethodPath(collectionId, 'add_data'), { ids: dataIds });
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL3Jlc3QvY29sbGVjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFHQSxpREFBNkM7QUFFN0MscURBQXFGO0FBR3JGOztHQUVHO0FBQ0g7SUFBd0Msc0NBQThCO0lBRWxFLDRCQUFZLFVBQXNCO2VBQzlCLGtCQUFNLFlBQVksRUFBRSxVQUFVLENBQUM7SUFDbkMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ksdUNBQVUsR0FBakIsVUFBa0IsSUFBWTtRQUMxQixNQUFNLENBQTBCLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQy9HLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSSxvQ0FBTyxHQUFkLFVBQWUsWUFBb0IsRUFBRSxPQUFpQjtRQUNsRCxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0lBQzVHLENBQUM7SUFJTSxrQ0FBSyxHQUFaLFVBQWEsS0FBdUIsRUFBRSxPQUFzQjtRQUEvQyxzQkFBQSxFQUFBLFVBQXVCO1FBQ2hDLE1BQU0sQ0FBQyxpQkFBTSxLQUFLLFlBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFJTSxxQ0FBUSxHQUFmLFVBQWdCLEtBQXVCLEVBQUUsT0FBc0I7UUFBL0Msc0JBQUEsRUFBQSxVQUF1QjtRQUNuQyxNQUFNLENBQUMsaUJBQU0sUUFBUSxZQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRU0sbUNBQU0sR0FBYixVQUFjLFVBQTJCLEVBQUUsYUFBOEI7UUFBOUIsOEJBQUEsRUFBQSxxQkFBOEI7UUFDckUsTUFBTSxDQUFDLGlCQUFNLE1BQU0sWUFBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLEVBQUUsY0FBYyxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUM7SUFDM0UsQ0FBQztJQUVNLDJDQUFjLEdBQXJCLFVBQXNCLEVBQVU7UUFDNUIsTUFBTSxDQUFDLDRCQUFjLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFTSwyQ0FBYyxHQUFyQixVQUFzQixFQUFVLEVBQUUsV0FBd0M7UUFDdEUsTUFBTSxDQUFDLDRCQUFjLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBQ0wseUJBQUM7QUFBRCxDQWxEQSxBQWtEQyxDQWxEdUMsNEJBQVksR0FrRG5EO0FBbERZLGdEQUFrQiIsImZpbGUiOiJhcGkvcmVzb3VyY2VzL3Jlc3QvY29sbGVjdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJ4IGZyb20gJ3J4JztcblxuaW1wb3J0IHtRdWVyeU9wdGlvbnN9IGZyb20gJy4uLy4uL3Jlc291cmNlJztcbmltcG9ydCB7UkVTVFJlc291cmNlfSBmcm9tICcuL3Jlc3RfcmVzb3VyY2UnO1xuaW1wb3J0IHtDb25uZWN0aW9ufSBmcm9tICcuLi8uLi9jb25uZWN0aW9uJztcbmltcG9ydCB7UGVybWlzc2lvbmFibGUsIGdldFBlcm1pc3Npb25zLCBzZXRQZXJtaXNzaW9uc30gZnJvbSAnLi4vYWRkb25zL3Blcm1pc3Npb25zJztcbmltcG9ydCAqIGFzIHR5cGVzIGZyb20gJy4uLy4uL3R5cGVzL3Jlc3QnO1xuXG4vKipcbiAqIENvbGxlY3Rpb24gcmVzb3VyY2UgY2xhc3MgZm9yIGRlYWxpbmcgd2l0aCBjb2xsZWN0aW9uIGVuZHBvaW50LlxuICovXG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvblJlc291cmNlIGV4dGVuZHMgUkVTVFJlc291cmNlPHR5cGVzLkNvbGxlY3Rpb24+IGltcGxlbWVudHMgUGVybWlzc2lvbmFibGUge1xuXG4gICAgY29uc3RydWN0b3IoY29ubmVjdGlvbjogQ29ubmVjdGlvbikge1xuICAgICAgICBzdXBlcignY29sbGVjdGlvbicsIGNvbm5lY3Rpb24pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBjb2xsZWN0aW9uIHNsdWcgYWxyZWFkeSBleGlzdHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gU2x1ZyB0byBjaGVja1xuICAgICAqIEByZXR1cm4ge1J4Lk9ic2VydmFibGU8Ym9vbGVhbj59IEFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB0aGUgcmVzcG9uc2VcbiAgICAgKi9cbiAgICBwdWJsaWMgc2x1Z0V4aXN0cyhzbHVnOiBzdHJpbmcpOiBSeC5PYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICAgICAgcmV0dXJuIDxSeC5PYnNlcnZhYmxlPGJvb2xlYW4+PiB0aGlzLmNvbm5lY3Rpb24uZ2V0KHRoaXMuZ2V0TGlzdE1ldGhvZFBhdGgoJ3NsdWdfZXhpc3RzJyksIHsgbmFtZTogc2x1ZyB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGRhdGEgb2JqZWN0cyB0byBjb2xsZWN0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbGxlY3Rpb25JZCBDb2xsZWN0aW9uIGlkXG4gICAgICogQHBhcmFtIGRhdGFJZHMgQXJyYXkgb2YgZGF0YSBvYmplY3QgaWRzXG4gICAgICogQHJldHVybnMge1J4Lk9ic2VydmFibGU8dm9pZD59XG4gICAgICovXG4gICAgcHVibGljIGFkZERhdGEoY29sbGVjdGlvbklkOiBudW1iZXIsIGRhdGFJZHM6IG51bWJlcltdKTogUnguT2JzZXJ2YWJsZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbm5lY3Rpb24ucG9zdDx2b2lkPih0aGlzLmdldERldGFpbE1ldGhvZFBhdGgoY29sbGVjdGlvbklkLCAnYWRkX2RhdGEnKSwgeyBpZHM6IGRhdGFJZHMgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIHF1ZXJ5KHF1ZXJ5PzogdHlwZXMuUXVlcnlPYmplY3QsIG9wdGlvbnM/OiBRdWVyeU9wdGlvbnMpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLkNvbGxlY3Rpb25bXT47XG4gICAgcHVibGljIHF1ZXJ5KHF1ZXJ5OiB0eXBlcy5RdWVyeU9iamVjdEh5ZHJhdGVEYXRhLCBvcHRpb25zPzogUXVlcnlPcHRpb25zKTogUnguT2JzZXJ2YWJsZTx0eXBlcy5Db2xsZWN0aW9uSHlkcmF0ZURhdGFbXT47XG4gICAgcHVibGljIHF1ZXJ5KHF1ZXJ5OiB0eXBlcy5RdWVyeSA9IHt9LCBvcHRpb25zPzogUXVlcnlPcHRpb25zKTogUnguT2JzZXJ2YWJsZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIHN1cGVyLnF1ZXJ5KHF1ZXJ5LCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcXVlcnlPbmUocXVlcnk/OiB0eXBlcy5RdWVyeU9iamVjdCwgb3B0aW9ucz86IFF1ZXJ5T3B0aW9ucyk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuQ29sbGVjdGlvbj47XG4gICAgcHVibGljIHF1ZXJ5T25lKHF1ZXJ5OiB0eXBlcy5RdWVyeU9iamVjdEh5ZHJhdGVEYXRhLCBvcHRpb25zPzogUXVlcnlPcHRpb25zKTogUnguT2JzZXJ2YWJsZTx0eXBlcy5Db2xsZWN0aW9uSHlkcmF0ZURhdGE+O1xuICAgIHB1YmxpYyBxdWVyeU9uZShxdWVyeTogdHlwZXMuUXVlcnkgPSB7fSwgb3B0aW9ucz86IFF1ZXJ5T3B0aW9ucyk6IFJ4Lk9ic2VydmFibGU8YW55PiB7XG4gICAgICAgIHJldHVybiBzdXBlci5xdWVyeU9uZShxdWVyeSwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgcHVibGljIGRlbGV0ZShwcmltYXJ5S2V5OiBudW1iZXIgfCBzdHJpbmcsIGRlbGV0ZUNvbnRlbnQ6IGJvb2xlYW4gPSBmYWxzZSk6IFJ4Lk9ic2VydmFibGU8T2JqZWN0PiB7XG4gICAgICAgIHJldHVybiBzdXBlci5kZWxldGUocHJpbWFyeUtleSwge30sIHsgZGVsZXRlX2NvbnRlbnQ6IGRlbGV0ZUNvbnRlbnQgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFBlcm1pc3Npb25zKGlkOiBudW1iZXIpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLkl0ZW1QZXJtaXNzaW9uc1tdPiB7XG4gICAgICAgIHJldHVybiBnZXRQZXJtaXNzaW9ucyh0aGlzLCBpZCk7XG4gICAgfVxuXG4gICAgcHVibGljIHNldFBlcm1pc3Npb25zKGlkOiBudW1iZXIsIHBlcm1pc3Npb25zOiB0eXBlcy5TZXRQZXJtaXNzaW9uc1JlcXVlc3QpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLkl0ZW1QZXJtaXNzaW9uc1tdPiB7XG4gICAgICAgIHJldHVybiBzZXRQZXJtaXNzaW9ucyh0aGlzLCBpZCwgcGVybWlzc2lvbnMpO1xuICAgIH1cbn1cbiJdfQ==
