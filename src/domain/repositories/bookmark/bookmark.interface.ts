export interface ICreateBookmarkInput {
  userId: string;
  postId: string;
}

export interface IDeleteBookmarkInput extends ICreateBookmarkInput {}
