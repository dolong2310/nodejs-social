import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { BadRequestError } from '@/providers/httpResponses/error.response';

export const BookmarkPostNotFoundException = new BadRequestError(VALIDATION_ERROR_MESSAGE.POST_NOT_FOUND);
