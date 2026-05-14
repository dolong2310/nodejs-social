import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import { FriendRequestEntity } from '@/modules/relationship/domain/entities/friend-request.entity';
import {
  CountOutgoingRequestsCreatedOnUtcDayInput,
  CreatePendingRequestInput,
  DeleteAllRequestsBetweenUsersInput,
  DeletePendingRequestInput,
  FindPendingRequestByUserPairInput,
  ListIncomingForUserInput,
  ListOutgoingForUserInput
} from '@/modules/relationship/domain/repositories/friend-request.repository.type';

export interface FriendRequestRepositoryPort extends RepositoryPort<FriendRequestEntity> {
  findPendingRequestByUserPair(data: FindPendingRequestByUserPairInput): Promise<FriendRequestEntity | null>;
  listIncomingForUser(data: ListIncomingForUserInput): Promise<FriendRequestEntity[]>;
  listOutgoingForUser(data: ListOutgoingForUserInput): Promise<FriendRequestEntity[]>;
  createPendingRequest(data: CreatePendingRequestInput): Promise<FriendRequestEntity>;
  deletePendingRequest(data: DeletePendingRequestInput): Promise<number>;
  deleteAllRequestsBetweenUsers(data: DeleteAllRequestsBetweenUsersInput): Promise<void>;
  countOutgoingRequestsCreatedOnUtcDay(data: CountOutgoingRequestsCreatedOnUtcDayInput): Promise<number>;
}
