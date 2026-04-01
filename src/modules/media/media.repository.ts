/*
 * Media Repository
 * This file contains the MediaRepository class which implements IMediaRepository interface.
 * It provides methods to interact with the media data in the database.
 */

import { Injectable } from '@/decorators/injectable.decorator';
import { BaseRepository } from '@/modules/base/base.repository';
import { EEncodingVideoStatus } from '@/modules/media/media.enum';
import { DatabaseService } from '@/providers/database/mongodb/database.service';
import { IVideoStatus, VideoStatusSchema } from '@/shared/models/videoStatus.schema';
import { UpdateResult } from 'mongodb';

export interface IMediaRepository {
  createVideoStatus(payload: { name: string; status: EEncodingVideoStatus }): Promise<IVideoStatus>;
  updateVideoStatus(payload: {
    name: string;
    status: EEncodingVideoStatus;
    message?: string;
  }): Promise<UpdateResult<IVideoStatus>>;
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
  }): Promise<UpdateResult<IVideoStatus>> {
    const result = await this.db.videoStatuses.updateOne(
      { name },
      {
        $set: { status, message },
        $currentDate: { updatedAt: true }
      }
    );
    return result;
  }

  findVideoStatusByName(name: string): Promise<IVideoStatus | null> {
    return this.db.videoStatuses.findOne({ name });
  }
}
