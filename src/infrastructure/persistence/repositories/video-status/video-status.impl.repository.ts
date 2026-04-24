import { LoggerPort } from '@/application/ports/logger.port';
import { VideoStatusEntity } from '@/domain/entities/video-status/video-status.entity';
import { VideoStatusRepositoryPort } from '@/domain/repositories/video-status/video-status.repository';
import { IUpdateVideoStatusInput } from '@/domain/repositories/video-status/video-status.repository.type';
import { MongoRepositoryBase } from '@/infrastructure/persistence/repositories/base/base.mongo.repository';
import { VideoStatusMapper } from '@/infrastructure/persistence/repositories/video-status/video-status.mapper';
import { VideoStatusModel } from '@/infrastructure/persistence/repositories/video-status/video-status.model';
import { Db, MongoClient } from 'mongodb';

export class VideoStatusRepository
  extends MongoRepositoryBase<VideoStatusEntity, VideoStatusModel>
  implements VideoStatusRepositoryPort
{
  protected collectionName = 'videoStatus';

  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: VideoStatusMapper,
    protected readonly logger: LoggerPort
  ) {
    super(mapper, logger);
  }

  async updateVideoStatus(data: IUpdateVideoStatusInput): Promise<boolean> {
    const result = await this.dbCollection.updateOne(
      { name: data.name },
      {
        $set: { status: data.status, message: data.message ?? '' },
        $currentDate: { updatedAt: true }
      }
    );
    return result.modifiedCount > 0;
  }

  async findVideoStatusByName(name: string): Promise<VideoStatusEntity | null> {
    const result = await this.dbCollection.findOne({ name });
    return result ? this.mapper.toDomain(result) : null;
  }
}
