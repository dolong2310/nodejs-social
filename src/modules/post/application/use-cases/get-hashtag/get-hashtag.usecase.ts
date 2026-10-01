import { HashtagNotFoundException } from '@/modules/post/application/exceptions/hashtag.exception';
import {
  GetHashtagPort,
  type GetHashtagInputPort
} from '@/modules/post/application/use-cases/get-hashtag/get-hashtag.port';
import { HashtagListItem } from '@/modules/post/application/use-cases/list-hashtags/list-hashtags.port';
import type { HashtagRepositoryPort } from '@/modules/post/domain/repositories/hashtag.repository';

export class GetHashtagUseCase extends GetHashtagPort {
  constructor(private readonly hashtagRepository: HashtagRepositoryPort) {
    super();
  }

  async execute(input: GetHashtagInputPort): Promise<HashtagListItem> {
    const entity = await this.hashtagRepository.findHashtagById(input.id);
    if (!entity) {
      throw new HashtagNotFoundException();
    }
    return new HashtagListItem(entity.toObject());
  }
}
