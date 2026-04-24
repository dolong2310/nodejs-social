import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/constants/message.constant';
import { BadRequestError, InternalServerError, NotFoundError } from '@/presentation/http/responses/error.response';
import { HTTP_ERROR_MESSAGE } from '@/presentation/http/responses/http-message.constant';
import { HTTP_STATUS } from '@/presentation/http/responses/http-status.constant';

export const VideoNotFoundException = new NotFoundError(VALIDATION_ERROR_MESSAGE.VIDEO_NOT_FOUND);
export const StaticMediaNotFoundException = new NotFoundError();
export const StaticVideoStreamInternalServerErrorException = new InternalServerError();
export const RequestedRangeNotSatisfiableException = new BadRequestError(
  HTTP_ERROR_MESSAGE.REQUESTED_RANGE_NOT_SATISFIABLE,
  HTTP_STATUS.REQUESTED_RANGE_NOT_SATISFIABLE
);
