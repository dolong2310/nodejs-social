import { ILike } from '@/domain/entities/like.entity';

export interface ICreateLikeInput extends Pick<ILike, 'userId' | 'postId'> {}

export interface IDeleteLikeInput extends ICreateLikeInput {}
