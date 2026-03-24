import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import {
  CreateDirectConversationBodyDTO,
  CreateGroupConversationBodyDTO,
  InviteConversationMemberBodyDTO,
  PatchConversationBodyDTO,
  PatchConversationMemberRoleBodyDTO,
  TransferConversationAdminBodyDTO
} from '@/dtos/requests/conversation.request.dto';
import {
  ConversationDetailResponseDTO,
  ConversationSummaryResponseDTO,
  toConversationMemberRow,
  toConversationSummary
} from '@/dtos/responses/conversation.response.dto';
import { EConversationType, IConversation } from '@/models/schemas/conversation.schema';
import { EConversationMemberRole, IConversationMember } from '@/models/schemas/conversationMember.schema';
import { IBlockRepository } from '@/repositories/block.repository';
import { ConversationRepository, IConversationRepository } from '@/repositories/conversation.repository';
import {
  ConversationMemberRepository,
  IConversationMemberRepository
} from '@/repositories/conversationMember.repository';
import { BadRequestError, ConflictRequestError, ForbiddenError, NotFoundError } from '@/responses/error.response';
import { BaseService } from '@/services/base.service';
import { IFriendsService } from '@/services/friends.service';
import { INotificationsService } from '@/services/notifications.service';
import { decodeConversationListCursor, encodeConversationListCursor } from '@/utils/conversation-cursor.util';
import { MongoServerError, ObjectId } from 'mongodb';

export interface IConversationsService {
  getOrCreateDirect(userId: string, body: CreateDirectConversationBodyDTO): Promise<ConversationSummaryResponseDTO>;
  createGroup(userId: string, body: CreateGroupConversationBodyDTO): Promise<ConversationSummaryResponseDTO>;
  listConversations(
    userId: string,
    limit: number,
    cursor?: string
  ): Promise<{ conversations: ConversationSummaryResponseDTO[]; nextCursor: string | null }>;
  getConversationDetail(userId: string, conversationId: string): Promise<ConversationDetailResponseDTO>;
  patchConversation(
    userId: string,
    conversationId: string,
    body: PatchConversationBodyDTO
  ): Promise<ConversationSummaryResponseDTO>;
  inviteMember(
    userId: string,
    conversationId: string,
    body: InviteConversationMemberBodyDTO
  ): Promise<ConversationDetailResponseDTO>;
  leaveConversation(userId: string, conversationId: string): Promise<void>;
  kickMember(userId: string, conversationId: string, targetUserId: string): Promise<void>;
  patchMemberRole(
    userId: string,
    conversationId: string,
    targetUserId: string,
    body: PatchConversationMemberRoleBodyDTO
  ): Promise<ConversationDetailResponseDTO>;
  transferAdmin(
    userId: string,
    conversationId: string,
    body: TransferConversationAdminBodyDTO
  ): Promise<ConversationDetailResponseDTO>;
}

class ConversationsService extends BaseService implements IConversationsService {
  constructor(
    private readonly conversationRepository: IConversationRepository,
    private readonly conversationMemberRepository: IConversationMemberRepository,
    private readonly friendsService: IFriendsService,
    private readonly blockRepository: IBlockRepository,
    private readonly notificationsService: INotificationsService
  ) {
    super();
  }

  private directPeer(conv: IConversation, viewer: ObjectId): ObjectId {
    if (conv.type !== EConversationType.DIRECT || !conv.userIdLow || !conv.userIdHigh) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_FOUND);
    }
    return conv.userIdLow.equals(viewer) ? conv.userIdHigh! : conv.userIdLow!;
  }

  private async assertMember(conversationId: ObjectId, userId: ObjectId): Promise<IConversationMember> {
    const m = await this.conversationMemberRepository.findMembership(conversationId, userId);
    if (!m) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_MEMBER);
    }
    return m;
  }

  private async loadConversation(conversationId: ObjectId): Promise<IConversation> {
    const conv = await this.conversationRepository.findById(conversationId);
    if (!conv) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_FOUND);
    }
    return conv;
  }

  async getOrCreateDirect(
    userId: string,
    body: CreateDirectConversationBodyDTO
  ): Promise<ConversationSummaryResponseDTO> {
    const viewerOid = new ObjectId(userId);
    const peerOid = new ObjectId(body.peerUserId);
    if (viewerOid.equals(peerOid)) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CONVERSATION_INVALID_PEER);
    }

    const existing = await this.conversationRepository.findDirectByUserPair(viewerOid, peerOid);
    if (existing) {
      await this.assertMember(existing._id, viewerOid);
      return toConversationSummary(existing, this.directPeer(existing, viewerOid));
    }

    const isFriend = await this.friendsService.isFriendOf(userId, body.peerUserId);
    if (!isFriend) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_PEER_NOT_FRIEND);
    }
    if (await this.blockRepository.isBlockedEitherWay(viewerOid, peerOid)) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_PEER_BLOCKED);
    }

    const doc = ConversationRepository.createDirectDocument(viewerOid, peerOid);
    try {
      await this.conversationRepository.insertConversation(doc);
    } catch (e) {
      if (e instanceof MongoServerError && e.code === 11000) {
        const again = await this.conversationRepository.findDirectByUserPair(viewerOid, peerOid);
        if (again) {
          await this.assertMember(again._id, viewerOid);
          return toConversationSummary(again, this.directPeer(again, viewerOid));
        }
      }
      throw e;
    }

    await this.conversationMemberRepository.insertMember(
      ConversationMemberRepository.newMember(doc._id, viewerOid, EConversationMemberRole.MEMBER)
    );
    await this.conversationMemberRepository.insertMember(
      ConversationMemberRepository.newMember(doc._id, peerOid, EConversationMemberRole.MEMBER)
    );

    return toConversationSummary(doc, peerOid);
  }

  async createGroup(userId: string, body: CreateGroupConversationBodyDTO): Promise<ConversationSummaryResponseDTO> {
    const creatorOid = new ObjectId(userId);
    const memberOids = [...new Set(body.memberIds.map((id) => new ObjectId(id)))].filter(
      (id) => !id.equals(creatorOid)
    );

    if (memberOids.length < 1) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CONVERSATION_GROUP_NEEDS_MEMBER);
    }

    for (const mid of memberOids) {
      const ok = await this.friendsService.isFriendOf(userId, mid.toHexString());
      if (!ok) {
        throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_PEER_NOT_FRIEND);
      }
    }

    const group = ConversationRepository.createGroupDocument(creatorOid, body.name);
    await this.conversationRepository.insertConversation(group);
    await this.conversationMemberRepository.insertMember(
      ConversationMemberRepository.newMember(group._id, creatorOid, EConversationMemberRole.ADMIN)
    );
    for (const mid of memberOids) {
      await this.conversationMemberRepository.insertMember(
        ConversationMemberRepository.newMember(group._id, mid, EConversationMemberRole.MEMBER)
      );
    }

    return toConversationSummary(group);
  }

  async listConversations(
    userId: string,
    limit: number,
    cursor?: string
  ): Promise<{ conversations: ConversationSummaryResponseDTO[]; nextCursor: string | null }> {
    const viewerOid = new ObjectId(userId);
    let decoded: { updatedAt: Date; conversationId: ObjectId } | undefined;
    if (cursor) {
      try {
        decoded = decodeConversationListCursor(cursor);
      } catch {
        throw new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_CURSOR);
      }
    }

    const page = Math.min(100, Math.max(1, limit));
    const rows = await this.conversationMemberRepository.listConversationsForUser(viewerOid, page + 1, decoded);
    const hasMore = rows.length > page;
    const slice = rows.slice(0, page);
    const next =
      hasMore && slice.length > 0
        ? encodeConversationListCursor(slice[slice.length - 1].updatedAt, slice[slice.length - 1].conversationId)
        : null;

    const conversations: ConversationSummaryResponseDTO[] = [];
    for (const row of slice) {
      const conv = await this.conversationRepository.findById(row.conversationId);
      if (!conv) continue;
      try {
        await this.assertMember(conv._id, viewerOid);
      } catch {
        continue;
      }
      if (conv.type === EConversationType.DIRECT) {
        conversations.push(toConversationSummary(conv, this.directPeer(conv, viewerOid)));
      } else {
        conversations.push(toConversationSummary(conv));
      }
    }

    return { conversations, nextCursor: next };
  }

  async getConversationDetail(userId: string, conversationId: string): Promise<ConversationDetailResponseDTO> {
    const cid = new ObjectId(conversationId);
    const viewerOid = new ObjectId(userId);
    await this.assertMember(cid, viewerOid);
    const conv = await this.loadConversation(cid);
    const members = await this.conversationMemberRepository.listMembers(cid);
    const base =
      conv.type === EConversationType.DIRECT
        ? toConversationSummary(conv, this.directPeer(conv, viewerOid))
        : toConversationSummary(conv);
    return {
      ...base,
      members: members.map(toConversationMemberRow)
    };
  }

  async patchConversation(
    userId: string,
    conversationId: string,
    body: PatchConversationBodyDTO
  ): Promise<ConversationSummaryResponseDTO> {
    const cid = new ObjectId(conversationId);
    const viewerOid = new ObjectId(userId);
    const self = await this.assertMember(cid, viewerOid);
    if (self.role === EConversationMemberRole.MEMBER) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_ROLE_FORBIDDEN);
    }

    const patch: Partial<Pick<IConversation, 'name' | 'avatarMediaId' | 'updatedAt'>> = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.avatarMediaId !== undefined) {
      patch.avatarMediaId = body.avatarMediaId ? new ObjectId(body.avatarMediaId) : null;
    }
    if (Object.keys(patch).length === 0) {
      const conv = await this.loadConversation(cid);
      return conv.type === EConversationType.DIRECT
        ? toConversationSummary(conv, this.directPeer(conv, viewerOid))
        : toConversationSummary(conv);
    }

    const updated = await this.conversationRepository.updateConversation(cid, patch);
    const conv = updated ?? (await this.loadConversation(cid));
    return conv.type === EConversationType.DIRECT
      ? toConversationSummary(conv, this.directPeer(conv, viewerOid))
      : toConversationSummary(conv);
  }

  async inviteMember(
    userId: string,
    conversationId: string,
    body: InviteConversationMemberBodyDTO
  ): Promise<ConversationDetailResponseDTO> {
    const cid = new ObjectId(conversationId);
    const viewerOid = new ObjectId(userId);
    const inviteeOid = new ObjectId(body.userId);
    await this.assertMember(cid, viewerOid);

    const conv = await this.loadConversation(cid);
    if (conv.type !== EConversationType.GROUP) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_FOUND);
    }

    const existing = await this.conversationMemberRepository.findMembership(cid, inviteeOid);
    if (existing) {
      throw new ConflictRequestError(VALIDATION_ERROR_MESSAGE.CONVERSATION_USER_ALREADY_MEMBER);
    }

    const inviterFriend = await this.friendsService.isFriendOf(userId, body.userId);
    if (!inviterFriend) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_INVITE_NOT_FRIEND_OF_BOTH);
    }
    const creatorFriend = await this.friendsService.isFriendOf(conv.createdBy.toHexString(), body.userId);
    if (!creatorFriend) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_INVITE_NOT_FRIEND_OF_BOTH);
    }

    await this.conversationMemberRepository.insertMember(
      ConversationMemberRepository.newMember(cid, inviteeOid, EConversationMemberRole.MEMBER)
    );
    await this.conversationRepository.touchUpdatedAt(cid);

    await this.notificationsService.recordAddedToGroup(body.userId, userId, conv);

    return this.getConversationDetail(userId, conversationId);
  }

  async leaveConversation(userId: string, conversationId: string): Promise<void> {
    const cid = new ObjectId(conversationId);
    const viewerOid = new ObjectId(userId);
    await this.assertMember(cid, viewerOid);
    const conv = await this.loadConversation(cid);

    if (conv.type === EConversationType.GROUP) {
      const self = await this.conversationMemberRepository.findMembership(cid, viewerOid);
      if (self?.role === EConversationMemberRole.ADMIN) {
        const admins = (await this.conversationMemberRepository.listMembers(cid)).filter(
          (m) => m.role === EConversationMemberRole.ADMIN
        );
        if (admins.length === 1) {
          throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_ROLE_FORBIDDEN);
        }
      }
    }

    await this.conversationMemberRepository.deleteMember(cid, viewerOid);
  }

  async kickMember(userId: string, conversationId: string, targetUserId: string): Promise<void> {
    const cid = new ObjectId(conversationId);
    const viewerOid = new ObjectId(userId);
    const targetOid = new ObjectId(targetUserId);
    const conv = await this.loadConversation(cid);
    if (conv.type === EConversationType.DIRECT) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CONVERSATION_DIRECT_NO_KICK);
    }
    const actor = await this.assertMember(cid, viewerOid);
    const target = await this.conversationMemberRepository.findMembership(cid, targetOid);
    if (!target) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }
    if (targetOid.equals(viewerOid)) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CONVERSATION_CANNOT_KICK);
    }

    if (actor.role === EConversationMemberRole.MEMBER) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_CANNOT_KICK);
    }
    if (target.role === EConversationMemberRole.ADMIN) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_CANNOT_KICK);
    }
    if (actor.role === EConversationMemberRole.MANAGER) {
      if (target.role !== EConversationMemberRole.MEMBER) {
        throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_CANNOT_KICK);
      }
    }

    await this.conversationMemberRepository.deleteMember(cid, targetOid);
    await this.conversationRepository.touchUpdatedAt(cid);
  }

  async patchMemberRole(
    userId: string,
    conversationId: string,
    targetUserId: string,
    body: PatchConversationMemberRoleBodyDTO
  ): Promise<ConversationDetailResponseDTO> {
    const cid = new ObjectId(conversationId);
    const viewerOid = new ObjectId(userId);
    const targetOid = new ObjectId(targetUserId);
    const conv = await this.loadConversation(cid);
    if (conv.type !== EConversationType.GROUP) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_FOUND);
    }
    const actor = await this.assertMember(cid, viewerOid);
    if (actor.role !== EConversationMemberRole.ADMIN) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_ROLE_FORBIDDEN);
    }
    const target = await this.conversationMemberRepository.findMembership(cid, targetOid);
    if (!target) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }
    if (target.role === EConversationMemberRole.ADMIN) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_ROLE_FORBIDDEN);
    }

    const next = body.role;
    if (next === EConversationMemberRole.ADMIN) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_ROLE_FORBIDDEN);
    }
    if (target.role === EConversationMemberRole.MANAGER && next !== EConversationMemberRole.MEMBER) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_ROLE_FORBIDDEN);
    }
    if (target.role === EConversationMemberRole.MEMBER && next !== EConversationMemberRole.MANAGER) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_ROLE_FORBIDDEN);
    }

    await this.conversationMemberRepository.updateRole(cid, targetOid, next);
    return this.getConversationDetail(userId, conversationId);
  }

  async transferAdmin(
    userId: string,
    conversationId: string,
    body: TransferConversationAdminBodyDTO
  ): Promise<ConversationDetailResponseDTO> {
    const cid = new ObjectId(conversationId);
    const viewerOid = new ObjectId(userId);
    const newAdminOid = new ObjectId(body.newAdminUserId);
    const conv = await this.loadConversation(cid);
    if (conv.type !== EConversationType.GROUP) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_FOUND);
    }
    const actor = await this.assertMember(cid, viewerOid);
    if (actor.role !== EConversationMemberRole.ADMIN) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_ROLE_FORBIDDEN);
    }
    const newAdmin = await this.conversationMemberRepository.findMembership(cid, newAdminOid);
    if (!newAdmin) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    await this.conversationMemberRepository.updateRole(cid, viewerOid, EConversationMemberRole.MANAGER);
    await this.conversationMemberRepository.updateRole(cid, newAdminOid, EConversationMemberRole.ADMIN);
    await this.conversationRepository.touchUpdatedAt(cid);

    return this.getConversationDetail(userId, conversationId);
  }
}

export default ConversationsService;
