import { IVideoStatus } from '@/domain/entities/video-status.entity';

export interface ICreateVideoStatusInput extends Pick<IVideoStatus, 'name' | 'status'> {}

export interface IUpdateVideoStatusInput extends Pick<IVideoStatus, 'name' | 'status' | 'message'> {}

export interface IFindVideoStatusByNameInput extends Pick<IVideoStatus, 'name'> {}
