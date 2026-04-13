import { VALIDATION_ERROR_MESSAGE } from '@/application/common/constants/message.constant';
import { AuthFailureError } from '@/presentation/http/responses/error.response';

export const TokenInvalidException = new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
