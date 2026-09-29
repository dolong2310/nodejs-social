import {
  HashtagListItem,
  ListHashtagsPort,
  ListHashtagsInputPort,
  ListHashtagsOutputPort
} from '@/modules/post/application/use-cases/list-hashtags/list-hashtags.port';
import { HashtagRepositoryPort } from '@/modules/post/domain/repositories/hashtag.repository';

export class ListHashtagsUseCase extends ListHashtagsPort {
  constructor(private readonly hashtagRepository: HashtagRepositoryPort) {
    super();
  }

  async execute(input: ListHashtagsInputPort): Promise<ListHashtagsOutputPort> {
    const skip = (input.page - 1) * input.limit;
    const [total, entities] = await Promise.all([
      this.hashtagRepository.countHashtags(),
      this.hashtagRepository.findHashtags({ limit: input.limit, skip })
    ]);
    const items = entities.map((entity) => new HashtagListItem(entity.toObject()));
    return new ListHashtagsOutputPort({ items, total });
  }
}
