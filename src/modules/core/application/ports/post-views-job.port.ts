export interface IPostViewsJobData {
  postIds: string[];
  isAuthenticatedViewer: boolean;
}

export interface IPostViewsJobResult {
  updatedCount: number;
}

export interface IPostViewsQueue {
  add(data: IPostViewsJobData): Promise<void>;
  close(): Promise<void>;
}
