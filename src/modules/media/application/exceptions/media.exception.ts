import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';

export class RequestedRangeNotSatisfiableException extends ExceptionBase {
  readonly code = 'MEDIA.RANGE_NOT_SATISFIABLE';
  readonly statusCode = 416;
}
