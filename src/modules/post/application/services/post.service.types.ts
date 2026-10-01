import { PostDetailOutput, PostDetailWithAuthorOutput } from '@/modules/post/domain/repositories/post.query.types';

export interface UpdatePostsViewsPayload<T extends PostDetailOutput | PostDetailWithAuthorOutput> {
  posts: T[];
  userId?: string;
}

export interface IsUserInteractedWithPostPayload {
  userId: string;
  postId: string;
}

export interface GetBlockedPostIdsPayload {
  userId: string;
  blockedAuthorIds: string[];
}
