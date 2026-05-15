import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { HashtagEntity } from '@/modules/post/domain/entities/hashtag.entity';
import { HashtagFullProps } from '@/modules/post/domain/entities/hashtag.type';
import { HashtagModel, hashtagSchema } from '@/modules/post/infrastructure/persistence/mongo/hashtag.model';
import { parse } from 'valibot';

export class HashtagMapper implements Mapper<HashtagEntity, HashtagModel, HashtagFullProps> {
  toPersistence(entity: HashtagEntity): HashtagModel {
    const clone = entity.getProps();
    const record: HashtagModel = {
      _id: clone.id.toString(),
      name: clone.name,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
    };
    return parse(hashtagSchema, record);
  }
  toDomain(record: HashtagModel): HashtagEntity {
    const entity = new HashtagEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        name: record.name
      }
    });
    return entity;
  }
  toResponse(record: HashtagModel): HashtagFullProps {
    const response = {
      id: record._id,
      name: record.name,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
    return response;
  }
}
