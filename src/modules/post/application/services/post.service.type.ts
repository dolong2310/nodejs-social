import {
  IPostDetailOutput,
  IPostDetailWithAuthorOutput
} from '@/modules/post/application/ports/queries/post-query.type';

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
