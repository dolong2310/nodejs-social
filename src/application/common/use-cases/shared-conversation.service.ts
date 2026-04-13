import { IConversationMember } from '@/domain/entities/conversation-member.entity';
import { IConversation } from '@/domain/entities/conversation.entity';
import { EConversationType } from '@/domain/enums/conversation.enum';
import { IConversationMemberRepository } from '@/domain/repositories/conversation-member/conversation-member.repository';

import {
  SharedConversationNotFoundException,
  SharedConversationNotMemberException
} from '@/application/errors/common/conversation.error';
import { BaseService } from '@/application/use-cases/base.service';

export class SharedConversationsService extends BaseService {
  constructor(protected readonly conversationMemberRepository: IConversationMemberRepository) {
    super();
  }

  protected directPeer(conv: IConversation, viewerUserId: string): string {
    if (conv.type !== EConversationType.DIRECT || !conv.userIdLow || !conv.userIdHigh) {
      throw SharedConversationNotFoundException;
    }
    return conv.userIdLow === viewerUserId ? conv.userIdHigh! : conv.userIdLow!;
  }

  /**
   * - Chỉ thành viên của conversation mới được gửi tin.
   * - Tại sao: conversationId có thể hợp lệ (ObjectId đúng format) nhưng user không nằm trong bảng member → không được phép ghi tin.
   */
  protected async assertMember(conversationId: string, userId: string): Promise<IConversationMember> {
    const member = await this.conversationMemberRepository.findMember({ conversationId, userId });
    if (!member) {
      throw SharedConversationNotMemberException;
    }
    return member;
  }
}
