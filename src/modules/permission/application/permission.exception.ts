export const PermissionNotFoundException = new Error('Permission not found');
export const PermissionPathMethodConflictException = new Error('Permission for this path and method already exists');
export const PermissionInUseByRolesException = new Error('Permission is assigned to one or more roles');
export const FailedToCreatePermissionException = new Error('Failed to create permission');
