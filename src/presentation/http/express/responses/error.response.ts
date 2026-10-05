import { HTTP_ERROR_MESSAGE } from '@/presentation/http/express/responses/http-message.constants';
import { HTTP_STATUS } from '@/presentation/http/express/responses/http-status.constants';

/**
 * Base error class for all custom API errors.
 * Extends JavaScript's built-in Error class.
 */
export class HttpException extends Error {
  statusCode: number;
  errors: Record<string, unknown>;

  constructor(message: string, statusCode: number, errors: Record<string, unknown> = {}) {
    super(message);
    this.errors = errors;
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Bad request error - status code 400.
 * Used when the request has syntax errors or missing information.
 * Example: missing required fields or invalid data format.
 */
export class BadRequestException extends HttpException {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.BAD_REQUEST,
    statusCode: number = HTTP_STATUS.BAD_REQUEST,
    errors: Record<string, unknown> = {}
  ) {
    super(message, statusCode, errors);
  }
}

/**
 * Authentication error - status code 401.
 * Used when the user is not logged in or the token is invalid.
 * Example: expired token, wrong password, or missing authentication token.
 */
export class UnauthorizedException extends HttpException {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.UNAUTHORIZED,
    statusCode: number = HTTP_STATUS.UNAUTHORIZED,
    errors: Record<string, unknown> = {}
  ) {
    super(message, statusCode, errors);
  }
}

/**
 * Forbidden error - status code 403.
 * Used when the user does not have permission to access a resource.
 * Example: a regular user accesses an admin page or lacks permission for an action.
 */
export class ForbiddenException extends HttpException {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.FORBIDDEN,
    statusCode: number = HTTP_STATUS.FORBIDDEN,
    errors: Record<string, unknown> = {}
  ) {
    super(message, statusCode, errors);
  }
}

/**
 * Not found error - status code 404.
 * Used when the requested resource cannot be found.
 * Example: accessing a non-existent user or invalid URL.
 */
export class NotFoundException extends HttpException {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.NOT_FOUND,
    statusCode: number = HTTP_STATUS.NOT_FOUND,
    errors: Record<string, unknown> = {}
  ) {
    super(message, statusCode, errors);
  }
}

/**
 * Method not allowed error - status code 405.
 * Used when the endpoint exists but does not support the current HTTP method.
 */
export class MethodNotAllowedException extends HttpException {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.METHOD_NOT_ALLOWED,
    statusCode: number = HTTP_STATUS.METHOD_NOT_ALLOWED,
    errors: Record<string, unknown> = {}
  ) {
    super(message, statusCode, errors);
  }
}

/**
 * Not acceptable error - status code 406.
 * Used when the server cannot produce a response matching the client's Accept header.
 */
export class NotAcceptableException extends HttpException {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.NOT_ACCEPTABLE,
    statusCode: number = HTTP_STATUS.NOT_ACCEPTABLE,
    errors: Record<string, unknown> = {}
  ) {
    super(message, statusCode, errors);
  }
}

/**
 * Request timeout error - status code 408.
 * Used when the request is not processed within the allowed time.
 * Example: an API request is not processed within 30 seconds.
 */
export class RequestTimeoutException extends HttpException {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.REQUEST_TIMEOUT,
    statusCode: number = HTTP_STATUS.REQUEST_TIMEOUT,
    errors: Record<string, unknown> = {}
  ) {
    super(message, statusCode, errors);
  }
}

/**
 * Conflict error - status code 409.
 * Used when the request conflicts with the current server state.
 * Example: creating an account with an existing email or a product with an existing code.
 */
export class ConflictException extends HttpException {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.CONFLICT,
    statusCode: number = HTTP_STATUS.CONFLICT,
    errors: Record<string, unknown> = {}
  ) {
    super(message, statusCode, errors);
  }
}

/**
 * Gone error - status code 410.
 * Used when the resource no longer exists and has no replacement address.
 */
export class GoneException extends HttpException {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.GONE,
    statusCode: number = HTTP_STATUS.GONE,
    errors: Record<string, unknown> = {}
  ) {
    super(message, statusCode, errors);
  }
}

/**
 * Precondition failed error - status code 412.
 * Used when header preconditions are not satisfied.
 */
export class PreconditionFailedException extends HttpException {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.PRECONDITION_FAILED,
    statusCode: number = HTTP_STATUS.PRECONDITION_FAILED,
    errors: Record<string, unknown> = {}
  ) {
    super(message, statusCode, errors);
  }
}

/**
 * Payload too large error - status code 413.
 * Used when the request body exceeds the server's allowed limit.
 */
export class PayloadTooLargeException extends HttpException {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.REQUEST_TOO_LONG,
    statusCode: number = HTTP_STATUS.REQUEST_TOO_LONG,
    errors: Record<string, unknown> = {}
  ) {
    super(message, statusCode, errors);
  }
}

/**
 * Unsupported media type error - status code 415.
 * Used when the request data format is not supported by the server.
 */
export class UnsupportedMediaTypeException extends HttpException {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.UNSUPPORTED_MEDIA_TYPE,
    statusCode: number = HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE,
    errors: Record<string, unknown> = {}
  ) {
    super(message, statusCode, errors);
  }
}

/**
 * Teapot error - status code 418.
 * Used when the server cannot produce a response matching the client's Accept header.
 */
export class ImATeapotException extends HttpException {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.IM_A_TEAPOT,
    statusCode: number = HTTP_STATUS.IM_A_TEAPOT,
    errors: Record<string, unknown> = {}
  ) {
    super(message, statusCode, errors);
  }
}

/**
 * Unprocessable entity error - status code 422.
 * Used when submitted data has the correct format but is logically invalid.
 * Example: birth date in the future or invalid phone number format.
 */
export class UnprocessableEntityException extends HttpException {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.UNPROCESSABLE_ENTITY,
    statusCode: number = HTTP_STATUS.UNPROCESSABLE_ENTITY,
    errors: Record<string, unknown> = {}
  ) {
    super(message, statusCode, errors);
  }
}

/**
 * Too many requests error - status code 429.
 * Used when a user sends too many requests within a time window.
 * Example: login attempt limits or API request limits.
 */
export class TooManyRequestsException extends HttpException {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.TOO_MANY_REQUESTS,
    statusCode: number = HTTP_STATUS.TOO_MANY_REQUESTS,
    errors: Record<string, unknown> = {}
  ) {
    super(message, statusCode, errors);
  }
}

/**
 * Server error - status code 500.
 * Used when an unexpected server error occurs.
 * Example: database connection error or data processing error.
 */
export class InternalServerErrorException extends HttpException {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.INTERNAL_SERVER_ERROR,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors: Record<string, unknown> = {}
  ) {
    super(message, statusCode, errors);
  }
}

/**
 * Not implemented error - status code 501.
 * Used when the server does not support the requested functionality yet.
 */
export class NotImplementedException extends HttpException {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.NOT_IMPLEMENTED,
    statusCode: number = HTTP_STATUS.NOT_IMPLEMENTED,
    errors: Record<string, unknown> = {}
  ) {
    super(message, statusCode, errors);
  }
}

/**
 * Bad gateway error - status code 502.
 * Used when the server receives an invalid response from another server.
 * Example: third-party API failure or microservice connection error.
 */
export class BadGatewayException extends HttpException {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.BAD_GATEWAY,
    statusCode: number = HTTP_STATUS.BAD_GATEWAY,
    errors: Record<string, unknown> = {}
  ) {
    super(message, statusCode, errors);
  }
}

/**
 * Service unavailable error - status code 503.
 * Used when the server temporarily cannot handle the request.
 * Example: maintenance or overload.
 */
export class ServiceUnavailableException extends HttpException {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.SERVICE_UNAVAILABLE,
    statusCode: number = HTTP_STATUS.SERVICE_UNAVAILABLE,
    errors: Record<string, unknown> = {}
  ) {
    super(message, statusCode, errors);
  }
}

/**
 * Gateway timeout error - status code 504.
 * Used when the server acts as a gateway and does not receive a timely response.
 */
export class GatewayTimeoutException extends HttpException {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.GATEWAY_TIMEOUT,
    statusCode: number = HTTP_STATUS.GATEWAY_TIMEOUT,
    errors: Record<string, unknown> = {}
  ) {
    super(message, statusCode, errors);
  }
}

/**
 * HTTP version not supported error - status code 505.
 * Used when the server does not support the HTTP version in the request.
 */
export class HttpVersionNotSupportedException extends HttpException {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.HTTP_VERSION_NOT_SUPPORTED,
    statusCode: number = HTTP_STATUS.HTTP_VERSION_NOT_SUPPORTED,
    errors: Record<string, unknown> = {}
  ) {
    super(message, statusCode, errors);
  }
}
