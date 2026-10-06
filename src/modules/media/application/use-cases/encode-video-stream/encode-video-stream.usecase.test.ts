import type { FileStoragePort } from '@/modules/media/application/ports/file-storage.port';
import type { ObjectStoragePort } from '@/modules/media/application/ports/object-storage.port';
import type { VideoStreamEncoderPort } from '@/modules/media/application/ports/video-stream-encoder.port';
import { EncodeVideoStreamInputPort } from '@/modules/media/application/use-cases/encode-video-stream/encode-video-stream.port';
import { EncodeVideoStreamUseCase } from '@/modules/media/application/use-cases/encode-video-stream/encode-video-stream.usecase';
import { EnumEncodingVideoStatus } from '@/modules/media/domain/entities/video-status.types';
import type { VideoStatusRepositoryPort } from '@/modules/media/domain/repositories/video-status.repository';
import { mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

describe('EncodeVideoStreamUseCase', () => {
  it('encodes the video, uploads every HLS file, cleans up and marks the video as succeeded', async () => {
    const mediaRepository = mockPort<VideoStatusRepositoryPort>({
      updateVideoStatus: vi.fn().mockResolvedValue(undefined)
    });
    const videoStreamEncoder = mockPort<VideoStreamEncoderPort>({
      encode: vi.fn().mockResolvedValue(undefined),
      listEncodedFiles: vi.fn().mockResolvedValue({
        outputDir: '/uploads/videos/vid1',
        files: [
          { filepath: '/uploads/videos/vid1/master.m3u8', key: 'vid1/master.m3u8' },
          { filepath: '/uploads/videos/vid1/v0/fileSequence0.ts', key: 'vid1/v0/fileSequence0.ts' }
        ]
      })
    });
    const s3Service = mockPort<ObjectStoragePort>({
      uploadFile: vi.fn().mockResolvedValue({ url: 'https://cdn/x' })
    });
    const fileStorage = mockPort<FileStoragePort>({
      delete: vi.fn().mockResolvedValue(undefined),
      deleteDirectory: vi.fn().mockResolvedValue(undefined),
      getMimeType: vi.fn().mockReturnValue('video/mp2t')
    });
    const useCase = new EncodeVideoStreamUseCase(mediaRepository, videoStreamEncoder, s3Service, fileStorage);

    const result = await useCase.execute(
      new EncodeVideoStreamInputPort({ filepath: '/uploads/videos/vid1/vid1.mp4', idName: 'vid1' })
    );

    expect(mediaRepository.updateVideoStatus).toHaveBeenNthCalledWith(1, {
      name: 'vid1',
      status: EnumEncodingVideoStatus.PROCESSING
    });
    expect(videoStreamEncoder.encode).toHaveBeenCalledWith('/uploads/videos/vid1/vid1.mp4');
    expect(fileStorage.delete).toHaveBeenCalledWith('/uploads/videos/vid1/vid1.mp4');
    expect(s3Service.uploadFile).toHaveBeenCalledWith({
      filename: 'videos-stream/vid1/master.m3u8',
      filepath: '/uploads/videos/vid1/master.m3u8',
      contentType: 'video/mp2t'
    });
    expect(s3Service.uploadFile).toHaveBeenCalledWith(
      expect.objectContaining({ filename: 'videos-stream/vid1/v0/fileSequence0.ts' })
    );
    expect(fileStorage.deleteDirectory).toHaveBeenCalledWith('/uploads/videos/vid1');
    expect(mediaRepository.updateVideoStatus).toHaveBeenLastCalledWith({
      name: 'vid1',
      status: EnumEncodingVideoStatus.SUCCESS
    });
    expect(result.idName).toBe('vid1');
  });
});
