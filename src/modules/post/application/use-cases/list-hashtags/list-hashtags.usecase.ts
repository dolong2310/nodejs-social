import {
  HashtagListItem,
  ListHashtagsPort,
  ListHashtagsQuery,
  ListHashtagsResult
} from '@/modules/post/application/use-cases/list-hashtags/list-hashtags.port';
import { HashtagRepositoryPort } from '@/modules/post/domain/repositories/hashtag.repository';

export class ListHashtagsUseCase extends ListHashtagsPort {
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
