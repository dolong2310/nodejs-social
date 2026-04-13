export class PaginationQueryDTO {
  page: string;
  limit: string;
  constructor(payload: { page: string; limit: string }) {
    this.page = payload.page;
    this.limit = payload.limit;
  }
}

export class CursorPaginationQueryDTO {
  limit: number;
  cursor?: string;
  constructor(payload: { limit: string; cursor?: string }) {
    this.limit = Number(payload.limit);
    this.cursor = payload.cursor;
  }
}

export class UserIdPayloadDTO {
  userId: string;
  constructor(payload: { userId: string }) {
    this.userId = payload.userId;
  }
}
