import type { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import type { FriendshipEntity } from '@/modules/relationship/domain/entities/friendship.entity';
import type {
  CountFriendshipsWithUserAmongOthersInput,
  ListFriendIdsByCursorInput
} from '@/modules/relationship/domain/repositories/friendship.repository.types';

export interface FriendshipRepositoryPort extends RepositoryPort<FriendshipEntity> {
  findFriendIdsByUserId(userId: string): Promise<string[]>;
  findFriendshipPair(userIdA: string, userIdB: string): Promise<FriendshipEntity | null>;
  listFriendIdsByCursor(data: ListFriendIdsByCursorInput): Promise<string[]>;
  createFriendship(userIdA: string, userIdB: string): Promise<FriendshipEntity | null>;
  deleteFriendship(userIdA: string, userIdB: string): Promise<number>;
  countFriendshipsWithUserAmongOthers(data: CountFriendshipsWithUserAmongOthersInput): Promise<number>;
}
