import {
  CreateRefreshTokenProps,
  RefreshTokenProps
} from '@/modules/authentication/domain/entities/refresh-token.type';

export interface CreateRefreshTokenInput extends CreateRefreshTokenProps {}

export interface RotateRefreshTokenInput extends Pick<RefreshTokenProps, 'userId' | 'expiresAt'> {
  oldToken: string;
  newToken: string;
}
