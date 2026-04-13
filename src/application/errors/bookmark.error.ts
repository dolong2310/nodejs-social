import { VALIDATION_ERROR_MESSAGE } from '@/application/common/constants/message.constant';
import { BadRequestError } from '@/presentation/http/responses/error.response';

export const BookmarkPostNotFoundException = new BadRequestError(VALIDATION_ERROR_MESSAGE.POST_NOT_FOUND);
