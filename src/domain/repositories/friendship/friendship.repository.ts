import { IFriendship } from '@/domain/entities/friendship.entity';
import {
  ICountFriendshipsWithUserAmongOthersInput,
  ICreateFriendshipInput,
  IDeleteFriendshipInput,
  IFindFriendIdsByUserIdInput,
  IFindFriendshipPairInput,
  IListFriendIdsByCursorInput
} from '@/domain/repositories/friendship/friendship.interface';

export interface IFriendshipRepository {
  findFriendIdsByUserId(data: IFindFriendIdsByUserIdInput): Promise<string[]>;
  findFriendshipPair(data: IFindFriendshipPairInput): Promise<IFriendship | null>;
  listFriendIdsByCursor(data: IListFriendIdsByCursorInput): Promise<string[]>;
  createFriendship(data: ICreateFriendshipInput): Promise<IFriendship | null>;
  deleteFriendship(data: IDeleteFriendshipInput): Promise<number>;
  countFriendshipsWithUserAmongOthers(data: ICountFriendshipsWithUserAmongOthersInput): Promise<number>;
}
