import type { UseCase } from '@/modules/core/application/base.usecase';
import type { HashtagListItem } from '@/modules/post/application/use-cases/list-hashtags/list-hashtags.port';
import type { MarkOptional } from 'ts-essentials';

export class UpdateHashtagInputPort implements MarkOptional<{ name: string }, 'name'> {
  id: string;
  name?: string;
  constructor(payload: { id: string; name?: string }) {
    this.id = payload.id;
    this.name = payload.name;
  }
}

export abstract class UpdateHashtagPort implements UseCase<UpdateHashtagInputPort, HashtagListItem> {
  abstract execute(input: UpdateHashtagInputPort): Promise<HashtagListItem>;
}
