import { VALIDATION_ERROR_MESSAGE } from '@/constants';
import { NotFoundError } from '@/providers';

export const MissingAuthenticatedUserException = new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
