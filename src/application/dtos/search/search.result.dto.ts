import { IUser } from '@/domain/entities/user.entity';

import { ICursorPaginationResult } from '@/application/common/interfaces/cursor-pagination-result.interface';
import { PostDetailResultDTO } from '@/application/dtos/post/post.result.dto';

export class SearchPostsResultDTO implements ICursorPaginationResult<PostDetailResultDTO> {
  items: PostDetailResultDTO[];
  nextCursor: string | null;
  constructor(payload: { items: PostDetailResultDTO[]; nextCursor: string | null }) {
    this.items = payload.items;
    this.nextCursor = payload.nextCursor;
  }
}

export class SearchUsersResultDTO implements ICursorPaginationResult<IUser> {
  items: IUser[];
  nextCursor: string | null;
  constructor(payload: { items: IUser[]; nextCursor: string | null }) {
    this.items = payload.items;
    this.nextCursor = payload.nextCursor;
  }
}
