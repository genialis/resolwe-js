"use strict";
/*
 * Type definitions
 *
 * Here is defined everything the API returns.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
function isResponsePaginated(response) {
    return response.hasOwnProperty('results');
}
exports.isResponsePaginated = isResponsePaginated;
exports.OWNER_PERMISSION = 'owner';
exports.SHARE_PERMISSION = 'share';
exports.EDIT_PERMISSION = 'edit';
exports.DELETE_PERMISSION = 'edit';
exports.ADD_PERMISSION = 'add';
exports.DOWNLOAD_PERMISSION = 'download';
exports.VIEW_PERMISSION = 'view';
exports.PUBLIC_PERMISSION_TYPE = 'public';
exports.GROUP_PERMISSION_TYPE = 'group';
exports.USER_PERMISSION_TYPE = 'user';
exports.RAW_PROCESS_PERSISTENCE = 'RAW';
exports.CACHED_PROCESS_PERSISTENCE = 'CAC';
exports.TEMP_PROCESS_PERSISTENCE = 'TMP';
exports.UPLOADING_DATA_STATUS = 'UP';
exports.RESOLVING_DATA_STATUS = 'RE';
exports.WAITING_DATA_STATUS = 'WT';
exports.PROCESSING_DATA_STATUS = 'PR';
exports.DONE_DATA_STATUS = 'OK';
exports.ERROR_DATA_STATUS = 'ER';
exports.DIRTY_DATA_STATUS = 'DR';
function isData(object) {
    return _.all(['checksum', 'status', 'process', 'process_name', 'process_type', 'input', 'output', 'current_user_permissions'], function (property) { return object.hasOwnProperty(property); });
}
exports.isData = isData;
function isCollection(object) {
    // CollectionBase doesn't contain `data` property in it's interface, but
    // Collection and CollectionHydrateData do.
    return object.hasOwnProperty('description') &&
        object.hasOwnProperty('settings') &&
        object.hasOwnProperty('data') &&
        !object.hasOwnProperty('descriptor_completed');
}
exports.isCollection = isCollection;
function isSampleBase(object) {
    return object.hasOwnProperty('description') &&
        object.hasOwnProperty('settings') &&
        object.hasOwnProperty('data') &&
        object.hasOwnProperty('descriptor_completed');
}
exports.isSampleBase = isSampleBase;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcGkvdHlwZXMvcmVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7R0FJRzs7QUFHSCwwQkFBNEI7QUF5QjVCLDZCQUF1QyxRQUEyQjtJQUM5RCxNQUFNLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUM5QyxDQUFDO0FBRkQsa0RBRUM7QUFzQlksUUFBQSxnQkFBZ0IsR0FBb0IsT0FBTyxDQUFDO0FBQzVDLFFBQUEsZ0JBQWdCLEdBQW9CLE9BQU8sQ0FBQztBQUM1QyxRQUFBLGVBQWUsR0FBbUIsTUFBTSxDQUFDO0FBQ3pDLFFBQUEsaUJBQWlCLEdBQXFCLE1BQU0sQ0FBQztBQUM3QyxRQUFBLGNBQWMsR0FBa0IsS0FBSyxDQUFDO0FBQ3RDLFFBQUEsbUJBQW1CLEdBQXVCLFVBQVUsQ0FBQztBQUNyRCxRQUFBLGVBQWUsR0FBbUIsTUFBTSxDQUFDO0FBVXpDLFFBQUEsc0JBQXNCLEdBQXlCLFFBQVEsQ0FBQztBQUN4RCxRQUFBLHFCQUFxQixHQUF3QixPQUFPLENBQUM7QUFDckQsUUFBQSxvQkFBb0IsR0FBdUIsTUFBTSxDQUFDO0FBa0RsRCxRQUFBLHVCQUF1QixHQUEwQixLQUFLLENBQUM7QUFDdkQsUUFBQSwwQkFBMEIsR0FBNkIsS0FBSyxDQUFDO0FBQzdELFFBQUEsd0JBQXdCLEdBQTJCLEtBQUssQ0FBQztBQW1JekQsUUFBQSxxQkFBcUIsR0FBd0IsSUFBSSxDQUFDO0FBQ2xELFFBQUEscUJBQXFCLEdBQXdCLElBQUksQ0FBQztBQUNsRCxRQUFBLG1CQUFtQixHQUFzQixJQUFJLENBQUM7QUFDOUMsUUFBQSxzQkFBc0IsR0FBeUIsSUFBSSxDQUFDO0FBQ3BELFFBQUEsZ0JBQWdCLEdBQW1CLElBQUksQ0FBQztBQUN4QyxRQUFBLGlCQUFpQixHQUFvQixJQUFJLENBQUM7QUFDMUMsUUFBQSxpQkFBaUIsR0FBb0IsSUFBSSxDQUFDO0FBb0N2RCxnQkFBdUIsTUFBMEM7SUFDN0QsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxVQUFVLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsMEJBQTBCLENBQUMsRUFDekgsVUFBQyxRQUFRLElBQUssT0FBQSxNQUFNLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUEvQixDQUErQixDQUNoRCxDQUFDO0FBQ04sQ0FBQztBQUpELHdCQUlDO0FBNEtELHNCQUE2QixNQUEwQztJQUNuRSx3RUFBd0U7SUFDeEUsMkNBQTJDO0lBQzNDLE1BQU0sQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQztRQUN2QyxNQUFNLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQztRQUNqQyxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQztRQUM3QixDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUN2RCxDQUFDO0FBUEQsb0NBT0M7QUFVRCxzQkFBNkIsTUFBMEM7SUFDbkUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDO1FBQ3ZDLE1BQU0sQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDO1FBQ2pDLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDO1FBQzdCLE1BQU0sQ0FBQyxjQUFjLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUN0RCxDQUFDO0FBTEQsb0NBS0MiLCJmaWxlIjoiYXBpL3R5cGVzL3Jlc3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogVHlwZSBkZWZpbml0aW9uc1xuICpcbiAqIEhlcmUgaXMgZGVmaW5lZCBldmVyeXRoaW5nIHRoZSBBUEkgcmV0dXJucy5cbiAqL1xuXG5pbXBvcnQgKiBhcyBSeCBmcm9tICdyeCc7XG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5cbmltcG9ydCBEaWN0aW9uYXJ5ID0gXy5EaWN0aW9uYXJ5O1xuaW1wb3J0IE51bWVyaWNEaWN0aW9uYXJ5ID0gXy5OdW1lcmljRGljdGlvbmFyeTtcblxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFF1ZXJ5XG5cbmV4cG9ydCBpbnRlcmZhY2UgUXVlcnkge1xuICAgIGxpbWl0PzogbnVtYmVyO1xuICAgIG9mZnNldD86IG51bWJlcjtcbiAgICBvcmRlcmluZz86IHN0cmluZzsgLy8gJy1maWVsZDEsLWZpZWxkMixmaWVsZDMnXG4gICAgZmllbGRzPzogc3RyaW5nO1xuICAgIFtwcm9wZXJ0eU5hbWU6IHN0cmluZ106IGFueTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBRdWVyeU9iamVjdCBleHRlbmRzIFF1ZXJ5IHtcbiAgICBoeWRyYXRlX2RhdGE/OiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFF1ZXJ5T2JqZWN0SHlkcmF0ZURhdGEgZXh0ZW5kcyBRdWVyeSB7XG4gICAgaHlkcmF0ZV9kYXRhOiAnMSc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1Jlc3BvbnNlUGFnaW5hdGVkPFQ+KHJlc3BvbnNlOiBUIHwgeyByZXN1bHRzOiBUfSk6IHJlc3BvbnNlIGlzIHsgcmVzdWx0czogVCB9IHtcbiAgICByZXR1cm4gcmVzcG9uc2UuaGFzT3duUHJvcGVydHkoJ3Jlc3VsdHMnKTtcbn1cblxuLy8gTGltaXRPZmZzZXRQYWdpbmF0aW9uXG5leHBvcnQgaW50ZXJmYWNlIFBhZ2luYXRlZFJlc3BvbnNlPFQ+IHtcbiAgICBjb3VudDogbnVtYmVyO1xuICAgIG5leHQ6IHN0cmluZztcbiAgICBwcmV2aW91czogc3RyaW5nO1xuICAgIHJlc3VsdHM6IFRbXTtcbn1cblxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFBlcm1pc3Npb25zXG5cbmV4cG9ydCB0eXBlIE93bmVyUGVybWlzc2lvbiA9ICdvd25lcic7XG5leHBvcnQgdHlwZSBTaGFyZVBlcm1pc3Npb24gPSAnc2hhcmUnO1xuZXhwb3J0IHR5cGUgRWRpdFBlcm1pc3Npb24gPSAnZWRpdCc7XG5leHBvcnQgdHlwZSBEZWxldGVQZXJtaXNzaW9uID0gJ2VkaXQnOyAvLyBub3QgYSB0eXBvIChBUEkgZG9lc24ndCBzdXBwb3J0IGRlbGV0ZSBwZXJtaXNzaW9uKVxuZXhwb3J0IHR5cGUgQWRkUGVybWlzc2lvbiA9ICdhZGQnO1xuZXhwb3J0IHR5cGUgRG93bmxvYWRQZXJtaXNzaW9uID0gJ2Rvd25sb2FkJztcbmV4cG9ydCB0eXBlIFZpZXdQZXJtaXNzaW9uID0gJ3ZpZXcnO1xuXG5leHBvcnQgY29uc3QgT1dORVJfUEVSTUlTU0lPTjogT3duZXJQZXJtaXNzaW9uID0gJ293bmVyJztcbmV4cG9ydCBjb25zdCBTSEFSRV9QRVJNSVNTSU9OOiBTaGFyZVBlcm1pc3Npb24gPSAnc2hhcmUnO1xuZXhwb3J0IGNvbnN0IEVESVRfUEVSTUlTU0lPTjogRWRpdFBlcm1pc3Npb24gPSAnZWRpdCc7XG5leHBvcnQgY29uc3QgREVMRVRFX1BFUk1JU1NJT046IERlbGV0ZVBlcm1pc3Npb24gPSAnZWRpdCc7XG5leHBvcnQgY29uc3QgQUREX1BFUk1JU1NJT046IEFkZFBlcm1pc3Npb24gPSAnYWRkJztcbmV4cG9ydCBjb25zdCBET1dOTE9BRF9QRVJNSVNTSU9OOiBEb3dubG9hZFBlcm1pc3Npb24gPSAnZG93bmxvYWQnO1xuZXhwb3J0IGNvbnN0IFZJRVdfUEVSTUlTU0lPTjogVmlld1Blcm1pc3Npb24gPSAndmlldyc7XG5cbmV4cG9ydCB0eXBlIFBlcm1pc3Npb24gPSBPd25lclBlcm1pc3Npb24gfCBTaGFyZVBlcm1pc3Npb24gfCBFZGl0UGVybWlzc2lvbiB8IERlbGV0ZVBlcm1pc3Npb24gfCBBZGRQZXJtaXNzaW9uIHxcbiAgICBEb3dubG9hZFBlcm1pc3Npb24gfCBWaWV3UGVybWlzc2lvbjtcblxuXG5leHBvcnQgdHlwZSBQdWJsaWNQZXJtaXNzaW9uVHlwZSA9ICdwdWJsaWMnO1xuZXhwb3J0IHR5cGUgR3JvdXBQZXJtaXNzaW9uVHlwZSA9ICdncm91cCc7XG5leHBvcnQgdHlwZSBVc2VyUGVybWlzc2lvblR5cGUgPSAndXNlcic7XG5cbmV4cG9ydCBjb25zdCBQVUJMSUNfUEVSTUlTU0lPTl9UWVBFOiBQdWJsaWNQZXJtaXNzaW9uVHlwZSA9ICdwdWJsaWMnO1xuZXhwb3J0IGNvbnN0IEdST1VQX1BFUk1JU1NJT05fVFlQRTogR3JvdXBQZXJtaXNzaW9uVHlwZSA9ICdncm91cCc7XG5leHBvcnQgY29uc3QgVVNFUl9QRVJNSVNTSU9OX1RZUEU6IFVzZXJQZXJtaXNzaW9uVHlwZSA9ICd1c2VyJztcblxuZXhwb3J0IHR5cGUgUGVybWlzc2lvblR5cGUgPSBQdWJsaWNQZXJtaXNzaW9uVHlwZSB8IEdyb3VwUGVybWlzc2lvblR5cGUgfCBVc2VyUGVybWlzc2lvblR5cGU7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSXRlbVBlcm1pc3Npb25zT2Y8VD4ge1xuICAgIHR5cGU6IFBlcm1pc3Npb25UeXBlO1xuICAgIHBlcm1pc3Npb25zOiBUW107XG4gICAgaWQ/OiBudW1iZXI7XG4gICAgbmFtZT86IHN0cmluZztcbn1cblxuZXhwb3J0IHR5cGUgSXRlbVBlcm1pc3Npb25zID0gSXRlbVBlcm1pc3Npb25zT2Y8UGVybWlzc2lvbj47XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2V0UGVybWlzc2lvbnNSZXF1ZXN0IHtcbiAgICBwdWJsaWM/OiB7XG4gICAgICAgIGFkZD86IFBlcm1pc3Npb25bXSxcbiAgICAgICAgcmVtb3ZlPzogUGVybWlzc2lvbltdXG4gICAgfTtcbiAgICBncm91cHM/OiB7XG4gICAgICAgIGFkZD86IE51bWVyaWNEaWN0aW9uYXJ5PFBlcm1pc3Npb25bXT4gfCBEaWN0aW9uYXJ5PFBlcm1pc3Npb25bXT5cbiAgICAgICAgcmVtb3ZlPzogTnVtZXJpY0RpY3Rpb25hcnk8UGVybWlzc2lvbltdPiB8IERpY3Rpb25hcnk8UGVybWlzc2lvbltdPlxuICAgIH07XG4gICAgdXNlcnM/OiB7XG4gICAgICAgIGFkZD86IE51bWVyaWNEaWN0aW9uYXJ5PFBlcm1pc3Npb25bXT4gfCBEaWN0aW9uYXJ5PFBlcm1pc3Npb25bXT5cbiAgICAgICAgcmVtb3ZlPzogTnVtZXJpY0RpY3Rpb25hcnk8UGVybWlzc2lvbltdPiB8IERpY3Rpb25hcnk8UGVybWlzc2lvbltdPlxuICAgIH07XG4gICAgc2hhcmVfY29udGVudD86ICcwJyB8ICcxJztcbn1cblxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIENvbnRyaWJ1dG9yXG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29udHJpYnV0b3Ige1xuICAgIGlkOiBudW1iZXI7XG4gICAgdXNlcm5hbWU6IHN0cmluZztcbiAgICBmaXJzdF9uYW1lOiBzdHJpbmc7XG4gICAgbGFzdF9uYW1lOiBzdHJpbmc7XG59XG5cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBQcm9jZXNzXG5cbmV4cG9ydCB0eXBlIFByb2Nlc3NQZXJtaXNzaW9ucyA9IFZpZXdQZXJtaXNzaW9uIHwgU2hhcmVQZXJtaXNzaW9uO1xuXG5leHBvcnQgdHlwZSBSYXdQcm9jZXNzUGVyc2lzdGVuY2UgPSAnUkFXJztcbmV4cG9ydCB0eXBlIENhY2hlZFByb2Nlc3NQZXJzaXN0ZW5jZSA9ICdDQUMnO1xuZXhwb3J0IHR5cGUgVGVtcFByb2Nlc3NQZXJzaXN0ZW5jZSA9ICdUTVAnO1xuXG5leHBvcnQgY29uc3QgUkFXX1BST0NFU1NfUEVSU0lTVEVOQ0U6IFJhd1Byb2Nlc3NQZXJzaXN0ZW5jZSA9ICdSQVcnO1xuZXhwb3J0IGNvbnN0IENBQ0hFRF9QUk9DRVNTX1BFUlNJU1RFTkNFOiBDYWNoZWRQcm9jZXNzUGVyc2lzdGVuY2UgPSAnQ0FDJztcbmV4cG9ydCBjb25zdCBURU1QX1BST0NFU1NfUEVSU0lTVEVOQ0U6IFRlbXBQcm9jZXNzUGVyc2lzdGVuY2UgPSAnVE1QJztcblxuZXhwb3J0IHR5cGUgUHJvY2Vzc1BlcnNpc3RlbmNlID0gUmF3UHJvY2Vzc1BlcnNpc3RlbmNlIHwgQ2FjaGVkUHJvY2Vzc1BlcnNpc3RlbmNlIHwgVGVtcFByb2Nlc3NQZXJzaXN0ZW5jZTtcblxuZXhwb3J0IGludGVyZmFjZSBQcm9jZXNzIHtcbiAgICBpZDogbnVtYmVyO1xuICAgIHNsdWc6IHN0cmluZztcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgY3JlYXRlZDogc3RyaW5nO1xuICAgIG1vZGlmaWVkOiBzdHJpbmc7XG4gICAgdmVyc2lvbjogbnVtYmVyO1xuICAgIHR5cGU6IHN0cmluZztcbiAgICBjYXRlZ29yeTogc3RyaW5nO1xuICAgIHBlcnNpc3RlbmNlOiBQcm9jZXNzUGVyc2lzdGVuY2U7XG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgICBpbnB1dF9zY2hlbWE6IGFueTtcbiAgICBvdXRwdXRfc2NoZW1hOiBhbnk7XG4gICAgcnVuOiBhbnk7XG4gICAgY29udHJpYnV0b3I6IENvbnRyaWJ1dG9yO1xuICAgIGN1cnJlbnRfdXNlcl9wZXJtaXNzaW9uczogSXRlbVBlcm1pc3Npb25zT2Y8UHJvY2Vzc1Blcm1pc3Npb25zPltdO1xufVxuXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRGVzY3JpcHRvclNjaGVtYVxuXG4vLyBTY2hlbWFcbmV4cG9ydCBpbnRlcmZhY2UgQ2hvaWNlTWFwIHtcbiAgICB2YWx1ZTogc3RyaW5nO1xuICAgIGxhYmVsOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRmllbGRTY2hlbWEge1xuICAgIGRpc2FibGVkPzogYm9vbGVhbiB8IHN0cmluZztcbiAgICByZXF1aXJlZD86IGJvb2xlYW47XG4gICAgY29sbGFwc2VkPzogYm9vbGVhbjtcbiAgICBoaWRkZW4/OiBib29sZWFuIHwgc3RyaW5nO1xuICAgIGRlZmF1bHQ/OiBhbnk7XG4gICAgY2hvaWNlcz86IENob2ljZU1hcFtdO1xuICAgIGFsbG93X2N1c3RvbV9jaG9pY2U/OiBib29sZWFuO1xuICAgIHZhbGlkYXRlX3JlZ2V4Pzogc3RyaW5nO1xuICAgIHNsdWc/OiB7XG4gICAgICAgIHNvdXJjZT86IHN0cmluZztcbiAgICAgICAgdW5pcXVlVmFsaWRhdG9yPzogKHNsdWc6IHN0cmluZykgPT4gUnguT2JzZXJ2YWJsZTxib29sZWFuPjtcbiAgICB9O1xuICAgIHR5cGU6IHN0cmluZztcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgbGFiZWw6IHN0cmluZztcbiAgICBncm91cD86IFNjaGVtYTtcbn1cblxuZXhwb3J0IHR5cGUgU2NoZW1hID0gRmllbGRTY2hlbWFbXTtcblxuXG4vLyBEZXNjcmlwdG9yU2NoZW1hXG5leHBvcnQgdHlwZSBEZXNjcmlwdG9yU2NoZW1hUGVybWlzc2lvbnMgPSBWaWV3UGVybWlzc2lvbiB8IEVkaXRQZXJtaXNzaW9uIHwgU2hhcmVQZXJtaXNzaW9uO1xuXG5leHBvcnQgaW50ZXJmYWNlIERlc2NyaXB0b3JTY2hlbWFCYXNlIHtcbiAgICBpZDogbnVtYmVyO1xuICAgIGNyZWF0ZWQ6IHN0cmluZztcbiAgICBtb2RpZmllZDogc3RyaW5nO1xuICAgIHNsdWc6IHN0cmluZztcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgdmVyc2lvbjogbnVtYmVyO1xuICAgIHNjaGVtYTogU2NoZW1hO1xuICAgIGNvbnRyaWJ1dG9yOiBDb250cmlidXRvcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEZXNjcmlwdG9yU2NoZW1hIGV4dGVuZHMgRGVzY3JpcHRvclNjaGVtYUJhc2Uge1xuICAgIGN1cnJlbnRfdXNlcl9wZXJtaXNzaW9uczogSXRlbVBlcm1pc3Npb25zT2Y8RGVzY3JpcHRvclNjaGVtYVBlcm1pc3Npb25zPltdO1xufVxuXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gU2NhdHRlciBQbG90IEpzb25cblxuLy8gU2NhdHRlclBsb3RKc29uLlJvb3RPYmplY3QgaXMgYSB0eXBlIG9mIHByb2Nlc3Mgb3V0cHV0LiBQcm9jZXNzZXMgKGkuZS4gUm9zZTIpXG4vLyBzYXZlIGl0IHRvIGRhdGEub3V0cHV0LnNjYXR0ZXJfcGxvdC5cbmV4cG9ydCBuYW1lc3BhY2UgU2NhdHRlclBsb3RKc29uIHtcblxuICAgIGV4cG9ydCBpbnRlcmZhY2UgUm9vdE9iamVjdCB7IC8vIFRoaXMgaXMgdGhlIGFjdHVhbCB0eXBlIG9mIHRoZSBqc29uIG91dHB1dFxuICAgICAgICBwb2ludHM6IFBvaW50cztcbiAgICAgICAgbWV0YT86IE1ldGE7XG4gICAgICAgIGFubm90YXRpb25zPzogQW5ub3RhdGlvbltdO1xuICAgIH1cblxuICAgIGV4cG9ydCBpbnRlcmZhY2UgUG9pbnRzIHtcbiAgICAgICAgeF9heGlzOiBudW1iZXJbXTtcbiAgICAgICAgeV9heGlzOiBudW1iZXJbXTtcbiAgICAgICAgaXRlbXM/OiBhbnlbXTtcbiAgICB9XG5cbiAgICBleHBvcnQgaW50ZXJmYWNlIE1ldGEge1xuICAgICAgICB4X2xhYmVsPzogc3RyaW5nO1xuICAgICAgICB5X2xhYmVsPzogc3RyaW5nO1xuICAgICAgICB0ZXh0Pzogc3RyaW5nO1xuICAgICAgICBjaHJfcG9zPzogc3RyaW5nW107XG4gICAgfVxuXG4gICAgZXhwb3J0IHR5cGUgQW5ub3RhdGlvbiA9IEFubm90YXRpb25MaW5lR2VuZXJhbCB8IEFubm90YXRpb25MaW5lVmVydGljYWwgfCBBbm5vdGF0aW9uTGluZUhvcml6b250YWw7XG5cbiAgICBleHBvcnQgaW50ZXJmYWNlIEFubm90YXRpb25MaW5lR2VuZXJhbCB7XG4gICAgICAgIHR5cGU6ICdsaW5lJztcbiAgICAgICAgeDE6IG51bWJlcjtcbiAgICAgICAgeDI6IG51bWJlcjtcbiAgICAgICAgeTE6IG51bWJlcjtcbiAgICAgICAgeTI6IG51bWJlcjtcbiAgICB9XG4gICAgZXhwb3J0IGludGVyZmFjZSBBbm5vdGF0aW9uTGluZVZlcnRpY2FsIHtcbiAgICAgICAgdHlwZTogJ2xpbmVfdmVydGljYWwnO1xuICAgICAgICB4OiBudW1iZXI7XG4gICAgfVxuICAgIGV4cG9ydCBpbnRlcmZhY2UgQW5ub3RhdGlvbkxpbmVIb3Jpem9udGFsIHtcbiAgICAgICAgdHlwZTogJ2xpbmVfaG9yaXpvbnRhbCc7XG4gICAgICAgIHk6IG51bWJlcjtcbiAgICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRGF0YVxuXG5leHBvcnQgdHlwZSBEYXRhUGVybWlzc2lvbnMgPSBWaWV3UGVybWlzc2lvbiB8IEVkaXRQZXJtaXNzaW9uIHwgU2hhcmVQZXJtaXNzaW9uIHwgRG93bmxvYWRQZXJtaXNzaW9uO1xuXG5leHBvcnQgdHlwZSBVcGxvYWRpbmdEYXRhU3RhdHVzID0gJ1VQJztcbmV4cG9ydCB0eXBlIFJlc29sdmluZ0RhdGFTdGF0dXMgPSAnUkUnO1xuZXhwb3J0IHR5cGUgV2FpdGluZ0RhdGFTdGF0dXMgPSAnV1QnO1xuZXhwb3J0IHR5cGUgUHJvY2Vzc2luZ0RhdGFTdGF0dXMgPSAnUFInO1xuZXhwb3J0IHR5cGUgRG9uZURhdGFTdGF0dXMgPSAnT0snO1xuZXhwb3J0IHR5cGUgRXJyb3JEYXRhU3RhdHVzID0gJ0VSJztcbmV4cG9ydCB0eXBlIERpcnR5RGF0YVN0YXR1cyA9ICdEUic7XG5cbmV4cG9ydCBjb25zdCBVUExPQURJTkdfREFUQV9TVEFUVVM6IFVwbG9hZGluZ0RhdGFTdGF0dXMgPSAnVVAnO1xuZXhwb3J0IGNvbnN0IFJFU09MVklOR19EQVRBX1NUQVRVUzogUmVzb2x2aW5nRGF0YVN0YXR1cyA9ICdSRSc7XG5leHBvcnQgY29uc3QgV0FJVElOR19EQVRBX1NUQVRVUzogV2FpdGluZ0RhdGFTdGF0dXMgPSAnV1QnO1xuZXhwb3J0IGNvbnN0IFBST0NFU1NJTkdfREFUQV9TVEFUVVM6IFByb2Nlc3NpbmdEYXRhU3RhdHVzID0gJ1BSJztcbmV4cG9ydCBjb25zdCBET05FX0RBVEFfU1RBVFVTOiBEb25lRGF0YVN0YXR1cyA9ICdPSyc7XG5leHBvcnQgY29uc3QgRVJST1JfREFUQV9TVEFUVVM6IEVycm9yRGF0YVN0YXR1cyA9ICdFUic7XG5leHBvcnQgY29uc3QgRElSVFlfREFUQV9TVEFUVVM6IERpcnR5RGF0YVN0YXR1cyA9ICdEUic7XG5cbmV4cG9ydCB0eXBlIERhdGFTdGF0dXMgPSBVcGxvYWRpbmdEYXRhU3RhdHVzIHwgUmVzb2x2aW5nRGF0YVN0YXR1cyB8IFdhaXRpbmdEYXRhU3RhdHVzIHwgUHJvY2Vzc2luZ0RhdGFTdGF0dXMgfFxuICAgIERvbmVEYXRhU3RhdHVzIHwgRXJyb3JEYXRhU3RhdHVzIHwgRGlydHlEYXRhU3RhdHVzO1xuXG5leHBvcnQgaW50ZXJmYWNlIERhdGFCYXNlIHtcbiAgICBpZDogbnVtYmVyO1xuICAgIGNyZWF0ZWQ6IHN0cmluZztcbiAgICBtb2RpZmllZDogc3RyaW5nO1xuICAgIHN0YXJ0ZWQ6IHN0cmluZztcbiAgICBmaW5pc2hlZDogc3RyaW5nO1xuICAgIGNoZWNrc3VtOiBzdHJpbmc7XG4gICAgc3RhdHVzOiBEYXRhU3RhdHVzO1xuICAgIHByb2Nlc3NfcHJvZ3Jlc3M6IG51bWJlcjtcbiAgICBwcm9jZXNzX3JjOiBudW1iZXI7XG4gICAgcHJvY2Vzc19pbmZvOiBzdHJpbmdbXTtcbiAgICBwcm9jZXNzX3dhcm5pbmc6IHN0cmluZ1tdO1xuICAgIHByb2Nlc3NfZXJyb3I6IHN0cmluZ1tdO1xuICAgIHByb2Nlc3NfdHlwZTogc3RyaW5nO1xuICAgIHByb2Nlc3NfaW5wdXRfc2NoZW1hOiBhbnk7XG4gICAgcHJvY2Vzc19vdXRwdXRfc2NoZW1hOiBhbnk7XG4gICAgcHJvY2Vzc19uYW1lOiBzdHJpbmc7XG4gICAgc2x1Zzogc3RyaW5nO1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBpbnB1dDogYW55O1xuICAgIG91dHB1dDogYW55O1xuICAgIGRlc2NyaXB0b3Jfc2NoZW1hOiBEZXNjcmlwdG9yU2NoZW1hQmFzZTtcbiAgICBkZXNjcmlwdG9yOiBhbnk7XG4gICAgY29udHJpYnV0b3I6IENvbnRyaWJ1dG9yO1xuICAgIHByb2Nlc3M6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEYXRhIGV4dGVuZHMgRGF0YUJhc2Uge1xuICAgIGN1cnJlbnRfdXNlcl9wZXJtaXNzaW9uczogSXRlbVBlcm1pc3Npb25zT2Y8RGF0YVBlcm1pc3Npb25zPltdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNEYXRhKG9iamVjdDogQ29sbGVjdGlvbkJhc2UgfCBTYW1wbGVCYXNlIHwgRGF0YSk6IG9iamVjdCBpcyBEYXRhIHtcbiAgICByZXR1cm4gXy5hbGwoWydjaGVja3N1bScsICdzdGF0dXMnLCAncHJvY2VzcycsICdwcm9jZXNzX25hbWUnLCAncHJvY2Vzc190eXBlJywgJ2lucHV0JywgJ291dHB1dCcsICdjdXJyZW50X3VzZXJfcGVybWlzc2lvbnMnXSxcbiAgICAgICAgKHByb3BlcnR5KSA9PiBvYmplY3QuaGFzT3duUHJvcGVydHkocHJvcGVydHkpXG4gICAgKTtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBkYXRhOmRpZmZlcmVudGlhbGV4cHJlc3Npb246XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGF0YURpZmZlcmVudGlhbEV4cHJlc3Npb24gZXh0ZW5kcyBEYXRhIHtcbiAgICBvdXRwdXQ6IHtcbiAgICAgICAgZGVfZmlsZTogeyBmaWxlOiBzdHJpbmcsIHNpemU6IG51bWJlciB9O1xuICAgICAgICByYXc6IHsgZmlsZTogc3RyaW5nLCBzaXplOiBudW1iZXIgfTtcbiAgICAgICAgZGVfanNvbjogbnVtYmVyO1xuICAgICAgICBzb3VyY2U6IHN0cmluZztcbiAgICB9O1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIGRhdGE6Z2VuZXNldDpcblxuZXhwb3J0IGludGVyZmFjZSBEYXRhR2VuZXNldE91dHB1dCB7XG4gICAgZ2VuZXNldDogeyBmaWxlOiBzdHJpbmcsIHNpemU6IG51bWJlciB9O1xuICAgIGdlbmVzZXRfanNvbjogbnVtYmVyOyAvLyA9PiBEYXRhR2VuZXNldFN0b3JhZ2VcbiAgICBzb3VyY2U6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEYXRhR2VuZXNldCBleHRlbmRzIERhdGEge1xuICAgIG91dHB1dDogRGF0YUdlbmVzZXRPdXRwdXQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGF0YUdlbmVzZXRTdG9yYWdlIGV4dGVuZHMgU3RvcmFnZSB7XG4gICAganNvbjoge1xuICAgICAgICBnZW5lczogc3RyaW5nW107XG4gICAgfTtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBkYXRhOmdlbmVzZXQ6dmVubjpcblxuZXhwb3J0IGludGVyZmFjZSBEYXRhR2VuZXNldFZlbm5PdXRwdXQgZXh0ZW5kcyBEYXRhR2VuZXNldE91dHB1dCB7XG4gICAgdmVubjogbnVtYmVyOyAvLyA9PiBEYXRhR2VuZXNldFZlbm5TdG9yYWdlXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGF0YUdlbmVzZXRWZW5uIGV4dGVuZHMgRGF0YUdlbmVzZXQge1xuICAgIG91dHB1dDogRGF0YUdlbmVzZXRWZW5uT3V0cHV0O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERhdGFHZW5lc2V0VmVublN0b3JhZ2UgZXh0ZW5kcyBTdG9yYWdlIHtcbiAgICBqc29uOiB7XG4gICAgICAgIHBhcmVudHM6IEFycmF5PHtcbiAgICAgICAgICAgIGlkOiBudW1iZXI7XG4gICAgICAgICAgICBuYW1lOiBzdHJpbmc7XG4gICAgICAgICAgICBnZW5lczogc3RyaW5nW107IC8vIGdlbmVzZXRfanNvbiAuIGdlbmVzXG4gICAgICAgIH0+O1xuICAgIH07XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gZGF0YTpnb2VhOiBHZW5lIE9udG9sb2d5XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGF0YUdPRW5yaWNobWVudEFuYWx5c2lzIGV4dGVuZHMgRGF0YSB7XG4gICAgb3V0cHV0OiB7XG4gICAgICAgIHRlcm1zOiBudW1iZXI7IC8vID0+IERhdGFHT0VucmljaG1lbnRBbmFseXNpc1N0b3JhZ2VcbiAgICAgICAgc291cmNlOiBzdHJpbmc7XG4gICAgfTtcbn1cblxuZXhwb3J0IHR5cGUgR09FbnJpY2htZW50QXNwZWN0ID0gR09FbnJpY2htZW50Tm9kZVtdO1xuZXhwb3J0IGludGVyZmFjZSBHT0VucmljaG1lbnRKc29uIHtcbiAgICB0b3RhbF9nZW5lczogbnVtYmVyO1xuICAgIGdlbmVfYXNzb2NpYXRpb25zOiB7XG4gICAgICAgIFtnb1Rlcm1JZDogc3RyaW5nXTogc3RyaW5nW107IC8vIHRlcm1faWQgPT4gZ2VuZV9pZHNcbiAgICB9O1xuICAgIHRyZWU6IHtcbiAgICAgICAgW2FzcGVjdFNsdWc6IHN0cmluZ106IEdPRW5yaWNobWVudEFzcGVjdCwgLy8gXCJCUFwiIHwgXCJDQ1wiIHwgXCJNRlwiXG4gICAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBHT0VucmljaG1lbnROb2RlIHtcbiAgICBnZW5lX2lkczogc3RyaW5nW107XG4gICAgdGVybV9uYW1lOiBzdHJpbmc7XG4gICAgdGVybV9pZDogc3RyaW5nO1xuICAgIHB2YWw6IG51bWJlcjtcbiAgICBzY29yZTogbnVtYmVyO1xuICAgIG1hdGNoZWQ6IG51bWJlcjsgLy8gTnVtYmVyIG9mIGZvdW5kIGVsZW1lbnRzIGluIGEgc2luZ2xlIG5vZGUuXG4gICAgdG90YWw6IG51bWJlcjsgLy8gVG90YWwgbnVtYmVyIG9mIGVsZW1lbnRzIChpbmNsdWRpbmcgY2hpbGRyZW4gbm9kZXMpIGluIGEgc2luZ2xlIG5vZGUuXG4gICAgY2hpbGRyZW4/OiBHT0VucmljaG1lbnROb2RlW107XG5cbiAgICAvLyBBZGRlZCBieSBmcm9udGVuZDpcbiAgICBkZXB0aD86IG51bWJlcjsgLy8gTnVtZXJpY2FsIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBsZXZlbCBvZiBkZXB0aC4gVXNlZCBmb3Igb2Zmc2V0dGluZyB0aGUgdGVybSBjb2x1bW4uXG4gICAgc291cmNlPzogc3RyaW5nO1xuICAgIHNjb3JlX3BlcmNlbnRhZ2U/OiBudW1iZXI7IC8vIFBlcmNlbnRhZ2Ugb2YgbWF4IHNjb3JlIHdpdGhpbiBHT0VucmljaG1lbnRBc3BlY3QuXG4gICAgZ2VuZV9hc3NvY2lhdGlvbnM/OiBzdHJpbmdbXTsgLy8gUGx1Y2tlZCBmcm9tIEdPRW5yaWNobWVudEpzb24uZ2VuZV9hc3NvY2lhdGlvbnMuXG4gICAgY29sbGFwc2VkPzogYm9vbGVhbjsgLy8gQm9vbGVhbiByZXByZXNlbnRhdGlvbiBpZiB0aGUgc2VsZWN0ZWQgaXRlbSBpcyBoaWRkZW4uXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGF0YUdPRW5yaWNobWVudEFuYWx5c2lzU3RvcmFnZSBleHRlbmRzIFN0b3JhZ2Uge1xuICAgIGpzb246IEdPRW5yaWNobWVudEpzb247XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGF0YUdPRW5yaWNobWVudEFuYWx5c2lzSW5wdXQge1xuICAgIHB2YWxfdGhyZXNob2xkOiBudW1iZXI7XG4gICAgZ2VuZXM6IHN0cmluZ1tdO1xuICAgIHNvdXJjZTogc3RyaW5nO1xuICAgIG9udG9sb2d5OiBudW1iZXI7XG4gICAgZ2FmOiBudW1iZXI7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gZGF0YTpnYWY6IEdBRiBhbm5vdGF0aW9uXG5cbmV4cG9ydCBpbnRlcmZhY2UgRGF0YUdhZkFubm90YXRpb24gZXh0ZW5kcyBEYXRhIHtcbiAgICBvdXRwdXQ6IHtcbiAgICAgICAgc291cmNlOiBzdHJpbmc7XG4gICAgICAgIHNwZWNpZXM6IHN0cmluZztcbiAgICAgICAgZ2FmOiB7IGZpbGU6IHN0cmluZywgc2l6ZTogbnVtYmVyIH07XG4gICAgICAgIGdhZl9vYmo6IHsgZmlsZTogc3RyaW5nLCBzaXplOiBudW1iZXIgfTtcbiAgICB9O1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIGRhdGE6dmFyaWFudHRhYmxlOlxuXG5leHBvcnQgaW50ZXJmYWNlIERhdGFWYXJpYW50VGFibGUgZXh0ZW5kcyBEYXRhIHtcbiAgICBvdXRwdXQ6IHtcbiAgICAgICAgdmFyaWFudF90YWJsZTogbnVtYmVyOyAvLyA9PiBEYXRhVmFyaWFudFRhYmxlU3RvcmFnZVxuICAgIH07XG59XG5cbmV4cG9ydCB0eXBlIERhdGFWYXJpYW50VGFibGVKc29uVmFsdWVDb2x1bW4gPSBzdHJpbmc7IC8vIEV4YW1wbGU6IE1TSDZfZXhvbjVfRjEvMlxuZXhwb3J0IHR5cGUgRGF0YVZhcmlhbnRUYWJsZUpzb25EZWxpbWl0ZWRDb2x1bW4gPSBzdHJpbmc7IC8vIEV4YW1wbGU6IERQND00Niw0MSwxMSwxNjtTQj00XG5leHBvcnQgdHlwZSBEYXRhVmFyaWFudFRhYmxlSnNvblVybHNDb2x1bW4gPSBbc3RyaW5nLCBzdHJpbmddW107IC8vIEV4YW1wbGU6IFtbJ0dlbmUnLCAnaHR0cDovL3d3dy5uY2JpLm5sbS5uaWguZ292L2dlbmUvP3Rlcm09Z2VuZSddXVxuZXhwb3J0IHR5cGUgRGF0YVZhcmlhbnRUYWJsZUpzb25Db2x1bW4gPSBEYXRhVmFyaWFudFRhYmxlSnNvblZhbHVlQ29sdW1uIHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRGF0YVZhcmlhbnRUYWJsZUpzb25EZWxpbWl0ZWRDb2x1bW4gfFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEYXRhVmFyaWFudFRhYmxlSnNvblVybHNDb2x1bW47XG5leHBvcnQgaW50ZXJmYWNlIERhdGFWYXJpYW50VGFibGVSb3cge1xuICAgIGNvbHVtbnM6IERhdGFWYXJpYW50VGFibGVKc29uQ29sdW1uW107XG4gICAgcG9zOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGF0YVZhcmlhbnRUYWJsZUpzb24geyAvLyBhcGktdHlwZWNoZWNrOmFtcGxpY29uX3RhYmxlX291dHB1dC5qc29uLmd6XG4gICAgY29sdW1uX3R5cGVzOiBBcnJheTwndmFsdWUnIHwgJ2RlbGltaXRlZCcgfCAndXJscyc+O1xuICAgIGhlYWRlcnM6IHN0cmluZ1tdO1xuICAgIGxhYmVsczogc3RyaW5nW107XG4gICAgZGF0YTogRGF0YVZhcmlhbnRUYWJsZVJvd1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERhdGFWYXJpYW50VGFibGVTdG9yYWdlIGV4dGVuZHMgU3RvcmFnZSB7XG4gICAganNvbjogRGF0YVZhcmlhbnRUYWJsZUpzb247XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gQ29sbGVjdGlvblxuXG5leHBvcnQgdHlwZSBDb2xsZWN0aW9uUGVybWlzc2lvbnMgPSBWaWV3UGVybWlzc2lvbiB8IEVkaXRQZXJtaXNzaW9uIHwgU2hhcmVQZXJtaXNzaW9uIHxcbiAgICBEb3dubG9hZFBlcm1pc3Npb24gfCBBZGRQZXJtaXNzaW9uO1xuXG5leHBvcnQgaW50ZXJmYWNlIENvbGxlY3Rpb25CYXNlIHtcbiAgICBpZDogbnVtYmVyO1xuICAgIGNyZWF0ZWQ6IHN0cmluZztcbiAgICBtb2RpZmllZDogc3RyaW5nO1xuICAgIHNsdWc6IHN0cmluZztcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgICBzZXR0aW5nczogYW55O1xuICAgIGRlc2NyaXB0b3Jfc2NoZW1hOiBEZXNjcmlwdG9yU2NoZW1hQmFzZTtcbiAgICBkZXNjcmlwdG9yOiBhbnk7XG4gICAgY29udHJpYnV0b3I6IENvbnRyaWJ1dG9yO1xuICAgIGN1cnJlbnRfdXNlcl9wZXJtaXNzaW9uczogSXRlbVBlcm1pc3Npb25zT2Y8Q29sbGVjdGlvblBlcm1pc3Npb25zPltdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbGxlY3Rpb24gZXh0ZW5kcyBDb2xsZWN0aW9uQmFzZSB7XG4gICAgZGF0YTogbnVtYmVyW107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbGxlY3Rpb24ob2JqZWN0OiBDb2xsZWN0aW9uQmFzZSB8IFNhbXBsZUJhc2UgfCBEYXRhKTogb2JqZWN0IGlzIENvbGxlY3Rpb24gfCBDb2xsZWN0aW9uSHlkcmF0ZURhdGEge1xuICAgIC8vIENvbGxlY3Rpb25CYXNlIGRvZXNuJ3QgY29udGFpbiBgZGF0YWAgcHJvcGVydHkgaW4gaXQncyBpbnRlcmZhY2UsIGJ1dFxuICAgIC8vIENvbGxlY3Rpb24gYW5kIENvbGxlY3Rpb25IeWRyYXRlRGF0YSBkby5cbiAgICByZXR1cm4gb2JqZWN0Lmhhc093blByb3BlcnR5KCdkZXNjcmlwdGlvbicpICYmXG4gICAgICAgIG9iamVjdC5oYXNPd25Qcm9wZXJ0eSgnc2V0dGluZ3MnKSAmJlxuICAgICAgICBvYmplY3QuaGFzT3duUHJvcGVydHkoJ2RhdGEnKSAmJlxuICAgICAgICAhb2JqZWN0Lmhhc093blByb3BlcnR5KCdkZXNjcmlwdG9yX2NvbXBsZXRlZCcpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbGxlY3Rpb25IeWRyYXRlRGF0YSBleHRlbmRzIENvbGxlY3Rpb25CYXNlIHtcbiAgICBkYXRhOiBEYXRhQmFzZVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNhbXBsZUJhc2UgZXh0ZW5kcyBDb2xsZWN0aW9uQmFzZSB7XG4gICAgZGVzY3JpcHRvcl9jb21wbGV0ZWQ6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1NhbXBsZUJhc2Uob2JqZWN0OiBDb2xsZWN0aW9uQmFzZSB8IFNhbXBsZUJhc2UgfCBEYXRhKTogb2JqZWN0IGlzIFNhbXBsZUJhc2Uge1xuICAgIHJldHVybiBvYmplY3QuaGFzT3duUHJvcGVydHkoJ2Rlc2NyaXB0aW9uJykgJiZcbiAgICAgICAgb2JqZWN0Lmhhc093blByb3BlcnR5KCdzZXR0aW5ncycpICYmXG4gICAgICAgIG9iamVjdC5oYXNPd25Qcm9wZXJ0eSgnZGF0YScpICYmXG4gICAgICAgIG9iamVjdC5oYXNPd25Qcm9wZXJ0eSgnZGVzY3JpcHRvcl9jb21wbGV0ZWQnKTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTYW1wbGUgZXh0ZW5kcyBDb2xsZWN0aW9uLCBTYW1wbGVCYXNlIHtcbiAgICBkZXNjcmlwdG9yX2NvbXBsZXRlZDogdHJ1ZTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTYW1wbGVIeWRyYXRlRGF0YSBleHRlbmRzIENvbGxlY3Rpb25IeWRyYXRlRGF0YSwgU2FtcGxlQmFzZSB7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJlc2FtcGxlIGV4dGVuZHMgQ29sbGVjdGlvbiwgU2FtcGxlQmFzZSB7XG4gICAgZGVzY3JpcHRvcl9jb21wbGV0ZWQ6IGZhbHNlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFByZXNhbXBsZUh5ZHJhdGVEYXRhIGV4dGVuZHMgQ29sbGVjdGlvbkh5ZHJhdGVEYXRhLCBTYW1wbGVCYXNlIHtcbiAgICBkZXNjcmlwdG9yX2NvbXBsZXRlZDogZmFsc2U7XG59XG5cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBTdG9yYWdlXG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RvcmFnZSB7XG4gICAgaWQ6IG51bWJlcjtcbiAgICBzbHVnOiBzdHJpbmc7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGRhdGE6IG51bWJlcjtcbiAgICBqc29uOiBhbnk7XG4gICAgY29udHJpYnV0b3I6IENvbnRyaWJ1dG9yO1xuICAgIGNyZWF0ZWQ6IHN0cmluZztcbiAgICBtb2RpZmllZDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNhbXBsZUNsdXN0ZXJpbmcgeyAvLyBhcGktdHlwZWNoZWNrOnNhbXBsZV9jbHVzdGVyX2RhdGEuanNvbi5nelxuICAgIHNhbXBsZV9pZHM6IF8uRGljdGlvbmFyeTx7IGlkOiBudW1iZXIgfT47XG4gICAgb3JkZXI6IG51bWJlcltdO1xuICAgIGxpbmthZ2U6IG51bWJlcltdW107IC8vIFtbbm9kZTEsIG5vZGUyLCBkaXN0YW5jZSwgbnVtYmVyIG9mIHNhbXBsZXNdXVxuICAgIHplcm9fc2FtcGxlX2lkczogbnVtYmVyW107IC8vIHNhbXBsZSBpZHMgd2l0aCBubyBleHByZXNzaW9uc1xuICAgIHplcm9fZ2VuZV9zeW1ib2xzOiBzdHJpbmdbXTsgLy8gZ2VuZSBzeW1ib2xzIHdpdGggbm8gZXhwcmVzc2lvbnNcbiAgICBtaXNzaW5nX2dlbmVfc3ltYm9sczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgR2VuZUNsdXN0ZXJpbmcgeyAvLyBhcGktdHlwZWNoZWNrOmdlbmVfY2x1c3Rlcl9kYXRhLmpzb24uZ3pcbiAgICBnZW5lX3N5bWJvbHM6IF8uRGljdGlvbmFyeTx7IGdlbmU6IHN0cmluZyB9PjtcbiAgICBvcmRlcjogbnVtYmVyW107XG4gICAgbGlua2FnZTogbnVtYmVyW11bXTsgLy8gW1tub2RlMSwgbm9kZTIsIGRpc3RhbmNlLCBudW1iZXIgb2YgZ2VuZXNdXVxuICAgIHplcm9fc2FtcGxlX2lkczogbnVtYmVyW107IC8vIHNhbXBsZSBpZHMgd2l0aCBubyBleHByZXNzaW9uc1xuICAgIHplcm9fZ2VuZV9zeW1ib2xzOiBzdHJpbmdbXTsgLy8gZ2VuZSBzeW1ib2xzIHdpdGggbm8gZXhwcmVzc2lvbnNcbiAgICBtaXNzaW5nX2dlbmVfc3ltYm9sczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUENBIHsgLy8gYXBpLXR5cGVjaGVjazpwY2FfcGxvdF9uY2JpLmpzb24uZ3pcbiAgICBleHBsYWluZWRfdmFyaWFuY2VfcmF0aW9zOiBudW1iZXJbXTtcbiAgICBhbGxfZXhwbGFpbmVkX3ZhcmlhbmNlX3JhdGlvczogbnVtYmVyW107XG4gICAgYWxsX2NvbXBvbmVudHM6IFtzdHJpbmcsIG51bWJlcl1bXVtdO1xuICAgIGNvbXBvbmVudHM6IFtzdHJpbmcsIG51bWJlcl1bXVtdO1xuICAgIHplcm9fZ2VuZV9zeW1ib2xzOiBzdHJpbmdbXTsgLy8gZ2VuZSBpZHMgd2l0aCBubyBleHByZXNzaW9uc1xuICAgIGZsb3Q6IHtcbiAgICAgICAgeGxhYmVsOiBzdHJpbmc7XG4gICAgICAgIHlsYWJlbDogc3RyaW5nO1xuICAgICAgICBkYXRhOiBudW1iZXJbXVtdO1xuICAgICAgICBzYW1wbGVfaWRzOiBzdHJpbmdbXTtcbiAgICB9O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFFDU3RvcmFnZSBleHRlbmRzIFN0b3JhZ2Uge1xuICAgIGpzb246IHtcbiAgICAgICAgc3RhdHVzOiAnUEFTUycgfCAnRkFJTCcgfCAnV0FSTklORycsXG4gICAgICAgIG1lc3NhZ2U6IHN0cmluZyxcbiAgICB9O1xufVxuXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gVXNlclxuXG5leHBvcnQgaW50ZXJmYWNlIFVzZXIge1xuICAgIGlkOiBudW1iZXI7XG4gICAgdXNlcm5hbWU6IHN0cmluZztcbiAgICBlbWFpbDogc3RyaW5nO1xuICAgIGZpcnN0X25hbWU6IHN0cmluZztcbiAgICBsYXN0X25hbWU6IHN0cmluZztcbiAgICBqb2JfdGl0bGU6IHN0cmluZztcbiAgICBjb21wYW55OiBzdHJpbmc7XG4gICAgZGVwYXJ0bWVudDogc3RyaW5nO1xuICAgIGxvY2F0aW9uOiBzdHJpbmc7XG4gICAgbGFiOiBzdHJpbmc7XG4gICAgcGhvbmVfbnVtYmVyOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTG9naW5SZXNwb25zZSB7XG4gICAga2V5OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTG9nb3V0UmVzcG9uc2Uge1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENyZWF0ZUFjY291bnRJbmZvcm1hdGlvbiB7XG4gICAgdXNlcm5hbWU6IHN0cmluZztcbiAgICBwYXNzd29yZDogc3RyaW5nO1xuICAgIGVtYWlsOiBzdHJpbmc7XG4gICAgZmlyc3RfbmFtZTogc3RyaW5nO1xuICAgIGxhc3RfbmFtZTogc3RyaW5nO1xuICAgIGpvYl90aXRsZT86IHN0cmluZztcbiAgICBjb21wYW55Pzogc3RyaW5nO1xuICAgIGRlcGFydG1lbnQ/OiBzdHJpbmc7XG4gICAgbG9jYXRpb24/OiBzdHJpbmc7XG4gICAgbGFiPzogc3RyaW5nO1xuICAgIHBob25lX251bWJlcj86IHN0cmluZztcbiAgICBuZXdzbGV0dGVyPzogYm9vbGVhbjtcbiAgICBjb21tdW5pdHk/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQWN0aXZhdGVBY2NvdW50UmVzcG9uc2Uge1xuICAgIHVzZXJuYW1lOiBzdHJpbmc7XG59XG5cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBGaWxlXG5cbmV4cG9ydCBpbnRlcmZhY2UgRG93bmxvYWQge1xuICAgIGRhdGE6IHN0cmluZztcbn1cbiJdfQ==
