import { FriendRequestProps } from '@/domain/entities/friend-request/friend-request.type';
import { DateIdCursor } from '@/domain/value-objects/date-id-cursor.value-object';

export interface IFindPendingRequestByUserPairInput extends Pick<FriendRequestProps, 'fromUserId' | 'toUserId'> {}

export interface IListIncomingForUserInput extends Pick<FriendRequestProps, 'toUserId'> {
  limit: number;
  cursor?: DateIdCursor;
}

export interface IListOutgoingForUserInput extends Pick<FriendRequestProps, 'fromUserId'> {
  limit: number;
  cursor?: DateIdCursor;
}

export interface ICreatePendingRequestInput extends Pick<FriendRequestProps, 'fromUserId' | 'toUserId'> {}

export interface IDeletePendingRequestInput extends Pick<FriendRequestProps, 'fromUserId' | 'toUserId'> {}

export interface IDeleteAllRequestsBetweenUsersInput extends Pick<FriendRequestProps, 'fromUserId' | 'toUserId'> {}

export interface ICountOutgoingRequestsCreatedOnUtcDayInput extends Pick<FriendRequestProps, 'fromUserId'> {
  dayStart: Date;
  dayEndExclusive: Date;
}
