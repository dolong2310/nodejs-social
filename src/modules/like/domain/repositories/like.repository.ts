import { LikeEntity } from '@/modules/like/domain/entities/like.entity';
import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import { ICreateLikeInput, IDeleteLikeInput } from '@/modules/like/domain/repositories/like.repository.type';

export interface LikeRepositoryPort extends RepositoryPort<LikeEntity> {
  createLike(data: ICreateLikeInput): Promise<LikeEntity | null>;
  deleteLike(data: IDeleteLikeInput): Promise<LikeEntity | null>;
}
