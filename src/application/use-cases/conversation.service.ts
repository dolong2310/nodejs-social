import { IConversationMember } from '@/domain/entities/conversation-member.entity';
import { IConversation } from '@/domain/entities/conversation.entity';
import { EConversationMemberRole } from '@/domain/enums/conversation-member.enum';
import { EConversationType } from '@/domain/enums/conversation.enum';
import { IBlockRepository } from '@/domain/repositories/block/block.repository';
import { IConversationMemberRepository } from '@/domain/repositories/conversation-member/conversation-member.repository';
import { IConversationRepository } from '@/domain/repositories/conversation/conversation.repository';

import {
  decodeConversationListCursor,
  encodeConversationListCursor
} from '@/application/common/cursor-codec/conversation.cursor-codec';
import { decodeCursorOrThrow } from '@/application/common/cursor-codec/cursor-decoder.codec';
import { SharedConversationsService } from '@/application/common/use-cases/shared-conversation.service';
import {
  CreateGroupConversationPayloadDTO,
  GetConversationDetailPayloadDTO,
  GetOrCreateDirectPayloadDTO,
  InviteConversationMemberPayloadDTO,
  KickMemberPayloadDTO,
  LeaveConversationPayloadDTO,
  ListConversationsPayloadDTO,
  PatchConversationMemberRolePayloadDTO,
  PatchConversationPayloadDTO,
  TransferConversationAdminPayloadDTO
} from '@/application/dtos/conversation/conversation.payload.dto';
import {
  ConversationDetailResultDTO,
  ConversationsPaginationResultDTO,
  ConversationResultDTO
} from '@/application/dtos/conversation/conversation.result.dto';
import {
  ConversationCannotKickBadRequestException,
  ConversationCannotKickException,
  ConversationDirectNoKickException,
  ConversationGroupNeedsMemberException,
  ConversationInvalidCursorException,
  ConversationInvalidPeerException,
  ConversationInviteNotFriendException,
  ConversationNotFoundException,
  ConversationNotMemberException,
  ConversationPeerBlockedException,
  ConversationPeerNotFriendException,
  ConversationRoleForbiddenException,
  ConversationTargetUserNotFoundException,
  ConversationTypeInvalidForOperationException,
  ConversationUserAlreadyMemberException
} from '@/application/errors/conversation.error';
import { IConversationsService } from '@/application/ports/conversation.port';
import { IFriendsService } from '@/application/ports/friend.port';
import { INotificationsService } from '@/application/ports/notification.port';

export class ConversationsService extends SharedConversationsService implements IConversationsService {
  constructor(
    private readonly conversationRepository: IConversationRepository,
    protected readonly conversationMemberRepository: IConversationMemberRepository,
    private readonly friendsService: IFriendsService,
    private readonly blockRepository: IBlockRepository,
    private readonly notificationsService: INotificationsService
  ) {
    super(conversationMemberRepository);
  }

  private async loadConversation(conversationId: string): Promise<IConversation> {
    const conv = await this.conversationRepository.findConversationById({ id: conversationId });
    if (!conv) {
      throw ConversationNotFoundException;
    }
    return conv;
  }

  private async mapConversationDetail(
    userId: string,
    conv: IConversation,
    members: IConversationMember[]
  ): Promise<ConversationDetailResultDTO> {
    const payload: ConversationDetailResultDTO = {
      id: conv.id,
      type: conv.type,
      createdBy: conv.createdBy,
      name: conv.name,
      avatarMediaId: conv.avatarMediaId ?? null,
      updatedAt: conv.updatedAt.toISOString(),
      createdAt: conv.createdAt.toISOString(),
      members: members.map((m) => ({
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
        lastReadMessageId: m.lastReadMessageId ?? null,
        lastReadAt: m.lastReadAt?.toISOString() ?? null
      }))
    };

    if (conv.type === EConversationType.DIRECT) {
      payload.peerUserId = this.directPeer(conv, userId);
    }

    return new ConversationDetailResultDTO(payload);
  }

  /**
   * Tạo phòng direct nếu chưa tồn tại, nếu đã tồn tại thì trả về phòng đó
   */
  async getOrCreateDirect({ userId, peerUserId }: GetOrCreateDirectPayloadDTO): Promise<ConversationResultDTO> {
    // Chặn tự gửi tin cho chính mình
    if (userId === peerUserId) {
      throw ConversationInvalidPeerException;
    }

    // Tìm phòng direct đã tồn tại
    const existing = await this.conversationRepository.findDirectConversationByUserPair({
      aUserId: userId,
      bUserId: peerUserId
    });
    if (existing) {
      // assertMember để chắc chắn người gọi thực sự là member của phòng
      await this.assertMember(existing.id, userId);
      return new ConversationResultDTO({
        id: existing.id,
        type: existing.type,
        createdBy: existing.createdBy,
        name: existing.name,
        avatarMediaId: existing.avatarMediaId ?? null,
        peerUserId: this.directPeer(existing, userId),
        updatedAt: existing.updatedAt.toISOString(),
        createdAt: existing.createdAt.toISOString()
      });
    }

    // chỉ cho tạo chat direct khi là bạn bè và không bị block
    const [isFriend, isBlockedEitherWay] = await Promise.all([
      this.friendsService.isFriendOf({ viewerUserId: userId, otherUserId: peerUserId }),
      this.blockRepository.isBlockedEitherWay({ aUserId: userId, bUserId: peerUserId })
    ]);
    if (!isFriend) {
      throw ConversationPeerNotFriendException;
    }
    if (isBlockedEitherWay) {
      throw ConversationPeerBlockedException;
    }

    const doc = await this.conversationRepository.createConversation({ createdBy: userId, peerId: peerUserId });

    if (!doc) {
      // Xử lý race condition khi 2 request cùng tạo
      const again = await this.conversationRepository.findDirectConversationByUserPair({
        aUserId: userId,
        bUserId: peerUserId
      });
      if (again) {
        await this.assertMember(again.id, userId);
        return new ConversationResultDTO({
          id: again.id,
          type: again.type,
          createdBy: again.createdBy,
          name: again.name,
          avatarMediaId: again.avatarMediaId ?? null,
          peerUserId: this.directPeer(again, userId),
          updatedAt: again.updatedAt.toISOString(),
          createdAt: again.createdAt.toISOString()
        });
      }
      throw ConversationNotFoundException;
    }

    // thêm 2 member vào phòng direct
    const conversationId = doc.id;
    await Promise.all([
      this.conversationMemberRepository.createMember({
        conversationId,
        userId,
        role: EConversationMemberRole.MEMBER
      }),
      this.conversationMemberRepository.createMember({
        conversationId,
        userId: peerUserId,
        role: EConversationMemberRole.MEMBER
      })
    ]);

    return new ConversationResultDTO({
      id: conversationId,
      type: doc.type,
      createdBy: doc.createdBy,
      name: doc.name,
      avatarMediaId: doc.avatarMediaId ?? null,
      peerUserId: peerUserId,
      updatedAt: doc.updatedAt.toISOString(),
      createdAt: doc.createdAt.toISOString()
    });
  }

  /**
   * Tạo group chat
   */
  async createGroup({
    userId,
    name,
    memberIds: memberIdsPayload
  }: CreateGroupConversationPayloadDTO): Promise<ConversationResultDTO> {
    // unique memberIds và filter chính mình khỏi list
    const memberIds = [...new Set(memberIdsPayload)].filter((id) => id !== userId);

    // chỉ cho tạo group khi có ít nhất 1 member khác chính mình
    if (memberIds.length < 1) {
      throw ConversationGroupNeedsMemberException;
    }

    // chỉ cho tạo group khi tất cả members đều là bạn bè của admin
    const allFriends = await this.friendsService.areAllFriends({ viewerUserId: userId, otherUserIds: memberIds });
    if (!allFriends) {
      throw ConversationPeerNotFriendException;
    }

    // tạo transaction thực hiện 2 operation: insert group và insert members
    const group = await this.conversationRepository.createGroupConversationWithMembers({
      adminId: userId,
      memberIds,
      groupName: name
    });

    return new ConversationResultDTO({
      id: group.id,
      type: group.type,
      createdBy: group.createdBy,
      name: group.name,
      avatarMediaId: group.avatarMediaId ?? null,
      updatedAt: group.updatedAt.toISOString(),
      createdAt: group.createdAt.toISOString()
    });
  }

  /**
   * Lấy danh sách phòng chat (conversations) của user
   */
  async listConversations({
    userId,
    limit,
    cursor
  }: ListConversationsPayloadDTO): Promise<ConversationsPaginationResultDTO> {
    const decoded = decodeCursorOrThrow(cursor, decodeConversationListCursor, ConversationInvalidCursorException);

    // giới hạn kích thước trang trong khoảng an toàn (1-100), tránh gửi limit quá lớn.
    const page = Math.min(100, Math.max(1, limit));
    // lấy danh sách phòng chat (conversations) của user
    const rows = await this.conversationMemberRepository.listConversationsForUser({
      userId,
      limit: page + 1,
      cursor: decoded
    });
    const hasMore = rows.length > page;
    const slice = rows.slice(0, page);
    const next =
      hasMore && slice.length > 0
        ? // Nếu còn dữ liệu, mã hóa updatedAt và conversationId của phần tử cuối trong slice làm cursor cho request phân trang sau.
          encodeConversationListCursor(slice[slice.length - 1].updatedAt, slice[slice.length - 1].conversationId)
        : null;

    const ids = slice.map((r) => r.conversationId);
    const uniqueIds = Array.from(new Set(ids));

    // Batch fetch để tránh N+1: 1 query conversations + 1 query membership.
    const [convs, memberships] = await Promise.all([
      this.conversationRepository.findConversationsByIds({ conversationIds: uniqueIds }),
      this.conversationMemberRepository.findMembers({ conversationIds: uniqueIds, userId })
    ]);

    const convById = new Map(convs.map((conv) => [conv.id, conv]));
    const memberChatIds = new Set(memberships.map((member) => member.conversationId));

    const conversations: ConversationResultDTO[] = [];
    for (const row of slice) {
      const convId = row.conversationId;
      // Kiểm tra phòng chat có tồn tại không
      const conv = convById.get(convId);
      if (!conv) continue;
      // Tương đương với assertMember(...), nhưng làm theo batch để giảm số query.
      // Kiểm tra user có phải là member của phòng chat không
      if (!memberChatIds.has(convId)) continue;

      const payload = {
        id: conv.id,
        type: conv.type,
        createdBy: conv.createdBy,
        name: conv.name,
        avatarMediaId: conv.avatarMediaId ?? null,
        updatedAt: conv.updatedAt.toISOString(),
        createdAt: conv.createdAt.toISOString()
      };

      if (conv.type === EConversationType.DIRECT) {
        // directPeer: cần biết đối phương là ai (so sánh userIdLow / userIdHigh với userId đang xem).
        conversations.push(new ConversationResultDTO({ ...payload, peerUserId: this.directPeer(conv, userId) }));
      } else {
        conversations.push(new ConversationResultDTO(payload));
      }
    }

    return new ConversationsPaginationResultDTO(conversations, next);
  }

  /**
   * Lấy chi tiết cuộc trò chuyện
   */
  async getConversationDetail({
    userId,
    conversationId
  }: GetConversationDetailPayloadDTO): Promise<ConversationDetailResultDTO> {
    await this.assertMember(conversationId, userId);
    const [conv, members] = await Promise.all([
      this.loadConversation(conversationId),
      this.conversationMemberRepository.listMembers({ conversationId })
    ]);
    return this.mapConversationDetail(userId, conv, members);
  }

  /**
   * Cập nhật thông tin cuộc trò chuyện
   * Sửa metadata của cuộc trò chuyện (ví dụ đổi name, đổi avatarMediaId) có phân quyền theo role trong conversation
   */
  async patchConversation({
    userId,
    conversationId,
    avatarMediaId,
    name
  }: PatchConversationPayloadDTO): Promise<ConversationResultDTO> {
    // kiểm tra user có phải là member của conversation không
    const self = await this.assertMember(conversationId, userId);
    // chỉ cho phép admin và manager được sửa metadata của conversation
    if (self.role === EConversationMemberRole.MEMBER) {
      throw ConversationRoleForbiddenException;
    }

    // tạo object chứa các thay đổi cần thực hiện
    const patch: Partial<{ name: string; avatarMediaId: string | null; updatedAt: Date }> = {};
    if (name !== undefined) patch.name = name;
    if (avatarMediaId !== undefined) {
      patch.avatarMediaId = avatarMediaId || null; // chấp nhận string hoặc null, undefined thì bỏ qua
    }
    if (Object.keys(patch).length === 0) {
      // nếu không có thay đổi gì thì trả về conversation hiện tại
      const conv = await this.loadConversation(conversationId);

      const payload: ConversationResultDTO = {
        id: conv.id,
        type: conv.type,
        createdBy: conv.createdBy,
        name: conv.name,
        avatarMediaId: conv.avatarMediaId ?? null,
        peerUserId: this.directPeer(conv, userId),
        updatedAt: conv.updatedAt.toISOString(),
        createdAt: conv.createdAt.toISOString()
      };

      if (conv.type === EConversationType.DIRECT) {
        payload.peerUserId = this.directPeer(conv, userId);
      }

      return new ConversationResultDTO(payload);
    }

    // cập nhật conversation
    const updated = await this.conversationRepository.updateConversation({
      id: conversationId,
      avatarMediaId: patch.avatarMediaId,
      name: patch.name,
      updatedAt: patch.updatedAt ?? new Date()
    });
    const conv = updated ?? (await this.loadConversation(conversationId));

    const payload: ConversationResultDTO = {
      id: conv.id,
      type: conv.type,
      createdBy: conv.createdBy,
      name: conv.name,
      avatarMediaId: conv.avatarMediaId ?? null,
      updatedAt: conv.updatedAt.toISOString(),
      createdAt: conv.createdAt.toISOString()
    };

    if (conv.type === EConversationType.DIRECT) {
      payload.peerUserId = this.directPeer(conv, userId);
    }

    return new ConversationResultDTO(payload);
  }

  /**
   * Mời thành viên vào group
   * Ràng buộc về quyền + quan hệ bạn bè + trạng thái dữ liệu
   */
  async inviteMember({
    userId,
    inviteeUserId,
    conversationId
  }: InviteConversationMemberPayloadDTO): Promise<ConversationDetailResultDTO> {
    // kiểm tra user có phải là member của conversation không
    await this.assertMember(conversationId, userId);

    // Parallel: load conversation + check membership + check friendship.
    const [conv, existing, inviterFriend] = await Promise.all([
      this.loadConversation(conversationId),
      this.conversationMemberRepository.findMember({ conversationId, userId: inviteeUserId }),
      this.friendsService.isFriendOf({ viewerUserId: userId, otherUserId: inviteeUserId })
    ]);

    // kiểm tra conversation có phải là group không
    if (conv.type !== EConversationType.GROUP) {
      throw ConversationTypeInvalidForOperationException;
    }

    // kiểm tra người được mới có phải là member của conversation không
    if (existing) {
      throw ConversationUserAlreadyMemberException;
    }

    // kiểm tra người được mời có phải là bạn bè của người đang mời không
    if (!inviterFriend) {
      throw ConversationInviteNotFriendException;
    }

    // kiểm tra người tạo group có phải là bạn bè của người được mời không
    const creatorFriend = await this.friendsService.isFriendOf({
      viewerUserId: conv.createdBy,
      otherUserId: inviteeUserId
    });
    if (!creatorFriend) {
      throw ConversationInviteNotFriendException;
    }

    // thêm người được mời vào group database
    await this.conversationMemberRepository.createMember({
      conversationId,
      userId: inviteeUserId,
      role: EConversationMemberRole.MEMBER
    });

    // Cập nhật updatedAt + gửi notification song song sau khi insert member.
    const updatedAt = new Date();
    const [members] = await Promise.all([
      this.conversationMemberRepository.listMembers({ conversationId }),
      this.conversationRepository.touchUpdatedAt({ id: conversationId, updatedAt }),
      this.notificationsService.recordAddedToGroup({ inviteeUserId, inviterUserId: userId, conv })
    ]);

    return new ConversationDetailResultDTO({
      id: conv.id,
      type: conv.type,
      createdBy: conv.createdBy,
      name: conv.name,
      avatarMediaId: conv.avatarMediaId ?? null,
      updatedAt: updatedAt.toISOString(), // override lại field này để response đúng thời điểm.
      createdAt: conv.createdAt.toISOString(),
      members: members.map((m) => ({
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
        lastReadMessageId: m.lastReadMessageId ?? null,
        lastReadAt: m.lastReadAt?.toISOString() ?? null
      }))
    });
  }

  /**
   * Rời khỏi group
   */
  async leaveConversation({ userId, conversationId }: LeaveConversationPayloadDTO): Promise<void> {
    const self = await this.assertMember(conversationId, userId);
    const conv = await this.loadConversation(conversationId);

    // không cho phép "admin cuối cùng" rời khỏi group mà khiến group không còn admin nào.
    if (conv.type === EConversationType.GROUP && self.role === EConversationMemberRole.ADMIN) {
      const adminsCount = await this.conversationMemberRepository.countAdmins({ conversationId });
      // nếu chỉ còn 1 admin thì không cho rời group
      if (adminsCount === 1) {
        throw ConversationRoleForbiddenException;
      }
    }

    await this.conversationMemberRepository.deleteMember({ conversationId, userId });
  }

  /**
   * Đuổi thành viên khỏi group
   * - Chỉ áp dụng cho group (không kick được trong chat direct 1-1).
   * - Người thực hiện (actor = userId) phải là MANAGER hoặc ADMIN.
   * - Không cho kick chính mình (việc tự rời group là nghiệp vụ khác: leaveConversation).
   * - Không cho kick ADMIN.
   * - MANAGER chỉ được kick MEMBER (không kick được MANAGER/ADMIN). ADMIN thì kick được MEMBER và MANAGER (nhưng vẫn không kick ADMIN).
   */
  async kickMember({ userId, conversationId, targetUserId }: KickMemberPayloadDTO): Promise<void> {
    // kiểm tra conversation có phải là group không
    const conv = await this.loadConversation(conversationId);
    if (conv.type === EConversationType.DIRECT) {
      throw ConversationDirectNoKickException;
    }

    // không cho kick chính mình
    if (targetUserId === userId) {
      throw ConversationCannotKickBadRequestException;
    }

    // Gom 1 query để lấy membership của actor (người thực hiện) + target (người bị kick) (giảm query so với findMembership 2 lần).
    const memberships = await this.conversationMemberRepository.findMembersByUsers({
      conversationId,
      userIds: [userId, targetUserId]
    });
    const actor = memberships.find((m) => m.userId === userId);
    const target = memberships.find((m) => m.userId === targetUserId);

    // kiểm tra user có phải là member của conversation không
    if (!actor) {
      throw ConversationNotMemberException;
    }
    // kiểm tra người bị kick có phải là member của conversation không
    if (!target) {
      throw ConversationTargetUserNotFoundException;
    }

    // kiểm tra quyền của người thực hiện
    if (actor.role === EConversationMemberRole.MEMBER) {
      throw ConversationCannotKickException;
    }
    // không cho kick ADMIN
    if (target.role === EConversationMemberRole.ADMIN) {
      throw ConversationCannotKickException;
    }
    // ADMIN thì kick được MEMBER và MANAGER (không kick được ADMIN).
    // MANAGER chỉ được kick MEMBER (không kick được MANAGER/ADMIN).
    if (actor.role === EConversationMemberRole.MANAGER) {
      if (target.role !== EConversationMemberRole.MEMBER) {
        throw ConversationCannotKickException;
      }
    }

    const deletedCount = await this.conversationMemberRepository.deleteMember({ conversationId, userId: targetUserId });
    // chỉ khi xóa thực sự xảy ra (tránh write thừa trong race condition).
    if (deletedCount > 0) {
      // cập nhật updatedAt của conversation (vì cần hiển thị message "kick member" trong danh sách messages)
      await this.conversationRepository.touchUpdatedAt({ id: conversationId, updatedAt: new Date() });
    }
  }

  /**
   * Cập nhật quyền thành viên trong group
   * - Chỉ áp dụng cho group (không cho phép thay đổi quyền trong chat direct 1-1).
   * - Chỉ ADMIN mới được đổi role.
   * - Không cho đụng tới ADMIN (không đổi role của ADMIN và cũng không cho set role thành ADMIN bằng endpoint này).
   * - ADMIN thì có thể thay đổi quyền của MEMBER và MANAGER.
   * - Chỉ cho “đổi qua lại” giữa MEMBER và MANAGER:
   * + Nếu target đang là MANAGER thì chỉ được hạ xuống MEMBER.
   * + Nếu target đang là MEMBER thì chỉ được nâng lên MANAGER.
   */
  async patchMemberRole({
    userId,
    conversationId,
    targetUserId,
    role
  }: PatchConversationMemberRolePayloadDTO): Promise<ConversationDetailResultDTO> {
    // kiểm tra conversation có phải là group không
    const conv = await this.loadConversation(conversationId);
    if (conv.type !== EConversationType.GROUP) {
      throw ConversationTypeInvalidForOperationException;
    }

    // gom 1 query để lấy membership của actor + target (giảm round-trip DB).
    const memberships = await this.conversationMemberRepository.findMembersByUsers({
      conversationId,
      userIds: [userId, targetUserId]
    });
    const actor = memberships.find((m) => m.userId === userId);
    const target = memberships.find((m) => m.userId === targetUserId);
    // kiểm tra user có phải là member của conversation không và có phải là ADMIN không
    if (!actor) {
      throw ConversationNotMemberException;
    }
    if (actor.role !== EConversationMemberRole.ADMIN) {
      throw ConversationRoleForbiddenException;
    }
    // kiểm tra người bị đổi role có phải là member của conversation không và có phải là ADMIN không
    if (!target) {
      throw ConversationTargetUserNotFoundException;
    }
    if (target.role === EConversationMemberRole.ADMIN) {
      throw ConversationRoleForbiddenException;
    }

    // kiểm tra role mới có phải là MEMBER hoặc MANAGER không
    const nextRole = role;
    if (nextRole === EConversationMemberRole.ADMIN) {
      throw ConversationRoleForbiddenException;
    }
    if (target.role === EConversationMemberRole.MANAGER && nextRole !== EConversationMemberRole.MEMBER) {
      throw ConversationRoleForbiddenException;
    }
    if (target.role === EConversationMemberRole.MEMBER && nextRole !== EConversationMemberRole.MANAGER) {
      throw ConversationRoleForbiddenException;
    }

    // cập nhật role của người bị đổi role
    await this.conversationMemberRepository.updateRole({ conversationId, userId: targetUserId, role: nextRole });
    // lấy members của conversation
    const members = await this.conversationMemberRepository.listMembers({ conversationId });
    // trả về chi tiết cuộc trò chuyện với members đã cập nhật
    return this.mapConversationDetail(userId, conv, members);
  }

  /**
   * Chuyển quyền admin cho người khác
   * - Chỉ áp dụng cho group (không cho phép chuyển quyền admin trong chat direct 1-1).
   * - Người thực hiện (actor = userId) phải là ADMIN.
   * - Người mới nhận quyền admin phải là member của conversation.
   * - Không cho chuyển quyền admin cho chính mình.
   */
  async transferAdmin({
    userId,
    newAdminUserId,
    conversationId
  }: TransferConversationAdminPayloadDTO): Promise<ConversationDetailResultDTO> {
    // kiểm tra conversation có phải là group không
    const conv = await this.loadConversation(conversationId);
    if (conv.type !== EConversationType.GROUP) {
      throw ConversationTypeInvalidForOperationException;
    }

    // không cho chuyển quyền admin cho chính mình
    if (newAdminUserId === userId) {
      throw ConversationRoleForbiddenException;
    }

    // gom 1 query để lấy membership của actor + người mới nhận quyền admin (giảm round-trip DB).
    const memberships = await this.conversationMemberRepository.findMembersByUsers({
      conversationId,
      userIds: [userId, newAdminUserId]
    });
    const actor = memberships.find((m) => m.userId === userId);
    const newAdmin = memberships.find((m) => m.userId === newAdminUserId);

    // kiểm tra user có phải là member của conversation không và có phải là ADMIN không
    if (!actor) {
      throw ConversationNotMemberException;
    }
    if (actor.role !== EConversationMemberRole.ADMIN) {
      throw ConversationRoleForbiddenException;
    }

    // kiểm tra người mới nhận quyền admin có phải là member của conversation không
    if (!newAdmin) {
      throw ConversationTargetUserNotFoundException;
    }

    const updatedAt = new Date();
    await this.conversationMemberRepository.transferAdminRole({
      conversationId,
      oldAdminUserId: userId,
      newAdminUserId,
      joinedAt: updatedAt
    });

    // trả về chi tiết cuộc trò chuyện với members đã cập nhật
    const members = await this.conversationMemberRepository.listMembers({ conversationId });
    return this.mapConversationDetail(
      userId,
      {
        ...conv,
        updatedAt
      },
      members
    );
  }
}
