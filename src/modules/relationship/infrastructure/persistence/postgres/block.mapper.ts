import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { BlockEntity } from '@/modules/relationship/domain/entities/block.entity';
import { BlockFullProps } from '@/modules/relationship/domain/entities/block.type';
import { BlockModel, blockSchema } from '@/modules/relationship/infrastructure/persistence/postgres/block.model';
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
    const entity = new BlockEntity({
      id: new UniqueEntityID(record.id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        blockerId: record.blocker_id,
        blockedId: record.blocked_id
      }
    });
    return entity;
  }
  toResponse(record: BlockModel): BlockFullProps {
    const response = {
      id: record.id,
      blockerId: record.blocker_id,
      blockedId: record.blocked_id,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
    return response;
  }
}
