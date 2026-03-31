import { VALIDATION_ERROR_MESSAGE } from '@/constants';
import { ForbiddenError, NotFoundError } from '@/providers';

export const SharedUserNotFoundException = new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
export const SharedUserNotVerifiedYetException = new ForbiddenError(VALIDATION_ERROR_MESSAGE.USER_NOT_VERIFIED_YET);
export const SharedUserIsBannedException = new ForbiddenError(VALIDATION_ERROR_MESSAGE.USER_IS_BANNED);
