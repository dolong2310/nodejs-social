import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { BadRequestError } from '@/providers/httpResponses/error.response';

export const SharedInvalidCursorException = new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_CURSOR);
