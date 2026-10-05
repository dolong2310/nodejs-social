import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';

export class RefreshTokenNotFoundException extends ExceptionBase {
  readonly code = 'AUTH.REFRESH_TOKEN_NOT_FOUND';
  readonly type = 'unauthenticated';
}

export class RefreshTokenExpiredException extends ExceptionBase {
  readonly code = 'AUTH.REFRESH_TOKEN_EXPIRED';
  readonly type = 'unauthenticated';
}
