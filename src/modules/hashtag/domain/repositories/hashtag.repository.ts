import { HashtagEntity } from '@/modules/hashtag/domain/entities/hashtag.entity';
import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import { ICreateHashtagInput } from '@/modules/hashtag/domain/repositories/hashtag.repository.type';

export interface HashtagRepositoryPort extends RepositoryPort<HashtagEntity> {
  createHashtag(data: ICreateHashtagInput): Promise<HashtagEntity>;
  insertBulk(hashtags: string[]): Promise<HashtagEntity[]>;
}
