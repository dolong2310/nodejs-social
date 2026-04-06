import { BaseService } from '@/modules/base/base.service';
import { IConversationMemberRepository } from '@/modules/conversations/conversationMember.repository';
import { IConversationMember } from '@/modules/conversations/conversationMember.schema';
import { EConversationType, IConversation } from '@/modules/conversations/conversations.schema';
import {
  SharedConversationNotFoundException,
  SharedConversationNotMemberException
} from '@/shared/exceptions/conversations.exception';

export class SharedConversationsService extends BaseService {
  constructor(protected readonly conversationMemberRepository: IConversationMemberRepository) {
    super();
  }

  protected directPeer(conv: IConversation, viewerUserId: string): string {
    if (conv.type !== EConversationType.DIRECT || !conv.userIdLow || !conv.userIdHigh) {
      throw SharedConversationNotFoundException;
    }
    return conv.userIdLow.toString() === viewerUserId
      ? conv.userIdHigh!.toString()
      : conv.userIdLow!.toString();
  }

  /**
   * - Chỉ thành viên của conversation mới được gửi tin.
   * - Tại sao: conversationId có thể hợp lệ (ObjectId đúng format) nhưng user không nằm trong bảng member → không được phép ghi tin.
   */
  protected async assertMember(conversationId: string, userId: string): Promise<IConversationMember> {
    const member = await this.conversationMemberRepository.findMembership(conversationId, userId);
    if (!member) {
      throw SharedConversationNotMemberException;
    }
    return member;
  }
}
