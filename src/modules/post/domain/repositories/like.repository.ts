import type { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import type { LikeEntity } from '@/modules/post/domain/entities/like.entity';
import type { CreateLikeInput, DeleteLikeInput } from '@/modules/post/domain/repositories/like.repository.types';

export interface LikeRepositoryPort extends RepositoryPort<LikeEntity> {
  createLike(data: CreateLikeInput): Promise<LikeEntity | null>;
  deleteLike(data: DeleteLikeInput): Promise<LikeEntity | null>;
}
