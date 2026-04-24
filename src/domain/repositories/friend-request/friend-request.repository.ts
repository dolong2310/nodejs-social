import { FriendRequestEntity } from '@/domain/entities/friend-request/friend-request.entity';
import { RepositoryPort } from '@/domain/repositories/base/port.repository';
import {
  ICountOutgoingRequestsCreatedOnUtcDayInput,
  ICreatePendingRequestInput,
  IDeleteAllRequestsBetweenUsersInput,
  IDeletePendingRequestInput,
  IFindPendingRequestByUserPairInput,
  IListIncomingForUserInput,
  IListOutgoingForUserInput
} from '@/domain/repositories/friend-request/friend-request.repository.type';

export interface FriendRequestRepositoryPort extends RepositoryPort<FriendRequestEntity> {
  findPendingRequestByUserPair(data: IFindPendingRequestByUserPairInput): Promise<FriendRequestEntity | null>;
  listIncomingForUser(data: IListIncomingForUserInput): Promise<FriendRequestEntity[]>;
  listOutgoingForUser(data: IListOutgoingForUserInput): Promise<FriendRequestEntity[]>;
  createPendingRequest(data: ICreatePendingRequestInput): Promise<FriendRequestEntity>;
  deletePendingRequest(data: IDeletePendingRequestInput): Promise<number>;
  deleteAllRequestsBetweenUsers(data: IDeleteAllRequestsBetweenUsersInput): Promise<void>;
  countOutgoingRequestsCreatedOnUtcDay(data: ICountOutgoingRequestsCreatedOnUtcDayInput): Promise<number>;
}
