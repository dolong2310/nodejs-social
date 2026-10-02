import type { CreateGroupPort } from '@/modules/conversation/application/use-cases/create-group/create-group.port';
import type { GetConversationDetailPort } from '@/modules/conversation/application/use-cases/get-conversation-detail/get-conversation-detail.port';
import type { GetConversationsPort } from '@/modules/conversation/application/use-cases/get-conversations/get-conversations.port';
import type { GetOrCreateConversationPort } from '@/modules/conversation/application/use-cases/get-or-create-conversation/get-or-create-conversation.port';
import type { InviteMemberPort } from '@/modules/conversation/application/use-cases/invite-member/invite-member.port';
import type { KickMemberPort } from '@/modules/conversation/application/use-cases/kick-member/kick-member.port';
import type { LeaveConversationPort } from '@/modules/conversation/application/use-cases/leave-conversation/leave-conversation.port';
import type { TransferAdminPort } from '@/modules/conversation/application/use-cases/transfer-admin/transfer-admin.port';
import type { UpdateConversationPort } from '@/modules/conversation/application/use-cases/update-conversation/update-conversation.port';
import type { UpdateMemberRolePort } from '@/modules/conversation/application/use-cases/update-member-role/update-member-role.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import type { ValidatedRequest } from '@/presentation/http/express/types';
import type { CursorPaginationQuerySchema } from '@/presentation/http/express/v1/schemas/common/pagination.schema';
import type {
  ConversationIdParamsSchema,
  ConversationMemberParamsSchema,
  CreateDirectConversationBodySchema,
  CreateGroupConversationBodySchema,
  InviteConversationMemberBodySchema,
  PatchConversationBodySchema,
  PatchConversationMemberRoleBodySchema,
  TransferConversationAdminBodySchema
} from '@/presentation/http/express/v1/schemas/conversation/conversation.request.schema';
import type {
  ConversationDetailResponse,
  ConversationResponse
} from '@/presentation/http/express/v1/schemas/conversation/conversation.response.schema';

type ConversationIdParams = { params: typeof ConversationIdParamsSchema };
type CreateDirectRequest = ValidatedRequest<{ body: typeof CreateDirectConversationBodySchema }>;
type CreateGroupRequest = ValidatedRequest<{ body: typeof CreateGroupConversationBodySchema }>;
type ListConversationsRequest = ValidatedRequest<{ query: typeof CursorPaginationQuerySchema }>;
type ConversationRequest = ValidatedRequest<ConversationIdParams>;
type PatchConversationRequest = ValidatedRequest<ConversationIdParams & { body: typeof PatchConversationBodySchema }>;
type InviteMemberRequest = ValidatedRequest<ConversationIdParams & { body: typeof InviteConversationMemberBodySchema }>;
type ConversationMemberRequest = ValidatedRequest<{ params: typeof ConversationMemberParamsSchema }>;
type PatchMemberRoleRequest = ValidatedRequest<{
  params: typeof ConversationMemberParamsSchema;
  body: typeof PatchConversationMemberRoleBodySchema;
}>;
type TransferAdminRequest = ValidatedRequest<
  ConversationIdParams & { body: typeof TransferConversationAdminBodySchema }
>;

export interface IConversationController {
  createDirect(req: CreateDirectRequest): Promise<unknown>;
  createGroup(req: CreateGroupRequest): Promise<unknown>;
  listConversations(req: ListConversationsRequest): Promise<unknown>;
  getConversation(req: ConversationRequest): Promise<unknown>;
  patchConversation(req: PatchConversationRequest): Promise<unknown>;
  inviteMember(req: InviteMemberRequest): Promise<unknown>;
  leaveConversation(req: ConversationRequest): Promise<unknown>;
  kickMember(req: ConversationMemberRequest): Promise<unknown>;
  patchMemberRole(req: PatchMemberRoleRequest): Promise<unknown>;
  transferAdmin(req: TransferAdminRequest): Promise<unknown>;
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
  async createDirect(req: CreateDirectRequest) {
    const userId = this.getUserId(req);
    const body = req.body;

    const conv = await this.createDirectUC.execute({ userId, peerUserId: body.peerUserId });

    return this.response({ instance: Created, data: conv, message: 'Direct conversation ready' });
  }

  @AutoBind()
  async createGroup(req: CreateGroupRequest) {
    const userId = this.getUserId(req);
    const body = req.body;

    const conv = await this.createGroupUC.execute({ userId, name: body.name, memberIds: body.memberIds });

    return this.response({ instance: Created, data: conv, message: 'Group conversation created' });
  }

  @AutoBind()
  async listConversations(req: ListConversationsRequest) {
    const userId = this.getUserId(req);
    const { limit, cursor } = req.query;

    const { items, nextCursor } = await this.listConversationsUC.execute({
      userId,
      limit,
      cursor
    });

    return this.cursorPaginatedResponse<ConversationResponse>({
      items,
      nextCursor,
      message: 'List conversations successfully'
    });
  }

  @AutoBind()
  async getConversation(req: ConversationRequest) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;

    const detail = await this.getConversationDetailUC.execute({ userId, conversationId });

    return this.response<ConversationDetailResponse>({
      data: detail,
      message: 'Get conversation successfully'
    });
  }

  @AutoBind()
  async patchConversation(req: PatchConversationRequest) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = req.body;

    const conv = await this.updateConversationUC.execute({
      userId,
      conversationId,
      name: body.name,
      avatarMediaId: body.avatarMediaId
    });

    return this.response<ConversationResponse>({
      data: conv,
      message: 'Conversation updated'
    });
  }

  @AutoBind()
  async inviteMember(req: InviteMemberRequest) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = req.body;

    const detail = await this.inviteMemberUC.execute({ userId, inviteeUserId: body.userId, conversationId });

    return this.response<ConversationDetailResponse>({
      data: detail,
      message: 'Member invited'
    });
  }

  @AutoBind()
  async kickMember(req: ConversationMemberRequest) {
    const userId = this.getUserId(req);
    const { conversationId, userId: targetUserId } = req.params;

    await this.kickMemberUC.execute({ userId, targetUserId, conversationId });

    return this.response({ message: 'Member removed' });
  }

  @AutoBind()
  async leaveConversation(req: ConversationRequest) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;

    await this.leaveConversationUC.execute({ userId, conversationId });

    return this.response({ message: 'Left conversation' });
  }

  @AutoBind()
  async patchMemberRole(req: PatchMemberRoleRequest) {
    const userId = this.getUserId(req);
    const { conversationId, userId: targetUserId } = req.params;
    const body = req.body;

    const detail = await this.updateMemberRoleUC.execute({
      userId,
      targetUserId,
      conversationId,
      role: body.role
    });

    return this.response<ConversationDetailResponse>({
      data: detail,
      message: 'Member role updated'
    });
  }

  @AutoBind()
  async transferAdmin(req: TransferAdminRequest) {
    const userId = this.getUserId(req);
    const { conversationId } = req.params;
    const body = req.body;

    const detail = await this.transferAdminUC.execute({
      userId,
      newAdminUserId: body.newAdminUserId,
      conversationId
    });

    return this.response<ConversationDetailResponse>({
      data: detail,
      message: 'Admin transferred'
    });
  }
}
