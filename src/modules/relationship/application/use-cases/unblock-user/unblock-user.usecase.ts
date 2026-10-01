import { NoActiveBlockException } from '@/modules/relationship/application/exceptions/block.exception';
import type { FriendServicePort } from '@/modules/relationship/application/services/friend.service';
import {
  type UnblockUserInputPort,
  UnblockUserPort
} from '@/modules/relationship/application/use-cases/unblock-user/unblock-user.port';
import type { BlockRepositoryPort } from '@/modules/relationship/domain/repositories/block.repository';

export class UnblockUserUseCase extends UnblockUserPort {
  constructor(
    private readonly blockRepository: BlockRepositoryPort,
    private readonly friendService: FriendServicePort
  ) {
    super();
  }

  async execute(input: UnblockUserInputPort): Promise<void> {
    const { blockerUserId, blockedUserId } = input;
    const deleted = await this.blockRepository.deleteBlock(blockerUserId, blockedUserId);
    if (deleted === 0) {
      throw new NoActiveBlockException();
    }
    await Promise.all([
      this.friendService.invalidateFriendCache(blockerUserId),
      this.friendService.invalidateFriendCache(blockedUserId)
    ]);
  }
}
