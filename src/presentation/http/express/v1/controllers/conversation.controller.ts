import { CreateGroupInPort } from '@/modules/conversation/application/use-cases/create-group/create-group.in-port';
import { GetConversationDetailInPort } from '@/modules/conversation/application/use-cases/get-conversation-detail/get-conversation-detail.in-port';
import { GetConversationsInPort } from '@/modules/conversation/application/use-cases/get-conversations/get-conversations.in-port';
import { GetOrCreateConversationInPort } from '@/modules/conversation/application/use-cases/get-or-create-conversation/get-or-create-conversation.in-port';
import { InviteMemberInPort } from '@/modules/conversation/application/use-cases/invite-member/invite-member.in-port';
import { KickMemberInPort } from '@/modules/conversation/application/use-cases/kick-member/kick-member.in-port';
import { LeaveConversationInPort } from '@/modules/conversation/application/use-cases/leave-conversation/leave-conversation.in-port';
import { TransferAdminInPort } from '@/modules/conversation/application/use-cases/transfer-admin/transfer-admin.in-port';
import { UpdateConversationInPort } from '@/modules/conversation/application/use-cases/update-conversation/update-conversation.in-port';
import { UpdateMemberRoleInPort } from '@/modules/conversation/application/use-cases/update-member-role/update-member-role.in-port';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import { BaseController } from '@/presentation/http/express/v1/controllers/base.controller';
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
import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IConversationController {
  createDirect(req: Request<ParamsDictionary, object, CreateDirectConversationBodyDTO>): Promise<unknown>;
  createGroup(req: Request<ParamsDictionary, object, CreateGroupConversationBodyDTO>): Promise<unknown>;
  listConversations(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>): Promise<unknown>;
  getConversation(req: Request<ConversationIdParams>): Promise<unknown>;
  patchConversation(req: Request<ConversationIdParams, object, PatchConversationBodyDTO>): Promise<unknown>;
  inviteMember(req: Request<ConversationIdParams, object, InviteConversationMemberBodyDTO>): Promise<unknown>;
  leaveConversation(req: Request<ConversationIdParams>): Promise<unknown>;
  kickMember(req: Request<ConversationMemberParams>): Promise<unknown>;
  patchMemberRole(req: Request<ConversationMemberParams, object, PatchConversationMemberRoleBodyDTO>): Promise<unknown>;
  transferAdmin(req: Request<ConversationIdParams, object, TransferConversationAdminBodyDTO>): Promise<unknown>;
}

export class ConversationController extends BaseController implements IConversationController {
  constructor(
    private readonly createDirectUC: GetOrCreateConversationInPort,
    private readonly createGroupUC: CreateGroupInPort,
    private readonly listConversationsUC: GetConversationsInPort,
    private readonly getConversationDetailUC: GetConversationDetailInPort,
    private readonly updateConversationUC: UpdateConversationInPort,
    private readonly inviteMemberUC: InviteMemberInPort,
    private readonly kickMemberUC: KickMemberInPort,
    private readonly leaveConversationUC: LeaveConversationInPort,
    private readonly updateMemberRoleUC: UpdateMemberRoleInPort,
    private readonly transferAdminUC: TransferAdminInPort
  ) {
    super();
  }

  @AutoBind()
  async createDirect(req: Request<ParamsDictionary, object, CreateDirectConversationBodyDTO>) {
    const userId = this.getUserId(req);
    const body = new CreateDirectConversationBodyDTO(req.body);

    const conv = await this.createDirectUC.execute({ userId, peerUserId: body.peerUserId });

    return this.response({ instance: Created, data: conv, message: 'Direct conversation ready' });
  }

  @AutoBind()
  async createGroup(req: Request<ParamsDictionary, object, CreateGroupConversationBodyDTO>) {
    const userId = this.getUserId(req);
    const body = new CreateGroupConversationBodyDTO(req.body);

    const conv = await this.createGroupUC.execute({ userId, name: body.name, memberIds: body.memberIds });

    return this.response({ instance: Created, data: conv, message: 'Group conversation created' });
  }

  @AutoBind()
  async listConversations(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>) {
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
  async getConversation(req: Request<ConversationIdParams>) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;

    const detail = await this.getConversationDetailUC.execute({ userId, conversationId });

    return this.response<ConversationDetailResponseDTO>({
      data: new ConversationDetailResponseDTO(detail),
      message: 'Get conversation successfully'
    });
  }

  @AutoBind()
  async patchConversation(req: Request<ConversationIdParams, object, PatchConversationBodyDTO>) {
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
  async inviteMember(req: Request<ConversationIdParams, object, InviteConversationMemberBodyDTO>) {
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
  async kickMember(req: Request<ConversationMemberParams>) {
    const userId = this.getUserId(req);
    const { conversationId, userId: targetUserId } = req.params;

    await this.kickMemberUC.execute({ userId, targetUserId, conversationId });

    return this.response({ message: 'Member removed' });
  }

  @AutoBind()
  async leaveConversation(req: Request<ConversationIdParams>) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;

    await this.leaveConversationUC.execute({ userId, conversationId });

    return this.response({ message: 'Left conversation' });
  }

  @AutoBind()
  async patchMemberRole(req: Request<ConversationMemberParams, object, PatchConversationMemberRoleBodyDTO>) {
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
  async transferAdmin(req: Request<ConversationIdParams, object, TransferConversationAdminBodyDTO>) {
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
