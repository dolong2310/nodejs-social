import { NoActiveBlockException } from '@/modules/block/application/block.exception';
import {
  UnblockUserCommand,
  UnblockUserPort
} from '@/modules/block/application/use-cases/unblock-user/unblock-user.port';
import { BlockRepositoryPort } from '@/modules/block/domain/repositories/block.repository';
import { FriendServicePort } from '@/modules/friend/application/services/friend.service';

export class UnblockUserUseCase extends UnblockUserPort {
  constructor(
    private readonly blockRepository: BlockRepositoryPort,
    private readonly friendService: FriendServicePort
  ) {
    super();
  }

  async execute({ blockerUserId, blockedUserId }: UnblockUserCommand): Promise<void> {
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
