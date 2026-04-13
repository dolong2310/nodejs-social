export class PaginationResultDTO {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  constructor(payload: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }) {
    this.page = payload.page;
    this.limit = payload.limit;
    this.totalItems = payload.totalItems;
    this.totalPages = payload.totalPages;
    this.hasNext = payload.hasNext;
    this.hasPrev = payload.hasPrev;
  }
}

export class MessageResultDTO {
  message: string;
  constructor(message: string) {
    this.message = message;
  }
}
