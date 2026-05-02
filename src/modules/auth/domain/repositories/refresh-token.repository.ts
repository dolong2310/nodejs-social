import { RefreshTokenEntity } from '@/modules/auth/domain/entities/refresh-token.entity';
import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import {
  ICreateRefreshTokenInput,
  IRotateRefreshTokenInput
} from '@/modules/auth/domain/repositories/refresh-token.repository.type';

export interface RefreshTokenRepositoryPort extends RepositoryPort<RefreshTokenEntity> {
  findRefreshToken(token: string): Promise<RefreshTokenEntity | null>;
  createRefreshToken(data: ICreateRefreshTokenInput): Promise<RefreshTokenEntity>;
  deleteRefreshToken(token: string): Promise<boolean>;
  rotateRefreshToken(data: IRotateRefreshTokenInput): Promise<boolean>;
}
