import type { BaseEntityProps } from '@/modules/core/domain/entities/base.entity';
import type { Prettify } from 'ts-essentials';

export interface HashtagProps {
  name: string;
}

export interface HashtagFullProps extends Prettify<HashtagProps & Omit<BaseEntityProps, 'id'> & { id: string }> {}

export interface CreateHashtagProps extends HashtagProps {}
