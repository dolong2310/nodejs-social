import {
  ConversationInviteNotFriendException,
  ConversationNotFoundException,
  ConversationUserAlreadyMemberException
} from '@/modules/conversation/application/conversation.exception';
import { ConversationServicePort } from '@/modules/conversation/application/services/conversation.service';
import { FriendServicePort } from '@/modules/friend/application/services/friend.service';
import { NotificationServicePort } from '@/modules/notification/application/services/notification.service';
import {
  InviteMemberCommand,
  InviteMemberPort,
  InviteMemberResult
} from '@/modules/conversation/application/use-cases/invite-member/invite-member.port';
import { EConversationMemberRole } from '@/modules/conversation/domain/entities/conversation-member.type';
import { EConversationType } from '@/modules/conversation/domain/entities/conversation.type';
import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import { ConversationRepositoryPort } from '@/modules/conversation/domain/repositories/conversation.repository';

/**
 * Mời thành viên vào group
 * Ràng buộc về quyền + quan hệ bạn bè + trạng thái dữ liệu
 */
export class InviteMemberUseCase extends InviteMemberPort {
  constructor(
    private readonly conversationRepository: ConversationRepositoryPort,
    private readonly conversationMemberRepository: ConversationMemberRepositoryPort,
    private readonly conversationService: ConversationServicePort,
    private readonly friendService: FriendServicePort,
    private readonly notificationsService: NotificationServicePort
  ) {
    super();
  }

  async execute({ userId, inviteeUserId, conversationId }: InviteMemberCommand): Promise<InviteMemberResult> {
    // kiểm tra user có phải là member của conversation không
    await this.conversationService.isMember({ conversationId, userId });

    // Parallel: load conversation + check membership + check friendship.
    const [convEntity, memberEntity, isFriend] = await Promise.all([
      this.conversationService.loadConversation(conversationId),
      this.conversationMemberRepository.findMember({ conversationId, userId: inviteeUserId }),
      this.friendService.isFriendOf({ userId, otherUserId: inviteeUserId })
    ]);
    const conv = convEntity.toObject();

    // kiểm tra conversation có phải là group không
    if (conv.type !== EConversationType.GROUP) {
      throw new ConversationNotFoundException();
    }

    // kiểm tra người được mới có phải là member của conversation không
    if (memberEntity) {
      throw new ConversationUserAlreadyMemberException();
    }

    // kiểm tra người được mời có phải là bạn bè của người đang mời không
    if (!isFriend) {
      throw new ConversationInviteNotFriendException();
    }

    // kiểm tra người tạo group có phải là bạn bè của người được mời không
    const creatorFriend = await this.friendService.isFriendOf({
      userId: conv.createdBy,
      otherUserId: inviteeUserId
    });
    if (!creatorFriend) {
      throw new ConversationInviteNotFriendException();
    }

    // thêm người được mời vào group database
    await this.conversationMemberRepository.createMember({
      conversationId,
      userId: inviteeUserId,
      role: EConversationMemberRole.MEMBER
    });

    // Cập nhật updatedAt + gửi notification song song sau khi insert member.
    const updatedAt = new Date();
    const [memberEntities] = await Promise.all([
      this.conversationMemberRepository.listMembers(conversationId),
      this.conversationRepository.touchUpdatedAt(conversationId, { updatedAt }),
      this.notificationsService.recordAddedToGroup({ inviteeUserId, inviterUserId: userId, conv: convEntity })
    ]);

    return new InviteMemberResult({
      id: conv.id,
      type: conv.type,
      createdBy: conv.createdBy,
      name: conv.name,
      avatarMediaId: conv.avatarMediaId ?? null,
      updatedAt: updatedAt, // override lại field này để response đúng thời điểm.
      createdAt: conv.createdAt,
      members: memberEntities.map((member) => member.toObject())
    });
  }
}
