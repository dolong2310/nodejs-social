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
      created_by_id: clone.createdById ?? null,
      updated_at: clone.updatedAt,
      updated_by_id: clone.updatedById ?? null,
      deleted_at: clone.deletedAt ?? null,
      deleted_by_id: clone.deletedById ?? null
    };
    return parse(videoStatusSchema, record);
  }
  toDomain(record: VideoStatusModel): VideoStatusEntity {
    const entity = new VideoStatusEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.created_at,
      createdById: record.created_by_id ?? null,
      updatedAt: record.updated_at,
      updatedById: record.updated_by_id ?? null,
      deletedAt: record.deleted_at ?? null,
      deletedById: record.deleted_by_id ?? null,
      props: {
        name: record.name,
        status: record.status,
        message: record.message
      }
    });
    return entity;
  }
  toResponse(record: VideoStatusModel): VideoStatusFullProps {
    const response = {
      id: record._id,
      name: record.name,
      status: record.status,
      message: record.message,
      createdAt: record.created_at,
      createdById: record.created_by_id ?? null,
      updatedAt: record.updated_at,
      updatedById: record.updated_by_id ?? null,
      deletedAt: record.deleted_at ?? null,
      deletedById: record.deleted_by_id ?? null
    };
    return response;
  }
}
