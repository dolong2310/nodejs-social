import { VALIDATION_ERROR_MESSAGE } from '@/constants';
import { EConversationType, IConversation, IConversationMember, IConversationMemberRepository } from '@/modules';
import { BaseService } from '@/modules/base/base.service';
import { ForbiddenError, NotFoundError } from '@/providers';

export class SharedConversationsService extends BaseService {
  constructor(protected readonly conversationMemberRepository: IConversationMemberRepository) {
    super();
  }

  protected directPeer(conv: IConversation, viewerUserId: string): string {
    if (conv.type !== EConversationType.DIRECT || !conv.userIdLow || !conv.userIdHigh) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_FOUND);
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
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_MEMBER);
    }
    return member;
  }
}
