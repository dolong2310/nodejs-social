import {
  GetVideoStatusInPort,
  GetVideoStatusQuery,
  GetVideoStatusResult
} from '@/application/use-cases/media/get-video-status/get-video-status.in-port';
import { VideoStatusRepositoryPort } from '@/domain/repositories/video-status/video-status.repository';

export class GetVideoStatusInteractor extends GetVideoStatusInPort {
  constructor(private readonly mediaRepository: VideoStatusRepositoryPort) {
    super();
  }

  async execute({ name }: GetVideoStatusQuery): Promise<GetVideoStatusResult | null> {
    const entity = await this.mediaRepository.findVideoStatusByName(name);
    if (!entity) return null;
    return new GetVideoStatusResult(entity.toObject());
  }
}
