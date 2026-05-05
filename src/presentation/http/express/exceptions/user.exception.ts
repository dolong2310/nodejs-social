import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constant';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException
} from '@/presentation/http/express/responses/error.response';

export const UserNotFoundException = new NotFoundException(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
export const UserIsInactiveException = new ForbiddenException(VALIDATION_ERROR_MESSAGE.USER_IS_INACTIVE);
export const UserIsBannedException = new ForbiddenException(VALIDATION_ERROR_MESSAGE.USER_IS_BANNED);
export const UsernameFormatInvalidException = new UnprocessableEntityException(
  VALIDATION_ERROR_MESSAGE.USERNAME_MUST_BE_4_TO_15_CHARACTERS_LONG_AND_CONTAIN_ONLY_LETTERS_NUMBERS_AND_UNDERSCORES
);
export const MissingAuthTokenPayloadException = new UnauthorizedException();
export const InvalidUserIdException = new BadRequestException(VALIDATION_ERROR_MESSAGE.INVALID_USER_ID);
