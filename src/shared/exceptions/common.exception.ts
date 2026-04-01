import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { BadRequestError } from '@/providers/httpResponses/error.response';

export const PageMustBeGreaterThanZeroException = new BadRequestError(
  VALIDATION_ERROR_MESSAGE.PAGE_MUST_BE_GREATER_THAN_0
);
export const LimitMustBeBetweenOneToHundredException = new BadRequestError(
  VALIDATION_ERROR_MESSAGE.LIMIT_MUST_BE_BETWEEN_1_TO_100
);
