import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { VideoStatusEntity } from '@/domain/entities/video-status/video-status.entity';
import { Mapper } from '@/infrastructure/persistence/repositories/base/base.mapper';
import {
  VideoStatusModel,
  videoStatusSchema
} from '@/infrastructure/persistence/repositories/video-status/video-status.model';
import { parse } from 'valibot';

export class VideoStatusMapper implements Mapper<VideoStatusEntity, VideoStatusModel> {
  toPersistence(entity: VideoStatusEntity): VideoStatusModel {
    const clone = entity.getProps();
    const record: VideoStatusModel = {
      _id: clone.id.toString(),
      name: clone.name,
      status: clone.status,
      message: clone.message,
      createdAt: clone.createdAt,
      updatedAt: clone.updatedAt
    };
    return parse(videoStatusSchema, record);
  }
  toDomain(record: VideoStatusModel): VideoStatusEntity {
    const entity = new VideoStatusEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      props: {
        name: record.name,
        status: record.status,
        message: record.message
      }
    });
    return entity;
  }
  toResponse() {}
}
