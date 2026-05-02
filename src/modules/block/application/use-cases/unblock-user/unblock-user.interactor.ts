import { NoActiveBlockException } from '@/modules/block/application/block.exception';
import { IFriendService } from '@/modules/friend/application/services/friend.service';
import { UnblockUserCommand, UnblockUserInPort } from '@/modules/block/application/use-cases/unblock-user/unblock-user.in-port';
import { BlockRepositoryPort } from '@/modules/block/domain/repositories/block.repository';

export class UnblockUserInteractor extends UnblockUserInPort {
  constructor(
    private readonly blockRepository: BlockRepositoryPort,
    private readonly friendService: IFriendService
  ) {
    super();
  }

  async execute({ blockerUserId, blockedUserId }: UnblockUserCommand): Promise<void> {
    const deleted = await this.blockRepository.deleteBlock(blockerUserId, blockedUserId);
    if (deleted === 0) {
      throw NoActiveBlockException;
    }
    await Promise.all([
      this.friendService.invalidateFriendCache(blockerUserId),
      this.friendService.invalidateFriendCache(blockedUserId)
    ]);
  }
}
