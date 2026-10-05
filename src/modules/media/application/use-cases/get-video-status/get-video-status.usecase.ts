import {
  GetVideoStatusPort,
  type GetVideoStatusInputPort,
  GetVideoStatusOutputPort
} from '@/modules/media/application/use-cases/get-video-status/get-video-status.port';
import type { VideoStatusRepositoryPort } from '@/modules/media/domain/repositories/video-status.repository';

export class GetVideoStatusUseCase extends GetVideoStatusPort {
  constructor(private readonly mediaRepository: VideoStatusRepositoryPort) {
    super();
  }

  async execute(input: GetVideoStatusInputPort): Promise<GetVideoStatusOutputPort | null> {
    const { name } = input;
    const entity = await this.mediaRepository.findVideoStatusByName(name);
    if (!entity) return null;
    return new GetVideoStatusOutputPort(entity.toObject());
  }
}
