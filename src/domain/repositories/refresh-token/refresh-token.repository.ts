import { RefreshTokenEntity } from '@/domain/entities/refresh-token/refresh-token.entity';
import { RepositoryPort } from '@/domain/repositories/base/port.repository';
import {
  ICreateRefreshTokenInput,
  IRotateRefreshTokenInput
} from '@/domain/repositories/refresh-token/refresh-token.repository.type';

export interface RefreshTokenRepositoryPort extends RepositoryPort<RefreshTokenEntity> {
  findRefreshToken(token: string): Promise<RefreshTokenEntity | null>;
  createRefreshToken(data: ICreateRefreshTokenInput): Promise<RefreshTokenEntity>;
  deleteRefreshToken(token: string): Promise<boolean>;
  rotateRefreshToken(data: IRotateRefreshTokenInput): Promise<boolean>;
}
