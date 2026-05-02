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
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IConversationController {
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
  async createDirect(req: Request<ParamsDictionary, object, CreateDirectConversationBodyDTO>, res: Response) {
    const userId = this.getUserId(req);
    const body = new CreateDirectConversationBodyDTO(req.body);

    const conv = await this.createDirectUC.execute({ userId, peerUserId: body.peerUserId });

    this.sendResponse({ res, instance: Created, data: conv, message: 'Direct conversation ready' });
  }

  @AutoBind()
  async createGroup(req: Request<ParamsDictionary, object, CreateGroupConversationBodyDTO>, res: Response) {
    const userId = this.getUserId(req);
    const body = new CreateGroupConversationBodyDTO(req.body);

    const conv = await this.createGroupUC.execute({ userId, name: body.name, memberIds: body.memberIds });

    this.sendResponse({ res, instance: Created, data: conv, message: 'Group conversation created' });
  }

  @AutoBind()
  async listConversations(req: Request<ParamsDictionary, object, object, CursorPaginationQueryDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;

    const { items, nextCursor } = await this.listConversationsUC.execute({
      userId,
      limit: Number(limit),
      cursor
    });

    this.sendCursorPaginatedResponse<ConversationResponseDTO>({
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

    const detail = await this.getConversationDetailUC.execute({ userId, conversationId });

    this.sendResponse<ConversationDetailResponseDTO>({
      res,
      data: new ConversationDetailResponseDTO(detail),
      message: 'Get conversation successfully'
    });
  }

  @AutoBind()
  async patchConversation(req: Request<ConversationIdParams, object, PatchConversationBodyDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = new PatchConversationBodyDTO(req.body);

    const conv = await this.updateConversationUC.execute({
      userId,
      conversationId,
      name: body.name,
      avatarMediaId: body.avatarMediaId
    });

    this.sendResponse<ConversationResponseDTO>({
      res,
      data: new ConversationResponseDTO(conv),
      message: 'Conversation updated'
    });
  }

  @AutoBind()
  async inviteMember(req: Request<ConversationIdParams, object, InviteConversationMemberBodyDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = new InviteConversationMemberBodyDTO(req.body);

    const detail = await this.inviteMemberUC.execute({ userId, inviteeUserId: body.userId, conversationId });

    this.sendResponse<ConversationDetailResponseDTO>({
      res,
      data: new ConversationDetailResponseDTO(detail),
      message: 'Member invited'
    });
  }

  @AutoBind()
  async kickMember(req: Request<ConversationMemberParams>, res: Response) {
    const userId = this.getUserId(req);
    const { conversationId, userId: targetUserId } = req.params;

    await this.kickMemberUC.execute({ userId, targetUserId, conversationId });

    this.sendResponse({ res, message: 'Member removed' });
  }

  @AutoBind()
  async leaveConversation(req: Request<ConversationIdParams>, res: Response) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;

    await this.leaveConversationUC.execute({ userId, conversationId });

    this.sendResponse({ res, message: 'Left conversation' });
  }

  @AutoBind()
  async patchMemberRole(
    req: Request<ConversationMemberParams, object, PatchConversationMemberRoleBodyDTO>,
    res: Response
  ) {
    const userId = this.getUserId(req);
    const { conversationId, userId: targetUserId } = req.params;
    const body = new PatchConversationMemberRoleBodyDTO(req.body);

    const detail = await this.updateMemberRoleUC.execute({
      userId,
      targetUserId,
      conversationId,
      role: body.role
    });

    this.sendResponse<ConversationDetailResponseDTO>({
      res,
      data: new ConversationDetailResponseDTO(detail),
      message: 'Member role updated'
    });
  }

  @AutoBind()
  async transferAdmin(req: Request<ConversationIdParams, object, TransferConversationAdminBodyDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = new TransferConversationAdminBodyDTO(req.body);

    const detail = await this.transferAdminUC.execute({
      userId,
      newAdminUserId: body.newAdminUserId,
      conversationId
    });

    this.sendResponse<ConversationDetailResponseDTO>({
      res,
      data: new ConversationDetailResponseDTO(detail),
      message: 'Admin transferred'
    });
  }
}
