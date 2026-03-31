import { HTTP_ERROR_MESSAGE, HTTP_STATUS, VALIDATION_ERROR_MESSAGE } from '@/constants';
import { BadRequestError, InternalServerError, NotFoundError } from '@/providers';

export const VideoNotFoundException = new NotFoundError(VALIDATION_ERROR_MESSAGE.VIDEO_NOT_FOUND);
export const StaticMediaNotFoundException = new NotFoundError();
export const StaticVideoStreamInternalServerErrorException = new InternalServerError();
export const RequestedRangeNotSatisfiableException = new BadRequestError(
  HTTP_ERROR_MESSAGE.REQUESTED_RANGE_NOT_SATISFIABLE,
  HTTP_STATUS.REQUESTED_RANGE_NOT_SATISFIABLE
);
