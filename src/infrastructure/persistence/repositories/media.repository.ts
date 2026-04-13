import { IVideoStatus, VideoStatusEntity } from '@/domain/entities/video-status.entity';
import { EEncodingVideoStatus } from '@/domain/enums/media.enum';
import { IFindVideoStatusByNameInput, IUpdateVideoStatusInput } from '@/domain/repositories/media/media.interface';
import { IMediaRepository } from '@/domain/repositories/media/media.repository';

import { VideoStatusMapper } from '@/infrastructure/persistence/mapper/media.mapper';
import { DatabaseService } from '@/infrastructure/persistence/mongodb/database.service';
import { BaseRepository } from '@/infrastructure/persistence/repositories/base.repository';

export class MediaRepository extends BaseRepository implements IMediaRepository {
  constructor(
    db: DatabaseService,
    private readonly mapper: VideoStatusMapper
  ) {
    super(db);
  }

  async createVideoStatus({ name, status }: { name: string; status: EEncodingVideoStatus }): Promise<IVideoStatus> {
    const videoStatus = VideoStatusEntity.create({ id: '123', name, status });
    await this.db.videoStatuses.insertOne(this.mapper.toPersistence(videoStatus));
    return videoStatus;
  }

  async updateVideoStatus(data: IUpdateVideoStatusInput): Promise<boolean> {
    const record = this.mapper.toPersistence(data);
    const result = await this.db.videoStatuses.updateOne(
      { name: record.name },
      {
        $set: { status: record.status, message: record.message ?? '' },
        $currentDate: { updatedAt: true }
      }
    );
    return result.modifiedCount > 0;
  }

  async findVideoStatusByName(data: IFindVideoStatusByNameInput): Promise<IVideoStatus | null> {
    const record = this.mapper.toPersistence(data);
    const result = await this.db.videoStatuses.findOne({ name: record.name });
    return result ? this.mapper.toDomain(result) : null;
  }
}
