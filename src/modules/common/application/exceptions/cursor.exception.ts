import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';

export class InvalidCursorException extends ExceptionBase {
  readonly code = 'COMMON.INVALID_CURSOR';
  readonly statusCode = 400;
}
