import {
  ConversationNotFoundException,
  ConversationNotMemberException
} from '@/modules/conversation/application/exceptions/conversation.exception';
import type {
  AssertMemberPayload,
  ConversationDetailResult,
  GetDirectPeerIdPayload,
  MapConversationDetailPayload
} from '@/modules/conversation/application/services/conversation.service.types';
import type { ConversationMemberEntity } from '@/modules/conversation/domain/entities/conversation-member.entity';
import type { ConversationEntity } from '@/modules/conversation/domain/entities/conversation.entity';
import { EnumConversationType } from '@/modules/conversation/domain/entities/conversation.types';
import type { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import type { ConversationRepositoryPort } from '@/modules/conversation/domain/repositories/conversation.repository';

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
   * Get the other user's id in a direct (1-1) conversation.
   * Example:
   * userIdLow = A, userIdHigh = B
   * userId is A -> return B
   * userId is B -> return A
   */
  getDirectPeerId({ conv, userId }: GetDirectPeerIdPayload): string {
    const { type, userIdLow, userIdHigh } = conv.getProps();
    if (type !== EnumConversationType.DIRECT || !userIdLow || !userIdHigh) {
      throw new ConversationNotFoundException();
    }
    return userIdLow === userId ? userIdHigh : userIdLow;
  }

  /**
   * - Only conversation members can send messages.
   * - Why: conversationId may be valid, but if the user is not in the members table, writing messages is not allowed.
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

    if (conv.type === EnumConversationType.DIRECT) {
      payload.peerUserId = this.getDirectPeerId({ conv: convEntity, userId });
    }

    return payload;
  }
}
