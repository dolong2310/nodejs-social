import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { BlockEntity } from '@/modules/block/domain/entities/block.entity';
import { BlockModel, blockSchema } from '@/modules/block/infrastructure/mongo/block.model';
import { parse } from 'valibot';

export class BlockMapper implements Mapper<BlockEntity, BlockModel> {
  toPersistence(entity: BlockEntity): BlockModel {
    const clone = entity.getProps();
    const record: BlockModel = {
      _id: clone.id.toString(),
      blocker_id: clone.blockerId,
      blocked_id: clone.blockedId,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
    };
    return parse(blockSchema, record);
  }
  toDomain(record: BlockModel): BlockEntity {
    const entity = new BlockEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        blockerId: record.blocker_id,
        blockedId: record.blocked_id
      }
    });
    return entity;
  }
  toResponse() {}
}
