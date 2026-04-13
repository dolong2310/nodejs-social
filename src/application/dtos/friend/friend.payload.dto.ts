import { CursorPaginationQueryDTO, UserIdPayloadDTO } from '@/application/dtos/common/common.payload.dto';

export class FindFriendUserIdsPayloadDTO extends UserIdPayloadDTO {}

export class IsFriendOfPayloadDTO {
  viewerUserId: string;
  otherUserId: string;
  constructor(payload: { viewerUserId: string; otherUserId: string }) {
    this.viewerUserId = payload.viewerUserId;
    this.otherUserId = payload.otherUserId;
  }
}

export class AreAllFriendsPayloadDTO {
  viewerUserId: string;
  otherUserIds: string[];
  constructor(payload: { viewerUserId: string; otherUserIds: string[] }) {
    this.viewerUserId = payload.viewerUserId;
    this.otherUserIds = payload.otherUserIds;
  }
}

export class InvalidateFriendCachePayloadDTO extends UserIdPayloadDTO {}

export class SendFriendRequestPayloadDTO {
  myUserId: string;
  toUserId: string;
  constructor(payload: { myUserId: string; toUserId: string }) {
    this.myUserId = payload.myUserId;
    this.toUserId = payload.toUserId;
  }
}

export class AcceptIncomingRequestPayloadDTO {
  myUserId: string;
  fromUserId: string;
  constructor(payload: { myUserId: string; fromUserId: string }) {
    this.myUserId = payload.myUserId;
    this.fromUserId = payload.fromUserId;
  }
}

export class DeclineIncomingRequestPayloadDTO {
  myUserId: string;
  fromUserId: string;
  constructor(payload: { myUserId: string; fromUserId: string }) {
    this.myUserId = payload.myUserId;
    this.fromUserId = payload.fromUserId;
  }
}

export class RevokeOutgoingRequestPayloadDTO {
  myUserId: string;
  toUserId: string;
  constructor(payload: { myUserId: string; toUserId: string }) {
    this.myUserId = payload.myUserId;
    this.toUserId = payload.toUserId;
  }
}

export class UnfriendPayloadDTO {
  myUserId: string;
  otherUserId: string;
  constructor(payload: { myUserId: string; otherUserId: string }) {
    this.myUserId = payload.myUserId;
    this.otherUserId = payload.otherUserId;
  }
}

class UserIdCursorPaginationDTO extends CursorPaginationQueryDTO {
  myUserId: string;
  constructor(payload: { myUserId: string; limit: string; cursor?: string }) {
    super({ limit: payload.limit, cursor: payload.cursor });
    this.myUserId = payload.myUserId;
  }
}

export class ListFriendsPayloadDTO extends UserIdCursorPaginationDTO {
  constructor(payload: { myUserId: string; limit: string; cursor?: string }) {
    super(payload);
  }
}

export class ListIncomingRequestsPayloadDTO extends UserIdCursorPaginationDTO {
  constructor(payload: { myUserId: string; limit: string; cursor?: string }) {
    super(payload);
  }
}

export class ListOutgoingRequestsPayloadDTO extends UserIdCursorPaginationDTO {
  constructor(payload: { myUserId: string; limit: string; cursor?: string }) {
    super(payload);
  }
}
