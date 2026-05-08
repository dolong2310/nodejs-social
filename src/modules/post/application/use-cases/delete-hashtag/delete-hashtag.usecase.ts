import { HashtagNotFoundException } from '@/modules/post/application/exceptions/hashtag.exception';
import {
  DeleteHashtagCommand,
  DeleteHashtagPort
} from '@/modules/post/application/use-cases/delete-hashtag/delete-hashtag.port';
import { HashtagRepositoryPort } from '@/modules/post/domain/repositories/hashtag.repository';

export class DeleteHashtagUseCase extends DeleteHashtagPort {
  constructor(private readonly hashtagRepository: HashtagRepositoryPort) {
    super();
  }

  async execute(command: DeleteHashtagCommand): Promise<void> {
    const current = await this.hashtagRepository.findHashtagById(command.id);
    if (!current) {
      throw new HashtagNotFoundException();
    }
    const removed = await this.hashtagRepository.deleteHashtag(command.id);
    if (!removed) {
      throw new HashtagNotFoundException();
    }
  }
}
