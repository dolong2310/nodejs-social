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
