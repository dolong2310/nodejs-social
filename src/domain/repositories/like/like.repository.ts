import { ILike } from '@/domain/entities/like.entity';
import { ICreateLikeInput, IDeleteLikeInput } from '@/domain/repositories/like/like.interface';

export interface ILikeRepository {
  createLike(data: ICreateLikeInput): Promise<ILike | null>;
  deleteLike(data: IDeleteLikeInput): Promise<ILike | null>;
}
