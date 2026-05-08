import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';

export class PermissionNotFoundException extends ExceptionBase {
  readonly code = 'PERMISSION.NOT_FOUND';
  readonly statusCode = 404;
}

export class PermissionPathMethodConflictException extends ExceptionBase {
  readonly code = 'PERMISSION.PATH_METHOD_CONFLICT';
  readonly statusCode = 409;
}

export class PermissionInUseByRolesException extends ExceptionBase {
  readonly code = 'PERMISSION.IN_USE_BY_ROLES';
  readonly statusCode = 409;
}

export class FailedToCreatePermissionException extends ExceptionBase {
  readonly code = 'PERMISSION.CREATE_FAILED';
  readonly statusCode = 500;
}
