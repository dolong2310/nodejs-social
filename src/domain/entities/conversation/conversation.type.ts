import { BaseEntityProps } from '@/domain/entities/base/base.entity';
import { Prettify } from 'ts-essentials';

export interface ConversationProps {
  type: EConversationType;
  createdBy: string;
  name?: string;
  avatarMediaId?: string | null;
  userIdLow?: string;
  userIdHigh?: string;
}

export interface ConversationFullProps extends Prettify<
  ConversationProps & Omit<BaseEntityProps, 'id'> & { id: string }
> {}

export interface CreateDirectConversationProps extends Pick<
  ConversationProps,
  'type' | 'createdBy' | 'userIdLow' | 'userIdHigh'
> {}

export interface CreateGroupConversationProps extends Pick<
  ConversationProps,
  'type' | 'createdBy' | 'name' | 'avatarMediaId'
> {}

export enum EConversationType {
  DIRECT = 'direct',
  GROUP = 'group'
}
