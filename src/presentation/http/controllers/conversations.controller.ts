import { IConversationsService } from '@/application/ports/conversation.port';

import { BaseController } from '@/presentation/http/controllers/base.controller';
import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import { CursorPaginationQueryDTO } from '@/presentation/http/dtos/common/common.request.dto';
import {
  ConversationIdParams,
  ConversationMemberParams,
  CreateDirectConversationBodyDTO,
  CreateGroupConversationBodyDTO,
  InviteConversationMemberBodyDTO,
  PatchConversationBodyDTO,
  PatchConversationMemberRoleBodyDTO,
  TransferConversationAdminBodyDTO
} from '@/presentation/http/dtos/conversation/conversations.request.dto';
import { Created } from '@/presentation/http/responses/success.response';

import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IConversationsController {
  createDirect(req: Request<ParamsDictionary, object, CreateDirectConversationBodyDTO>, res: Response): Promise<void>;
  createGroup(req: Request<ParamsDictionary, object, CreateGroupConversationBodyDTO>, res: Response): Promise<void>;
  listConversations(
    req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>,
    res: Response
  ): Promise<void>;
  getConversation(req: Request<ConversationIdParams>, res: Response): Promise<void>;
  patchConversation(req: Request<ConversationIdParams, object, PatchConversationBodyDTO>, res: Response): Promise<void>;
  inviteMember(
    req: Request<ConversationIdParams, object, InviteConversationMemberBodyDTO>,
    res: Response
  ): Promise<void>;
  leaveConversation(req: Request<ConversationIdParams>, res: Response): Promise<void>;
  kickMember(req: Request<ConversationMemberParams>, res: Response): Promise<void>;
  patchMemberRole(
    req: Request<ConversationMemberParams, object, PatchConversationMemberRoleBodyDTO>,
    res: Response
  ): Promise<void>;
  transferAdmin(
    req: Request<ConversationIdParams, object, TransferConversationAdminBodyDTO>,
    res: Response
  ): Promise<void>;
}

export class ConversationsController extends BaseController implements IConversationsController {
  constructor(private readonly conversationsService: IConversationsService) {
    super();
  }

  @AutoBind()
  async createDirect(req: Request<ParamsDictionary, object, CreateDirectConversationBodyDTO>, res: Response) {
    const userId = this.getUserId(req);
    const body = new CreateDirectConversationBodyDTO(req.body);
    const conv = await this.conversationsService.getOrCreateDirect({ userId, peerUserId: body.peerUserId });
    this.sendResponse({ res, instance: Created, data: conv, message: 'Direct conversation ready' });
  }

  @AutoBind()
  async createGroup(req: Request<ParamsDictionary, object, CreateGroupConversationBodyDTO>, res: Response) {
    const userId = this.getUserId(req);
    const body = new CreateGroupConversationBodyDTO(req.body);
    const conv = await this.conversationsService.createGroup({ userId, name: body.name, memberIds: body.memberIds });
    this.sendResponse({ res, instance: Created, data: conv, message: 'Group conversation created' });
  }

  @AutoBind()
  async listConversations(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;
    const { items, nextCursor } = await this.conversationsService.listConversations({
      userId,
      limit: Number(limit),
      cursor
    });
    this.sendCursorPaginatedResponse({
      res,
      items,
      nextCursor,
      message: 'List conversations successfully'
    });
  }

  @AutoBind()
  async getConversation(req: Request<ConversationIdParams>, res: Response) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const detail = await this.conversationsService.getConversationDetail({ userId, conversationId });
    this.sendResponse({ res, data: detail, message: 'Get conversation successfully' });
  }

  @AutoBind()
  async patchConversation(req: Request<ConversationIdParams, object, PatchConversationBodyDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = new PatchConversationBodyDTO(req.body);
    const conv = await this.conversationsService.patchConversation({
      userId,
      conversationId,
      name: body.name,
      avatarMediaId: body.avatarMediaId
    });
    this.sendResponse({ res, data: conv, message: 'Conversation updated' });
  }

  @AutoBind()
  async inviteMember(req: Request<ConversationIdParams, object, InviteConversationMemberBodyDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = new InviteConversationMemberBodyDTO(req.body);
    const detail = await this.conversationsService.inviteMember({ userId, inviteeUserId: body.userId, conversationId });
    this.sendResponse({ res, data: detail, message: 'Member invited' });
  }

  @AutoBind()
  async kickMember(req: Request<ConversationMemberParams>, res: Response) {
    const userId = this.getUserId(req);
    const { conversationId, userId: targetUserId } = req.params;
    await this.conversationsService.kickMember({ userId, targetUserId, conversationId });
    this.sendResponse({ res, data: null, message: 'Member removed' });
  }

  @AutoBind()
  async leaveConversation(req: Request<ConversationIdParams>, res: Response) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    await this.conversationsService.leaveConversation({ userId, conversationId });
    this.sendResponse({ res, data: null, message: 'Left conversation' });
  }

  @AutoBind()
  async patchMemberRole(
    req: Request<ConversationMemberParams, object, PatchConversationMemberRoleBodyDTO>,
    res: Response
  ) {
    const userId = this.getUserId(req);
    const { conversationId, userId: targetUserId } = req.params;
    const body = new PatchConversationMemberRoleBodyDTO(req.body);
    const detail = await this.conversationsService.patchMemberRole({
      userId,
      targetUserId,
      conversationId,
      role: body.role
    });
    this.sendResponse({ res, data: detail, message: 'Member role updated' });
  }

  @AutoBind()
  async transferAdmin(req: Request<ConversationIdParams, object, TransferConversationAdminBodyDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = new TransferConversationAdminBodyDTO(req.body);
    const detail = await this.conversationsService.transferAdmin({
      userId,
      newAdminUserId: body.newAdminUserId,
      conversationId
    });
    this.sendResponse({ res, data: detail, message: 'Admin transferred' });
  }
}
