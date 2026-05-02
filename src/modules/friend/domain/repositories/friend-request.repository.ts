import { FriendRequestEntity } from '@/modules/friend/domain/entities/friend-request.entity';
import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import {
  ICountOutgoingRequestsCreatedOnUtcDayInput,
  ICreatePendingRequestInput,
  IDeleteAllRequestsBetweenUsersInput,
  IDeletePendingRequestInput,
  IFindPendingRequestByUserPairInput,
  IListIncomingForUserInput,
  IListOutgoingForUserInput
} from '@/modules/friend/domain/repositories/friend-request.repository.type';

export interface FriendRequestRepositoryPort extends RepositoryPort<FriendRequestEntity> {
  findPendingRequestByUserPair(data: IFindPendingRequestByUserPairInput): Promise<FriendRequestEntity | null>;
  listIncomingForUser(data: IListIncomingForUserInput): Promise<FriendRequestEntity[]>;
  listOutgoingForUser(data: IListOutgoingForUserInput): Promise<FriendRequestEntity[]>;
  createPendingRequest(data: ICreatePendingRequestInput): Promise<FriendRequestEntity>;
  deletePendingRequest(data: IDeletePendingRequestInput): Promise<number>;
  deleteAllRequestsBetweenUsers(data: IDeleteAllRequestsBetweenUsersInput): Promise<void>;
  countOutgoingRequestsCreatedOnUtcDay(data: ICountOutgoingRequestsCreatedOnUtcDayInput): Promise<number>;
}
