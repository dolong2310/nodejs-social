import {
  FindPostsByUserIdInput,
  FindPostsByUserInteractionInput,
  FindGuestPostsInput,
  FindPostIdsWhereUserInteractedWithAuthorsInput,
  FindPostsForSearchInput,
  FindPostsInput,
  FindPostsTypeInput,
  IsUserInteractedWithPostInput,
  PostDetailWithAuthorOutput
} from '@/modules/post/domain/repositories/post.query.type';

export interface PostQueryRepositoryPort {
  isUserInteractedWithPost(data: IsUserInteractedWithPostInput): Promise<boolean>;
  findPostDetailById(id: string, currentUserId?: string): Promise<PostDetailWithAuthorOutput>;
  findPostIdsWhereUserInteractedWithAuthors(data: FindPostIdsWhereUserInteractedWithAuthorsInput): Promise<string[]>;
  findPosts(data: FindPostsInput): Promise<PostDetailWithAuthorOutput[]>;
  findGuestPosts(data: FindGuestPostsInput): Promise<PostDetailWithAuthorOutput[]>;
  findPostsByUserId(data: FindPostsByUserIdInput): Promise<PostDetailWithAuthorOutput[]>;
  findPostsByUserInteraction(data: FindPostsByUserInteractionInput): Promise<PostDetailWithAuthorOutput[]>;
  findPostsType(data: FindPostsTypeInput): Promise<PostDetailWithAuthorOutput[]>;
  findPostsForSearch(data: FindPostsForSearchInput): Promise<PostDetailWithAuthorOutput[]>;
}
