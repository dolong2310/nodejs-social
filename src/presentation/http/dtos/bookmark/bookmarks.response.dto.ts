import { IBookmark } from '@/domain/entities/bookmark.entity';

export class CreateBookmarkResponseDTO {
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

export class DeleteBookmarkResponseDTO extends CreateBookmarkResponseDTO {
  constructor(bookmark: IBookmark) {
    super(bookmark);
  }
}
