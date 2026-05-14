import { DateIdCursor } from '@/modules/common/domain/value-objects/cursor.value-object';
import { FriendRequestProps } from '@/modules/relationship/domain/entities/friend-request.type';

export interface FindPendingRequestByUserPairInput extends Pick<FriendRequestProps, 'fromUserId' | 'toUserId'> {}

export interface ListIncomingForUserInput extends Pick<FriendRequestProps, 'toUserId'> {
  limit: number;
  cursor?: DateIdCursor;
}

export interface ListOutgoingForUserInput extends Pick<FriendRequestProps, 'fromUserId'> {
  limit: number;
  cursor?: DateIdCursor;
}

export interface CreatePendingRequestInput extends Pick<FriendRequestProps, 'fromUserId' | 'toUserId'> {}

export interface DeletePendingRequestInput extends Pick<FriendRequestProps, 'fromUserId' | 'toUserId'> {}

export interface DeleteAllRequestsBetweenUsersInput extends Pick<FriendRequestProps, 'fromUserId' | 'toUserId'> {}

export interface CountOutgoingRequestsCreatedOnUtcDayInput extends Pick<FriendRequestProps, 'fromUserId'> {
  dayStart: Date;
  dayEndExclusive: Date;
}
