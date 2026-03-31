import { Injectable } from '@/decorators';
import {
  BlockRepository,
  ConversationCannotKickBadRequestException,
  ConversationCannotKickException,
  ConversationDetailResponseDTO,
  ConversationDirectNoKickException,
  ConversationGroupNeedsMemberException,
  ConversationInvalidCursorException,
  ConversationInvalidPeerException,
  ConversationInviteNotFriendException,
  ConversationMemberRepository,
  ConversationNotFoundException,
  ConversationNotMemberException,
  ConversationPeerBlockedException,
  ConversationPeerNotFriendException,
  ConversationRepository,
  ConversationRoleForbiddenException,
  ConversationSummaryResponseDTO,
  ConversationTargetUserNotFoundException,
  ConversationTypeInvalidForOperationException,
  ConversationUserAlreadyMemberException,
  CreateDirectConversationBodyDTO,
  CreateGroupConversationBodyDTO,
  EConversationMemberRole,
  EConversationType,
  FriendsService,
  IConversation,
  IConversationMember,
  InviteConversationMemberBodyDTO,
  NotificationsService,
  PatchConversationBodyDTO,
  PatchConversationMemberRoleBodyDTO,
  toConversationMemberRow,
  toConversationSummary,
  TransferConversationAdminBodyDTO
} from '@/modules';
import { SharedConversationsService } from '@/shared';
import { decodeConversationListCursor, encodeConversationListCursor } from '@/utils';
import { MongoServerError } from 'mongodb';

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

@Injectable()
export class ConversationsService extends SharedConversationsService implements IConversationsService {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    protected readonly conversationMemberRepository: ConversationMemberRepository,
    private readonly friendsService: FriendsService,
    private readonly blockRepository: BlockRepository,
    private readonly notificationsService: NotificationsService
  ) {
    super(conversationMemberRepository);
  }

  private async loadConversation(conversationId: string): Promise<IConversation> {
    const conv = await this.conversationRepository.findById(conversationId);
    if (!conv) {
      throw ConversationNotFoundException;
    }
    return conv;
  }

  private async getConversationDetailWithPreloadedConversation(
    userId: string,
    conv: IConversation,
    members: IConversationMember[]
  ): Promise<ConversationDetailResponseDTO> {
    const base =
      conv.type === EConversationType.DIRECT
        ? toConversationSummary(conv, this.directPeer(conv, userId))
        : toConversationSummary(conv);
    return {
      ...base,
      members: members.map(toConversationMemberRow)
    };
  }

  /**
   * Tạo phòng direct nếu chưa tồn tại, nếu đã tồn tại thì trả về phòng đó
   */
  async getOrCreateDirect(
    userId: string,
    body: CreateDirectConversationBodyDTO
  ): Promise<ConversationSummaryResponseDTO> {
    // Chặn tự gửi tin cho chính mình
    if (userId === body.peerUserId) {
      throw ConversationInvalidPeerException;
    }

    // Tìm phòng direct đã tồn tại
    const existing = await this.conversationRepository.findDirectByUserPair(userId, body.peerUserId);
    if (existing) {
      // assertMember để chắc chắn người gọi thực sự là member của phòng
      await this.assertMember(existing._id.toHexString(), userId);
      return toConversationSummary(existing, this.directPeer(existing, userId));
    }

    // chỉ cho tạo chat direct khi là bạn bè và không bị block
    const [isFriend, isBlockedEitherWay] = await Promise.all([
      this.friendsService.isFriendOf(userId, body.peerUserId),
      this.blockRepository.isBlockedEitherWay(userId, body.peerUserId)
    ]);
    if (!isFriend) {
      throw ConversationPeerNotFriendException;
    }
    if (isBlockedEitherWay) {
      throw ConversationPeerBlockedException;
    }

    // tạo document vì hàm insertOne không trả về document được tạo
    const doc = ConversationRepository.createDirectDocument(userId, body.peerUserId);
    try {
      await this.conversationRepository.insertConversation(doc);
    } catch (e) {
      // Xử lý race condition khi 2 request cùng tạo
      if (e instanceof MongoServerError && e.code === 11000) {
        const again = await this.conversationRepository.findDirectByUserPair(userId, body.peerUserId);
        if (again) {
          await this.assertMember(again._id.toHexString(), userId);
          return toConversationSummary(again, this.directPeer(again, userId));
        }
      }
      throw e;
    }

    // thêm 2 member vào phòng direct
    const convId = doc._id.toHexString();
    await Promise.all([
      this.conversationMemberRepository.insertMember(
        ConversationMemberRepository.newMember(convId, userId, EConversationMemberRole.MEMBER)
      ),
      this.conversationMemberRepository.insertMember(
        ConversationMemberRepository.newMember(convId, body.peerUserId, EConversationMemberRole.MEMBER)
      )
    ]);

    return toConversationSummary(doc, body.peerUserId);
  }

  /**
   * Tạo group chat
   */
  async createGroup(userId: string, body: CreateGroupConversationBodyDTO): Promise<ConversationSummaryResponseDTO> {
    // unique memberIds và filter chính mình khỏi list
    const memberIds = [...new Set(body.memberIds)].filter((id) => id !== userId);

    // chỉ cho tạo group khi có ít nhất 1 member khác chính mình
    if (memberIds.length < 1) {
      throw ConversationGroupNeedsMemberException;
    }

    // chỉ cho tạo group khi tất cả members đều là bạn bè của admin
    const allFriends = await this.friendsService.areAllFriends(userId, memberIds);
    if (!allFriends) {
      throw ConversationPeerNotFriendException;
    }

    // tạo document vì hàm insertOne không trả về document được tạo
    const group = ConversationRepository.createGroupDocument(userId, body.name);
    const groupId = group._id.toHexString();
    // thêm admin và members vào group
    const members: IConversationMember[] = [
      ConversationMemberRepository.newMember(groupId, userId, EConversationMemberRole.ADMIN),
      ...memberIds.map((memberId) =>
        ConversationMemberRepository.newMember(groupId, memberId, EConversationMemberRole.MEMBER)
      )
    ];

    // tạo transaction thực hiện 2 operation: insert group và insert members
    await this.conversationRepository.insertGroupConversationWithMembers(group, members);

    return toConversationSummary(group);
  }

  /**
   * Lấy danh sách phòng chat (conversations) của user
   */
  async listConversations(
    userId: string,
    limit: number,
    cursor?: string
  ): Promise<{ conversations: ConversationSummaryResponseDTO[]; nextCursor: string | null }> {
    let decoded: { updatedAt: Date; conversationId: string } | undefined;
    if (cursor) {
      try {
        decoded = decodeConversationListCursor(cursor);
      } catch {
        throw ConversationInvalidCursorException;
      }
    }

    // giới hạn kích thước trang trong khoảng an toàn (1-100), tránh gửi limit quá lớn.
    const page = Math.min(100, Math.max(1, limit));
    // lấy danh sách phòng chat (conversations) của user
    const rows = await this.conversationMemberRepository.listConversationsForUser(userId, page + 1, decoded);
    const hasMore = rows.length > page;
    const slice = rows.slice(0, page);
    const next =
      hasMore && slice.length > 0
        ? // Nếu còn dữ liệu, mã hóa updatedAt và conversationId của phần tử cuối trong slice làm cursor cho request phân trang sau.
          encodeConversationListCursor(
            slice[slice.length - 1].updatedAt,
            slice[slice.length - 1].conversationId.toHexString()
          )
        : null;

    const ids = slice.map((r) => r.conversationId.toHexString());
    const uniqueIds = Array.from(new Set(ids));

    // Batch fetch để tránh N+1: 1 query conversations + 1 query membership.
    const [convs, memberships] = await Promise.all([
      this.conversationRepository.findByIds(uniqueIds),
      this.conversationMemberRepository.findMemberships(uniqueIds, userId)
    ]);

    const convById = new Map(convs.map((conv) => [conv._id.toHexString(), conv]));
    const memberChatIds = new Set(memberships.map((member) => member.chatId.toHexString()));

    const conversations: ConversationSummaryResponseDTO[] = [];
    for (const row of slice) {
      const convId = row.conversationId.toHexString();
      // Kiểm tra phòng chat có tồn tại không
      const conv = convById.get(convId);
      if (!conv) continue;
      // Tương đương với assertMember(...), nhưng làm theo batch để giảm số query.
      // Kiểm tra user có phải là member của phòng chat không
      if (!memberChatIds.has(convId)) continue;

      if (conv.type === EConversationType.DIRECT) {
        // directPeer: cần biết đối phương là ai (so sánh userIdLow / userIdHigh với userId đang xem).
        conversations.push(toConversationSummary(conv, this.directPeer(conv, userId)));
      } else {
        conversations.push(toConversationSummary(conv));
      }
    }

    return { conversations, nextCursor: next };
  }

  /**
   * Lấy chi tiết cuộc trò chuyện
   */
  async getConversationDetail(userId: string, conversationId: string): Promise<ConversationDetailResponseDTO> {
    await this.assertMember(conversationId, userId);
    const [conv, members] = await Promise.all([
      this.loadConversation(conversationId),
      this.conversationMemberRepository.listMembers(conversationId)
    ]);
    return this.getConversationDetailWithPreloadedConversation(userId, conv, members);
  }

  /**
   * Cập nhật thông tin cuộc trò chuyện
   * Sửa metadata của cuộc trò chuyện (ví dụ đổi name, đổi avatarMediaId) có phân quyền theo role trong conversation
   */
  async patchConversation(
    userId: string,
    conversationId: string,
    body: PatchConversationBodyDTO
  ): Promise<ConversationSummaryResponseDTO> {
    // kiểm tra user có phải là member của conversation không
    const self = await this.assertMember(conversationId, userId);
    // chỉ cho phép admin và manager được sửa metadata của conversation
    if (self.role === EConversationMemberRole.MEMBER) {
      throw ConversationRoleForbiddenException;
    }

    // tạo object chứa các thay đổi cần thực hiện
    const patch: Partial<{ name: string; avatarMediaId: string | null; updatedAt: Date }> = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.avatarMediaId !== undefined) {
      patch.avatarMediaId = body.avatarMediaId || null; // chấp nhận string hoặc null, undefined thì bỏ qua
    }
    if (Object.keys(patch).length === 0) {
      // nếu không có thay đổi gì thì trả về conversation hiện tại
      const conv = await this.loadConversation(conversationId);
      return conv.type === EConversationType.DIRECT
        ? toConversationSummary(conv, this.directPeer(conv, userId))
        : toConversationSummary(conv);
    }

    // cập nhật conversation
    const updated = await this.conversationRepository.updateConversation(conversationId, patch);
    const conv = updated ?? (await this.loadConversation(conversationId));
    return conv.type === EConversationType.DIRECT
      ? toConversationSummary(conv, this.directPeer(conv, userId))
      : toConversationSummary(conv);
  }

  /**
   * Mời thành viên vào group
   * Ràng buộc về quyền + quan hệ bạn bè + trạng thái dữ liệu
   */
  async inviteMember(
    userId: string,
    conversationId: string,
    body: InviteConversationMemberBodyDTO
  ): Promise<ConversationDetailResponseDTO> {
    // kiểm tra user có phải là member của conversation không
    await this.assertMember(conversationId, userId);

    const inviteeUserId = body.userId;

    // Parallel: load conversation + check membership + check friendship.
    const [conv, existing, inviterFriend] = await Promise.all([
      this.loadConversation(conversationId),
      this.conversationMemberRepository.findMembership(conversationId, inviteeUserId),
      this.friendsService.isFriendOf(userId, inviteeUserId)
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
    const creatorFriend = await this.friendsService.isFriendOf(conv.createdBy.toHexString(), inviteeUserId);
    if (!creatorFriend) {
      throw ConversationInviteNotFriendException;
    }

    // thêm người được mời vào group database
    await this.conversationMemberRepository.insertMember(
      ConversationMemberRepository.newMember(conversationId, inviteeUserId, EConversationMemberRole.MEMBER)
    );

    // Cập nhật updatedAt + gửi notification song song sau khi insert member.
    // Lưu ý: vì `toConversationSummary()` lấy `updatedAt` từ `conv`, ta override lại field này để response đúng thời điểm.
    const updatedAt = new Date();
    const [members] = await Promise.all([
      this.conversationMemberRepository.listMembers(conversationId),
      this.conversationRepository.touchUpdatedAt(conversationId, updatedAt),
      this.notificationsService.recordAddedToGroup(inviteeUserId, userId, conv)
    ]);

    const base = toConversationSummary(conv);
    return { ...base, updatedAt: updatedAt.toISOString(), members: members.map(toConversationMemberRow) };
  }

  /**
   * Rời khỏi group
   */
  async leaveConversation(userId: string, conversationId: string): Promise<void> {
    const self = await this.assertMember(conversationId, userId);
    const conv = await this.loadConversation(conversationId);

    // không cho phép "admin cuối cùng" rời khỏi group mà khiến group không còn admin nào.
    if (conv.type === EConversationType.GROUP && self.role === EConversationMemberRole.ADMIN) {
      const adminsCount = await this.conversationMemberRepository.countAdmins(conversationId);
      // nếu chỉ còn 1 admin thì không cho rời group
      if (adminsCount === 1) {
        throw ConversationRoleForbiddenException;
      }
    }

    await this.conversationMemberRepository.deleteMember(conversationId, userId);
  }

  /**
   * Đuổi thành viên khỏi group
   * - Chỉ áp dụng cho group (không kick được trong chat direct 1-1).
   * - Người thực hiện (actor = userId) phải là MANAGER hoặc ADMIN.
   * - Không cho kick chính mình (việc tự rời group là nghiệp vụ khác: leaveConversation).
   * - Không cho kick ADMIN.
   * - MANAGER chỉ được kick MEMBER (không kick được MANAGER/ADMIN). ADMIN thì kick được MEMBER và MANAGER (nhưng vẫn không kick ADMIN).
   */
  async kickMember(userId: string, conversationId: string, targetUserId: string): Promise<void> {
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
    const memberships = await this.conversationMemberRepository.findMembershipsByUsers(conversationId, [
      userId,
      targetUserId
    ]);
    const actor = memberships.find((m) => m.userId.toHexString() === userId);
    const target = memberships.find((m) => m.userId.toHexString() === targetUserId);

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

    const deletedCount = await this.conversationMemberRepository.deleteMember(conversationId, targetUserId);
    // chỉ khi xóa thực sự xảy ra (tránh write thừa trong race condition).
    if (deletedCount > 0) {
      // cập nhật updatedAt của conversation (vì cần hiển thị message "kick member" trong danh sách messages)
      await this.conversationRepository.touchUpdatedAt(conversationId);
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
  async patchMemberRole(
    userId: string,
    conversationId: string,
    targetUserId: string,
    body: PatchConversationMemberRoleBodyDTO
  ): Promise<ConversationDetailResponseDTO> {
    // kiểm tra conversation có phải là group không
    const conv = await this.loadConversation(conversationId);
    if (conv.type !== EConversationType.GROUP) {
      throw ConversationTypeInvalidForOperationException;
    }

    // gom 1 query để lấy membership của actor + target (giảm round-trip DB).
    const memberships = await this.conversationMemberRepository.findMembershipsByUsers(conversationId, [
      userId,
      targetUserId
    ]);
    const actor = memberships.find((m) => m.userId.toHexString() === userId);
    const target = memberships.find((m) => m.userId.toHexString() === targetUserId);
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
    const next = body.role;
    if (next === EConversationMemberRole.ADMIN) {
      throw ConversationRoleForbiddenException;
    }
    if (target.role === EConversationMemberRole.MANAGER && next !== EConversationMemberRole.MEMBER) {
      throw ConversationRoleForbiddenException;
    }
    if (target.role === EConversationMemberRole.MEMBER && next !== EConversationMemberRole.MANAGER) {
      throw ConversationRoleForbiddenException;
    }

    // cập nhật role của người bị đổi role
    await this.conversationMemberRepository.updateRole(conversationId, targetUserId, next);
    // lấy members của conversation
    const members = await this.conversationMemberRepository.listMembers(conversationId);
    // trả về chi tiết cuộc trò chuyện với members đã cập nhật
    return this.getConversationDetailWithPreloadedConversation(userId, conv, members);
  }

  /**
   * Chuyển quyền admin cho người khác
   * - Chỉ áp dụng cho group (không cho phép chuyển quyền admin trong chat direct 1-1).
   * - Người thực hiện (actor = userId) phải là ADMIN.
   * - Người mới nhận quyền admin phải là member của conversation.
   * - Không cho chuyển quyền admin cho chính mình.
   */
  async transferAdmin(
    userId: string,
    conversationId: string,
    body: TransferConversationAdminBodyDTO
  ): Promise<ConversationDetailResponseDTO> {
    // kiểm tra conversation có phải là group không
    const conv = await this.loadConversation(conversationId);
    if (conv.type !== EConversationType.GROUP) {
      throw ConversationTypeInvalidForOperationException;
    }

    // không cho chuyển quyền admin cho chính mình
    if (body.newAdminUserId === userId) {
      throw ConversationRoleForbiddenException;
    }

    // gom 1 query để lấy membership của actor + người mới nhận quyền admin (giảm round-trip DB).
    const memberships = await this.conversationMemberRepository.findMembershipsByUsers(conversationId, [
      userId,
      body.newAdminUserId
    ]);
    const actor = memberships.find((m) => m.userId.toHexString() === userId);
    const newAdmin = memberships.find((m) => m.userId.toHexString() === body.newAdminUserId);

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
    await this.conversationMemberRepository.transferAdminRole(conversationId, userId, body.newAdminUserId, updatedAt);

    // trả về chi tiết cuộc trò chuyện với members đã cập nhật
    const members = await this.conversationMemberRepository.listMembers(conversationId);
    return this.getConversationDetailWithPreloadedConversation(
      userId,
      {
        ...conv,
        updatedAt
      },
      members
    );
  }
}
