import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/constants/message.constant';
import { AuthFailureError, BadRequestError, ForbiddenError } from '@/presentation/http/responses/error.response';

export const TokenHasExpiredException = new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_HAS_EXPIRED);
export const NoTokenProvidedException = new ForbiddenError(VALIDATION_ERROR_MESSAGE.NO_TOKEN_PROVIDED);
export const ConfirmPasswordMustMatchException = new BadRequestError(
  VALIDATION_ERROR_MESSAGE.CONFIRM_PASSWORD_MUST_MATCH_PASSWORD
);
