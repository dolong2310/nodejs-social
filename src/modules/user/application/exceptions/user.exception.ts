import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';

export class UserNotFoundException extends ExceptionBase {
  readonly code = 'USER.NOT_FOUND';
  readonly statusCode = 404;
}

export class UserAlreadyExistsException extends ExceptionBase {
  readonly code = 'USER.ALREADY_EXISTS';
  readonly statusCode = 409;
}

export class UsernameAlreadyExistsException extends ExceptionBase {
  readonly code = 'USER.USERNAME_ALREADY_EXISTS';
  readonly statusCode = 409;
}

export class UserAlreadyVerifiedException extends ExceptionBase {
  readonly code = 'USER.ALREADY_VERIFIED';
  readonly statusCode = 409;
}

export class CannotViewUserProfileBlockedException extends ExceptionBase {
  readonly code = 'USER.PROFILE_VIEW_BLOCKED';
  readonly statusCode = 403;
}

export class UserIsInactiveException extends ExceptionBase {
  readonly code = 'USER.INACTIVE';
  readonly statusCode = 403;
}

export class UserIsBannedException extends ExceptionBase {
  readonly code = 'USER.BANNED';
  readonly statusCode = 403;
}

export class CannotAssignAdminRoleException extends ExceptionBase {
  readonly code = 'USER.CANNOT_ASSIGN_ADMIN_ROLE';
  readonly statusCode = 403;
}

export class CannotMutateAdminUserException extends ExceptionBase {
  readonly code = 'USER.CANNOT_MUTATE_ADMIN';
  readonly statusCode = 403;
}
