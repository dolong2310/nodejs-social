import {
  ConversationNotFoundException,
  ConversationNotMemberException
} from '@/modules/conversation/application/exceptions/conversation.exception';
import {
  AssertMemberPayload,
  ConversationDetailResult,
  GetDirectPeerIdPayload,
  MapConversationDetailPayload
} from '@/modules/conversation/application/services/conversation.service.type';
import { ConversationMemberEntity } from '@/modules/conversation/domain/entities/conversation-member.entity';
import { ConversationEntity } from '@/modules/conversation/domain/entities/conversation.entity';
import { EConversationType } from '@/modules/conversation/domain/entities/conversation.type';
import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import { ConversationRepositoryPort } from '@/modules/conversation/domain/repositories/conversation.repository';

export interface ConversationServicePort {
  getDirectPeerId(payload: GetDirectPeerIdPayload): string;
  isMember(payload: AssertMemberPayload): Promise<ConversationMemberEntity>;
  loadConversation(conversationId: string): Promise<ConversationEntity>;
  mapConversationDetail(payload: MapConversationDetailPayload): Promise<ConversationDetailResult>;
}

export class ConversationService implements ConversationServicePort {
  constructor(
    private readonly conversationRepository: ConversationRepositoryPort,
    private readonly conversationMemberRepository: ConversationMemberRepositoryPort
  ) {}

  /**
   * lấy userId của người còn lại trong cuộc trò chuyện direct (1-1)
   * Ví dụ:
   * userIdLow = A, userIdHigh = B
   * userId là A -> return B
   * userId là B -> return A
   */
  getDirectPeerId({ conv, userId }: GetDirectPeerIdPayload): string {
    const { type, userIdLow, userIdHigh } = conv.getProps();
    if (type !== EConversationType.DIRECT || !userIdLow || !userIdHigh) {
      throw new ConversationNotFoundException();
    }
    return userIdLow === userId ? userIdHigh : userIdLow;
  }

  /**
   * - Chỉ thành viên của conversation mới được gửi tin.
   * - Tại sao: conversationId có thể hợp lệ (ObjectId đúng format) nhưng user không nằm trong bảng member => không được phép ghi tin.
   */
  async isMember({ conversationId, userId }: AssertMemberPayload): Promise<ConversationMemberEntity> {
    const memberEntity = await this.conversationMemberRepository.findMember({ conversationId, userId });
    if (!memberEntity) {
      throw new ConversationNotMemberException();
    }
    return memberEntity;
  }

  async loadConversation(conversationId: string): Promise<ConversationEntity> {
    const convEntity = await this.conversationRepository.findConversationById(conversationId);
    if (!convEntity) {
      throw new ConversationNotFoundException();
    }
    return convEntity;
  }

  async mapConversationDetail({
    userId,
    conv: convEntity,
    members: memberEntities
  }: MapConversationDetailPayload): Promise<ConversationDetailResult> {
    const conv = convEntity.toObject();
    const payload: ConversationDetailResult = {
      ...conv,
      members: memberEntities.map((memberEntity) => memberEntity.toObject())
    };

    if (conv.type === EConversationType.DIRECT) {
      payload.peerUserId = this.getDirectPeerId({ conv: convEntity, userId });
    }

    return payload;
  }
}
