import { Entity } from '@/modules/core/domain/entities/base.entity';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { ArgumentInvalidException, ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import {
  CreateVideoStatusProps,
  EnumEncodingVideoStatus,
  VideoStatusProps
} from '@/modules/media/domain/entities/video-status.type';

export class VideoStatusEntity extends Entity<VideoStatusProps> {
  static create(createProps: CreateVideoStatusProps) {
    const id = new UniqueEntityID(generatePrefixId('video_status'));
    const props: VideoStatusProps = { ...createProps };
    const videoStatus = new VideoStatusEntity({ id, props });
    return videoStatus;
  }

  validate(): void {
    const { name, status } = this.getProps();
    invariant(name.trim().length > 0, new ArgumentNotProvidedException('Video name is required'));
    invariant(
      Object.values(EnumEncodingVideoStatus).includes(status),
      new ArgumentInvalidException('Invalid video encoding status')
    );
  }
}
