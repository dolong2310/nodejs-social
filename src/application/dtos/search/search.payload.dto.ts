import { ESearchPeople, ESearchType } from '@/domain/enums/search.enum';

import { CursorPaginationQueryDTO } from '@/application/dtos/common/common.payload.dto';

export class SearchPayloadDTO extends CursorPaginationQueryDTO {
  userId?: string;
  query?: string;
  type?: ESearchType;
  people?: ESearchPeople;
  constructor(payload: {
    userId?: string;
    query?: string;
    type?: ESearchType;
    people?: ESearchPeople;
    limit: string;
    cursor?: string;
  }) {
    super({ limit: payload.limit, cursor: payload.cursor });
    this.userId = payload.userId;
    this.query = payload.query;
    this.type = payload.type;
    this.people = payload.people;
  }
}
