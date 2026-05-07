import { ConversationMemberEntity } from '@/modules/conversation/domain/entities/conversation-member.entity';
import { EConversationMemberRole } from '@/modules/conversation/domain/entities/conversation-member.type';
import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import {
  ICreateMemberInput,
  IDeleteMemberInput,
  IFindMemberInput,
  IFindMembersByUsersInput,
  IFindMembersInput,
  ITransferAdminRoleInput,
  IUpdateReadStateInput,
  IUpdateRoleInput
} from '@/modules/conversation/domain/repositories/conversation-member.repository.type';
import { ConversationMemberMapper } from '@/modules/conversation/infrastructure/postgres/conversation-member.mapper';
import { ConversationMemberModel } from '@/modules/conversation/infrastructure/postgres/conversation-member.model';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostgresRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.postgres.repository';
import type { Pool } from 'pg';

export class ConversationMemberRepository
  extends PostgresRepositoryBase<ConversationMemberEntity, ConversationMemberModel>
  implements ConversationMemberRepositoryPort
{
  protected tableName = 'conversation_members';

  constructor(
    protected readonly pool: Pool,
    protected readonly mapper: ConversationMemberMapper,
    protected readonly logger: LoggerPort
  ) {
    super(pool, mapper);
  }

  async findMember({ conversationId, userId }: IFindMemberInput): Promise<ConversationMemberEntity | null> {
    const result = await this.query<ConversationMemberModel>(
      `SELECT * FROM conversation_members WHERE conversation_id = $1 AND user_id = $2 LIMIT 1`,
      [conversationId, userId]
    );
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }

  async findMembersByUsers({ conversationId, userIds }: IFindMembersByUsersInput): Promise<ConversationMemberEntity[]> {
    if (userIds.length === 0) return [];
    const result = await this.query<ConversationMemberModel>(
      `SELECT * FROM conversation_members WHERE conversation_id = $1 AND user_id = ANY($2::text[])`,
      [conversationId, userIds]
    );
    return result.rows.map((record) => this.mapper.toDomain(record));
  }

  async findMembers({ conversationIds, userId }: IFindMembersInput): Promise<ConversationMemberEntity[]> {
    if (conversationIds.length === 0) return [];
    const result = await this.query<ConversationMemberModel>(
      `SELECT * FROM conversation_members WHERE conversation_id = ANY($1::text[]) AND user_id = $2`,
      [conversationIds, userId]
    );
    return result.rows.map((record) => this.mapper.toDomain(record));
  }

  async createMember(data: ICreateMemberInput): Promise<ConversationMemberEntity> {
    const entity = ConversationMemberEntity.create(data);
    const record = this.mapper.toPersistence(entity);
    const result = await this.query<ConversationMemberModel>(
      `
        INSERT INTO conversation_members (
          id,
          conversation_id,
          user_id,
          role,
          joined_at,
          last_read_at,
          last_read_message_id,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `,
      [
        record.id,
        record.conversation_id,
        record.user_id,
        record.role,
        record.joined_at,
        record.last_read_at,
        record.last_read_message_id,
        record.created_at,
        record.updated_at
      ]
    );
    return this.mapper.toDomain(result.rows[0] ?? record);
  }

  async deleteMember({ conversationId, userId }: IDeleteMemberInput): Promise<number> {
    const result = await this.query(`DELETE FROM conversation_members WHERE conversation_id = $1 AND user_id = $2`, [
      conversationId,
      userId
    ]);
    return result.rowCount ?? 0;
  }

  async listMembers(conversationId: string): Promise<ConversationMemberEntity[]> {
    const result = await this.query<ConversationMemberModel>(
      `SELECT * FROM conversation_members WHERE conversation_id = $1 ORDER BY joined_at ASC, id ASC`,
      [conversationId]
    );
    return result.rows.map((record) => this.mapper.toDomain(record));
  }

  async updateRole({ conversationId, userId, role }: IUpdateRoleInput): Promise<ConversationMemberEntity | null> {
    const result = await this.query<ConversationMemberModel>(
      `
        UPDATE conversation_members
        SET role = $3, updated_at = NOW()
        WHERE conversation_id = $1 AND user_id = $2
        RETURNING *
      `,
      [conversationId, userId, role]
    );
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }

  async transferAdminRole(data: ITransferAdminRoleInput): Promise<void> {
    const { conversationId, joinedAt, oldAdminUserId, newAdminUserId } = data;
    await this.transaction(async () => {
      await this.query(
        `UPDATE conversation_members SET role = $3, updated_at = NOW() WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, oldAdminUserId, EConversationMemberRole.MANAGER]
      );
      await this.query(
        `UPDATE conversation_members SET role = $3, updated_at = NOW() WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, newAdminUserId, EConversationMemberRole.ADMIN]
      );
      await this.query(`UPDATE conversations SET updated_at = $2 WHERE id = $1`, [conversationId, joinedAt]);
    });
  }

  async updateReadState({
    conversationId,
    userId,
    lastReadAt,
    lastReadMessageId
  }: IUpdateReadStateInput): Promise<ConversationMemberEntity | null> {
    const result = await this.query<ConversationMemberModel>(
      `
        UPDATE conversation_members
        SET last_read_message_id = $3, last_read_at = $4, updated_at = NOW()
        WHERE conversation_id = $1 AND user_id = $2
        RETURNING *
      `,
      [conversationId, userId, lastReadMessageId, lastReadAt]
    );
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }

  async countMembers(conversationId: string): Promise<number> {
    const result = await this.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM conversation_members WHERE conversation_id = $1`,
      [conversationId]
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  async countAdmins(conversationId: string): Promise<number> {
    const result = await this.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM conversation_members WHERE conversation_id = $1 AND role = $2`,
      [conversationId, EConversationMemberRole.ADMIN]
    );
    return Number(result.rows[0]?.count ?? 0);
  }
}
