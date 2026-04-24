import {
  GetBlockedUserInPort,
  GetBlockedUserQuery,
  GetBlockedUserResult
} from '@/application/use-cases/block/get-blocked-user/get-blocked-user.in-port';
import { UserFullProps, UserRecordProps } from '@/domain/entities/user/user.type';
import { BlockRepositoryPort } from '@/domain/repositories/block/block.repository';
import { UserRepositoryPort } from '@/domain/repositories/user/user.repository';

export class GetBlockedUserInteractor extends GetBlockedUserInPort {
  constructor(
    private readonly blockRepository: BlockRepositoryPort,
    private readonly userRepository: UserRepositoryPort
  ) {
    super();
  }

  async execute({ blockerUserId, page, limit }: GetBlockedUserQuery): Promise<GetBlockedUserResult> {
    const blockedIds = await this.blockRepository.listBlockedUserIdsForBlocker(blockerUserId);
    const sorted = [...blockedIds].sort((a, b) => Buffer.compare(Buffer.from(a, 'hex'), Buffer.from(b, 'hex')));
    const total = sorted.length;
    const { skip, limitNum } = this.parsePageLimit(page, limit);
    const pageIds = sorted.slice(skip, skip + limitNum);
    const users = (await this.userRepository.findManyUsersByIds(pageIds)).map((user) => user.toObject());
    const userMap = new Map(users.map((u) => [u.id, u]));
    const ordered = pageIds.map((id) => userMap.get(id)).filter((u): u is UserFullProps => Boolean(u));
    const items: UserRecordProps[] = ordered.map((user) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar
    }));
    return new GetBlockedUserResult({ users: items, total });
  }

  private parsePageLimit(page: string, limit: string): { pageNum: number; limitNum: number; skip: number } {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    return { pageNum, limitNum, skip: (pageNum - 1) * limitNum };
  }
}
