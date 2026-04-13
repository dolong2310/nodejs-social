import { IFriendRequest } from '@/domain/entities/friend-request.entity';
import { DateIdCursor } from '@/domain/value-objects/date-id-cursor.value-object';

export interface IFindPendingRequestByUserPairInput extends Pick<IFriendRequest, 'fromUserId' | 'toUserId'> {}

export interface IListIncomingForUserInput extends Pick<IFriendRequest, 'toUserId'> {
  limit: number;
  cursor?: DateIdCursor;
}

export interface IListOutgoingForUserInput extends Pick<IFriendRequest, 'fromUserId'> {
  limit: number;
  cursor?: DateIdCursor;
}

export interface ICreatePendingRequestInput extends Pick<IFriendRequest, 'fromUserId' | 'toUserId'> {}

export interface IDeletePendingRequestInput extends Pick<IFriendRequest, 'fromUserId' | 'toUserId'> {}

export interface IDeleteAllRequestsBetweenUsersInput extends Pick<IFriendRequest, 'fromUserId' | 'toUserId'> {}

export interface ICountOutgoingRequestsCreatedOnUtcDayInput extends Pick<IFriendRequest, 'fromUserId'> {
  dayStart: Date;
  dayEndExclusive: Date;
}
