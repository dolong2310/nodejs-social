import { CreateRefreshTokenProps, RefreshTokenProps } from '@/domain/entities/refresh-token/refresh-token.type';

export interface ICreateRefreshTokenInput extends CreateRefreshTokenProps {}

export interface IRotateRefreshTokenInput extends Pick<RefreshTokenProps, 'userId'> {
  oldToken: string;
  newToken: string;
}
