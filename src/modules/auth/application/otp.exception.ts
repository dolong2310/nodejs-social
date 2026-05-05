import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';

export class InvalidOtpCodeException extends ExceptionBase {
  readonly code = 'AUTH.OTP_INVALID';
  readonly statusCode = 400;
}

export class ExpiredOtpCodeException extends ExceptionBase {
  readonly code = 'AUTH.OTP_EXPIRED';
  readonly statusCode = 400;
}

export class UserAlreadyHas2FAException extends ExceptionBase {
  readonly code = 'AUTH.TWO_FACTOR_ALREADY_ENABLED';
  readonly statusCode = 409;
}

export class UserNotEnabled2FAException extends ExceptionBase {
  readonly code = 'AUTH.TWO_FACTOR_NOT_ENABLED';
  readonly statusCode = 400;
}
