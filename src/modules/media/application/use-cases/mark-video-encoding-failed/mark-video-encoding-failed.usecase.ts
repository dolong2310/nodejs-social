import {
  type MarkVideoEncodingFailedInputPort,
  MarkVideoEncodingFailedPort
} from '@/modules/media/application/use-cases/mark-video-encoding-failed/mark-video-encoding-failed.port';
import { EnumEncodingVideoStatus } from '@/modules/media/domain/entities/video-status.types';
import type { VideoStatusRepositoryPort } from '@/modules/media/domain/repositories/video-status.repository';

export class MarkVideoEncodingFailedUseCase extends MarkVideoEncodingFailedPort {
  constructor(private readonly mediaRepository: VideoStatusRepositoryPort) {
    super();
  }

  async execute(input: MarkVideoEncodingFailedInputPort): Promise<void> {
    await this.mediaRepository.updateVideoStatus({
      name: input.idName,
      status: EnumEncodingVideoStatus.FAILED,
      message: input.message
    });
  }
}
