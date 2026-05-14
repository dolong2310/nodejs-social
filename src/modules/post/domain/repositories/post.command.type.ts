export interface IncreasePostViewsInput {
  postId: string;
  userId?: string;
}

export interface IncreasePostsViewsInput {
  ids: string[];
  isAuthenticatedViewer: boolean;
}

// Output

export interface IncreasePostViewsOutput {
  userViews: number;
  guestViews: number;
  updatedAt: Date;
}
