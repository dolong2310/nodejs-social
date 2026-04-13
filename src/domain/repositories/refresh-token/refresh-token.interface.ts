import { RefreshTokenEntity } from '@/domain/entities/refresh-token.entity';

export interface IFindRefreshTokenInput extends Pick<RefreshTokenEntity, 'token'> {}

export interface ICreateRefreshTokenInput extends Pick<RefreshTokenEntity, 'token' | 'userId'> {}

export interface IDeleteRefreshTokenInput extends Pick<RefreshTokenEntity, 'token'> {}

export interface IRotateRefreshTokenInput extends Pick<RefreshTokenEntity, 'userId'> {
  oldToken: string;
  newToken: string;
}
