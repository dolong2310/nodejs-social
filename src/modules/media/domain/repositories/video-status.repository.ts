import type { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import type { VideoStatusEntity } from '@/modules/media/domain/entities/video-status.entity';
import type { UpdateVideoStatusInput } from '@/modules/media/domain/repositories/video-status.repository.types';

export interface VideoStatusRepositoryPort extends RepositoryPort<VideoStatusEntity> {
  updateVideoStatus(data: UpdateVideoStatusInput): Promise<boolean>;
  findVideoStatusByName(name: string): Promise<VideoStatusEntity | null>;
}
