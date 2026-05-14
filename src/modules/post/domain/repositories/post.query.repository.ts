import {
  FindGuestPostsInput,
  FindPostIdsWhereViewerInteractedWithAuthorsInput,
  FindPostsForSearchInput,
  FindPostsInput,
  FindPostsTypeInput,
  IsViewerInteractedWithPostInput,
  PostDetailOutput,
  PostDetailWithAuthorOutput
} from '@/modules/post/domain/repositories/post.query.type';

export interface PostQueryRepositoryPort {
  isViewerInteractedWithPost(data: IsViewerInteractedWithPostInput): Promise<boolean>;
  findPostDetailById(id: string): Promise<PostDetailOutput>;
  findPostIdsWhereViewerInteractedWithAuthors(
    data: FindPostIdsWhereViewerInteractedWithAuthorsInput
  ): Promise<string[]>;
  findPosts(data: FindPostsInput): Promise<PostDetailWithAuthorOutput[]>;
  findGuestPosts(data: FindGuestPostsInput): Promise<PostDetailWithAuthorOutput[]>;
  findPostsType(data: FindPostsTypeInput): Promise<PostDetailOutput[]>;
  findPostsForSearch(data: FindPostsForSearchInput): Promise<PostDetailWithAuthorOutput[]>;
}
