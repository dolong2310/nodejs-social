import { CreateGroupPort } from '@/modules/conversation/application/use-cases/create-group/create-group.port';
import { GetConversationDetailPort } from '@/modules/conversation/application/use-cases/get-conversation-detail/get-conversation-detail.port';
import { GetConversationsPort } from '@/modules/conversation/application/use-cases/get-conversations/get-conversations.port';
import { GetOrCreateConversationPort } from '@/modules/conversation/application/use-cases/get-or-create-conversation/get-or-create-conversation.port';
import { InviteMemberPort } from '@/modules/conversation/application/use-cases/invite-member/invite-member.port';
import { KickMemberPort } from '@/modules/conversation/application/use-cases/kick-member/kick-member.port';
import { LeaveConversationPort } from '@/modules/conversation/application/use-cases/leave-conversation/leave-conversation.port';
import { TransferAdminPort } from '@/modules/conversation/application/use-cases/transfer-admin/transfer-admin.port';
import { UpdateConversationPort } from '@/modules/conversation/application/use-cases/update-conversation/update-conversation.port';
import { UpdateMemberRolePort } from '@/modules/conversation/application/use-cases/update-member-role/update-member-role.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import { ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';
import { CursorPaginationQueryDTO } from '@/presentation/http/express/v1/dtos/common/common.request.dto';
import {
  ConversationIdParams,
  ConversationMemberParams,
  CreateDirectConversationBodyDTO,
  CreateGroupConversationBodyDTO,
  InviteConversationMemberBodyDTO,
  PatchConversationBodyDTO,
  PatchConversationMemberRoleBodyDTO,
  TransferConversationAdminBodyDTO
} from '@/presentation/http/express/v1/dtos/conversation/conversation.request.dto';
import {
  ConversationDetailResponseDTO,
  ConversationResponseDTO
} from '@/presentation/http/express/v1/dtos/conversation/conversation.response.dto';
import { NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IConversationController {
  createDirect(
    req: ExpressRequest<ParamsDictionary, object, CreateDirectConversationBodyDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  createGroup(
    req: ExpressRequest<ParamsDictionary, object, CreateGroupConversationBodyDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  listConversations(
    req: ExpressRequest<ParamsDictionary, object, object, CursorPaginationQueryDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  getConversation(
    req: ExpressRequest<ConversationIdParams>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  patchConversation(
    req: ExpressRequest<ConversationIdParams, object, PatchConversationBodyDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  inviteMember(
    req: ExpressRequest<ConversationIdParams, object, InviteConversationMemberBodyDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  leaveConversation(
    req: ExpressRequest<ConversationIdParams>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  kickMember(req: ExpressRequest<ConversationMemberParams>, res: ExpressResponse, next: NextFunction): Promise<unknown>;
  patchMemberRole(
    req: ExpressRequest<ConversationMemberParams, object, PatchConversationMemberRoleBodyDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  transferAdmin(
    req: ExpressRequest<ConversationIdParams, object, TransferConversationAdminBodyDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
}

export class ConversationController extends BaseController implements IConversationController {
  constructor(
    private readonly createDirectUC: GetOrCreateConversationPort,
    private readonly createGroupUC: CreateGroupPort,
    private readonly listConversationsUC: GetConversationsPort,
    private readonly getConversationDetailUC: GetConversationDetailPort,
    private readonly updateConversationUC: UpdateConversationPort,
    private readonly inviteMemberUC: InviteMemberPort,
    private readonly kickMemberUC: KickMemberPort,
    private readonly leaveConversationUC: LeaveConversationPort,
    private readonly updateMemberRoleUC: UpdateMemberRolePort,
    private readonly transferAdminUC: TransferAdminPort
  ) {
    super();
  }

  @AutoBind()
  async createDirect(req: ExpressRequest<ParamsDictionary, object, CreateDirectConversationBodyDTO>) {
    const userId = this.getUserId(req);
    const body = new CreateDirectConversationBodyDTO(req.body);

    const conv = await this.createDirectUC.execute({ userId, peerUserId: body.peerUserId });

    return this.response({ instance: Created, data: conv, message: 'Direct conversation ready' });
  }

  @AutoBind()
  async createGroup(req: ExpressRequest<ParamsDictionary, object, CreateGroupConversationBodyDTO>) {
    const userId = this.getUserId(req);
    const body = new CreateGroupConversationBodyDTO(req.body);

    const conv = await this.createGroupUC.execute({ userId, name: body.name, memberIds: body.memberIds });

    return this.response({ instance: Created, data: conv, message: 'Group conversation created' });
  }

  @AutoBind()
  async listConversations(req: ExpressRequest<ParamsDictionary, object, object, CursorPaginationQueryDTO>) {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;

    const { items, nextCursor } = await this.listConversationsUC.execute({
      userId,
      limit: Number(limit),
      cursor
    });

    return this.cursorPaginatedResponse<ConversationResponseDTO>({
      items,
      nextCursor,
      message: 'List conversations successfully'
    });
  }

  @AutoBind()
  async getConversation(req: ExpressRequest<ConversationIdParams>) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;

    const detail = await this.getConversationDetailUC.execute({ userId, conversationId });

    return this.response<ConversationDetailResponseDTO>({
      data: new ConversationDetailResponseDTO(detail),
      message: 'Get conversation successfully'
    });
  }

  @AutoBind()
  async patchConversation(req: ExpressRequest<ConversationIdParams, object, PatchConversationBodyDTO>) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = new PatchConversationBodyDTO(req.body);

    const conv = await this.updateConversationUC.execute({
      userId,
      conversationId,
      name: body.name,
      avatarMediaId: body.avatarMediaId
    });

    return this.response<ConversationResponseDTO>({
      data: new ConversationResponseDTO(conv),
      message: 'Conversation updated'
    });
  }

  @AutoBind()
  async inviteMember(req: ExpressRequest<ConversationIdParams, object, InviteConversationMemberBodyDTO>) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = new InviteConversationMemberBodyDTO(req.body);

    const detail = await this.inviteMemberUC.execute({ userId, inviteeUserId: body.userId, conversationId });

    return this.response<ConversationDetailResponseDTO>({
      data: new ConversationDetailResponseDTO(detail),
      message: 'Member invited'
    });
  }

  @AutoBind()
  async kickMember(req: ExpressRequest<ConversationMemberParams>) {
    const userId = this.getUserId(req);
    const { conversationId, userId: targetUserId } = req.params;

    await this.kickMemberUC.execute({ userId, targetUserId, conversationId });

    return this.response({ message: 'Member removed' });
  }

  @AutoBind()
  async leaveConversation(req: ExpressRequest<ConversationIdParams>) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;

    await this.leaveConversationUC.execute({ userId, conversationId });

    return this.response({ message: 'Left conversation' });
  }

  @AutoBind()
  async patchMemberRole(req: ExpressRequest<ConversationMemberParams, object, PatchConversationMemberRoleBodyDTO>) {
    const userId = this.getUserId(req);
    const { conversationId, userId: targetUserId } = req.params;
    const body = new PatchConversationMemberRoleBodyDTO(req.body);

    const detail = await this.updateMemberRoleUC.execute({
      userId,
      targetUserId,
      conversationId,
      role: body.role
    });

    return this.response<ConversationDetailResponseDTO>({
      data: new ConversationDetailResponseDTO(detail),
      message: 'Member role updated'
    });
  }

  @AutoBind()
  async transferAdmin(req: ExpressRequest<ConversationIdParams, object, TransferConversationAdminBodyDTO>) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = new TransferConversationAdminBodyDTO(req.body);

    const detail = await this.transferAdminUC.execute({
      userId,
      newAdminUserId: body.newAdminUserId,
      conversationId
    });

    return this.response<ConversationDetailResponseDTO>({
      data: new ConversationDetailResponseDTO(detail),
      message: 'Admin transferred'
    });
  }
}
