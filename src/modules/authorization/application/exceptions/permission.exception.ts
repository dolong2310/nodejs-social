import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';

export class PermissionNotFoundException extends ExceptionBase {
  readonly code = 'PERMISSION.NOT_FOUND';
  readonly type = 'not_found';
}

export class PermissionPathMethodConflictException extends ExceptionBase {
  readonly code = 'PERMISSION.PATH_METHOD_CONFLICT';
  readonly type = 'conflict';
}

export class PermissionInUseByRolesException extends ExceptionBase {
  readonly code = 'PERMISSION.IN_USE_BY_ROLES';
  readonly type = 'conflict';
}

export class FailedToCreatePermissionException extends ExceptionBase {
  readonly code = 'PERMISSION.CREATE_FAILED';
  readonly type = 'internal';
}
