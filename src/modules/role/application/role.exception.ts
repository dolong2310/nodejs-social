import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';

export class RoleNotFoundException extends ExceptionBase {
  readonly code = 'ROLE.NOT_FOUND';
  readonly statusCode = 404;
}

export class RoleNameAlreadyExistsException extends ExceptionBase {
  readonly code = 'ROLE.NAME_ALREADY_EXISTS';
  readonly statusCode = 409;
}

export class CannotRenameSystemRoleException extends ExceptionBase {
  readonly code = 'ROLE.CANNOT_RENAME_SYSTEM';
  readonly statusCode = 403;
}

export class SystemRoleCannotBeDeletedException extends ExceptionBase {
  readonly code = 'ROLE.SYSTEM_CANNOT_DELETE';
  readonly statusCode = 403;
}

export class CannotDeactivateAdminRoleException extends ExceptionBase {
  readonly code = 'ROLE.CANNOT_DEACTIVATE_ADMIN';
  readonly statusCode = 403;
}
