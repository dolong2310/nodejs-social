import { EConversationType, IConversation, IConversationMember, IConversationMemberRepository } from '@/modules';
import { BaseService } from '@/modules/base/base.service';
import { SharedConversationNotFoundException, SharedConversationNotMemberException } from '@/shared/exceptions';

export class SharedConversationsService extends BaseService {
  constructor(protected readonly conversationMemberRepository: IConversationMemberRepository) {
    super();
  }

  protected directPeer(conv: IConversation, viewerUserId: string): string {
    if (conv.type !== EConversationType.DIRECT || !conv.userIdLow || !conv.userIdHigh) {
      throw SharedConversationNotFoundException;
    }
    return conv.userIdLow.toHexString() === viewerUserId
      ? conv.userIdHigh!.toHexString()
      : conv.userIdLow!.toHexString();
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
