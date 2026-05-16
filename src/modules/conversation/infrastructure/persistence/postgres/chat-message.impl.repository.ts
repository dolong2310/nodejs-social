import { ChatMessageEntity } from '@/modules/conversation/domain/entities/chat-message.entity';
import { ChatMessageRepositoryPort } from '@/modules/conversation/domain/repositories/chat-message.repository';
import {
  CreateMessageInput,
  FindMessagesInput
} from '@/modules/conversation/domain/repositories/chat-message.repository.type';
import { ChatMessageMapper } from '@/modules/conversation/infrastructure/persistence/postgres/chat-message.mapper';
import { ChatMessageModel } from '@/modules/conversation/infrastructure/persistence/postgres/chat-message.model';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostgresRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.postgres.repository';
import type { Pool } from 'pg';

export class ChatMessageRepository
  extends PostgresRepositoryBase<ChatMessageEntity, ChatMessageModel>
  implements ChatMessageRepositoryPort
{
  protected tableName = 'chat_messages';

  constructor(
    protected readonly pool: Pool,
    protected readonly mapper: ChatMessageMapper,
    protected readonly logger: LoggerPort
  ) {
    super(pool, mapper);
  }

  async createMessage(data: CreateMessageInput): Promise<ChatMessageEntity> {
    const entity = ChatMessageEntity.create({
      conversationId: data.conversationId,
      senderId: data.senderId,
      text: data.text,
      attachments: data.attachments
    });
    const record = this.mapper.toPersistence(entity);
    const result = await this.query<ChatMessageModel>(
      `
        INSERT INTO chat_messages (
          id,
          conversation_id,
          sender_id,
          text,
          attachments,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
        RETURNING *
      `,
      [
        record.id,
        record.conversation_id,
        record.sender_id,
        record.text,
        record.attachments ? JSON.stringify(record.attachments) : null,
        record.created_at,
        record.updated_at
      ]
    );
    return this.mapper.toDomain(result.rows[0] ?? record);
  }

  async findMessageById(id: string): Promise<ChatMessageEntity | null> {
    return this.findById(id);
  }

  async findMessages(id: string, data: FindMessagesInput): Promise<ChatMessageEntity[]> {
    const { limit, before } = data;
    const conditions = ['conversation_id = $1', 'deleted_at IS NULL'];
    const values: unknown[] = [id];

    if (before) {
      const cursor = before.raw();
      values.push(cursor.createdAt, cursor.id);
      conditions.push(
        `(created_at < $${values.length - 1} OR (created_at = $${values.length - 1} AND id < $${values.length}))`
      );
    }

    values.push(limit);
    const result = await this.query<ChatMessageModel>(
      `
        SELECT *
        FROM chat_messages
        WHERE ${conditions.join(' AND ')}
        ORDER BY created_at DESC, id DESC
        LIMIT $${values.length}
      `,
      values
    );
    return result.rows.map((record) => this.mapper.toDomain(record));
  }
}
