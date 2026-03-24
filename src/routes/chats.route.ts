/*
 * Chat direct / group / messages / read / get / patch / invite / leave / kick / patch role / transfer admin.
 */

import { IChatMessagesController } from '@/controllers/chatMessages.controller';
import { IChatsController } from '@/controllers/chats.controller';
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

    this.router.post(
      '/direct',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.chatsValidation.peerUserIdBody,
      asyncHandler(this.chatsController.createDirect)
    );

    this.router.post(
      '/groups',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.chatsValidation.createGroupBody,
      asyncHandler(this.chatsController.createGroup)
    );

    this.router.get(
      '/',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.chatsValidation.listChatsQuery,
      asyncHandler(this.chatsController.listChats)
    );

    this.router.get(
      '/:chatId/messages',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.chatsValidation.chatIdParam,
      this.chatsValidation.listMessagesQuery,
      asyncHandler(this.chatMessagesController.listMessages)
    );

    this.router.post(
      '/:chatId/messages',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.chatsValidation.chatIdParam,
      this.chatsValidation.sendMessageBody,
      asyncHandler(this.chatMessagesController.sendMessage)
    );

    this.router.patch(
      '/:chatId/read',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.chatsValidation.chatIdParam,
      this.chatsValidation.markReadBody,
      asyncHandler(this.chatMessagesController.markRead)
    );

    this.router.get(
      '/:chatId',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.chatsValidation.chatIdParam,
      asyncHandler(this.chatsController.getChat)
    );

    this.router.patch(
      '/:chatId',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.chatsValidation.chatIdParam,
      this.chatsValidation.patchChatBody,
      asyncHandler(this.chatsController.patchChat)
    );

    this.router.post(
      '/:chatId/members',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.chatsValidation.chatIdParam,
      this.chatsValidation.inviteUserIdBody,
      asyncHandler(this.chatsController.inviteMember)
    );

    this.router.delete(
      '/:chatId/members/me',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.chatsValidation.chatIdParam,
      asyncHandler(this.chatsController.leaveChat)
    );

    this.router.delete(
      '/:chatId/members/:userId',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.chatsValidation.chatIdParam,
      this.chatsValidation.kickTargetUserIdParam,
      asyncHandler(this.chatsController.kickMember)
    );

    this.router.patch(
      '/:chatId/members/:userId/role',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.chatsValidation.chatIdParam,
      this.chatsValidation.kickTargetUserIdParam,
      this.chatsValidation.patchMemberRoleBody,
      asyncHandler(this.chatsController.patchMemberRole)
    );

    this.router.post(
      '/:chatId/admin/transfer',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.chatsValidation.chatIdParam,
      this.chatsValidation.newAdminUserIdBody,
      asyncHandler(this.chatsController.transferAdmin)
    );
  }
}

export default () => {
  const r = new ChatsRoute();
  return r.getRouter();
};
