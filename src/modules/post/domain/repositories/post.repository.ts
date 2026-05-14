import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import { PostEntity } from '@/modules/post/domain/entities/post.entity';
import { CreatePostInput, UpdatePostInput } from '@/modules/post/domain/repositories/post.repository.type';

export interface PostRepositoryPort extends RepositoryPort<PostEntity> {
  findPostById(id: string): Promise<PostEntity | null>;
  createPost(data: CreatePostInput): Promise<PostEntity>;
  updatePost(data: UpdatePostInput): Promise<PostEntity | null>;
}
