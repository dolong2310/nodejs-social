import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constant';
import { AuthFailureError } from '@/presentation/http/express/responses/error.response';

export const TokenInvalidException = new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
