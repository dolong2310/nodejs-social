/*
 * Phase 4 — Chat HTTP API (`/api/chats`). Uses chat DB collections; verified users only (same as friends).
 */

import ChatMessagesController, { IChatMessagesController } from '@/controllers/chatMessages.controller';
import ChatsController, { IChatsController } from '@/controllers/chats.controller';
import { protect } from '@/middlewares/auth.middleware';
import { appLimiter } from '@/middlewares/limiter.middleware';
import { BaseRoute } from '@/routes/base.route';
import { asyncHandler } from '@/utils/handler.util';
import { IChatsValidation } from '@/validations/chats.validation';
import { IUsersValidation } from '@/validations/users.validation';

export class ChatsRoute extends BaseRoute {
  private chatsController!: IChatsController;
  private chatMessagesController!: IChatMessagesController;
  private usersValidation!: IUsersValidation;
  private chatsValidation!: IChatsValidation;

  protected initializeRoutes(): void {
    this.chatsController = this.container.getChatsController();
    this.chatMessagesController = this.container.getChatMessagesController();
    this.usersValidation = this.container.getUsersValidation();
    this.chatsValidation = this.container.getChatsValidation();

    const v = this.usersValidation.userVerifiedValidation;
    const cv = this.chatsValidation;

    this.router.post('/direct', appLimiter, protect, v, cv.peerUserIdBody, asyncHandler(this.chatsController.createDirect));

    this.router.post('/groups', appLimiter, protect, v, cv.createGroupBody, asyncHandler(this.chatsController.createGroup));

    this.router.get('/', appLimiter, protect, v, cv.listChatsQuery, asyncHandler(this.chatsController.listChats));

    this.router.get(
      '/:chatId/messages',
      appLimiter,
      protect,
      v,
      cv.chatIdParam,
      cv.listMessagesQuery,
      asyncHandler(this.chatMessagesController.listMessages)
    );

    this.router.post(
      '/:chatId/messages',
      appLimiter,
      protect,
      v,
      cv.chatIdParam,
      cv.sendMessageBody,
      asyncHandler(this.chatMessagesController.sendMessage)
    );

    this.router.patch(
      '/:chatId/read',
      appLimiter,
      protect,
      v,
      cv.chatIdParam,
      cv.markReadBody,
      asyncHandler(this.chatMessagesController.markRead)
    );

    this.router.get('/:chatId', appLimiter, protect, v, cv.chatIdParam, asyncHandler(this.chatsController.getChat));

    this.router.patch(
      '/:chatId',
      appLimiter,
      protect,
      v,
      cv.chatIdParam,
      cv.patchChatBody,
      asyncHandler(this.chatsController.patchChat)
    );

    this.router.post(
      '/:chatId/members',
      appLimiter,
      protect,
      v,
      cv.chatIdParam,
      cv.inviteUserIdBody,
      asyncHandler(this.chatsController.inviteMember)
    );

    this.router.delete('/:chatId/members/me', appLimiter, protect, v, cv.chatIdParam, asyncHandler(this.chatsController.leaveChat));

    this.router.delete(
      '/:chatId/members/:userId',
      appLimiter,
      protect,
      v,
      cv.chatIdParam,
      cv.kickTargetUserIdParam,
      asyncHandler(this.chatsController.kickMember)
    );

    this.router.patch(
      '/:chatId/members/:userId/role',
      appLimiter,
      protect,
      v,
      cv.chatIdParam,
      cv.kickTargetUserIdParam,
      cv.patchMemberRoleBody,
      asyncHandler(this.chatsController.patchMemberRole)
    );

    this.router.post(
      '/:chatId/admin/transfer',
      appLimiter,
      protect,
      v,
      cv.chatIdParam,
      cv.newAdminUserIdBody,
      asyncHandler(this.chatsController.transferAdmin)
    );
  }
}

export default () => {
  const r = new ChatsRoute();
  return r.getRouter();
};
