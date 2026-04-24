import { HashtagEntity } from '@/domain/entities/hashtag/hashtag.entity';
import { RepositoryPort } from '@/domain/repositories/base/port.repository';
import { ICreateHashtagInput } from '@/domain/repositories/hashtag/hashtag.repository.type';

export interface HashtagRepositoryPort extends RepositoryPort<HashtagEntity> {
  createHashtag(data: ICreateHashtagInput): Promise<HashtagEntity>;
  insertBulk(hashtags: string[]): Promise<HashtagEntity[]>;
}
