import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { HashtagEntity } from '@/modules/post/domain/entities/hashtag.entity';
import { HashtagFullProps } from '@/modules/post/domain/entities/hashtag.type';
import { HashtagModel, hashtagSchema } from '@/modules/post/infrastructure/persistence/postgres/hashtag.model';
import { parse } from 'valibot';

export class HashtagMapper implements Mapper<HashtagEntity, HashtagModel, HashtagFullProps> {
  toPersistence(entity: HashtagEntity): HashtagModel {
    const clone = entity.getProps();
    const record: HashtagModel = {
      id: clone.id.toString(),
      name: clone.name,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
    };
    return parse(hashtagSchema, record);
  }
  toDomain(record: HashtagModel): HashtagEntity {
    return new HashtagEntity({
      id: new UniqueEntityID(record.id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        name: record.name
      }
    });
  }
  toResponse(record: HashtagModel): HashtagFullProps {
    return {
      id: record.id,
      name: record.name,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }
}
