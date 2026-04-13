import { VALIDATION_ERROR_MESSAGE } from '@/application/common/constants/message.constant';
import {
  SharedUserIsBannedException,
  SharedUserNotFoundException,
  SharedUserNotVerifiedYetException
} from '@/application/errors/common/user.error';
import {
  AuthFailureError,
  BadRequestError,
  ForbiddenError,
  UnprocessableEntityError
} from '@/presentation/http/responses/error.response';

export const UsersUserNotFoundException = SharedUserNotFoundException;
export const CannotViewUserProfileBlockedException = new ForbiddenError(
  VALIDATION_ERROR_MESSAGE.CANNOT_VIEW_USER_PROFILE_BLOCKED
);
export const UsernameFormatInvalidException = new UnprocessableEntityError(
  VALIDATION_ERROR_MESSAGE.USERNAME_MUST_BE_4_TO_15_CHARACTERS_LONG_AND_CONTAIN_ONLY_LETTERS_NUMBERS_AND_UNDERSCORES
);
export const UsernameAlreadyExistsException = new UnprocessableEntityError(
  VALIDATION_ERROR_MESSAGE.USERNAME_ALREADY_EXISTS
);
export const MissingAuthTokenPayloadException = new AuthFailureError();
export const UserNotVerifiedYetException = SharedUserNotVerifiedYetException;
export const UserIsBannedException = SharedUserIsBannedException;
export const EngagementRequiresVerifiedAccountException = new ForbiddenError(
  VALIDATION_ERROR_MESSAGE.ENGAGEMENT_REQUIRES_VERIFIED_ACCOUNT
);
export const InvalidUserIdException = new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_USER_ID);
