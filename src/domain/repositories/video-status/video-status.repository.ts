import { VideoStatusEntity } from '@/domain/entities/video-status/video-status.entity';
import { RepositoryPort } from '@/domain/repositories/base/port.repository';
import { IUpdateVideoStatusInput } from '@/domain/repositories/video-status/video-status.repository.type';

export interface VideoStatusRepositoryPort extends RepositoryPort<VideoStatusEntity> {
  updateVideoStatus(data: IUpdateVideoStatusInput): Promise<boolean>;
  findVideoStatusByName(name: string): Promise<VideoStatusEntity | null>;
}
