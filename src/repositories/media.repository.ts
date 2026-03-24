/*
 * Media Repository
 * This file contains the MediaRepository class which implements IMediaRepository interface.
 * It provides methods to interact with the media data in the database.
 */

import { EEncodingVideoStatus } from '@/enums/media.enum';
import VideoStatusSchema, { IVideoStatus } from '@/models/videoStatus.schema';
import { BaseRepository } from '@/repositories/base.repository';
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

export class MediaRepository extends BaseRepository implements IMediaRepository {
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
