import { ConversationMemberEntity } from '@/modules/conversation/domain/entities/conversation-member.entity';
import { EConversationMemberRole } from '@/modules/conversation/domain/entities/conversation-member.type';
import { ConversationEntity } from '@/modules/conversation/domain/entities/conversation.entity';
import { EConversationType } from '@/modules/conversation/domain/entities/conversation.type';
import { ConversationRepositoryPort } from '@/modules/conversation/domain/repositories/conversation.repository';
import {
  ICreateGroupConversationInput,
  ITouchUpdatedAtInput,
  IUpdateConversationInput
} from '@/modules/conversation/domain/repositories/conversation.repository.type';
import { ConversationMemberMapper } from '@/modules/conversation/infrastructure/postgres/conversation-member.mapper';
import { ConversationMemberModel } from '@/modules/conversation/infrastructure/postgres/conversation-member.model';
import { ConversationMapper } from '@/modules/conversation/infrastructure/postgres/conversation.mapper';
import { ConversationModel } from '@/modules/conversation/infrastructure/postgres/conversation.model';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostgresRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.postgres.repository';
import { normalizeFriendshipPair } from '@/modules/friend/infrastructure/postgres/friendship.impl.repository';
import type { Pool } from 'pg';

const UNIQUE_VIOLATION = '23505';

export class ConversationRepository
  extends PostgresRepositoryBase<ConversationEntity, ConversationModel>
  implements ConversationRepositoryPort
{
  protected tableName = 'conversations';

  constructor(
    protected readonly pool: Pool,
    protected readonly mapper: ConversationMapper,
    protected readonly conversationMemberMapper: ConversationMemberMapper,
    protected readonly logger: LoggerPort
  ) {
    super(pool, mapper);
  }

  async findConversationById(id: string): Promise<ConversationEntity | null> {
    return this.findById(id);
  }

  async findConversationsByIds(ids: string[]): Promise<ConversationEntity[]> {
    return this.findAllByIds(ids);
  }

  async findDirectConversationByUserPair(userIdA: string, userIdB: string): Promise<ConversationEntity | null> {
    const { userIdLow, userIdHigh } = normalizeFriendshipPair(userIdA, userIdB);
    const result = await this.query<ConversationModel>(
      `
        SELECT *
        FROM conversations
        WHERE type = $1 AND user_id_low = $2 AND user_id_high = $3
        LIMIT 1
      `,
      [EConversationType.DIRECT, userIdLow, userIdHigh]
    );
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }

  async createDirectConversation(createdBy: string, peerId: string): Promise<ConversationEntity | null> {
    try {
      const { userIdLow, userIdHigh } = normalizeFriendshipPair(createdBy, peerId);
      const entity = ConversationEntity.create({
        type: EConversationType.DIRECT,
        createdBy,
        userIdLow,
        userIdHigh
      });
      const record = this.mapper.toPersistence(entity);
      const result = await this.query<ConversationModel>(
        `
          INSERT INTO conversations (
            id,
            type,
            created_by,
            name,
            avatar_media_id,
            user_id_low,
            user_id_high,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `,
        [
          record.id,
          record.type,
          record.created_by,
          record.name,
          record.avatar_media_id,
          record.user_id_low,
          record.user_id_high,
          record.created_at,
          record.updated_at
        ]
      );
      return this.mapper.toDomain(result.rows[0] ?? record);
    } catch (error) {
      if ((error as { code?: string })?.code === UNIQUE_VIOLATION) {
        return null;
      }
      throw error;
    }
  }

  async createGroupConversation(data: ICreateGroupConversationInput): Promise<ConversationEntity> {
    const { name, createdBy, memberIds } = data;
    const group = ConversationEntity.create({
      type: EConversationType.GROUP,
      createdBy,
      name
    });
    const joinedAt = new Date();
    const allMembers: ConversationMemberEntity[] = [
      ConversationMemberEntity.create({
        conversationId: group.id.toString(),
        userId: createdBy,
        role: EConversationMemberRole.ADMIN,
        joinedAt,
        lastReadAt: joinedAt,
        lastReadMessageId: null
      }),
      ...memberIds.map((memberId) =>
        ConversationMemberEntity.create({
          conversationId: group.id.toString(),
          userId: memberId,
          role: EConversationMemberRole.MEMBER,
          joinedAt,
          lastReadAt: joinedAt,
          lastReadMessageId: null
        })
      )
    ];

    await this.transaction(async () => {
      const groupRecord = this.mapper.toPersistence(group);
      await this.query(
        `
          INSERT INTO conversations (
            id,
            type,
            created_by,
            name,
            avatar_media_id,
            user_id_low,
            user_id_high,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          groupRecord.id,
          groupRecord.type,
          groupRecord.created_by,
          groupRecord.name,
          groupRecord.avatar_media_id,
          groupRecord.user_id_low,
          groupRecord.user_id_high,
          groupRecord.created_at,
          groupRecord.updated_at
        ]
      );

      const memberRecords = allMembers.map((member) => this.conversationMemberMapper.toPersistence(member));
      const values: unknown[] = [];
      const rows = memberRecords.map((record, index) => {
        const offset = index * 9;
        values.push(
          record.id,
          record.conversation_id,
          record.user_id,
          record.role,
          record.joined_at,
          record.last_read_at,
          record.last_read_message_id,
          record.created_at,
          record.updated_at
        );
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`;
      });

      if (rows.length > 0) {
        await this.query<ConversationMemberModel>(
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
            VALUES ${rows.join(', ')}
          `,
          values
        );
      }
    });

    return group;
  }

  async updateConversation(id: string, data: IUpdateConversationInput): Promise<ConversationEntity | null> {
    const updates: string[] = ['updated_at = NOW()'];
    const values: unknown[] = [id];

    if (data.name !== undefined) {
      values.push(data.name);
      updates.push(`name = $${values.length}`);
    }
    if (data.avatarMediaId !== undefined) {
      values.push(data.avatarMediaId === null ? null : data.avatarMediaId);
      updates.push(`avatar_media_id = $${values.length}`);
    }

    const result = await this.query<ConversationModel>(
      `
        UPDATE conversations
        SET ${updates.join(', ')}
        WHERE id = $1
        RETURNING *
      `,
      values
    );
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }

  async touchUpdatedAt(id: string, data: ITouchUpdatedAtInput): Promise<void> {
    await this.query(`UPDATE conversations SET updated_at = $2 WHERE id = $1`, [id, data.updatedAt]);
  }
}
