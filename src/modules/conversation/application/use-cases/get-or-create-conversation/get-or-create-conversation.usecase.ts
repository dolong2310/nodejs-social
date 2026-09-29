import {
  ConversationInvalidPeerException,
  ConversationNotFoundException,
  ConversationPeerBlockedException,
  ConversationPeerNotFriendException
} from '@/modules/conversation/application/exceptions/conversation.exception';
import { ConversationServicePort } from '@/modules/conversation/application/services/conversation.service';
import {
  GetOrCreateConversationInputPort,
  GetOrCreateConversationPort,
  GetOrCreateConversationOutputPort
} from '@/modules/conversation/application/use-cases/get-or-create-conversation/get-or-create-conversation.port';
import { EnumConversationMemberRole } from '@/modules/conversation/domain/entities/conversation-member.type';
import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import { ConversationRepositoryPort } from '@/modules/conversation/domain/repositories/conversation.repository';
import { FriendServicePort } from '@/modules/relationship/application/services/friend.service';
import { BlockRepositoryPort } from '@/modules/relationship/domain/repositories/block.repository';

/**
 * Create a direct room when it does not exist; otherwise return the existing room.
 */
export class GetOrCreateConversationUseCase extends GetOrCreateConversationPort {
  constructor(
    private readonly conversationRepository: ConversationRepositoryPort,
    private readonly conversationMemberRepository: ConversationMemberRepositoryPort,
    private readonly conversationService: ConversationServicePort,
    private readonly friendService: FriendServicePort,
    private readonly blockRepository: BlockRepositoryPort
  ) {
    super();
  }

  async execute(input: GetOrCreateConversationInputPort): Promise<GetOrCreateConversationOutputPort> {
    const { userId, peerUserId } = input;
    // Prevent sending messages to yourself.
    if (userId === peerUserId) {
      throw new ConversationInvalidPeerException();
    }

    // Find an existing direct room.
    const existingConvEntity = await this._getExistingConversation(userId, peerUserId);
    if (existingConvEntity) return existingConvEntity;

    // Allow direct chat creation only when users are friends and not blocked.
    const [isFriend, isBlockedEitherWay] = await Promise.all([
      this.friendService.isFriendOf({ userId, otherUserId: peerUserId }),
      this.blockRepository.isBlockedEitherWay(userId, peerUserId)
    ]);
    if (!isFriend) {
      throw new ConversationPeerNotFriendException();
    }
    if (isBlockedEitherWay) {
      throw new ConversationPeerBlockedException();
    }

    const convEntity = await this.conversationRepository.createDirectConversation(userId, peerUserId);
    const conv = convEntity?.toObject();

    if (!conv) {
      // Handle race conditions when two requests create the room concurrently.
      const againConvEntity = await this._getExistingConversation(userId, peerUserId);
      if (againConvEntity) {
        return againConvEntity;
      } else {
        throw new ConversationNotFoundException();
      }
    }

    // Add both members to the direct room.
    const conversationId = conv.id;
    await Promise.all([
      this.conversationMemberRepository.createMember({
        conversationId,
        userId,
        role: EnumConversationMemberRole.MEMBER
      }),
      this.conversationMemberRepository.createMember({
        conversationId,
        userId: peerUserId,
        role: EnumConversationMemberRole.MEMBER
      })
    ]);

    return new GetOrCreateConversationOutputPort({
      id: conversationId,
      type: conv.type,
      createdBy: conv.createdBy,
      name: conv.name,
      avatarMediaId: conv.avatarMediaId,
      peerUserId: peerUserId,
      updatedAt: conv.updatedAt,
      createdAt: conv.createdAt
    });
  }

  private async _getExistingConversation(
    userId: string,
    peerUserId: string
  ): Promise<GetOrCreateConversationOutputPort | null> {
    // Find an existing direct room.
    const convEntity = await this.conversationRepository.findDirectConversationByUserPair(userId, peerUserId);
    if (!convEntity) return null;
    const conv = convEntity.toObject();
    // isMember ensures the caller is actually a room member.
    await this.conversationService.isMember({ conversationId: conv.id, userId });
    return new GetOrCreateConversationOutputPort({
      id: conv.id,
      type: conv.type,
      createdBy: conv.createdBy,
      name: conv.name,
      avatarMediaId: conv.avatarMediaId,
      peerUserId: this.conversationService.getDirectPeerId({ conv: convEntity, userId }),
      updatedAt: conv.updatedAt,
      createdAt: conv.createdAt
    });
  }
}
