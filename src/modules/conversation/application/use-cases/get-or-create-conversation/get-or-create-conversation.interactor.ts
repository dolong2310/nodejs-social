import {
  ConversationInvalidPeerException,
  ConversationNotFoundException,
  ConversationPeerBlockedException,
  ConversationPeerNotFriendException
} from '@/modules/conversation/application/conversation.exception';
import { IConversationService } from '@/modules/conversation/application/services/conversation.service';
import { IFriendService } from '@/modules/friend/application/services/friend.service';
import {
  GetOrCreateConversationCommand,
  GetOrCreateConversationInPort,
  GetOrCreateConversationResult
} from '@/modules/conversation/application/use-cases/get-or-create-conversation/get-or-create-conversation.in-port';
import { EConversationMemberRole } from '@/modules/conversation/domain/entities/conversation-member.type';
import { BlockRepositoryPort } from '@/modules/block/domain/repositories/block.repository';
import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import { ConversationRepositoryPort } from '@/modules/conversation/domain/repositories/conversation.repository';

/**
 * Tạo phòng direct nếu chưa tồn tại, nếu đã tồn tại thì trả về phòng đó
 */
export class GetOrCreateConversationInteractor extends GetOrCreateConversationInPort {
  constructor(
    private readonly conversationRepository: ConversationRepositoryPort,
    private readonly conversationMemberRepository: ConversationMemberRepositoryPort,
    private readonly conversationService: IConversationService,
    private readonly friendService: IFriendService,
    private readonly blockRepository: BlockRepositoryPort
  ) {
    super();
  }

  async execute({ userId, peerUserId }: GetOrCreateConversationCommand): Promise<GetOrCreateConversationResult> {
    // Chặn tự gửi tin cho chính mình
    if (userId === peerUserId) {
      throw ConversationInvalidPeerException;
    }

    // Tìm phòng direct đã tồn tại
    const existingConvEntity = await this._getExistingConversation(userId, peerUserId);
    if (existingConvEntity) return existingConvEntity;

    // chỉ cho tạo chat direct khi là bạn bè và không bị block
    const [isFriend, isBlockedEitherWay] = await Promise.all([
      this.friendService.isFriendOf({ userId, otherUserId: peerUserId }),
      this.blockRepository.isBlockedEitherWay(userId, peerUserId)
    ]);
    if (!isFriend) {
      throw ConversationPeerNotFriendException;
    }
    if (isBlockedEitherWay) {
      throw ConversationPeerBlockedException;
    }

    const convEntity = await this.conversationRepository.createDirectConversation(userId, peerUserId);
    const conv = convEntity?.toObject();

    if (!conv) {
      // Xử lý race condition khi 2 request cùng tạo
      const againConvEntity = await this._getExistingConversation(userId, peerUserId);
      if (againConvEntity) {
        return againConvEntity;
      } else {
        throw ConversationNotFoundException;
      }
    }

    // thêm 2 member vào phòng direct
    const conversationId = conv.id;
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

    return new GetOrCreateConversationResult({
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
  ): Promise<GetOrCreateConversationResult | null> {
    // Tìm phòng direct đã tồn tại
    const convEntity = await this.conversationRepository.findDirectConversationByUserPair(userId, peerUserId);
    if (!convEntity) return null;
    const conv = convEntity.toObject();
    // isMember để chắc chắn người gọi thực sự là member của phòng
    await this.conversationService.isMember({ conversationId: conv.id, userId });
    return new GetOrCreateConversationResult({
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
