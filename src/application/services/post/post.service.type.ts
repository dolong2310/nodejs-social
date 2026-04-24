import { IPostDetailOutput, IPostDetailWithAuthorOutput } from '@/application/queries/post/post-query.type';

export interface UpdatePostsViewsPayload<T extends IPostDetailOutput | IPostDetailWithAuthorOutput> {
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
