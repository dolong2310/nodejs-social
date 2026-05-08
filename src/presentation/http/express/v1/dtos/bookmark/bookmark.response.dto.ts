import { BookmarkFullProps } from '@/modules/post/domain/entities/bookmark.type';

export class CreateBookmarkResponseDTO implements BookmarkFullProps {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(bookmark: BookmarkFullProps) {
    this.id = bookmark.id;
    this.userId = bookmark.userId;
    this.postId = bookmark.postId;
    this.createdAt = bookmark.createdAt;
    this.updatedAt = bookmark.updatedAt;
  }
}

export class DeleteBookmarkResponseDTO extends CreateBookmarkResponseDTO {
  constructor(bookmark: BookmarkFullProps) {
    super(bookmark);
  }
}
