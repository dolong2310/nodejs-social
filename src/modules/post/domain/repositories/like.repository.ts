import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import { LikeEntity } from '@/modules/post/domain/entities/like.entity';
import { ICreateLikeInput, IDeleteLikeInput } from '@/modules/post/domain/repositories/like.repository.type';

export interface LikeRepositoryPort extends RepositoryPort<LikeEntity> {
  createLike(data: ICreateLikeInput): Promise<LikeEntity | null>;
  deleteLike(data: IDeleteLikeInput): Promise<LikeEntity | null>;
}
