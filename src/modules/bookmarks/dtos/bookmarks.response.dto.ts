import { IBookmark } from '@/modules';

export class CreateBookmarkResponseDTO {
  _id: string;
  userId: string;
  postId: string;
  createdAt?: Date;

  constructor(bookmark: IBookmark) {
    this._id = bookmark._id.toString();
    this.userId = bookmark.userId.toString();
    this.postId = bookmark.postId.toString();
    this.createdAt = bookmark.createdAt;
  }
}

export class DeleteBookmarkResponseDTO extends CreateBookmarkResponseDTO {
  constructor(bookmark: IBookmark) {
    super(bookmark);
  }
}
