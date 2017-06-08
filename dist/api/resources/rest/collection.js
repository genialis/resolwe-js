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
    CollectionResource.prototype.getPermissions = function (id) {
        return permissions_1.getPermissions(this, id);
    };
    CollectionResource.prototype.setPermissions = function (id, permissions) {
        return permissions_1.setPermissions(this, id, permissions);
    };
    return CollectionResource;
}(rest_resource_1.RESTResource));
exports.CollectionResource = CollectionResource;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvcmVzb3VyY2VzL3Jlc3QvY29sbGVjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFHQSxpREFBNkM7QUFFN0MscURBQXFGO0FBR3JGOztHQUVHO0FBQ0g7SUFBd0Msc0NBQThCO0lBRWxFLDRCQUFZLFVBQXNCO2VBQzlCLGtCQUFNLFlBQVksRUFBRSxVQUFVLENBQUM7SUFDbkMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ksdUNBQVUsR0FBakIsVUFBa0IsSUFBWTtRQUMxQixNQUFNLENBQTBCLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQy9HLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSSxvQ0FBTyxHQUFkLFVBQWUsWUFBb0IsRUFBRSxPQUFpQjtRQUNsRCxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0lBQzVHLENBQUM7SUFJTSxrQ0FBSyxHQUFaLFVBQWEsS0FBdUIsRUFBRSxPQUFzQjtRQUEvQyxzQkFBQSxFQUFBLFVBQXVCO1FBQ2hDLE1BQU0sQ0FBQyxpQkFBTSxLQUFLLFlBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFJTSxxQ0FBUSxHQUFmLFVBQWdCLEtBQXVCLEVBQUUsT0FBc0I7UUFBL0Msc0JBQUEsRUFBQSxVQUF1QjtRQUNuQyxNQUFNLENBQUMsaUJBQU0sUUFBUSxZQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRU0sMkNBQWMsR0FBckIsVUFBc0IsRUFBVTtRQUM1QixNQUFNLENBQUMsNEJBQWMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVNLDJDQUFjLEdBQXJCLFVBQXNCLEVBQVUsRUFBRSxXQUF3QztRQUN0RSxNQUFNLENBQUMsNEJBQWMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFDTCx5QkFBQztBQUFELENBOUNBLEFBOENDLENBOUN1Qyw0QkFBWSxHQThDbkQ7QUE5Q1ksZ0RBQWtCIiwiZmlsZSI6ImFwaS9yZXNvdXJjZXMvcmVzdC9jb2xsZWN0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUnggZnJvbSAncngnO1xuXG5pbXBvcnQge1F1ZXJ5T3B0aW9uc30gZnJvbSAnLi4vLi4vcmVzb3VyY2UnO1xuaW1wb3J0IHtSRVNUUmVzb3VyY2V9IGZyb20gJy4vcmVzdF9yZXNvdXJjZSc7XG5pbXBvcnQge0Nvbm5lY3Rpb259IGZyb20gJy4uLy4uL2Nvbm5lY3Rpb24nO1xuaW1wb3J0IHtQZXJtaXNzaW9uYWJsZSwgZ2V0UGVybWlzc2lvbnMsIHNldFBlcm1pc3Npb25zfSBmcm9tICcuLi9hZGRvbnMvcGVybWlzc2lvbnMnO1xuaW1wb3J0ICogYXMgdHlwZXMgZnJvbSAnLi4vLi4vdHlwZXMvcmVzdCc7XG5cbi8qKlxuICogQ29sbGVjdGlvbiByZXNvdXJjZSBjbGFzcyBmb3IgZGVhbGluZyB3aXRoIGNvbGxlY3Rpb24gZW5kcG9pbnQuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uUmVzb3VyY2UgZXh0ZW5kcyBSRVNUUmVzb3VyY2U8dHlwZXMuQ29sbGVjdGlvbj4gaW1wbGVtZW50cyBQZXJtaXNzaW9uYWJsZSB7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb25uZWN0aW9uOiBDb25uZWN0aW9uKSB7XG4gICAgICAgIHN1cGVyKCdjb2xsZWN0aW9uJywgY29ubmVjdGlvbik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGNvbGxlY3Rpb24gc2x1ZyBhbHJlYWR5IGV4aXN0cy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBTbHVnIHRvIGNoZWNrXG4gICAgICogQHJldHVybiB7UnguT2JzZXJ2YWJsZTxib29sZWFuPn0gQW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHRoZSByZXNwb25zZVxuICAgICAqL1xuICAgIHB1YmxpYyBzbHVnRXhpc3RzKHNsdWc6IHN0cmluZyk6IFJ4Lk9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICAgICAgICByZXR1cm4gPFJ4Lk9ic2VydmFibGU8Ym9vbGVhbj4+IHRoaXMuY29ubmVjdGlvbi5nZXQodGhpcy5nZXRMaXN0TWV0aG9kUGF0aCgnc2x1Z19leGlzdHMnKSwgeyBuYW1lOiBzbHVnIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgZGF0YSBvYmplY3RzIHRvIGNvbGxlY3Rpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29sbGVjdGlvbklkIENvbGxlY3Rpb24gaWRcbiAgICAgKiBAcGFyYW0gZGF0YUlkcyBBcnJheSBvZiBkYXRhIG9iamVjdCBpZHNcbiAgICAgKiBAcmV0dXJucyB7UnguT2JzZXJ2YWJsZTx2b2lkPn1cbiAgICAgKi9cbiAgICBwdWJsaWMgYWRkRGF0YShjb2xsZWN0aW9uSWQ6IG51bWJlciwgZGF0YUlkczogbnVtYmVyW10pOiBSeC5PYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29ubmVjdGlvbi5wb3N0PHZvaWQ+KHRoaXMuZ2V0RGV0YWlsTWV0aG9kUGF0aChjb2xsZWN0aW9uSWQsICdhZGRfZGF0YScpLCB7IGlkczogZGF0YUlkcyB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcXVlcnkocXVlcnk/OiB0eXBlcy5RdWVyeU9iamVjdCwgb3B0aW9ucz86IFF1ZXJ5T3B0aW9ucyk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuQ29sbGVjdGlvbltdPjtcbiAgICBwdWJsaWMgcXVlcnkocXVlcnk6IHR5cGVzLlF1ZXJ5T2JqZWN0SHlkcmF0ZURhdGEsIG9wdGlvbnM/OiBRdWVyeU9wdGlvbnMpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLkNvbGxlY3Rpb25IeWRyYXRlRGF0YVtdPjtcbiAgICBwdWJsaWMgcXVlcnkocXVlcnk6IHR5cGVzLlF1ZXJ5ID0ge30sIG9wdGlvbnM/OiBRdWVyeU9wdGlvbnMpOiBSeC5PYnNlcnZhYmxlPGFueT4ge1xuICAgICAgICByZXR1cm4gc3VwZXIucXVlcnkocXVlcnksIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIHB1YmxpYyBxdWVyeU9uZShxdWVyeT86IHR5cGVzLlF1ZXJ5T2JqZWN0LCBvcHRpb25zPzogUXVlcnlPcHRpb25zKTogUnguT2JzZXJ2YWJsZTx0eXBlcy5Db2xsZWN0aW9uPjtcbiAgICBwdWJsaWMgcXVlcnlPbmUocXVlcnk6IHR5cGVzLlF1ZXJ5T2JqZWN0SHlkcmF0ZURhdGEsIG9wdGlvbnM/OiBRdWVyeU9wdGlvbnMpOiBSeC5PYnNlcnZhYmxlPHR5cGVzLkNvbGxlY3Rpb25IeWRyYXRlRGF0YT47XG4gICAgcHVibGljIHF1ZXJ5T25lKHF1ZXJ5OiB0eXBlcy5RdWVyeSA9IHt9LCBvcHRpb25zPzogUXVlcnlPcHRpb25zKTogUnguT2JzZXJ2YWJsZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIHN1cGVyLnF1ZXJ5T25lKHF1ZXJ5LCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0UGVybWlzc2lvbnMoaWQ6IG51bWJlcik6IFJ4Lk9ic2VydmFibGU8dHlwZXMuSXRlbVBlcm1pc3Npb25zW10+IHtcbiAgICAgICAgcmV0dXJuIGdldFBlcm1pc3Npb25zKHRoaXMsIGlkKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0UGVybWlzc2lvbnMoaWQ6IG51bWJlciwgcGVybWlzc2lvbnM6IHR5cGVzLlNldFBlcm1pc3Npb25zUmVxdWVzdCk6IFJ4Lk9ic2VydmFibGU8dHlwZXMuSXRlbVBlcm1pc3Npb25zW10+IHtcbiAgICAgICAgcmV0dXJuIHNldFBlcm1pc3Npb25zKHRoaXMsIGlkLCBwZXJtaXNzaW9ucyk7XG4gICAgfVxufVxuIl19
