import {
  AcceptIncomingRequestPayloadDTO,
  AreAllFriendsPayloadDTO,
  DeclineIncomingRequestPayloadDTO,
  FindFriendUserIdsPayloadDTO,
  InvalidateFriendCachePayloadDTO,
  IsFriendOfPayloadDTO,
  ListFriendsPayloadDTO,
  ListIncomingRequestsPayloadDTO,
  ListOutgoingRequestsPayloadDTO,
  RevokeOutgoingRequestPayloadDTO,
  SendFriendRequestPayloadDTO,
  UnfriendPayloadDTO
} from '@/application/dtos/friend/friend.payload.dto';
import {
  AreAllFriendsResultDTO,
  FindFriendUserIdsResultDTO,
  FriendListPaginationResultDTO,
  IsFriendOfResultDTO,
  SendFriendRequestResultDTO
} from '@/application/dtos/friend/friend.result.dto';

export interface IFriendsService {
  findFriendUserIds(payload: FindFriendUserIdsPayloadDTO): Promise<FindFriendUserIdsResultDTO>;
  isFriendOf(payload: IsFriendOfPayloadDTO): Promise<IsFriendOfResultDTO>;
  areAllFriends(payload: AreAllFriendsPayloadDTO): Promise<AreAllFriendsResultDTO>;
  invalidateFriendCache(payload: InvalidateFriendCachePayloadDTO): Promise<void>;
  sendFriendRequest(payload: SendFriendRequestPayloadDTO): Promise<SendFriendRequestResultDTO>;
  acceptIncomingRequest(payload: AcceptIncomingRequestPayloadDTO): Promise<void>;
  declineIncomingRequest(payload: DeclineIncomingRequestPayloadDTO): Promise<void>;
  revokeOutgoingRequest(payload: RevokeOutgoingRequestPayloadDTO): Promise<void>;
  unfriend(payload: UnfriendPayloadDTO): Promise<void>;
  listFriends(payload: ListFriendsPayloadDTO): Promise<FriendListPaginationResultDTO>;
  listIncomingRequests(payload: ListIncomingRequestsPayloadDTO): Promise<FriendListPaginationResultDTO>;
  listOutgoingRequests(payload: ListOutgoingRequestsPayloadDTO): Promise<FriendListPaginationResultDTO>;
}
