export class BlockUserPayloadDTO {
  blockerUserId: string;
  blockedUserId: string;
  constructor(payload: { blockerUserId: string; blockedUserId: string }) {
    this.blockerUserId = payload.blockerUserId;
    this.blockedUserId = payload.blockedUserId;
  }
}

export class UnBlockUserPayloadDTO extends BlockUserPayloadDTO {}

export class ListBlockedUsersPayloadDTO {
  blockerUserId: string;
  page: string;
  limit: string;
  constructor(payload: { blockerUserId: string; page: string; limit: string }) {
    this.blockerUserId = payload.blockerUserId;
    this.page = payload.page;
    this.limit = payload.limit;
  }
}
