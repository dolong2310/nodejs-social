import { NoActiveBlockException } from '@/application/exceptions/block.exception';
import { IFriendService } from '@/application/services/friend/friend.service';
import { UnblockUserCommand, UnblockUserInPort } from '@/application/use-cases/block/unblock-user/unblock-user.in-port';
import { BlockRepositoryPort } from '@/domain/repositories/block/block.repository';

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
