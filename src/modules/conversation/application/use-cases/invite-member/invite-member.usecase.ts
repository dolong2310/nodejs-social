import {
  ConversationInviteNotFriendException,
  ConversationNotFoundException,
  ConversationUserAlreadyMemberException
} from '@/modules/conversation/application/exceptions/conversation.exception';
import { ConversationServicePort } from '@/modules/conversation/application/services/conversation.service';
import {
  InviteMemberCommand,
  InviteMemberPort,
  InviteMemberResult
} from '@/modules/conversation/application/use-cases/invite-member/invite-member.port';
import { EnumConversationMemberRole } from '@/modules/conversation/domain/entities/conversation-member.type';
import { EnumConversationType } from '@/modules/conversation/domain/entities/conversation.type';
import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import { ConversationRepositoryPort } from '@/modules/conversation/domain/repositories/conversation.repository';
import { NotificationServicePort } from '@/modules/notification/application/services/notification.service';
import { FriendServicePort } from '@/modules/relationship/application/services/friend.service';

/**
 * Invite a member to a group.
 * Constraints: permissions, friendship relationship, and data state.
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
    // Check whether the user is a conversation member.
    await this.conversationService.isMember({ conversationId, userId });

    // Parallel: load conversation + check membership + check friendship.
    const [convEntity, memberEntity, isFriend] = await Promise.all([
      this.conversationService.loadConversation(conversationId),
      this.conversationMemberRepository.findMember({ conversationId, userId: inviteeUserId }),
      this.friendService.isFriendOf({ userId, otherUserId: inviteeUserId })
    ]);
    const conv = convEntity.toObject();

    // Check whether the conversation is a group.
    if (conv.type !== EnumConversationType.GROUP) {
      throw new ConversationNotFoundException();
    }

    // Check whether the invitee is already a conversation member.
    if (memberEntity) {
      throw new ConversationUserAlreadyMemberException();
    }

    // Check whether the invitee is friends with the inviter.
    if (!isFriend) {
      throw new ConversationInviteNotFriendException();
    }

    // Check whether the group creator is friends with the invitee.
    const creatorFriend = await this.friendService.isFriendOf({
      userId: conv.createdBy,
      otherUserId: inviteeUserId
    });
    if (!creatorFriend) {
      throw new ConversationInviteNotFriendException();
    }

    // Add the invitee to the group in the database.
    await this.conversationMemberRepository.createMember({
      conversationId,
      userId: inviteeUserId,
      role: EnumConversationMemberRole.MEMBER
    });

    // Update updatedAt and send notification in parallel after inserting the member.
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
      updatedAt: updatedAt, // override this field so the response uses the correct timestamp
      createdAt: conv.createdAt,
      members: memberEntities.map((member) => member.toObject())
    });
  }
}
