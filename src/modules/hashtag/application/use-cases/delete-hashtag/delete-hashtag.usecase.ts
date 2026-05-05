import { HashtagNotFoundException } from '@/modules/hashtag/application/hashtag.exception';
import {
  DeleteHashtagCommand,
  DeleteHashtagPort
} from '@/modules/hashtag/application/use-cases/delete-hashtag/delete-hashtag.port';
import { HashtagRepositoryPort } from '@/modules/hashtag/domain/repositories/hashtag.repository';

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
