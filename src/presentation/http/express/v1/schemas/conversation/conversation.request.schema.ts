import { EnumConversationMemberRole } from '@/modules/conversation/domain/entities/conversation-member.types';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constants';
import { requestObject } from '@/presentation/http/express/utils/schema.util';
import { idSchema, userIdSchema } from '@/presentation/http/express/v1/schemas/common/primitives.schema';
import { array, minLength, nullable, optional, picklist, pipe, string, trim } from 'valibot';

export const conversationIdSchema = idSchema({
  required: VALIDATION_ERROR_MESSAGE.CONVERSATION_ID_IS_REQUIRED,
  invalid: VALIDATION_ERROR_MESSAGE.CONVERSATION_ID_MUST_BE_A_STRING,
  format: VALIDATION_ERROR_MESSAGE.INVALID_CONVERSATION_ID
});

const conversationNameSchema = pipe(string(), trim());

export const ConversationIdParamsSchema = requestObject({ conversationId: conversationIdSchema });

export const ConversationMemberParamsSchema = requestObject({
  conversationId: conversationIdSchema,
  userId: userIdSchema
});

export const CreateDirectConversationBodySchema = requestObject({ peerUserId: userIdSchema });

export const CreateGroupConversationBodySchema = requestObject({
  name: optional(conversationNameSchema),
  memberIds: pipe(
    array(userIdSchema, VALIDATION_ERROR_MESSAGE.CONVERSATION_GROUP_NEEDS_MEMBER),
    minLength(1, VALIDATION_ERROR_MESSAGE.CONVERSATION_GROUP_NEEDS_MEMBER)
  )
});

export const PatchConversationBodySchema = requestObject({
  name: optional(conversationNameSchema),
  avatarMediaId: optional(nullable(string()))
});

export const InviteConversationMemberBodySchema = requestObject({ userId: userIdSchema });

export const PatchConversationMemberRoleBodySchema = requestObject({
  role: picklist(
    [EnumConversationMemberRole.MANAGER, EnumConversationMemberRole.MEMBER],
    VALIDATION_ERROR_MESSAGE.CONVERSATION_ROLE_FORBIDDEN
  )
});

export const TransferConversationAdminBodySchema = requestObject({ newAdminUserId: userIdSchema });
