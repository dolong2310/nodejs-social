import { BaseEntityProps } from '@/modules/core/domain/entities/base.entity';
import { MarkOptional, Prettify } from 'ts-essentials';

export interface ConversationMemberProps {
  conversationId: string;
  userId: string;
  role: EConversationMemberRole;
  joinedAt: Date;
  lastReadAt?: Date | null;
  lastReadMessageId?: string | null;
}

export interface ConversationMemberFullProps extends Prettify<
  ConversationMemberProps & Omit<BaseEntityProps, 'id'> & { id: string }
> {}

export interface CreateConversationMemberProps extends MarkOptional<
  ConversationMemberProps,
  'joinedAt' | 'lastReadAt' | 'lastReadMessageId'
> {}

export enum EConversationMemberRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member'
}
