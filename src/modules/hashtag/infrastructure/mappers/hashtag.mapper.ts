import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { HashtagEntity } from '@/modules/hashtag/domain/entities/hashtag.entity';
import { HashtagModel, hashtagSchema } from '@/modules/hashtag/infrastructure/mongo/hashtag.model';
import { parse } from 'valibot';

export class HashtagMapper implements Mapper<HashtagEntity, HashtagModel> {
  toPersistence(entity: HashtagEntity): HashtagModel {
    const clone = entity.getProps();
    const record: HashtagModel = {
      _id: clone.id.toString(),
      name: clone.name,
      createdAt: clone.createdAt,
      updatedAt: clone.updatedAt
    };
    return parse(hashtagSchema, record);
  }
  toDomain(record: HashtagModel): HashtagEntity {
    const entity = new HashtagEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      props: {
        name: record.name
      }
    });
    return entity;
  }
  toResponse() {}
}
