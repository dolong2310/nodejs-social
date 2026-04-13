import { IFriendRequest } from '@/domain/entities/friend-request.entity';
import {
  ICountOutgoingRequestsCreatedOnUtcDayInput,
  ICreatePendingRequestInput,
  IDeleteAllRequestsBetweenUsersInput,
  IDeletePendingRequestInput,
  IFindPendingRequestByUserPairInput,
  IListIncomingForUserInput,
  IListOutgoingForUserInput
} from '@/domain/repositories/friend-request/friend-request.interface';

export interface IFriendRequestRepository {
  findPendingRequestByUserPair(data: IFindPendingRequestByUserPairInput): Promise<IFriendRequest | null>;
  listIncomingForUser(data: IListIncomingForUserInput): Promise<IFriendRequest[]>;
  listOutgoingForUser(data: IListOutgoingForUserInput): Promise<IFriendRequest[]>;
  createPendingRequest(data: ICreatePendingRequestInput): Promise<IFriendRequest>;
  deletePendingRequest(data: IDeletePendingRequestInput): Promise<number>;
  deleteAllRequestsBetweenUsers(data: IDeleteAllRequestsBetweenUsersInput): Promise<void>;
  countOutgoingRequestsCreatedOnUtcDay(data: ICountOutgoingRequestsCreatedOnUtcDayInput): Promise<number>;
}
