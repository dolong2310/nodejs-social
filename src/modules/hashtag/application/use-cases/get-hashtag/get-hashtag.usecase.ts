import { HashtagNotFoundException } from '@/modules/hashtag/application/hashtag.exception';
import {
  GetHashtagPort,
  GetHashtagQuery
} from '@/modules/hashtag/application/use-cases/get-hashtag/get-hashtag.port';
import { HashtagListItem } from '@/modules/hashtag/application/use-cases/list-hashtags/list-hashtags.port';
import { HashtagRepositoryPort } from '@/modules/hashtag/domain/repositories/hashtag.repository';

export class GetHashtagUseCase extends GetHashtagPort {
  constructor(private readonly hashtagRepository: HashtagRepositoryPort) {
    super();
  }

  async execute(query: GetHashtagQuery): Promise<HashtagListItem> {
    const entity = await this.hashtagRepository.findHashtagById(query.id);
    if (!entity) {
      throw new HashtagNotFoundException();
    }
    return new HashtagListItem(entity.toObject());
  }
}
