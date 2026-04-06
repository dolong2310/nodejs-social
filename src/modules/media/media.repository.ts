import { Injectable } from '@/decorators/injectable.decorator';
import { BaseRepository } from '@/modules/base/base.repository';
import { EEncodingVideoStatus } from '@/modules/media/media.enum';
import { DatabaseService } from '@/providers/database/mongodb/database.service';
import { IVideoStatus, VideoStatusSchema } from '@/modules/media/videoStatus.schema';

export interface IMediaRepository {
  createVideoStatus(payload: { name: string; status: EEncodingVideoStatus }): Promise<IVideoStatus>;
  updateVideoStatus(payload: { name: string; status: EEncodingVideoStatus; message?: string }): Promise<boolean>;
  findVideoStatusByName(name: string): Promise<IVideoStatus | null>;
}

@Injectable()
export class MediaRepository extends BaseRepository implements IMediaRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async createVideoStatus({ name, status }: { name: string; status: EEncodingVideoStatus }): Promise<IVideoStatus> {
    const videoStatus = new VideoStatusSchema({ name, status });
    await this.db.videoStatuses.insertOne(videoStatus);
    return videoStatus;
  }

  async updateVideoStatus({
    name,
    status,
    message
  }: {
    name: string;
    status: EEncodingVideoStatus;
    message?: string;
  }): Promise<boolean> {
    const result = await this.db.videoStatuses.updateOne(
      { name },
      {
        $set: { status, message: message ?? '' },
        $currentDate: { updatedAt: true }
      }
    );
    return result.modifiedCount > 0;
  }

  findVideoStatusByName(name: string): Promise<IVideoStatus | null> {
    return this.db.videoStatuses.findOne({ name });
  }
}
