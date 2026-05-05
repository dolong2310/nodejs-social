import {
  HashtagNameAlreadyExistsException,
  HashtagNotFoundException
} from '@/modules/hashtag/application/hashtag.exception';
import { HashtagListItem } from '@/modules/hashtag/application/use-cases/list-hashtags/list-hashtags.port';
import {
  UpdateHashtagCommand,
  UpdateHashtagPort
} from '@/modules/hashtag/application/use-cases/update-hashtag/update-hashtag.port';
import { HashtagEntity } from '@/modules/hashtag/domain/entities/hashtag.entity';
import { HashtagRepositoryPort } from '@/modules/hashtag/domain/repositories/hashtag.repository';

export class UpdateHashtagUseCase extends UpdateHashtagPort {
  constructor(private readonly hashtagRepository: HashtagRepositoryPort) {
    super();
  }

  async execute(command: UpdateHashtagCommand): Promise<HashtagListItem> {
    const current = await this.hashtagRepository.findHashtagById(command.id);
    if (!current) {
      throw new HashtagNotFoundException();
    }
    const currentProps = current.getProps();
    const nextName = command.name !== undefined ? command.name.trim().toLowerCase() : currentProps.name;

    void new HashtagEntity({
      id: currentProps.id,
      createdAt: currentProps.createdAt,
      updatedAt: new Date(),
      props: { name: nextName }
    });

    if (command.name !== undefined && nextName !== currentProps.name) {
      const taken = await this.hashtagRepository.findHashtagByName(nextName);
      if (taken && taken.id.toString() !== command.id) {
        throw new HashtagNameAlreadyExistsException();
      }
    }

    if (command.name === undefined) {
      return new HashtagListItem(current.toObject());
    }

    const updated = await this.hashtagRepository.updateHashtag(command.id, { name: nextName });
    if (!updated) {
      throw new HashtagNotFoundException();
    }
    return new HashtagListItem(updated.toObject());
  }
}
