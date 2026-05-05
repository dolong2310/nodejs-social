import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';

export class InvalidTokenException extends ExceptionBase {
  readonly code = 'AUTH.INVALID_TOKEN';
  readonly statusCode = 401;
}

export class InvalidEmailOrPasswordException extends ExceptionBase {
  readonly code = 'AUTH.INVALID_EMAIL_OR_PASSWORD';
  readonly statusCode = 401;
}

export class GoogleAccountNotVerifiedException extends ExceptionBase {
  readonly code = 'AUTH.GOOGLE_ACCOUNT_NOT_VERIFIED';
  readonly statusCode = 403;
}

export class EmailAlreadyExistsException extends ExceptionBase {
  readonly code = 'AUTH.EMAIL_ALREADY_EXISTS';
  readonly statusCode = 409;
}

export class EmailNotFoundException extends ExceptionBase {
  readonly code = 'AUTH.EMAIL_NOT_FOUND';
  readonly statusCode = 404;
}

export class FailedToSendOtpCodeException extends ExceptionBase {
  readonly code = 'AUTH.FAILED_TO_SEND_OTP';
  readonly statusCode = 503;
}
