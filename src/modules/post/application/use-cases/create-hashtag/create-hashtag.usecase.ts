import { HashtagNameAlreadyExistsException } from '@/modules/post/application/exceptions/hashtag.exception';
import {
  type CreateHashtagInputPort,
  CreateHashtagPort
} from '@/modules/post/application/use-cases/create-hashtag/create-hashtag.port';
import { HashtagListItem } from '@/modules/post/application/use-cases/list-hashtags/list-hashtags.port';
import type { HashtagRepositoryPort } from '@/modules/post/domain/repositories/hashtag.repository';

export class CreateHashtagUseCase extends CreateHashtagPort {
  constructor(private readonly hashtagRepository: HashtagRepositoryPort) {
    super();
  }

  async execute(input: CreateHashtagInputPort): Promise<HashtagListItem> {
    const name = input.name.trim().toLowerCase();
    const duplicate = await this.hashtagRepository.findHashtagByName(name);
    if (duplicate) {
      throw new HashtagNameAlreadyExistsException();
    }
    const entity = await this.hashtagRepository.createHashtag({ name });
    return new HashtagListItem(entity.toObject());
  }
}
