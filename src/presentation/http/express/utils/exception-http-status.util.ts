import type { ExceptionBase, ExceptionType } from '@/modules/core/domain/exceptions/exception.base';
import { HTTP_STATUS } from '@/presentation/http/express/responses/http-status.constants';

/** The only place that translates transport-neutral exception types into HTTP status codes. */
export const EXCEPTION_TYPE_HTTP_STATUS: Readonly<Record<ExceptionType, number>> = {
  invalid_argument: HTTP_STATUS.BAD_REQUEST,
  unauthenticated: HTTP_STATUS.UNAUTHORIZED,
  forbidden: HTTP_STATUS.FORBIDDEN,
  not_found: HTTP_STATUS.NOT_FOUND,
  conflict: HTTP_STATUS.CONFLICT,
  too_large: HTTP_STATUS.REQUEST_TOO_LONG,
  range_not_satisfiable: HTTP_STATUS.REQUESTED_RANGE_NOT_SATISFIABLE,
  rate_limited: HTTP_STATUS.TOO_MANY_REQUESTS,
  unavailable: HTTP_STATUS.SERVICE_UNAVAILABLE,
  internal: HTTP_STATUS.INTERNAL_SERVER_ERROR
};

export function httpStatusOf(exception: ExceptionBase): number {
  return EXCEPTION_TYPE_HTTP_STATUS[exception.type];
}
