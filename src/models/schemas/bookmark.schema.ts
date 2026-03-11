import { ObjectId } from 'mongodb';

export interface IBookmark {
  _id?: ObjectId;
  userId: ObjectId;
  postId: ObjectId;
  createdAt?: Date;
}

class BookmarkSchema {
  public _id?: ObjectId;
  public userId: ObjectId;
  public postId: ObjectId;
  public createdAt?: Date;

  constructor({ _id, userId, postId, createdAt }: IBookmark) {
    const date = new Date();

    this._id = _id ?? new ObjectId();
    this.userId = userId;
    this.postId = postId;
    this.createdAt = createdAt ?? date;
  }
}

export default BookmarkSchema;
