import {
  IIncreasePostsViewsInput,
  IIncreasePostViewsInput,
  IIncreasePostViewsOutput
} from '@/modules/post/application/ports/command/post-command.type';

export interface PostCommandRepositoryPort {
  increasePostViews(data: IIncreasePostViewsInput): Promise<IIncreasePostViewsOutput | null>;
  increasePostsViews(data: IIncreasePostsViewsInput): Promise<number>;
}
