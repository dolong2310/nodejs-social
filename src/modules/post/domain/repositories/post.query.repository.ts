import {
  IFindGuestPostsInput,
  IFindPostIdsWhereViewerInteractedWithAuthorsInput,
  IFindPostsForSearchInput,
  IFindPostsInput,
  IFindPostsTypeInput,
  IIsViewerInteractedWithPostInput,
  IPostAccessSnapshot,
  IPostDetailOutput,
  IPostDetailWithAuthorOutput
} from '@/modules/post/domain/repositories/post.query.type';

export interface PostQueryRepositoryPort {
  isViewerInteractedWithPost(data: IIsViewerInteractedWithPostInput): Promise<boolean>;
  findPostAccessSnapshotById(id: string): Promise<IPostAccessSnapshot | null>;
  findPostDetailById(id: string): Promise<IPostDetailOutput>;
  findPostIdsWhereViewerInteractedWithAuthors(
    data: IFindPostIdsWhereViewerInteractedWithAuthorsInput
  ): Promise<string[]>;
  findPosts(data: IFindPostsInput): Promise<IPostDetailWithAuthorOutput[]>;
  findGuestPosts(data: IFindGuestPostsInput): Promise<IPostDetailWithAuthorOutput[]>;
  findPostsType(data: IFindPostsTypeInput): Promise<IPostDetailOutput[]>;
  findPostsForSearch(data: IFindPostsForSearchInput): Promise<IPostDetailWithAuthorOutput[]>;
}
