export interface IIncreasePostViewsInput {
  postId: string;
  userId?: string;
}

export interface IIncreasePostsViewsInput {
  ids: string[];
  isAuthenticatedViewer: boolean;
}

// Output

export interface IIncreasePostViewsOutput {
  userViews: number;
  guestViews: number;
  updatedAt: Date;
}
