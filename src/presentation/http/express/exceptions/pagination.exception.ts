import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constant';
import { BadRequestException } from '@/presentation/http/express/responses/error.response';

export const PageMustBeGreaterThanZeroException = new BadRequestException(
  VALIDATION_ERROR_MESSAGE.PAGE_MUST_BE_GREATER_THAN_0
);
export const LimitMustBeBetweenOneToHundredException = new BadRequestException(
  VALIDATION_ERROR_MESSAGE.LIMIT_MUST_BE_BETWEEN_1_TO_100
);
