import { BaseEntityProps } from '@/modules/core/domain/entities/base.entity';
import { Prettify } from 'ts-essentials';

export interface RefreshTokenProps {
  userId: string;
  token: string;
  expiresAt: Date;
}

export interface RefreshTokenFullProps extends Prettify<
  RefreshTokenProps & Omit<BaseEntityProps, 'id'> & { id: string }
> {}

export interface CreateRefreshTokenProps extends RefreshTokenProps {}
