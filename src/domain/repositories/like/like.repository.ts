import { LikeEntity } from '@/domain/entities/like/like.entity';
import { RepositoryPort } from '@/domain/repositories/base/port.repository';
import { ICreateLikeInput, IDeleteLikeInput } from '@/domain/repositories/like/like.repository.type';

export interface LikeRepositoryPort extends RepositoryPort<LikeEntity> {
  createLike(data: ICreateLikeInput): Promise<LikeEntity | null>;
  deleteLike(data: IDeleteLikeInput): Promise<LikeEntity | null>;
}
