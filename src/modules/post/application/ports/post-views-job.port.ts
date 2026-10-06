export const POST_VIEWS_QUEUE_NAME = 'post-views';

export interface PostViewsJobData {
  postIds: string[];
  isAuthenticatedUser: boolean;
}

export interface PostViewsJobResult {
  updatedCount: number;
}

export interface PostViewsQueuePort {
  add(data: PostViewsJobData): Promise<void>;
  close(): Promise<void>;
}
