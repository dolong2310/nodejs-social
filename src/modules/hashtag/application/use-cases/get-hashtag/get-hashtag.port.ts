import { UseCase } from '@/modules/core/application/base.usecase';
import { HashtagListItem } from '@/modules/hashtag/application/use-cases/list-hashtags/list-hashtags.port';

export class GetHashtagQuery {
  id: string;
  constructor(id: string) {
    this.id = id;
  }
}

export abstract class GetHashtagPort implements UseCase<GetHashtagQuery, HashtagListItem> {
  abstract execute(query: GetHashtagQuery): Promise<HashtagListItem>;
}
