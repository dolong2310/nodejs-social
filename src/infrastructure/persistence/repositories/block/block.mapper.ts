import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { BlockEntity } from '@/domain/entities/block/block.entity';
import { Mapper } from '@/infrastructure/persistence/repositories/base/base.mapper';
import { BlockModel, blockSchema } from '@/infrastructure/persistence/repositories/block/block.model';
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
