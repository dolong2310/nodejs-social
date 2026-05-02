import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { VideoStatusEntity } from '@/modules/media/domain/entities/video-status.entity';
import {
  VideoStatusModel,
  videoStatusSchema
} from '@/modules/media/infrastructure/mongo/video-status.model';
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
