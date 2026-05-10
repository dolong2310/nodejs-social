export interface PostViewsJobData {
  postIds: string[];
  isAuthenticatedViewer: boolean;
}

export interface PostViewsJobResult {
  updatedCount: number;
}

export interface PostViewsQueuePort {
  add(data: PostViewsJobData): Promise<void>;
  close(): Promise<void>;
}
