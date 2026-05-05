import { UseCase } from '@/modules/core/application/base.usecase';
import { HashtagListItem } from '@/modules/hashtag/application/use-cases/list-hashtags/list-hashtags.in-port';
import { MarkOptional } from 'ts-essentials';

export class UpdateHashtagCommand implements MarkOptional<{ name: string }, 'name'> {
  id: string;
  name?: string;
  constructor(payload: { id: string; name?: string }) {
    this.id = payload.id;
    this.name = payload.name;
  }
}

export abstract class UpdateHashtagInPort implements UseCase<UpdateHashtagCommand, HashtagListItem> {
  abstract execute(command: UpdateHashtagCommand): Promise<HashtagListItem>;
}
