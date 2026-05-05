import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constant';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException
} from '@/presentation/http/express/responses/error.response';

export const TokenHasExpiredException = new UnauthorizedException(VALIDATION_ERROR_MESSAGE.TOKEN_HAS_EXPIRED);
export const NoTokenProvidedException = new ForbiddenException(VALIDATION_ERROR_MESSAGE.NO_TOKEN_PROVIDED);
export const ConfirmPasswordMustMatchException = new BadRequestException(
  VALIDATION_ERROR_MESSAGE.CONFIRM_PASSWORD_MUST_MATCH_PASSWORD
);
