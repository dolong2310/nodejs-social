import { HashtagNotFoundException } from '@/modules/post/application/exceptions/hashtag.exception';
import {
  type DeleteHashtagInputPort,
  DeleteHashtagPort
} from '@/modules/post/application/use-cases/delete-hashtag/delete-hashtag.port';
import type { HashtagRepositoryPort } from '@/modules/post/domain/repositories/hashtag.repository';

export class DeleteHashtagUseCase extends DeleteHashtagPort {
  constructor(private readonly hashtagRepository: HashtagRepositoryPort) {
    super();
  }

  async execute(input: DeleteHashtagInputPort): Promise<void> {
    const current = await this.hashtagRepository.findHashtagById(input.id);
    if (!current) {
      throw new HashtagNotFoundException();
    }
    const removed = await this.hashtagRepository.deleteHashtag(input.id, { actorId: input.actorId });
    if (!removed) {
      throw new HashtagNotFoundException();
    }
  }
}
