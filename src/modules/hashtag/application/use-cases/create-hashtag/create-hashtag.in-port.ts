import { UseCase } from '@/modules/core/application/base.usecase';
import { HashtagListItem } from '@/modules/hashtag/application/use-cases/list-hashtags/list-hashtags.in-port';

export class CreateHashtagCommand {
  name: string;
  constructor(payload: { name: string }) {
    this.name = payload.name;
  }
}

export abstract class CreateHashtagInPort implements UseCase<CreateHashtagCommand, HashtagListItem> {
  abstract execute(command: CreateHashtagCommand): Promise<HashtagListItem>;
}
