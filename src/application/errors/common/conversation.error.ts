import { VALIDATION_ERROR_MESSAGE } from '@/application/common/constants/message.constant';
import { ForbiddenError, NotFoundError } from '@/presentation/http/responses/error.response';

export const SharedConversationNotFoundException = new NotFoundError(VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_FOUND);
export const SharedConversationNotMemberException = new ForbiddenError(
  VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_MEMBER
);
