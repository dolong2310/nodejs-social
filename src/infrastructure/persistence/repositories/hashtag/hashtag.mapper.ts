import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { HashtagEntity } from '@/domain/entities/hashtag/hashtag.entity';
import { Mapper } from '@/infrastructure/persistence/repositories/base/base.mapper';
import { HashtagModel, hashtagSchema } from '@/infrastructure/persistence/repositories/hashtag/hashtag.model';
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
