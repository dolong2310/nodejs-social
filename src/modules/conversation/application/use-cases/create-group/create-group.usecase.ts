import {
  ConversationGroupNeedsMemberException,
  ConversationPeerNotFriendException
} from '@/modules/conversation/application/exceptions/conversation.exception';
import {
  CreateGroupInputPort,
  CreateGroupPort,
  CreateGroupOutputPort
} from '@/modules/conversation/application/use-cases/create-group/create-group.port';
import { ConversationRepositoryPort } from '@/modules/conversation/domain/repositories/conversation.repository';
import { FriendshipRepositoryPort } from '@/modules/relationship/domain/repositories/friendship.repository';

export class CreateGroupUseCase extends CreateGroupPort {
  constructor(
    private readonly conversationRepository: ConversationRepositoryPort,
    private readonly friendshipRepository: FriendshipRepositoryPort
  ) {
    super();
  }

  async execute(input: CreateGroupInputPort): Promise<CreateGroupOutputPort> {
    const { userId, name, memberIds: memberIdsPayload } = input;
    // Deduplicate memberIds and filter out the creator.
    const memberIds = [...new Set(memberIdsPayload)].filter((id) => id !== userId);

    // Allow group creation only when at least one member is not the creator.
    if (memberIds.length < 1) {
      throw new ConversationGroupNeedsMemberException();
    }

    // Allow group creation only when all members are friends with the admin.
    const allFriends = await this.areAllFriends({ userId, otherUserIds: memberIds });
    if (!allFriends) {
      throw new ConversationPeerNotFriendException();
    }

    // Create a transaction that performs two operations: insert group and insert members.
    const groupEntity = await this.conversationRepository.createGroupConversation({
      name,
      createdBy: userId,
      memberIds
    });

    return new CreateGroupOutputPort(groupEntity.toObject());
  }

  /**
   * Count all group members who are friends with the admin and compare that count with the number of group
   * members excluding the admin; both values must be equal.
   */
  async areAllFriends(input: { userId: string; otherUserIds: string[] }): Promise<boolean> {
    const { userId, otherUserIds } = input;
    if (otherUserIds.length === 0) return true;
    const number = await this.friendshipRepository.countFriendshipsWithUserAmongOthers({
      userId,
      otherUserIds
    });
    return number === otherUserIds.length;
  }
}
