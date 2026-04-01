import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { AuthFailureError } from '@/providers/httpResponses/error.response';

export const TokenInvalidException = new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
