import { VALIDATION_ERROR_MESSAGE } from '@/constants';
import { BadRequestError } from '@/providers';

export const SharedInvalidCursorException = new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_CURSOR);
