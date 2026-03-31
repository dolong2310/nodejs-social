/*
 * Conversations: direct / group / messages / read / get / patch / invite / leave / kick / patch role / transfer admin.
 */

import {
  BaseRoute,
  ChatMessagesController,
  ChatMessagesValidation,
  ConversationsController,
  ConversationsValidation,
  UsersValidation,
  protect
} from '@/modules';
import { appLimiter, validateCursorPaginationQuery } from '@/shared';
import { asyncHandler } from '@/utils';

class ConversationsRoute extends BaseRoute {
  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    const {
      createDirect,
      createGroup,
      listConversations,
      getConversation,
      patchConversation,
      inviteMember,
      leaveConversation,
      kickMember,
      patchMemberRole,
      transferAdmin
    } = this.container.get(ConversationsController);
    const { listMessages, sendMessage, markRead } = this.container.get(ChatMessagesController);
    const { userVerifiedValidation } = this.container.get(UsersValidation);
    const {
      peerUserIdBody,
      createGroupBody,
      conversationIdParam,
      patchConversationBody,
      inviteUserIdBody,
      kickTargetUserIdParam,
      patchMemberRoleBody,
      newAdminUserIdBody
    } = this.container.get(ConversationsValidation);
    const { sendMessageBody, markReadBody } = this.container.get(ChatMessagesValidation);

    this.router.post(
      '/direct',
      appLimiter,
      protect,
      userVerifiedValidation,
      peerUserIdBody,
      asyncHandler(createDirect)
    );

    this.router.post(
      '/groups',
      appLimiter,
      protect,
      userVerifiedValidation,
      createGroupBody,
      asyncHandler(createGroup)
    );

    this.router.get(
      '/',
      appLimiter,
      protect,
      userVerifiedValidation,
      validateCursorPaginationQuery,
      asyncHandler(listConversations)
    );

    this.router.get(
      '/:conversationId',
      appLimiter,
      protect,
      userVerifiedValidation,
      conversationIdParam,
      asyncHandler(getConversation)
    );

    this.router.patch(
      '/:conversationId',
      appLimiter,
      protect,
      userVerifiedValidation,
      conversationIdParam,
      patchConversationBody,
      asyncHandler(patchConversation)
    );

    this.router.post(
      '/:conversationId/members',
      appLimiter,
      protect,
      userVerifiedValidation,
      conversationIdParam,
      inviteUserIdBody,
      asyncHandler(inviteMember)
    );

    this.router.delete(
      '/:conversationId/members/me',
      appLimiter,
      protect,
      userVerifiedValidation,
      conversationIdParam,
      asyncHandler(leaveConversation)
    );

    this.router.delete(
      '/:conversationId/members/:userId',
      appLimiter,
      protect,
      userVerifiedValidation,
      conversationIdParam,
      kickTargetUserIdParam,
      asyncHandler(kickMember)
    );

    this.router.patch(
      '/:conversationId/members/:userId/role',
      appLimiter,
      protect,
      userVerifiedValidation,
      conversationIdParam,
      kickTargetUserIdParam,
      patchMemberRoleBody,
      asyncHandler(patchMemberRole)
    );

    this.router.post(
      '/:conversationId/admin/transfer',
      appLimiter,
      protect,
      userVerifiedValidation,
      conversationIdParam,
      newAdminUserIdBody,
      asyncHandler(transferAdmin)
    );

    // Chat Messages
    this.router.get(
      '/:conversationId/messages',
      appLimiter,
      protect,
      userVerifiedValidation,
      conversationIdParam,
      validateCursorPaginationQuery,
      asyncHandler(listMessages)
    );

    this.router.post(
      '/:conversationId/messages',
      appLimiter,
      protect,
      userVerifiedValidation,
      conversationIdParam,
      sendMessageBody,
      asyncHandler(sendMessage)
    );

    this.router.patch(
      '/:conversationId/read',
      appLimiter,
      protect,
      userVerifiedValidation,
      conversationIdParam,
      markReadBody,
      asyncHandler(markRead)
    );
  }
}

export function conversationsRouter() {
  return new ConversationsRoute().getRouter();
}
