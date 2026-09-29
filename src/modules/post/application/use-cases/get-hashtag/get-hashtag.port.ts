import { UseCase } from '@/modules/core/application/base.usecase';
import { HashtagListItem } from '@/modules/post/application/use-cases/list-hashtags/list-hashtags.port';

export class GetHashtagInputPort {
  id: string;
  constructor(id: string) {
    this.id = id;
  }
}

export abstract class GetHashtagPort implements UseCase<GetHashtagInputPort, HashtagListItem> {
  abstract execute(input: GetHashtagInputPort): Promise<HashtagListItem>;
}
