import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import { FriendRequestEntity } from '@/modules/relationship/domain/entities/friend-request.entity';
import {
  ICountOutgoingRequestsCreatedOnUtcDayInput,
  ICreatePendingRequestInput,
  IDeleteAllRequestsBetweenUsersInput,
  IDeletePendingRequestInput,
  IFindPendingRequestByUserPairInput,
  IListIncomingForUserInput,
  IListOutgoingForUserInput
} from '@/modules/relationship/domain/repositories/friend-request.repository.type';

export interface FriendRequestRepositoryPort extends RepositoryPort<FriendRequestEntity> {
  findPendingRequestByUserPair(data: IFindPendingRequestByUserPairInput): Promise<FriendRequestEntity | null>;
  listIncomingForUser(data: IListIncomingForUserInput): Promise<FriendRequestEntity[]>;
  listOutgoingForUser(data: IListOutgoingForUserInput): Promise<FriendRequestEntity[]>;
  createPendingRequest(data: ICreatePendingRequestInput): Promise<FriendRequestEntity>;
  deletePendingRequest(data: IDeletePendingRequestInput): Promise<number>;
  deleteAllRequestsBetweenUsers(data: IDeleteAllRequestsBetweenUsersInput): Promise<void>;
  countOutgoingRequestsCreatedOnUtcDay(data: ICountOutgoingRequestsCreatedOnUtcDayInput): Promise<number>;
}
