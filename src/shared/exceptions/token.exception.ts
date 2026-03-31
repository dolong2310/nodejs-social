import { VALIDATION_ERROR_MESSAGE } from '@/constants';
import { AuthFailureError } from '@/providers';

export const TokenInvalidException = new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
