import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constants';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException
} from '@/presentation/http/express/responses/error.response';
import { HTTP_ERROR_MESSAGE } from '@/presentation/http/express/responses/http-message.constants';
import { HTTP_STATUS } from '@/presentation/http/express/responses/http-status.constants';

export const VideoNotFoundException = new NotFoundException(VALIDATION_ERROR_MESSAGE.VIDEO_NOT_FOUND);
export const StaticMediaNotFoundException = new NotFoundException();
export const StaticVideoStreamInternalServerErrorException = new InternalServerErrorException();
export const RequestedRangeNotSatisfiableException = new BadRequestException(
  HTTP_ERROR_MESSAGE.REQUESTED_RANGE_NOT_SATISFIABLE,
  HTTP_STATUS.REQUESTED_RANGE_NOT_SATISFIABLE
);
