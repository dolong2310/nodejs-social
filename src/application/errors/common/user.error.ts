import { VALIDATION_ERROR_MESSAGE } from '@/application/common/constants/message.constant';
import { ForbiddenError, NotFoundError } from '@/presentation/http/responses/error.response';

export const SharedUserNotFoundException = new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
export const SharedUserNotVerifiedYetException = new ForbiddenError(VALIDATION_ERROR_MESSAGE.USER_NOT_VERIFIED_YET);
export const SharedUserIsBannedException = new ForbiddenError(VALIDATION_ERROR_MESSAGE.USER_IS_BANNED);
