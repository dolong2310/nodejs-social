import { PostDetailOutput, PostDetailWithAuthorOutput } from '@/modules/post/domain/repositories/post.query.type';

export interface UpdatePostsViewsPayload<T extends PostDetailOutput | PostDetailWithAuthorOutput> {
  posts: T[];
  userId?: string;
}

export interface IsViewerInteractedWithPostPayload {
  viewerId: string;
  postId: string;
}

export interface GetBlockedPostIdsPayload {
  userId: string;
  blockedAuthorIds: string[];
}
