export interface IncreasePostViewsInput {
  postId: string;
  userId?: string;
}

export interface IncreasePostsViewsInput {
  ids: string[];
  isAuthenticatedUser: boolean;
}

// Output

export interface IncreasePostViewsOutput {
  userViews: number;
  guestViews: number;
  updatedAt: Date;
}
