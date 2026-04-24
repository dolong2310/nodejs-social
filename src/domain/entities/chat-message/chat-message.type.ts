import { BaseEntityProps } from '@/domain/entities/base/base.entity';
import { Prettify } from 'ts-essentials';

export interface IChatAttachment {
  key: string;
  mime: string;
  size: number;
  url?: string;
}

export interface ChatMessageProps {
  conversationId: string;
  senderId: string;
  text?: string;
  attachments?: IChatAttachment[];
}

export interface ChatMessageFullProps extends Prettify<
  ChatMessageProps & Omit<BaseEntityProps, 'id'> & { id: string }
> {}

export interface CreateChatMessageProps extends ChatMessageProps {}
