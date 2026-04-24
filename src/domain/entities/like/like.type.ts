import { BaseEntityProps } from '@/domain/entities/base/base.entity';
import { Prettify } from 'ts-essentials';

export interface LikeProps {
  userId: string;
  postId: string;
}

export interface LikeFullProps extends Prettify<LikeProps & Omit<BaseEntityProps, 'id'> & { id: string }> {}

export interface CreateLikeProps extends LikeProps {}
