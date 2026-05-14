import { BaseEntityProps } from '@/modules/core/domain/entities/base.entity';
import { Prettify } from 'ts-essentials';

export interface VideoStatusProps {
  name: string;
  status: EnumEncodingVideoStatus;
  message?: string;
}

export interface VideoStatusFullProps extends Prettify<
  VideoStatusProps & Omit<BaseEntityProps, 'id'> & { id: string }
> {}

export interface CreateVideoStatusProps extends VideoStatusProps {}

export enum EnumEncodingVideoStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed'
}
