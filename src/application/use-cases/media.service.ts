import { EEncodingVideoStatus, EMediaType } from '@/domain/enums/media.enum';
import { IMediaRepository } from '@/domain/repositories/media/media.repository';

import { mapWithConcurrency } from '@/application/common/utils/concurrency.util';
import {
  GetStaticVideoStreamPayloadDTO,
  GetVideoStatusByNamePayloadDTO,
  UploadMediaPayloadDTO
} from '@/application/dtos/media/media.payload.dto';
import {
  StaticVideoStreamResultDTO,
  UploadMediaResultDTO,
  VideoStatusResultDTO
} from '@/application/dtos/media/media.result.dto';
import { RequestedRangeNotSatisfiableException } from '@/application/errors/media.error';
import { IFileStorage } from '@/application/ports/file-storage.port';
import { IImageProcessor } from '@/application/ports/image-processor.port';
import { IMediaService } from '@/application/ports/media.port';
import { IMimeService } from '@/application/ports/mime.port';
import { IPathService } from '@/application/ports/path.port';
import { IS3Service } from '@/application/ports/s3.port';
import { IVideoHLSQueue } from '@/application/ports/video-hls-job.port';

import { IAppConfig } from '@/bootstrap/types/app.type';

export class MediaService implements IMediaService {
  constructor(
    private readonly mediaRepository: IMediaRepository,
    private readonly s3Service: IS3Service,
    private readonly videoHLSQueue: IVideoHLSQueue,
    private readonly imageProcessor: IImageProcessor,
    private readonly fileStorage: IFileStorage,
    private readonly mimeService: IMimeService,
    private readonly pathService: IPathService,
    private readonly appConfig: IAppConfig
  ) {}

  async getStaticVideoStream({
    filename,
    rangeHeader
  }: GetStaticVideoStreamPayloadDTO): Promise<StaticVideoStreamResultDTO> {
    if (!rangeHeader) {
      throw RequestedRangeNotSatisfiableException;
    }

    const videoPath = this.pathService.resolve('uploads/videos', filename);
    const { size: videoSize } = await this.fileStorage.stat(videoPath);

    const match = /^bytes=(\d+)-(\d*)$/i.exec(rangeHeader);
    if (!match) throw RequestedRangeNotSatisfiableException;

    const start = Number(match[1]);
    const endFromHeader = match[2] ? Number(match[2]) : null;

    if (!Number.isFinite(start) || start < 0 || start >= videoSize) {
      throw RequestedRangeNotSatisfiableException;
    }

    const chunkSize = 10 ** 6;
    const end =
      endFromHeader !== null && Number.isFinite(endFromHeader)
        ? Math.min(endFromHeader, videoSize - 1)
        : Math.min(start + chunkSize - 1, videoSize - 1);

    return new StaticVideoStreamResultDTO({
      videoPath,
      videoSize,
      start,
      end,
      contentLength: end - start + 1,
      contentType: this.mimeService.getType(videoPath)
    });
  }

  async getVideoStatusByName({ name }: GetVideoStatusByNamePayloadDTO): Promise<VideoStatusResultDTO | null> {
    const result = await this.mediaRepository.findVideoStatusByName({ name });
    if (!result) return null;
    return new VideoStatusResultDTO({
      id: result.id,
      name: result.name,
      status: result.status,
      message: result.message ?? '',
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    });
  }

  async uploadImage({ files }: UploadMediaPayloadDTO): Promise<UploadMediaResultDTO[]> {
    return mapWithConcurrency(files, 2, async (file) => {
      const newName = file.filename;
      const outputPath = this.pathService.resolve('uploads/images', `${newName}.jpg`);

      await this.imageProcessor.convertToJpeg(file.filepath, outputPath);

      const result = await this.s3Service.uploadFile({
        filename: `images/${newName}`,
        filepath: outputPath,
        contentType: this.mimeService.getType(outputPath)
      });

      await this.fileStorage.delete(file.filepath);
      await this.fileStorage.delete(outputPath);

      return new UploadMediaResultDTO({
        url: result.url,
        type: EMediaType.IMAGE
      });
    });
  }

  async uploadVideo({ files }: UploadMediaPayloadDTO): Promise<UploadMediaResultDTO[]> {
    return mapWithConcurrency(files, 2, async (file) => {
      const result = await this.s3Service.uploadFile({
        filename: `videos/${file.filename}`,
        filepath: file.filepath,
        contentType: this.mimeService.getType(file.filepath)
      });

      await this.fileStorage.delete(file.filepath);

      return new UploadMediaResultDTO({
        url: result.url,
        type: EMediaType.VIDEO
      });
    });
  }

  async uploadVideoHLS({ files }: UploadMediaPayloadDTO): Promise<UploadMediaResultDTO[]> {
    return mapWithConcurrency(files, 2, async (file) => {
      const idName = file.filename;

      await this.mediaRepository.createVideoStatus({
        name: idName,
        status: EEncodingVideoStatus.PENDING
      });

      void this.videoHLSQueue.add({ filepath: file.filepath, idName }).catch(async (err) => {
        await this.mediaRepository.updateVideoStatus({
          name: idName,
          status: EEncodingVideoStatus.FAILED,
          message: err instanceof Error ? err.message : 'Queue failed'
        });
      });

      return new UploadMediaResultDTO({
        url: `${this.appConfig.client.url}/static/videos-hls/${idName}/master.m3u8`,
        type: EMediaType.VIDEO_HLS
      });
    });
  }
}
