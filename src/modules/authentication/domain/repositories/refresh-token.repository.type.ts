import {
  CreateRefreshTokenProps,
  RefreshTokenProps
} from '@/modules/authentication/domain/entities/refresh-token.type';

export interface ICreateRefreshTokenInput extends CreateRefreshTokenProps {}

export interface IRotateRefreshTokenInput extends Pick<RefreshTokenProps, 'userId' | 'expiresAt'> {
  oldToken: string;
  newToken: string;
}
