'use strict';

import { HTTP_ERROR_MESSAGE } from '@/presentation/http/express/responses/http-message.constant';
import { HTTP_STATUS } from '@/presentation/http/express/responses/http-status.constant';

/**
 * Class lỗi cơ sở cho tất cả các lỗi tùy chỉnh trong API
 * Kế thừa từ class Error có sẵn của JavaScript
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
 * Lỗi yêu cầu không hợp lệ - Mã lỗi 400
 * Sử dụng khi yêu cầu bị lỗi cú pháp hoặc thiếu thông tin
 * Ví dụ: Thiếu trường bắt buộc, định dạng dữ liệu không hợp lệ
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
 * Lỗi xác thực - Mã lỗi 401
 * Sử dụng khi người dùng chưa đăng nhập hoặc token không hợp lệ
 * Ví dụ: Token hết hạn, sai mật khẩu, thiếu token xác thực
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
 * Lỗi cấm truy cập - Mã lỗi 403
 * Sử dụng khi người dùng không có quyền truy cập tài nguyên
 * Ví dụ: Người dùng thường truy cập trang admin, không đủ quyền thực hiện hành động
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
 * Lỗi không tìm thấy - Mã lỗi 404
 * Sử dụng khi không tìm thấy tài nguyên được yêu cầu
 * Ví dụ: Truy cập vào user không tồn tại, URL không hợp lệ
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
 * Lỗi phương thức không được phép - Mã lỗi 405
 * Sử dụng khi endpoint tồn tại nhưng không hỗ trợ HTTP method hiện tại
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
 * Lỗi không chấp nhận được - Mã lỗi 406
 * Sử dụng khi server không thể tạo response phù hợp với header Accept của client
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
 * Lỗi timeout - Mã lỗi 408
 * Sử dụng khi yêu cầu không được xử lý trong thời gian quy định
 * Ví dụ: Yêu cầu API không được xử lý trong 30 giây
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
 * Lỗi xung đột - Mã lỗi 409
 * Sử dụng khi yêu cầu xung đột với trạng thái hiện tại của server
 * Ví dụ: Tạo tài khoản với email đã tồn tại, tạo sản phẩm với mã đã có
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
 * Lỗi tài nguyên đã bị xóa - Mã lỗi 410
 * Sử dụng khi tài nguyên không còn tồn tại và không có địa chỉ thay thế
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
 * Lỗi điều kiện tiên quyết thất bại - Mã lỗi 412
 * Sử dụng khi các precondition trong header không được thỏa mãn
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
 * Lỗi payload quá lớn - Mã lỗi 413
 * Sử dụng khi body request vượt quá giới hạn server cho phép
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
 * Lỗi media type không được hỗ trợ - Mã lỗi 415
 * Sử dụng khi định dạng dữ liệu request không được server hỗ trợ
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
 * Lỗi teapot - Mã lỗi 418
 * Sử dụng khi server không thể tạo response phù hợp với header Accept của client
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
 * Lỗi dữ liệu không hợp lệ - Mã lỗi 422
 * Sử dụng khi dữ liệu gửi lên đúng format nhưng không hợp lệ về mặt logic
 * Ví dụ: Ngày sinh trong tương lai, số điện thoại sai định dạng
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
 * Lỗi quá nhiều yêu cầu - Mã lỗi 429
 * Sử dụng khi người dùng gửi quá nhiều yêu cầu trong một khoảng thời gian
 * Ví dụ: Giới hạn số lần đăng nhập, giới hạn số request API
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
 * Lỗi server - Mã lỗi 500
 * Sử dụng khi có lỗi không mong muốn xảy ra trên server
 * Ví dụ: Lỗi kết nối database, lỗi xử lý dữ liệu
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
 * Lỗi chưa được implement - Mã lỗi 501
 * Sử dụng khi server chưa hỗ trợ chức năng được yêu cầu
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
 * Lỗi gateway - Mã lỗi 502
 * Sử dụng khi server nhận được phản hồi không hợp lệ từ server khác
 * Ví dụ: Lỗi khi gọi API bên thứ 3, lỗi kết nối microservice
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
 * Lỗi service không khả dụng - Mã lỗi 503
 * Sử dụng khi server tạm thời không thể xử lý yêu cầu
 * Ví dụ: Server đang bảo trì, server quá tải
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
 * Lỗi gateway timeout - Mã lỗi 504
 * Sử dụng khi server đóng vai trò gateway và không nhận được response kịp thời
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
 * Lỗi HTTP version không được hỗ trợ - Mã lỗi 505
 * Sử dụng khi server không hỗ trợ phiên bản HTTP trong request
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
