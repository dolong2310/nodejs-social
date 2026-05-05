import { UseCase } from '@/modules/core/application/base.usecase';
import { BookmarkFullProps } from '@/modules/bookmark/domain/entities/bookmark.type';

export class BookmarkPostCommand {
  postId: string;
  userId: string;
  constructor(payload: { postId: string; userId: string }) {
    this.postId = payload.postId;
    this.userId = payload.userId;
  }
}

export class BookmarkPostResult implements BookmarkFullProps {
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

export abstract class BookmarkPostPort implements UseCase<BookmarkPostCommand, BookmarkPostResult> {
  abstract execute(command: BookmarkPostCommand): Promise<BookmarkPostResult>;
}
