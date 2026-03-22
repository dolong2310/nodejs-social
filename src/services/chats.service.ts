import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import {
  CreateDirectChatBodyDTO,
  CreateGroupChatBodyDTO,
  InviteChatMemberBodyDTO,
  PatchChatBodyDTO,
  PatchChatMemberRoleBodyDTO,
  TransferChatAdminBodyDTO
} from '@/dtos/requests/chat.request.dto';
import {
  ChatDetailResponseDTO,
  ChatSummaryResponseDTO,
  toChatSummary,
  toMemberRow
} from '@/dtos/responses/chat.response.dto';
import { EChatType, IChat } from '@/models/schemas/chat.schema';
import { EChatMemberRole, IChatMember } from '@/models/schemas/chatMember.schema';
import { IBlockRepository } from '@/repositories/block.repository';
import { ChatMemberRepository, IChatMemberRepository } from '@/repositories/chatMember.repository';
import { ChatRepository, IChatRepository } from '@/repositories/chat.repository';
import {
  BadRequestError,
  ConflictRequestError,
  ForbiddenError,
  NotFoundError
} from '@/responses/error.response';
import { BaseService } from '@/services/base.service';
import { IFriendsService } from '@/services/friends.service';
import { INotificationsService } from '@/services/notifications.service';
import { decodeChatListCursor, encodeChatListCursor } from '@/utils/chat-cursor.util';
import { MongoServerError, ObjectId } from 'mongodb';

export interface IChatsService {
  getOrCreateDirect(userId: string, body: CreateDirectChatBodyDTO): Promise<ChatSummaryResponseDTO>;
  createGroup(userId: string, body: CreateGroupChatBodyDTO): Promise<ChatSummaryResponseDTO>;
  listChats(
    userId: string,
    limit: number,
    cursor?: string
  ): Promise<{ chats: ChatSummaryResponseDTO[]; nextCursor: string | null }>;
  getChatDetail(userId: string, chatId: string): Promise<ChatDetailResponseDTO>;
  patchChat(userId: string, chatId: string, body: PatchChatBodyDTO): Promise<ChatSummaryResponseDTO>;
  inviteMember(userId: string, chatId: string, body: InviteChatMemberBodyDTO): Promise<ChatDetailResponseDTO>;
  leaveChat(userId: string, chatId: string): Promise<void>;
  kickMember(userId: string, chatId: string, targetUserId: string): Promise<void>;
  patchMemberRole(
    userId: string,
    chatId: string,
    targetUserId: string,
    body: PatchChatMemberRoleBodyDTO
  ): Promise<ChatDetailResponseDTO>;
  transferAdmin(userId: string, chatId: string, body: TransferChatAdminBodyDTO): Promise<ChatDetailResponseDTO>;
}

class ChatsService extends BaseService implements IChatsService {
  constructor(
    private readonly chatRepository: IChatRepository,
    private readonly chatMemberRepository: IChatMemberRepository,
    private readonly friendsService: IFriendsService,
    private readonly blockRepository: IBlockRepository,
    private readonly notificationsService: INotificationsService
  ) {
    super();
  }

  private directPeer(chat: IChat, viewer: ObjectId): ObjectId {
    if (chat.type !== EChatType.DIRECT || !chat.userIdLow || !chat.userIdHigh) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.CHAT_NOT_FOUND);
    }
    return chat.userIdLow.equals(viewer) ? chat.userIdHigh! : chat.userIdLow!;
  }

  private async assertMember(chatId: ObjectId, userId: ObjectId): Promise<IChatMember> {
    const m = await this.chatMemberRepository.findMembership(chatId, userId);
    if (!m) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CHAT_NOT_MEMBER);
    }
    return m;
  }

  private async loadChat(chatId: ObjectId): Promise<IChat> {
    const chat = await this.chatRepository.findById(chatId);
    if (!chat) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.CHAT_NOT_FOUND);
    }
    return chat;
  }

  async getOrCreateDirect(userId: string, body: CreateDirectChatBodyDTO): Promise<ChatSummaryResponseDTO> {
    const viewerOid = new ObjectId(userId);
    const peerOid = new ObjectId(body.peerUserId);
    if (viewerOid.equals(peerOid)) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CHAT_INVALID_PEER);
    }

    const existing = await this.chatRepository.findDirectByUserPair(viewerOid, peerOid);
    if (existing) {
      await this.assertMember(existing._id, viewerOid);
      return toChatSummary(existing, this.directPeer(existing, viewerOid));
    }

    const isFriend = await this.friendsService.isFriendOf(userId, body.peerUserId);
    if (!isFriend) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CHAT_PEER_NOT_FRIEND);
    }
    if (await this.blockRepository.isBlockedEitherWay(viewerOid, peerOid)) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CHAT_PEER_BLOCKED);
    }

    const doc = ChatRepository.createDirectDocument(viewerOid, peerOid);
    try {
      await this.chatRepository.insertChat(doc);
    } catch (e) {
      if (e instanceof MongoServerError && e.code === 11000) {
        const again = await this.chatRepository.findDirectByUserPair(viewerOid, peerOid);
        if (again) {
          await this.assertMember(again._id, viewerOid);
          return toChatSummary(again, this.directPeer(again, viewerOid));
        }
      }
      throw e;
    }

    await this.chatMemberRepository.insertMember(
      ChatMemberRepository.newMember(doc._id, viewerOid, EChatMemberRole.MEMBER)
    );
    await this.chatMemberRepository.insertMember(
      ChatMemberRepository.newMember(doc._id, peerOid, EChatMemberRole.MEMBER)
    );

    return toChatSummary(doc, peerOid);
  }

  async createGroup(userId: string, body: CreateGroupChatBodyDTO): Promise<ChatSummaryResponseDTO> {
    const creatorOid = new ObjectId(userId);
    const memberOids = [...new Set(body.memberIds.map((id) => new ObjectId(id)))].filter((id) => !id.equals(creatorOid));

    if (memberOids.length < 1) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CHAT_GROUP_NEEDS_MEMBER);
    }

    for (const mid of memberOids) {
      const ok = await this.friendsService.isFriendOf(userId, mid.toHexString());
      if (!ok) {
        throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CHAT_PEER_NOT_FRIEND);
      }
    }

    const group = ChatRepository.createGroupDocument(creatorOid, body.name);
    await this.chatRepository.insertChat(group);
    await this.chatMemberRepository.insertMember(
      ChatMemberRepository.newMember(group._id, creatorOid, EChatMemberRole.ADMIN)
    );
    for (const mid of memberOids) {
      await this.chatMemberRepository.insertMember(
        ChatMemberRepository.newMember(group._id, mid, EChatMemberRole.MEMBER)
      );
    }

    return toChatSummary(group);
  }

  async listChats(
    userId: string,
    limit: number,
    cursor?: string
  ): Promise<{ chats: ChatSummaryResponseDTO[]; nextCursor: string | null }> {
    const viewerOid = new ObjectId(userId);
    let decoded: { updatedAt: Date; chatId: ObjectId } | undefined;
    if (cursor) {
      try {
        decoded = decodeChatListCursor(cursor);
      } catch {
        throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CHAT_INVALID_CURSOR);
      }
    }

    const page = Math.min(100, Math.max(1, limit));
    const rows = await this.chatMemberRepository.listChatsForUser(viewerOid, page + 1, decoded);
    const hasMore = rows.length > page;
    const slice = rows.slice(0, page);
    const next =
      hasMore && slice.length > 0
        ? encodeChatListCursor(slice[slice.length - 1].updatedAt, slice[slice.length - 1].chatId)
        : null;

    const chats: ChatSummaryResponseDTO[] = [];
    for (const row of slice) {
      const chat = await this.chatRepository.findById(row.chatId);
      if (!chat) continue;
      try {
        await this.assertMember(chat._id, viewerOid);
      } catch {
        continue;
      }
      if (chat.type === EChatType.DIRECT) {
        chats.push(toChatSummary(chat, this.directPeer(chat, viewerOid)));
      } else {
        chats.push(toChatSummary(chat));
      }
    }

    return { chats, nextCursor: next };
  }

  async getChatDetail(userId: string, chatId: string): Promise<ChatDetailResponseDTO> {
    const cid = new ObjectId(chatId);
    const viewerOid = new ObjectId(userId);
    await this.assertMember(cid, viewerOid);
    const chat = await this.loadChat(cid);
    const members = await this.chatMemberRepository.listMembers(cid);
    const base =
      chat.type === EChatType.DIRECT
        ? toChatSummary(chat, this.directPeer(chat, viewerOid))
        : toChatSummary(chat);
    return {
      ...base,
      members: members.map(toMemberRow)
    };
  }

  async patchChat(userId: string, chatId: string, body: PatchChatBodyDTO): Promise<ChatSummaryResponseDTO> {
    const cid = new ObjectId(chatId);
    const viewerOid = new ObjectId(userId);
    const self = await this.assertMember(cid, viewerOid);
    if (self.role === EChatMemberRole.MEMBER) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CHAT_ROLE_FORBIDDEN);
    }

    const patch: Partial<Pick<IChat, 'name' | 'avatarMediaId' | 'updatedAt'>> = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.avatarMediaId !== undefined) {
      patch.avatarMediaId = body.avatarMediaId ? new ObjectId(body.avatarMediaId) : null;
    }
    if (Object.keys(patch).length === 0) {
      const chat = await this.loadChat(cid);
      return chat.type === EChatType.DIRECT
        ? toChatSummary(chat, this.directPeer(chat, viewerOid))
        : toChatSummary(chat);
    }

    const updated = await this.chatRepository.updateChat(cid, patch);
    const chat = updated ?? (await this.loadChat(cid));
    return chat.type === EChatType.DIRECT
      ? toChatSummary(chat, this.directPeer(chat, viewerOid))
      : toChatSummary(chat);
  }

  async inviteMember(userId: string, chatId: string, body: InviteChatMemberBodyDTO): Promise<ChatDetailResponseDTO> {
    const cid = new ObjectId(chatId);
    const viewerOid = new ObjectId(userId);
    const inviteeOid = new ObjectId(body.userId);
    await this.assertMember(cid, viewerOid);

    const chat = await this.loadChat(cid);
    if (chat.type !== EChatType.GROUP) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CHAT_NOT_FOUND);
    }

    const existing = await this.chatMemberRepository.findMembership(cid, inviteeOid);
    if (existing) {
      throw new ConflictRequestError(VALIDATION_ERROR_MESSAGE.CHAT_USER_ALREADY_IN_CHAT);
    }

    const inviterFriend = await this.friendsService.isFriendOf(userId, body.userId);
    if (!inviterFriend) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CHAT_INVITE_NOT_FRIEND_OF_BOTH);
    }
    const creatorFriend = await this.friendsService.isFriendOf(chat.createdBy.toHexString(), body.userId);
    if (!creatorFriend) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CHAT_INVITE_NOT_FRIEND_OF_BOTH);
    }

    await this.chatMemberRepository.insertMember(
      ChatMemberRepository.newMember(cid, inviteeOid, EChatMemberRole.MEMBER)
    );
    await this.chatRepository.touchUpdatedAt(cid);

    await this.notificationsService.recordAddedToGroup(body.userId, userId, chat);

    return this.getChatDetail(userId, chatId);
  }

  async leaveChat(userId: string, chatId: string): Promise<void> {
    const cid = new ObjectId(chatId);
    const viewerOid = new ObjectId(userId);
    await this.assertMember(cid, viewerOid);
    const chat = await this.loadChat(cid);

    if (chat.type === EChatType.GROUP) {
      const self = await this.chatMemberRepository.findMembership(cid, viewerOid);
      if (self?.role === EChatMemberRole.ADMIN) {
        const admins = (await this.chatMemberRepository.listMembers(cid)).filter(
          (m) => m.role === EChatMemberRole.ADMIN
        );
        if (admins.length === 1) {
          throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CHAT_ROLE_FORBIDDEN);
        }
      }
    }

    await this.chatMemberRepository.deleteMember(cid, viewerOid);
  }

  async kickMember(userId: string, chatId: string, targetUserId: string): Promise<void> {
    const cid = new ObjectId(chatId);
    const viewerOid = new ObjectId(userId);
    const targetOid = new ObjectId(targetUserId);
    const chat = await this.loadChat(cid);
    if (chat.type === EChatType.DIRECT) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CHAT_DIRECT_NO_KICK);
    }
    const actor = await this.assertMember(cid, viewerOid);
    const target = await this.chatMemberRepository.findMembership(cid, targetOid);
    if (!target) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }
    if (targetOid.equals(viewerOid)) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CHAT_CANNOT_KICK);
    }

    if (actor.role === EChatMemberRole.MEMBER) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CHAT_CANNOT_KICK);
    }
    if (target.role === EChatMemberRole.ADMIN) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CHAT_CANNOT_KICK);
    }
    if (actor.role === EChatMemberRole.MANAGER) {
      if (target.role !== EChatMemberRole.MEMBER) {
        throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CHAT_CANNOT_KICK);
      }
    }

    await this.chatMemberRepository.deleteMember(cid, targetOid);
    await this.chatRepository.touchUpdatedAt(cid);
  }

  async patchMemberRole(
    userId: string,
    chatId: string,
    targetUserId: string,
    body: PatchChatMemberRoleBodyDTO
  ): Promise<ChatDetailResponseDTO> {
    const cid = new ObjectId(chatId);
    const viewerOid = new ObjectId(userId);
    const targetOid = new ObjectId(targetUserId);
    const chat = await this.loadChat(cid);
    if (chat.type !== EChatType.GROUP) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CHAT_NOT_FOUND);
    }
    const actor = await this.assertMember(cid, viewerOid);
    if (actor.role !== EChatMemberRole.ADMIN) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CHAT_ROLE_FORBIDDEN);
    }
    const target = await this.chatMemberRepository.findMembership(cid, targetOid);
    if (!target) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }
    if (target.role === EChatMemberRole.ADMIN) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CHAT_ROLE_FORBIDDEN);
    }

    const next = body.role;
    if (next === EChatMemberRole.ADMIN) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CHAT_ROLE_FORBIDDEN);
    }
    if (target.role === EChatMemberRole.MANAGER && next !== EChatMemberRole.MEMBER) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CHAT_ROLE_FORBIDDEN);
    }
    if (target.role === EChatMemberRole.MEMBER && next !== EChatMemberRole.MANAGER) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CHAT_ROLE_FORBIDDEN);
    }

    await this.chatMemberRepository.updateRole(cid, targetOid, next);
    return this.getChatDetail(userId, chatId);
  }

  async transferAdmin(userId: string, chatId: string, body: TransferChatAdminBodyDTO): Promise<ChatDetailResponseDTO> {
    const cid = new ObjectId(chatId);
    const viewerOid = new ObjectId(userId);
    const newAdminOid = new ObjectId(body.newAdminUserId);
    const chat = await this.loadChat(cid);
    if (chat.type !== EChatType.GROUP) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CHAT_NOT_FOUND);
    }
    const actor = await this.assertMember(cid, viewerOid);
    if (actor.role !== EChatMemberRole.ADMIN) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CHAT_ROLE_FORBIDDEN);
    }
    const newAdmin = await this.chatMemberRepository.findMembership(cid, newAdminOid);
    if (!newAdmin) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    await this.chatMemberRepository.updateRole(cid, viewerOid, EChatMemberRole.MANAGER);
    await this.chatMemberRepository.updateRole(cid, newAdminOid, EChatMemberRole.ADMIN);
    await this.chatRepository.touchUpdatedAt(cid);

    return this.getChatDetail(userId, chatId);
  }
}

export default ChatsService;
