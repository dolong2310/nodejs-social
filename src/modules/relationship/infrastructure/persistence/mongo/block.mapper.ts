import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { BlockEntity } from '@/modules/relationship/domain/entities/block.entity';
import { BlockFullProps } from '@/modules/relationship/domain/entities/block.type';
import { BlockModel, blockSchema } from '@/modules/relationship/infrastructure/persistence/mongo/block.model';
import { parse } from 'valibot';

export class BlockMapper implements Mapper<BlockEntity, BlockModel, BlockFullProps> {
  toPersistence(entity: BlockEntity): BlockModel {
    const clone = entity.getProps();
    const record: BlockModel = {
      _id: clone.id.toString(),
      blocker_id: clone.blockerId,
      blocked_id: clone.blockedId,
      created_at: clone.createdAt,
      created_by_id: clone.createdById ?? null,
      updated_at: clone.updatedAt,
      updated_by_id: clone.updatedById ?? null,
      deleted_at: clone.deletedAt ?? null,
      deleted_by_id: clone.deletedById ?? null
    };
    return parse(blockSchema, record);
  }
  toDomain(record: BlockModel): BlockEntity {
    const entity = new BlockEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.created_at,
      createdById: record.created_by_id ?? null,
      updatedAt: record.updated_at,
      updatedById: record.updated_by_id ?? null,
      deletedAt: record.deleted_at ?? null,
      deletedById: record.deleted_by_id ?? null,
      props: {
        blockerId: record.blocker_id,
        blockedId: record.blocked_id
      }
    });
    return entity;
  }
  toResponse(record: BlockModel): BlockFullProps {
    const response = {
      id: record._id,
      blockerId: record.blocker_id,
      blockedId: record.blocked_id,
      createdAt: record.created_at,
      createdById: record.created_by_id ?? null,
      updatedAt: record.updated_at,
      updatedById: record.updated_by_id ?? null,
      deletedAt: record.deleted_at ?? null,
      deletedById: record.deleted_by_id ?? null
    };
    return response;
  }
}
