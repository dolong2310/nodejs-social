import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import { VideoStatusEntity } from '@/modules/media/domain/entities/video-status.entity';
import { UpdateVideoStatusInput } from '@/modules/media/domain/repositories/video-status.repository.type';

export interface VideoStatusRepositoryPort extends RepositoryPort<VideoStatusEntity> {
  updateVideoStatus(data: UpdateVideoStatusInput): Promise<boolean>;
  findVideoStatusByName(name: string): Promise<VideoStatusEntity | null>;
}
