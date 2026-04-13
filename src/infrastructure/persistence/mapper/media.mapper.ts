import { VideoStatusEntity } from '@/domain/entities/video-status.entity';
import { EEncodingVideoStatus } from '@/domain/enums/media.enum';

import { IVideoStatusModel } from '@/infrastructure/persistence/mongodb/models/video-status.model';

import { ObjectId } from 'mongodb';

export class VideoStatusMapper {
  toPersistence(entity: Partial<VideoStatusEntity>): IVideoStatusModel {
    const clone = entity;
    const record: IVideoStatusModel = {
      _id: new ObjectId(clone.id),
      name: clone.name ?? '',
      status: clone.status ?? EEncodingVideoStatus.PENDING,
      message: clone.message ?? '',
      createdAt: clone.createdAt ? new Date(clone.createdAt) : new Date(),
      updatedAt: clone.updatedAt ? new Date(clone.updatedAt) : new Date()
    };
    return record;
  }
  toDomain(record: IVideoStatusModel): VideoStatusEntity {
    return VideoStatusEntity.create({
      id: record._id?.toString() ?? '',
      name: record.name ?? '',
      status: record.status ?? EEncodingVideoStatus.PENDING,
      message: record.message ?? '',
      createdAt: record.createdAt ?? new Date(),
      updatedAt: record.updatedAt ?? new Date()
    });
  }
  toResponse() {}
}
