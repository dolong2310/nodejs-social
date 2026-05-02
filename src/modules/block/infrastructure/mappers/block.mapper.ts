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
      blockerId: clone.blockerId,
      blockedId: clone.blockedId,
      createdAt: clone.createdAt,
      updatedAt: clone.updatedAt
    };
    return parse(blockSchema, record);
  }
  toDomain(record: BlockModel): BlockEntity {
    const entity = new BlockEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      props: {
        blockerId: record.blockerId,
        blockedId: record.blockedId
      }
    });
    return entity;
  }
  toResponse() {}
}
