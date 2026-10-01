import type { Options, RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import type { HashtagEntity } from '@/modules/post/domain/entities/hashtag.entity';
import type {
  CreateHashtagInput,
  ListHashtagsInput,
  UpdateHashtagInput
} from '@/modules/post/domain/repositories/hashtag.repository.types';

export interface HashtagRepositoryPort extends RepositoryPort<HashtagEntity> {
  createHashtag(data: CreateHashtagInput): Promise<HashtagEntity>;
  insertBulk(hashtags: string[]): Promise<HashtagEntity[]>;
  findHashtagById(id: string): Promise<HashtagEntity | null>;
  findHashtagByName(name: string): Promise<HashtagEntity | null>;
  findHashtags(data: ListHashtagsInput): Promise<HashtagEntity[]>;
  countHashtags(): Promise<number>;
  updateHashtag(id: string, data: UpdateHashtagInput): Promise<HashtagEntity | null>;
  deleteHashtag(id: string, options?: Options): Promise<HashtagEntity | null>;
}
