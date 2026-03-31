import { VALIDATION_ERROR_MESSAGE } from '@/constants';
import { BadRequestError } from '@/providers';

export const LikePostNotFoundException = new BadRequestError(VALIDATION_ERROR_MESSAGE.POST_NOT_FOUND);
