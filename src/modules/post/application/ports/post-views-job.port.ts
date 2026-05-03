export interface IPostViewsJobData {
  postIds: string[];
  isAuthenticatedViewer: boolean;
}

export interface IPostViewsJobResult {
  updatedCount: number;
}

export interface PostViewsQueuePort {
  add(data: IPostViewsJobData): Promise<void>;
  close(): Promise<void>;
}
