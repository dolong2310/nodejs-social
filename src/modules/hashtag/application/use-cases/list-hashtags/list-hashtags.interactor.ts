import {
  HashtagListItem,
  ListHashtagsInPort,
  ListHashtagsQuery,
  ListHashtagsResult
} from '@/modules/hashtag/application/use-cases/list-hashtags/list-hashtags.in-port';
import { HashtagRepositoryPort } from '@/modules/hashtag/domain/repositories/hashtag.repository';

export class ListHashtagsInteractor extends ListHashtagsInPort {
  constructor(private readonly hashtagRepository: HashtagRepositoryPort) {
    super();
  }

  async execute(query: ListHashtagsQuery): Promise<ListHashtagsResult> {
    const skip = (query.page - 1) * query.limit;
    const [total, entities] = await Promise.all([
      this.hashtagRepository.countHashtags(),
      this.hashtagRepository.findHashtags({ limit: query.limit, skip })
    ]);
    const items = entities.map((entity) => new HashtagListItem(entity.toObject()));
    return new ListHashtagsResult({ items, total });
  }
}
