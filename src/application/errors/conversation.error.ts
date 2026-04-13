import { VALIDATION_ERROR_MESSAGE } from '@/application/common/constants/message.constant';
import {
  SharedConversationNotFoundException,
  SharedConversationNotMemberException
} from '@/application/errors/common/conversation.error';
import { SharedUserNotFoundException } from '@/application/errors/common/user.error';
import { SharedInvalidCursorException } from '@/application/errors/pagination.error';
import { BadRequestError, ConflictRequestError, ForbiddenError } from '@/presentation/http/responses/error.response';

export const ConversationNotFoundException = SharedConversationNotFoundException;
export const ConversationInvalidPeerException = new BadRequestError(VALIDATION_ERROR_MESSAGE.CONVERSATION_INVALID_PEER);
export const ConversationPeerNotFriendException = new ForbiddenError(
  VALIDATION_ERROR_MESSAGE.CONVERSATION_PEER_NOT_FRIEND
);
export const ConversationPeerBlockedException = new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_PEER_BLOCKED);
export const ConversationGroupNeedsMemberException = new BadRequestError(
  VALIDATION_ERROR_MESSAGE.CONVERSATION_GROUP_NEEDS_MEMBER
);
export const ConversationInvalidCursorException = SharedInvalidCursorException;
export const ConversationRoleForbiddenException = new ForbiddenError(
  VALIDATION_ERROR_MESSAGE.CONVERSATION_ROLE_FORBIDDEN
);
export const ConversationTypeInvalidForOperationException = new BadRequestError(
  VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_FOUND
);
export const ConversationUserAlreadyMemberException = new ConflictRequestError(
  VALIDATION_ERROR_MESSAGE.CONVERSATION_USER_ALREADY_MEMBER
);
export const ConversationInviteNotFriendException = new ForbiddenError(
  VALIDATION_ERROR_MESSAGE.CONVERSATION_INVITE_NOT_FRIEND_OF_BOTH
);
export const ConversationDirectNoKickException = new BadRequestError(
  VALIDATION_ERROR_MESSAGE.CONVERSATION_DIRECT_NO_KICK
);
export const ConversationCannotKickException = new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_CANNOT_KICK);
export const ConversationCannotKickBadRequestException = new BadRequestError(
  VALIDATION_ERROR_MESSAGE.CONVERSATION_CANNOT_KICK
);
export const ConversationNotMemberException = SharedConversationNotMemberException;
export const ConversationTargetUserNotFoundException = SharedUserNotFoundException;
