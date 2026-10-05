import type { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import type { PostEntity } from '@/modules/post/domain/entities/post.entity';
import type {
  CreatePostInput,
  DeletePostTreeInput,
  IncreasePostsViewsInput,
  IncreasePostViewsInput,
  IncreasePostViewsOutput,
  UpdatePostInput
} from '@/modules/post/domain/repositories/post.repository.types';

export interface PostRepositoryPort extends RepositoryPort<PostEntity> {
  findPostById(id: string): Promise<PostEntity | null>;
  createPost(data: CreatePostInput): Promise<PostEntity>;
  updatePost(data: UpdatePostInput): Promise<PostEntity | null>;
  deletePostTree(data: DeletePostTreeInput): Promise<number>;
  increasePostViews(data: IncreasePostViewsInput): Promise<IncreasePostViewsOutput | null>;
  increasePostsViews(data: IncreasePostsViewsInput): Promise<number>;
}
