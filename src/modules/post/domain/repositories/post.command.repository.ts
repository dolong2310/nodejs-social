import {
  IIncreasePostsViewsInput,
  IIncreasePostViewsInput,
  IIncreasePostViewsOutput
} from '@/modules/post/domain/repositories/post.command.type';

export interface PostCommandRepositoryPort {
  increasePostViews(data: IIncreasePostViewsInput): Promise<IIncreasePostViewsOutput | null>;
  increasePostsViews(data: IIncreasePostsViewsInput): Promise<number>;
}
