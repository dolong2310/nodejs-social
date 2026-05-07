import { BlockEntity } from '@/modules/block/domain/entities/block.entity';
import { BlockFullProps } from '@/modules/block/domain/entities/block.type';
import { BlockModel, blockSchema } from '@/modules/block/infrastructure/postgres/block.model';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { parse } from 'valibot';

export class BlockMapper implements Mapper<BlockEntity, BlockModel, BlockFullProps> {
  toPersistence(entity: BlockEntity): BlockModel {
    const clone = entity.getProps();
    const record: BlockModel = {
      id: clone.id.toString(),
      blocker_id: clone.blockerId,
      blocked_id: clone.blockedId,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
    };
    return parse(blockSchema, record);
  }
  toDomain(record: BlockModel): BlockEntity {
    return new BlockEntity({
      id: new UniqueEntityID(record.id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        blockerId: record.blocker_id,
        blockedId: record.blocked_id
      }
    });
  }
  toResponse(record: BlockModel): BlockFullProps {
    return {
      id: record.id,
      blockerId: record.blocker_id,
      blockedId: record.blocked_id,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }
}
