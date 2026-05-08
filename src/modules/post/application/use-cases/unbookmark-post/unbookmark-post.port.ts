import { UseCase } from '@/modules/core/application/base.usecase';
import { BookmarkFullProps } from '@/modules/post/domain/entities/bookmark.type';

export class UnbookmarkPostCommand {
  postId: string;
  userId: string;
  constructor(payload: { postId: string; userId: string }) {
    this.postId = payload.postId;
    this.userId = payload.userId;
  }
}

export class UnbookmarkPostResult implements BookmarkFullProps {
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

export abstract class UnbookmarkPostPort implements UseCase<UnbookmarkPostCommand, UnbookmarkPostResult> {
  abstract execute(command: UnbookmarkPostCommand): Promise<UnbookmarkPostResult>;
}
