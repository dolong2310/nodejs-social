export interface RefreshTokenProps {
  userId: string;
  token: string;
  expiresAt: Date;
}

export interface CreateRefreshTokenProps extends RefreshTokenProps {}
