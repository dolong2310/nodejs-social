export const RoleNotFoundException = new Error('Role not found');
export const RoleNameAlreadyExistsException = new Error('Role name already exists');
export const CannotRenameSystemRoleException = new Error('Cannot rename a system role');
export const SystemRoleCannotBeDeletedException = new Error('System role cannot be deleted');
export const CannotDeactivateAdminRoleException = new Error('The ADMIN role cannot be deactivated');
