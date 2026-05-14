import { CreateHashtagProps } from '@/modules/post/domain/entities/hashtag.type';

export interface CreateHashtagInput extends CreateHashtagProps {}

export interface ListHashtagsInput {
  limit: number;
  skip?: number;
}

export interface UpdateHashtagInput {
  name?: string;
}
