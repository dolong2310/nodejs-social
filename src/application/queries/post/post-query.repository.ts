import {
  IFindGuestPostsInput,
  IFindPostIdsWhereViewerInteractedWithAuthorsInput,
  IFindPostsForSearchInput,
  IFindPostsInput,
  IFindPostsTypeInput,
  IIsViewerInteractedWithPostInput,
  IPostDetailOutput,
  IPostDetailWithAuthorOutput
} from '@/application/queries/post/post-query.type';

export interface PostQueryRepositoryPort {
  isViewerInteractedWithPost(data: IIsViewerInteractedWithPostInput): Promise<boolean>;
  findPostDetailById(id: string): Promise<IPostDetailOutput>;
  findPostIdsWhereViewerInteractedWithAuthors(
    data: IFindPostIdsWhereViewerInteractedWithAuthorsInput
  ): Promise<string[]>;
  findPosts(data: IFindPostsInput): Promise<IPostDetailWithAuthorOutput[]>;
  findGuestPosts(data: IFindGuestPostsInput): Promise<IPostDetailWithAuthorOutput[]>;
  findPostsType(data: IFindPostsTypeInput): Promise<IPostDetailOutput[]>;
  findPostsForSearch(data: IFindPostsForSearchInput): Promise<IPostDetailWithAuthorOutput[]>;
}
