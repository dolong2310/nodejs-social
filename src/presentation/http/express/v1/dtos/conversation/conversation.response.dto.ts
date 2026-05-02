import { ConversationMemberFullProps } from '@/modules/conversation/domain/entities/conversation-member.type';
import { ConversationFullProps, EConversationType } from '@/modules/conversation/domain/entities/conversation.type';

export class ConversationResponseDTO implements Omit<ConversationFullProps, 'userIdLow' | 'userIdHigh'> {
  id: string;
  type: EConversationType;
  createdBy: string;
  name?: string;
  avatarMediaId?: string | null;
  peerUserId?: string;
  updatedAt: Date;
  createdAt: Date;
  constructor(conversation: ConversationFullProps & { peerUserId?: string }) {
    this.id = conversation.id;
    this.type = conversation.type;
    this.createdBy = conversation.createdBy;
    this.name = conversation.name;
    this.avatarMediaId = conversation.avatarMediaId;
    this.peerUserId = conversation.peerUserId;
    this.updatedAt = conversation.updatedAt;
    this.createdAt = conversation.createdAt;
  }
}

export class ConversationDetailResponseDTO extends ConversationResponseDTO {
  members: ConversationMemberFullProps[];
  constructor(conversation: ConversationFullProps & { peerUserId?: string; members: ConversationMemberFullProps[] }) {
    super(conversation);
    this.members = conversation.members;
  }
}
