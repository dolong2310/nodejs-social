import { HashtagNotFoundException } from '@/modules/hashtag/application/hashtag.exception';
import {
  DeleteHashtagCommand,
  DeleteHashtagInPort
} from '@/modules/hashtag/application/use-cases/delete-hashtag/delete-hashtag.in-port';
import { HashtagRepositoryPort } from '@/modules/hashtag/domain/repositories/hashtag.repository';

export class DeleteHashtagInteractor extends DeleteHashtagInPort {
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
