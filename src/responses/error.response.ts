'use strict';

import { HTTP_ERROR_MESSAGE } from '@/constants/httpMessage.constant';
import { HTTP_STATUS } from '@/constants/httpStatus.constant';

/**
 * Class lỗi cơ sở cho tất cả các lỗi tùy chỉnh trong API
 * Kế thừa từ class Error có sẵn của JavaScript
 */
export class ErrorResponse extends Error {
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
 * Lỗi xung đột - Mã lỗi 409
 * Sử dụng khi yêu cầu xung đột với trạng thái hiện tại của server
 * Ví dụ: Tạo tài khoản với email đã tồn tại, tạo sản phẩm với mã đã có
 */
export class ConflictRequestError extends ErrorResponse {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.CONFLICT,
    statusCode: number = HTTP_STATUS.CONFLICT,
    errors: Record<string, unknown> = {}
  ) {
    super(message, statusCode, errors);
  }
}

/**
 * Lỗi yêu cầu không hợp lệ - Mã lỗi 400
 * Sử dụng khi yêu cầu bị lỗi cú pháp hoặc thiếu thông tin
 * Ví dụ: Thiếu trường bắt buộc, định dạng dữ liệu không hợp lệ
 */
export class BadRequestError extends ErrorResponse {
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
export class AuthFailureError extends ErrorResponse {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.UNAUTHORIZED,
    statusCode: number = HTTP_STATUS.UNAUTHORIZED,
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
export class NotFoundError extends ErrorResponse {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.NOT_FOUND,
    statusCode: number = HTTP_STATUS.NOT_FOUND,
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
export class ForbiddenError extends ErrorResponse {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.FORBIDDEN,
    statusCode: number = HTTP_STATUS.FORBIDDEN,
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
export class InternalServerError extends ErrorResponse {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.INTERNAL_SERVER_ERROR,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
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
export class BadGatewayError extends ErrorResponse {
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
export class ServiceUnavailableError extends ErrorResponse {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.SERVICE_UNAVAILABLE,
    statusCode: number = HTTP_STATUS.SERVICE_UNAVAILABLE,
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
export class UnprocessableEntityError extends ErrorResponse {
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
export class TooManyRequestsError extends ErrorResponse {
  constructor(
    message: string = HTTP_ERROR_MESSAGE.TOO_MANY_REQUESTS,
    statusCode: number = HTTP_STATUS.TOO_MANY_REQUESTS,
    errors: Record<string, unknown> = {}
  ) {
    super(message, statusCode, errors);
  }
}
