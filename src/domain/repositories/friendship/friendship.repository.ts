import { FriendshipEntity } from '@/domain/entities/friendship/friendship.entity';
import { RepositoryPort } from '@/domain/repositories/base/port.repository';
import {
  ICountFriendshipsWithUserAmongOthersInput,
  IListFriendIdsByCursorInput
} from '@/domain/repositories/friendship/friendship.repository.type';

export interface FriendshipRepositoryPort extends RepositoryPort<FriendshipEntity> {
  findFriendIdsByUserId(userId: string): Promise<string[]>;
  findFriendshipPair(userIdA: string, userIdB: string): Promise<FriendshipEntity | null>;
  listFriendIdsByCursor(data: IListFriendIdsByCursorInput): Promise<string[]>;
  createFriendship(userIdA: string, userIdB: string): Promise<FriendshipEntity | null>;
  deleteFriendship(userIdA: string, userIdB: string): Promise<number>;
  countFriendshipsWithUserAmongOthers(data: ICountFriendshipsWithUserAmongOthersInput): Promise<number>;
}
