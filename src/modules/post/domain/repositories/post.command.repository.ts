import {
  IIncreasePostsViewsInput,
  IIncreasePostViewsInput,
  IIncreasePostViewsOutput,
  IPublishPostInput,
  IPublishPostOutput
} from '@/modules/post/domain/repositories/post.command.type';

export interface PostCommandRepositoryPort {
  publishPost(data: IPublishPostInput): Promise<IPublishPostOutput>;
  increasePostViews(data: IIncreasePostViewsInput): Promise<IIncreasePostViewsOutput | null>;
  increasePostsViews(data: IIncreasePostsViewsInput): Promise<number>;
}
