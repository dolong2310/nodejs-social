import {
  ConversationGroupNeedsMemberException,
  ConversationPeerNotFriendException
} from '@/modules/conversation/application/conversation.exception';
import {
  CreateGroupCommand,
  CreateGroupPort,
  CreateGroupResult
} from '@/modules/conversation/application/use-cases/create-group/create-group.port';
import { ConversationRepositoryPort } from '@/modules/conversation/domain/repositories/conversation.repository';
import { FriendshipRepositoryPort } from '@/modules/friend/domain/repositories/friendship.repository';

export class CreateGroupUseCase extends CreateGroupPort {
  constructor(
    private readonly conversationRepository: ConversationRepositoryPort,
    private readonly friendshipRepository: FriendshipRepositoryPort
  ) {
    super();
  }

  async execute({ userId, name, memberIds: memberIdsPayload }: CreateGroupCommand): Promise<CreateGroupResult> {
    // unique memberIds và filter chính mình khỏi list
    const memberIds = [...new Set(memberIdsPayload)].filter((id) => id !== userId);

    // chỉ cho tạo group khi có ít nhất 1 member khác chính mình
    if (memberIds.length < 1) {
      throw new ConversationGroupNeedsMemberException();
    }

    // chỉ cho tạo group khi tất cả members đều là bạn bè của admin
    const allFriends = await this.areAllFriends({ userId, otherUserIds: memberIds });
    if (!allFriends) {
      throw new ConversationPeerNotFriendException();
    }

    // tạo transaction thực hiện 2 operation: insert group và insert members
    const groupEntity = await this.conversationRepository.createGroupConversation({
      name,
      createdBy: userId,
      memberIds
    });

    return new CreateGroupResult(groupEntity.toObject());
  }

  /**
   * Lấy tất cả số lượng member trong group là bạn bè của admin và so sánh với số lượng member trong group (trừ admin ra) phải bằng nhau.
   */
  async areAllFriends({ userId, otherUserIds }: { userId: string; otherUserIds: string[] }): Promise<boolean> {
    if (otherUserIds.length === 0) return true;
    const number = await this.friendshipRepository.countFriendshipsWithUserAmongOthers({
      userId,
      otherUserIds
    });
    return number === otherUserIds.length;
  }
}
