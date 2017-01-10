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
        return this.connection.get('/api/' + this.name + '/slug_exists', { name: slug });
    };
    /**
     * Adds data objects to collection.
     *
     * @param collectionId Collection id
     * @param dataIds Array of data object ids
     * @returns {Rx.Observable<void>}
     */
    CollectionResource.prototype.addData = function (collectionId, dataIds) {
        return this.connection.post('/api/' + this.name + '/' + collectionId + '/add_data', { ids: dataIds });
    };
    CollectionResource.prototype.query = function (query) {
        if (query === void 0) { query = {}; }
        return _super.prototype.query.call(this, query);
    };
    CollectionResource.prototype.queryOne = function (query) {
        if (query === void 0) { query = {}; }
        return _super.prototype.queryOne.call(this, query);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL3Jlc3QvY29sbGVjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFFQSxpREFBNkM7QUFFN0MscURBQXFGO0FBR3JGOztHQUVHO0FBQ0g7SUFBd0Msc0NBQThCO0lBRWxFLDRCQUFZLFVBQXNCO2VBQzlCLGtCQUFNLFlBQVksRUFBRSxVQUFVLENBQUM7SUFDbkMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ksdUNBQVUsR0FBakIsVUFBa0IsSUFBWTtRQUMxQixNQUFNLENBQTBCLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLGNBQWMsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzlHLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSSxvQ0FBTyxHQUFkLFVBQWUsWUFBb0IsRUFBRSxPQUFpQjtRQUNsRCxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQU8sT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxHQUFHLFlBQVksR0FBRyxXQUFXLEVBQUUsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztJQUNoSCxDQUFDO0lBSU0sa0NBQUssR0FBWixVQUFhLEtBQXVCO1FBQXZCLHNCQUFBLEVBQUEsVUFBdUI7UUFDaEMsTUFBTSxDQUFDLGlCQUFNLEtBQUssWUFBQyxLQUFLLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBSU0scUNBQVEsR0FBZixVQUFnQixLQUF1QjtRQUF2QixzQkFBQSxFQUFBLFVBQXVCO1FBQ25DLE1BQU0sQ0FBQyxpQkFBTSxRQUFRLFlBQUMsS0FBSyxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUVNLDJDQUFjLEdBQXJCLFVBQXNCLEVBQVU7UUFDNUIsTUFBTSxDQUFDLDRCQUFjLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFTSwyQ0FBYyxHQUFyQixVQUFzQixFQUFVLEVBQUUsV0FBd0M7UUFDdEUsTUFBTSxDQUFDLDRCQUFjLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBQ0wseUJBQUM7QUFBRCxDQTlDQSxBQThDQyxDQTlDdUMsNEJBQVksR0E4Q25EO0FBOUNZLGdEQUFrQiIsImZpbGUiOiJhcGkvcmVzb3VyY2VzL3Jlc3QvY29sbGVjdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJ4IGZyb20gJ3J4JztcblxuaW1wb3J0IHtSRVNUUmVzb3VyY2V9IGZyb20gJy4vcmVzdF9yZXNvdXJjZSc7XG5pbXBvcnQge0Nvbm5lY3Rpb259IGZyb20gJy4uLy4uL2Nvbm5lY3Rpb24nO1xuaW1wb3J0IHtQZXJtaXNzaW9uYWJsZSwgZ2V0UGVybWlzc2lvbnMsIHNldFBlcm1pc3Npb25zfSBmcm9tICcuLi9hZGRvbnMvcGVybWlzc2lvbnMnO1xuaW1wb3J0ICogYXMgdHlwZXMgZnJvbSAnLi4vLi4vdHlwZXMvcmVzdCc7XG5cbi8qKlxuICogQ29sbGVjdGlvbiByZXNvdXJjZSBjbGFzcyBmb3IgZGVhbGluZyB3aXRoIGNvbGxlY3Rpb24gZW5kcG9pbnQuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uUmVzb3VyY2UgZXh0ZW5kcyBSRVNUUmVzb3VyY2U8dHlwZXMuQ29sbGVjdGlvbj4gaW1wbGVtZW50cyBQZXJtaXNzaW9uYWJsZSB7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb25uZWN0aW9uOiBDb25uZWN0aW9uKSB7XG4gICAgICAgIHN1cGVyKCdjb2xsZWN0aW9uJywgY29ubmVjdGlvbik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGNvbGxlY3Rpb24gc2x1ZyBhbHJlYWR5IGV4aXN0cy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBTbHVnIHRvIGNoZWNrXG4gICAgICogQHJldHVybiB7UnguT2JzZXJ2YWJsZTxib29sZWFuPn0gQW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHRoZSByZXNwb25zZVxuICAgICAqL1xuICAgIHB1YmxpYyBzbHVnRXhpc3RzKHNsdWc6IHN0cmluZyk6IFJ4Lk9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICAgICAgICByZXR1cm4gPFJ4Lk9ic2VydmFibGU8Ym9vbGVhbj4+IHRoaXMuY29ubmVjdGlvbi5nZXQoJy9hcGkvJyArIHRoaXMubmFtZSArICcvc2x1Z19leGlzdHMnLCB7IG5hbWU6IHNsdWcgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyBkYXRhIG9iamVjdHMgdG8gY29sbGVjdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb2xsZWN0aW9uSWQgQ29sbGVjdGlvbiBpZFxuICAgICAqIEBwYXJhbSBkYXRhSWRzIEFycmF5IG9mIGRhdGEgb2JqZWN0IGlkc1xuICAgICAqIEByZXR1cm5zIHtSeC5PYnNlcnZhYmxlPHZvaWQ+fVxuICAgICAqL1xuICAgIHB1YmxpYyBhZGREYXRhKGNvbGxlY3Rpb25JZDogbnVtYmVyLCBkYXRhSWRzOiBudW1iZXJbXSk6IFJ4Lk9ic2VydmFibGU8dm9pZD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uLnBvc3Q8dm9pZD4oJy9hcGkvJyArIHRoaXMubmFtZSArICcvJyArIGNvbGxlY3Rpb25JZCArICcvYWRkX2RhdGEnLCB7IGlkczogZGF0YUlkcyB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcXVlcnkocXVlcnk/OiB0eXBlcy5RdWVyeU9iamVjdCk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuQ29sbGVjdGlvbltdPjtcbiAgICBwdWJsaWMgcXVlcnkocXVlcnk6IHR5cGVzLlF1ZXJ5T2JqZWN0SHlkcmF0ZURhdGEpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLkNvbGxlY3Rpb25IeWRyYXRlRGF0YVtdPjtcbiAgICBwdWJsaWMgcXVlcnkocXVlcnk6IHR5cGVzLlF1ZXJ5ID0ge30pOiBSeC5PYnNlcnZhYmxlPGFueT4ge1xuICAgICAgICByZXR1cm4gc3VwZXIucXVlcnkocXVlcnkpO1xuICAgIH1cblxuICAgIHB1YmxpYyBxdWVyeU9uZShxdWVyeT86IHR5cGVzLlF1ZXJ5T2JqZWN0KTogUnguT2JzZXJ2YWJsZTx0eXBlcy5Db2xsZWN0aW9uPjtcbiAgICBwdWJsaWMgcXVlcnlPbmUocXVlcnk6IHR5cGVzLlF1ZXJ5T2JqZWN0SHlkcmF0ZURhdGEpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLkNvbGxlY3Rpb25IeWRyYXRlRGF0YT47XG4gICAgcHVibGljIHF1ZXJ5T25lKHF1ZXJ5OiB0eXBlcy5RdWVyeSA9IHt9KTogUnguT2JzZXJ2YWJsZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIHN1cGVyLnF1ZXJ5T25lKHF1ZXJ5KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0UGVybWlzc2lvbnMoaWQ6IG51bWJlcik6IFJ4Lk9ic2VydmFibGU8dHlwZXMuSXRlbVBlcm1pc3Npb25zW10+IHtcbiAgICAgICAgcmV0dXJuIGdldFBlcm1pc3Npb25zKHRoaXMsIGlkKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0UGVybWlzc2lvbnMoaWQ6IG51bWJlciwgcGVybWlzc2lvbnM6IHR5cGVzLlNldFBlcm1pc3Npb25zUmVxdWVzdCk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuSXRlbVBlcm1pc3Npb25zW10+IHtcbiAgICAgICAgcmV0dXJuIHNldFBlcm1pc3Npb25zKHRoaXMsIGlkLCBwZXJtaXNzaW9ucyk7XG4gICAgfVxufVxuIl19
