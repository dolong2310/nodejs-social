import { Entity } from '@/domain/entities/base/base.entity';
import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { CreateVideoStatusProps, VideoStatusProps } from '@/domain/entities/video-status/video-status.type';

export class VideoStatusEntity extends Entity<VideoStatusProps> {
  static create(createProps: CreateVideoStatusProps) {
    const id = new UniqueEntityID();
    const props: VideoStatusProps = { ...createProps };
    const videoStatus = new VideoStatusEntity({ id, props });
    return videoStatus;
  }

  validate(): void {
    throw new Error('Method not implemented.');
  }
}
