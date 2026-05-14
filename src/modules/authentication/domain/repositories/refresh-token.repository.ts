import { RefreshTokenEntity } from '@/modules/authentication/domain/entities/refresh-token.entity';
import {
  CreateRefreshTokenInput,
  RotateRefreshTokenInput
} from '@/modules/authentication/domain/repositories/refresh-token.repository.type';
import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';

export interface RefreshTokenRepositoryPort extends RepositoryPort<RefreshTokenEntity> {
  findRefreshToken(token: string): Promise<RefreshTokenEntity | null>;
  createRefreshToken(data: CreateRefreshTokenInput): Promise<RefreshTokenEntity>;
  deleteRefreshToken(token: string): Promise<boolean>;
  deleteExpiredRefreshTokens(now: Date): Promise<number>;
  rotateRefreshToken(data: RotateRefreshTokenInput): Promise<boolean>;
}
