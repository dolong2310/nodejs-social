import type { UseCase } from '@/modules/core/application/base.usecase';
import type { HashtagListItem } from '@/modules/post/application/use-cases/list-hashtags/list-hashtags.port';

export class CreateHashtagInputPort {
  name: string;
  constructor(payload: { name: string }) {
    this.name = payload.name;
  }
}

export abstract class CreateHashtagPort implements UseCase<CreateHashtagInputPort, HashtagListItem> {
  abstract execute(input: CreateHashtagInputPort): Promise<HashtagListItem>;
}
