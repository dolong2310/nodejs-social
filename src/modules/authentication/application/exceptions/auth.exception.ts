import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';

export class InvalidTokenException extends ExceptionBase {
  readonly code = 'AUTH.INVALID_TOKEN';
  readonly type = 'unauthenticated';
}

export class InvalidEmailOrPasswordException extends ExceptionBase {
  readonly code = 'AUTH.INVALID_EMAIL_OR_PASSWORD';
  readonly type = 'unauthenticated';
}

export class GoogleAccountNotVerifiedException extends ExceptionBase {
  readonly code = 'AUTH.GOOGLE_ACCOUNT_NOT_VERIFIED';
  readonly type = 'forbidden';
}

export class EmailAlreadyExistsException extends ExceptionBase {
  readonly code = 'AUTH.EMAIL_ALREADY_EXISTS';
  readonly type = 'conflict';
}

export class EmailNotFoundException extends ExceptionBase {
  readonly code = 'AUTH.EMAIL_NOT_FOUND';
  readonly type = 'not_found';
}

export class FailedToSendOtpCodeException extends ExceptionBase {
  readonly code = 'AUTH.FAILED_TO_SEND_OTP';
  readonly type = 'unavailable';
}
