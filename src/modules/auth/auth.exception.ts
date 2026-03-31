import { VALIDATION_ERROR_MESSAGE } from '@/constants';
import { AuthFailureError, BadRequestError, ForbiddenError, NotFoundError } from '@/providers';

export const EmailAlreadyExistsException = new BadRequestError(VALIDATION_ERROR_MESSAGE.EMAIL_ALREADY_EXISTS);
export const InvalidEmailOrPasswordException = new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_EMAIL_OR_PASSWORD);
export const InvalidTokenAuthFailureException = new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
export const InvalidTokenBadRequestException = new BadRequestError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
export const TokenHasExpiredException = new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_HAS_EXPIRED);
export const TokenIsRequiredException = new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_REQUIRED);
export const NoTokenProvidedException = new ForbiddenError(VALIDATION_ERROR_MESSAGE.NO_TOKEN_PROVIDED);
export const UserNotFoundException = new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
export const UserAlreadyVerifiedException = new BadRequestError(VALIDATION_ERROR_MESSAGE.USER_ALREADY_VERIFIED);
export const ConfirmPasswordMustMatchException = new BadRequestError(
  VALIDATION_ERROR_MESSAGE.CONFIRM_PASSWORD_MUST_MATCH_PASSWORD
);
