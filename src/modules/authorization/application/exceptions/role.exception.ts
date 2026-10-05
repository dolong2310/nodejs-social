import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';

export class RoleNotFoundException extends ExceptionBase {
  readonly code = 'ROLE.NOT_FOUND';
  readonly type = 'not_found';
}

export class RoleNameAlreadyExistsException extends ExceptionBase {
  readonly code = 'ROLE.NAME_ALREADY_EXISTS';
  readonly type = 'conflict';
}

export class CannotRenameSystemRoleException extends ExceptionBase {
  readonly code = 'ROLE.CANNOT_RENAME_SYSTEM';
  readonly type = 'forbidden';
}

export class SystemRoleCannotBeDeletedException extends ExceptionBase {
  readonly code = 'ROLE.SYSTEM_CANNOT_DELETE';
  readonly type = 'forbidden';
}

export class CannotDeactivateAdminRoleException extends ExceptionBase {
  readonly code = 'ROLE.CANNOT_DEACTIVATE_ADMIN';
  readonly type = 'forbidden';
}
