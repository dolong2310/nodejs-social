import { UseCase } from '@/modules/core/application/base.usecase';
import { HashtagFullProps } from '@/modules/hashtag/domain/entities/hashtag.type';

export class ListHashtagsQuery {
  page: number;
  limit: number;
  constructor(payload: { page: number; limit: number }) {
    this.page = payload.page;
    this.limit = payload.limit;
  }
}

export class HashtagListItem implements HashtagFullProps {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  constructor(payload: HashtagFullProps) {
    this.id = payload.id;
    this.name = payload.name;
    this.createdAt = payload.createdAt;
    this.updatedAt = payload.updatedAt;
  }
}

export class ListHashtagsResult {
  items: HashtagListItem[];
  total: number;
  constructor(payload: { items: HashtagListItem[]; total: number }) {
    this.items = payload.items;
    this.total = payload.total;
  }
}

export abstract class ListHashtagsInPort implements UseCase<ListHashtagsQuery, ListHashtagsResult> {
  abstract execute(query: ListHashtagsQuery): Promise<ListHashtagsResult>;
}
