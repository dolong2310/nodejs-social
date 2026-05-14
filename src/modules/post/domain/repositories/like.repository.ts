import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import { LikeEntity } from '@/modules/post/domain/entities/like.entity';
import { CreateLikeInput, DeleteLikeInput } from '@/modules/post/domain/repositories/like.repository.type';

export interface LikeRepositoryPort extends RepositoryPort<LikeEntity> {
  createLike(data: CreateLikeInput): Promise<LikeEntity | null>;
  deleteLike(data: DeleteLikeInput): Promise<LikeEntity | null>;
}
