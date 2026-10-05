import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';

export class InvalidOtpCodeException extends ExceptionBase {
  readonly code = 'AUTH.OTP_INVALID';
  readonly type = 'invalid_argument';
}

export class ExpiredOtpCodeException extends ExceptionBase {
  readonly code = 'AUTH.OTP_EXPIRED';
  readonly type = 'invalid_argument';
}

export class UserAlreadyHas2FAException extends ExceptionBase {
  readonly code = 'AUTH.TWO_FACTOR_ALREADY_ENABLED';
  readonly type = 'conflict';
}

export class UserNotEnabled2FAException extends ExceptionBase {
  readonly code = 'AUTH.TWO_FACTOR_NOT_ENABLED';
  readonly type = 'invalid_argument';
}
