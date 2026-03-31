import { VALIDATION_ERROR_MESSAGE } from '@/constants';
import { BadRequestError, NotFoundError } from '@/providers';

export const NotificationActorUserNotFoundException = new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
export const NotificationInvalidCursorException = new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_CURSOR);
