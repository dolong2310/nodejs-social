import { BaseEntityProps } from '@/domain/entities/base/base.entity';

import { Prettify } from 'ts-essentials';

export interface BookmarkProps {
  userId: string;
  postId: string;
}

export interface BookmarkFullProps extends Prettify<BookmarkProps & Omit<BaseEntityProps, 'id'> & { id: string }> {}

export interface CreateBookmarkProps extends BookmarkProps {}
