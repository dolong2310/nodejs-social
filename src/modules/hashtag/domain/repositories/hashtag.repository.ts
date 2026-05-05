import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import { HashtagEntity } from '@/modules/hashtag/domain/entities/hashtag.entity';
import {
  ICreateHashtagInput,
  IListHashtagsInput,
  IUpdateHashtagInput
} from '@/modules/hashtag/domain/repositories/hashtag.repository.type';

export interface HashtagRepositoryPort extends RepositoryPort<HashtagEntity> {
  createHashtag(data: ICreateHashtagInput): Promise<HashtagEntity>;
  insertBulk(hashtags: string[]): Promise<HashtagEntity[]>;
  findHashtagById(id: string): Promise<HashtagEntity | null>;
  findHashtagByName(name: string): Promise<HashtagEntity | null>;
  findHashtags(data: IListHashtagsInput): Promise<HashtagEntity[]>;
  countHashtags(): Promise<number>;
  updateHashtag(id: string, data: IUpdateHashtagInput): Promise<HashtagEntity | null>;
  deleteHashtag(id: string): Promise<HashtagEntity | null>;
}
