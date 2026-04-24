import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/constants/message.constant';
import {
  AuthFailureError,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError
} from '@/presentation/http/responses/error.response';

export const UserNotFoundException = new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
export const UserIsInactiveException = new ForbiddenError(VALIDATION_ERROR_MESSAGE.USER_IS_INACTIVE);
export const UserIsBannedException = new ForbiddenError(VALIDATION_ERROR_MESSAGE.USER_IS_BANNED);
export const UsernameFormatInvalidException = new UnprocessableEntityError(
  VALIDATION_ERROR_MESSAGE.USERNAME_MUST_BE_4_TO_15_CHARACTERS_LONG_AND_CONTAIN_ONLY_LETTERS_NUMBERS_AND_UNDERSCORES
);
export const UsernameAlreadyExistsException = new UnprocessableEntityError(
  VALIDATION_ERROR_MESSAGE.USERNAME_ALREADY_EXISTS
);
export const MissingAuthTokenPayloadException = new AuthFailureError();
export const InvalidUserIdException = new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_USER_ID);
