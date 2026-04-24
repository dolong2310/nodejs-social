import { PostEntity } from '@/domain/entities/post/post.entity';
import { RepositoryPort } from '@/domain/repositories/base/port.repository';
import {
  ICreatePostInput,
  IIncreasePostViewsInput,
  IIncreasePostsViewsInput,
  IUpdatePostAudienceAndStrangerCommentsInput
} from '@/domain/repositories/post/post.repository.type';

export interface PostRepositoryPort extends RepositoryPort<PostEntity> {
  findPostById(id: string): Promise<PostEntity | null>;
  createPost(data: ICreatePostInput): Promise<PostEntity>;
  updatePostAudienceAndStrangerComments(data: IUpdatePostAudienceAndStrangerCommentsInput): Promise<PostEntity | null>;
  increasePostViews(data: IIncreasePostViewsInput): Promise<PostEntity | null>;
  increasePostsViews(data: IIncreasePostsViewsInput): Promise<number>;
}
