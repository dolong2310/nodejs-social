import { IVideoStatus } from '@/domain/entities/video-status.entity';
import {
  ICreateVideoStatusInput,
  IFindVideoStatusByNameInput,
  IUpdateVideoStatusInput
} from '@/domain/repositories/media/media.interface';

export interface IMediaRepository {
  createVideoStatus(data: ICreateVideoStatusInput): Promise<IVideoStatus>;
  updateVideoStatus(data: IUpdateVideoStatusInput): Promise<boolean>;
  findVideoStatusByName(data: IFindVideoStatusByNameInput): Promise<IVideoStatus | null>;
}
