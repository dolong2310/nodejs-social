import { IHashtag } from '@/domain/entities/hashtag.entity';
import { IPost } from '@/domain/entities/post.entity';
import {
  ICountPostsInput,
  ICountPostsTypeInput,
  ICreatePostInput,
  IFindAndUpsertHashtagsInput,
  IFindGuestPostsInput,
  IFindPostByIdInput,
  IFindPostIdsWhereViewerInteractedWithAuthorsInput,
  IFindPostIdsWhereViewerInteractedWithAuthorsOutput,
  IFindPostsInput,
  IFindPostsTypeInput,
  IIncreasePostViewsInput,
  IIncreasePostsViewsInput,
  IIsViewerInteractedWithPostInput,
  IPostDetailOutput,
  IPostDetailWithAuthorOutput,
  IUpdatePostAudienceAndStrangerCommentsInput
} from '@/domain/repositories/post/post.interface';

export interface IPostRepository {
  isViewerInteractedWithPost(data: IIsViewerInteractedWithPostInput): Promise<boolean>;
  findPostDetailById(data: IFindPostByIdInput): Promise<IPostDetailOutput>;
  findPostIdsWhereViewerInteractedWithAuthors(
    data: IFindPostIdsWhereViewerInteractedWithAuthorsInput
  ): Promise<IFindPostIdsWhereViewerInteractedWithAuthorsOutput>;
  findPosts(data: IFindPostsInput): Promise<IPostDetailWithAuthorOutput[]>;
  findGuestPosts(data: IFindGuestPostsInput): Promise<IPostDetailWithAuthorOutput[]>;
  findPostsType(data: IFindPostsTypeInput): Promise<IPostDetailOutput[]>;
  findPostById(data: IFindPostByIdInput): Promise<IPost | null>;
  createPost(data: ICreatePostInput): Promise<IPost>;
  updatePostAudienceAndStrangerComments(data: IUpdatePostAudienceAndStrangerCommentsInput): Promise<IPost | null>;
  increasePostViews(data: IIncreasePostViewsInput): Promise<IPost | null>;
  increasePostsViews(data: IIncreasePostsViewsInput): Promise<number>;
  countPosts(data: ICountPostsInput): Promise<number>;
  countGuestPosts(): Promise<number>;
  countPostsType(data: ICountPostsTypeInput): Promise<number>;
  findAndUpsertHashtags(data: IFindAndUpsertHashtagsInput): Promise<(IHashtag | null)[]>;
}
