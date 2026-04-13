import { IBookmark } from '@/domain/entities/bookmark.entity';

export class CreateBookmarkResultDTO {
  id: string;
  userId: string;
  postId: string;
  createdAt?: Date;
  constructor(bookmark: IBookmark) {
    this.id = bookmark.id;
    this.userId = bookmark.userId;
    this.postId = bookmark.postId;
    this.createdAt = bookmark.createdAt;
  }
}

export class DeleteBookmarkResultDTO extends CreateBookmarkResultDTO {}
