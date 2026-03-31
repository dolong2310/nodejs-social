import { VALIDATION_ERROR_MESSAGE } from '@/constants';
import { AuthFailureError, ForbiddenError, NotFoundError } from '@/providers';

export const SocketUnauthorizedException = new AuthFailureError();
export const SocketTokenInvalidException = new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
export const SocketUserNotFoundException = new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
export const SocketUserNotVerifiedException = new ForbiddenError(VALIDATION_ERROR_MESSAGE.USER_NOT_VERIFIED_YET);
export const SocketUserBannedException = new ForbiddenError(VALIDATION_ERROR_MESSAGE.USER_IS_BANNED);
export const SocketEventUnauthorizedError = new Error('Unauthorized');
