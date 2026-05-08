import { CreateHashtagProps } from '@/modules/post/domain/entities/hashtag.type';

export interface ICreateHashtagInput extends CreateHashtagProps {}

export interface IListHashtagsInput {
  limit: number;
  skip?: number;
}

export interface IUpdateHashtagInput {
  name?: string;
}
