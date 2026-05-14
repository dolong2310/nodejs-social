import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { MongoRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.mongo.repository';
import { VideoStatusEntity } from '@/modules/media/domain/entities/video-status.entity';
import { VideoStatusRepositoryPort } from '@/modules/media/domain/repositories/video-status.repository';
import { UpdateVideoStatusInput } from '@/modules/media/domain/repositories/video-status.repository.type';
import { VideoStatusMapper } from '@/modules/media/infrastructure/persistence/mongo/video-status.mapper';
import { VideoStatusModel } from '@/modules/media/infrastructure/persistence/mongo/video-status.model';
import { Db, MongoClient } from 'mongodb';

export class VideoStatusRepository
  extends MongoRepositoryBase<VideoStatusEntity, VideoStatusModel>
  implements VideoStatusRepositoryPort
{
  protected collectionName = 'video_status';

  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: VideoStatusMapper,
    protected readonly logger: LoggerPort
  ) {
    super(mapper, logger);
  }

  async updateVideoStatus(data: UpdateVideoStatusInput): Promise<boolean> {
    const result = await this.dbCollection.updateOne(
      { name: data.name },
      {
        $set: { status: data.status, message: data.message ?? '' },
        $currentDate: { updated_at: true }
      }
    );
    return result.modifiedCount > 0;
  }

  async findVideoStatusByName(name: string): Promise<VideoStatusEntity | null> {
    const result = await this.dbCollection.findOne({ name });
    return result ? this.mapper.toDomain(result) : null;
  }
}
