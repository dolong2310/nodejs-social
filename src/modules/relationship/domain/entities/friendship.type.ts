import { BaseEntityProps } from '@/modules/core/domain/entities/base.entity';
import { Prettify } from 'ts-essentials';

export interface FriendshipProps {
  userIdLow: string;
  userIdHigh: string;
}

export interface FriendshipFullProps extends Prettify<FriendshipProps & Omit<BaseEntityProps, 'id'> & { id: string }> {}

export interface CreateFriendshipProps extends FriendshipProps {}
