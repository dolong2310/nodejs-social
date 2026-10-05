import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';

export class UserNotFoundException extends ExceptionBase {
  readonly code = 'USER.NOT_FOUND';
  readonly type = 'not_found';
}

export class UserAlreadyExistsException extends ExceptionBase {
  readonly code = 'USER.ALREADY_EXISTS';
  readonly type = 'conflict';
}

export class UsernameAlreadyExistsException extends ExceptionBase {
  readonly code = 'USER.USERNAME_ALREADY_EXISTS';
  readonly type = 'conflict';
}

export class UserAlreadyVerifiedException extends ExceptionBase {
  readonly code = 'USER.ALREADY_VERIFIED';
  readonly type = 'conflict';
}

export class CannotViewUserProfileBlockedException extends ExceptionBase {
  readonly code = 'USER.PROFILE_VIEW_BLOCKED';
  readonly type = 'forbidden';
}

export class UserIsInactiveException extends ExceptionBase {
  readonly code = 'USER.INACTIVE';
  readonly type = 'forbidden';
}

export class UserIsBannedException extends ExceptionBase {
  readonly code = 'USER.BANNED';
  readonly type = 'forbidden';
}

export class CannotAssignAdminRoleException extends ExceptionBase {
  readonly code = 'USER.CANNOT_ASSIGN_ADMIN_ROLE';
  readonly type = 'forbidden';
}

export class CannotMutateAdminUserException extends ExceptionBase {
  readonly code = 'USER.CANNOT_MUTATE_ADMIN';
  readonly type = 'forbidden';
}
