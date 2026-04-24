import { TypingCommand, TypingInPort, TypingResult } from '@/application/use-cases/realtime/typing/typing.in-port';
import { isValidId } from '@/domain/helpers/ids';
import { ConversationMemberRepositoryPort } from '@/domain/repositories/conversation-member/conversation-member.repository';

export class TypingInteractor extends TypingInPort {
  private readonly lastEmit = new Map<string, number>();
  private readonly THROTTLE = 2000;

  constructor(private readonly conversationMemberRepository: ConversationMemberRepositoryPort) {
    super();
  }

  async execute({ userId, conversationId, typing }: TypingCommand): Promise<TypingResult | null> {
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

    return new TypingResult({ conversationId, userId, typing });
  }
}
