import {
  IncreasePostsViewsInput,
  IncreasePostViewsInput,
  IncreasePostViewsOutput
} from '@/modules/post/domain/repositories/post.command.type';

export interface PostCommandRepositoryPort {
  increasePostViews(data: IncreasePostViewsInput): Promise<IncreasePostViewsOutput | null>;
  increasePostsViews(data: IncreasePostsViewsInput): Promise<number>;
}
