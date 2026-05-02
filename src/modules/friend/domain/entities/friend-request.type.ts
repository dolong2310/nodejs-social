import { BaseEntityProps } from '@/modules/core/domain/entities/base.entity';
import { Prettify } from 'ts-essentials';

export interface FriendRequestProps {
  fromUserId: string;
  toUserId: string;
}

export interface FriendRequestFullProps extends Prettify<
  FriendRequestProps & Omit<BaseEntityProps, 'id'> & { id: string }
> {}

export interface CreateFriendRequestProps extends FriendRequestProps {}
