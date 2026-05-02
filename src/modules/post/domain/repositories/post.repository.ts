import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import { PostEntity } from '@/modules/post/domain/entities/post.entity';
import {
  ICreatePostInput,
  IUpdatePostAudienceAndStrangerCommentsInput
} from '@/modules/post/domain/repositories/post.repository.type';

export interface PostRepositoryPort extends RepositoryPort<PostEntity> {
  findPostById(id: string): Promise<PostEntity | null>;
  createPost(data: ICreatePostInput): Promise<PostEntity>;
  updatePostAudienceAndStrangerComments(data: IUpdatePostAudienceAndStrangerCommentsInput): Promise<PostEntity | null>;
}
