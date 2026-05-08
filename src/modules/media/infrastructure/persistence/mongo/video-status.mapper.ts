import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { VideoStatusEntity } from '@/modules/media/domain/entities/video-status.entity';
import { VideoStatusFullProps } from '@/modules/media/domain/entities/video-status.type';
import {
  VideoStatusModel,
  videoStatusSchema
} from '@/modules/media/infrastructure/persistence/mongo/video-status.model';
import { parse } from 'valibot';

export class VideoStatusMapper implements Mapper<VideoStatusEntity, VideoStatusModel, VideoStatusFullProps> {
  toPersistence(entity: VideoStatusEntity): VideoStatusModel {
    const clone = entity.getProps();
    const record: VideoStatusModel = {
      _id: clone.id.toString(),
      name: clone.name,
      status: clone.status,
      message: clone.message,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
    };
    return parse(videoStatusSchema, record);
  }
  toDomain(record: VideoStatusModel): VideoStatusEntity {
    const entity = new VideoStatusEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        name: record.name,
        status: record.status,
        message: record.message
      }
    });
    return entity;
  }
  toResponse(record: VideoStatusModel): VideoStatusFullProps {
    return {
      id: record._id,
      name: record.name,
      status: record.status,
      message: record.message,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }
}
