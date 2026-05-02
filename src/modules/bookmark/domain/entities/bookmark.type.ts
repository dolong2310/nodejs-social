import { BaseEntityProps } from '@/modules/core/domain/entities/base.entity';

import { Prettify } from 'ts-essentials';

export interface BookmarkProps {
  userId: string;
  postId: string;
}

export interface BookmarkFullProps extends Prettify<BookmarkProps & Omit<BaseEntityProps, 'id'> & { id: string }> {}

export interface CreateBookmarkProps extends BookmarkProps {}
