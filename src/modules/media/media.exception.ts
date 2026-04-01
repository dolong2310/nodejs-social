import { HTTP_ERROR_MESSAGE } from '@/constants/httpMessage.constant';
import { HTTP_STATUS } from '@/constants/httpStatus.constant';
import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { BadRequestError, InternalServerError, NotFoundError } from '@/providers/httpResponses/error.response';

export const VideoNotFoundException = new NotFoundError(VALIDATION_ERROR_MESSAGE.VIDEO_NOT_FOUND);
export const StaticMediaNotFoundException = new NotFoundError();
export const StaticVideoStreamInternalServerErrorException = new InternalServerError();
export const RequestedRangeNotSatisfiableException = new BadRequestError(
  HTTP_ERROR_MESSAGE.REQUESTED_RANGE_NOT_SATISFIABLE,
  HTTP_STATUS.REQUESTED_RANGE_NOT_SATISFIABLE
);
