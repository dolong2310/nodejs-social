import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constant';
import { ForbiddenError } from '@/presentation/http/express/responses/error.response';

export const RoleIsInactiveException = new ForbiddenError(VALIDATION_ERROR_MESSAGE.ROLE_IS_INACTIVE);
