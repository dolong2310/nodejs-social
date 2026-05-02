import { BaseEntityProps } from '@/modules/core/domain/entities/base.entity';
import { Prettify } from 'ts-essentials';

export interface BlockProps {
  blockerId: string;
  blockedId: string;
}

export interface BlockFullProps extends Prettify<BlockProps & Omit<BaseEntityProps, 'id'> & { id: string }> {}

export interface CreateBlockProps extends BlockProps {}
