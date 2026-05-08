import { ConversationMemberQueryRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.query.repository';
import {
  IListConversationsForUserInput,
  IListConversationsForUserOutput
} from '@/modules/conversation/domain/repositories/conversation-member.query.type';
import type { Pool } from 'pg';

export class ConversationMemberQueryRepository implements ConversationMemberQueryRepositoryPort {
  constructor(protected readonly pool: Pool) {}

  async listConversationsForUser({
    userId,
    limit,
    cursor
  }: IListConversationsForUserInput): Promise<IListConversationsForUserOutput[]> {
    const conditions = ['cm.user_id = $1'];
    const values: unknown[] = [userId];

    if (cursor) {
      const raw = cursor.raw();
      values.push(raw.createdAt, raw.id);
      conditions.push(
        `(c.updated_at < $${values.length - 1} OR (c.updated_at = $${values.length - 1} AND c.id < $${values.length}))`
      );
    }

    values.push(limit);
    const result = await this.pool.query<{ conversation_id: string; updated_at: Date }>(
      `
        SELECT c.id AS conversation_id, c.updated_at
        FROM conversation_members cm
        INNER JOIN conversations c ON c.id = cm.conversation_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY c.updated_at DESC, c.id DESC
        LIMIT $${values.length}
      `,
      values
    );

    return result.rows.map((record) => ({
      conversationId: record.conversation_id,
      updatedAt: record.updated_at
    }));
  }
}
