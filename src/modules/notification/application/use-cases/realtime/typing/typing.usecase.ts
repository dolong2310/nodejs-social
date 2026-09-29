import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import { isValidId } from '@/modules/core/domain/helpers/ids';
import {
  TypingInputPort,
  TypingPort,
  TypingOutputPort
} from '@/modules/notification/application/use-cases/realtime/typing/typing.port';

export class TypingUseCase extends TypingPort {
  private readonly lastEmit = new Map<string, number>();
  private readonly THROTTLE = 2000;

  constructor(private readonly conversationMemberRepository: ConversationMemberRepositoryPort) {
    super();
  }

  async execute(input: TypingInputPort): Promise<TypingOutputPort | null> {
    const { userId, conversationId, typing } = input;
    if (typeof typing !== 'boolean') return null;
    if (!conversationId || !isValidId(conversationId)) return null;

    const member = await this.conversationMemberRepository.findMember({ userId, conversationId }).catch(() => null);
    if (!member) return null;

    if (typing) {
      const key = `${userId}:${conversationId}`;
      const now = Date.now();
      const last = this.lastEmit.get(key) ?? 0;
      if (now - last < this.THROTTLE) return null;
      this.lastEmit.set(key, now);
    }

    return new TypingOutputPort({ conversationId, userId, typing });
  }
}
