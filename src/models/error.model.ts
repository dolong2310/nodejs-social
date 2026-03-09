import HTTP_STATUS, { HTTP_STATUS_TYPE } from '@/constants/httpStatus.constant';
import { ERROR_MESSAGE } from '@/constants/message.constant';

type ErrorsType = Record<
  string,
  {
    msg: string;
    [key: string]: any;
  }
>;

export class ErrorWithStatus {
  message: string;
  status: HTTP_STATUS_TYPE;
  constructor({ message, status }: { message: string; status: HTTP_STATUS_TYPE }) {
    this.message = message;
    this.status = status;
  }
}

export class ErrorEntity extends ErrorWithStatus {
  errors: ErrorsType;
  constructor({
    message = ERROR_MESSAGE.UNPROCESSABLE_ENTITY,
    status = HTTP_STATUS.UNPROCESSABLE_ENTITY,
    errors = {}
  }: {
    message: string;
    status: HTTP_STATUS_TYPE;
    errors: ErrorsType;
  }) {
    super({ message, status });
    this.errors = errors;
  }
}
