import { type Algorithm, type Secret } from 'jsonwebtoken';
import type { StringValue } from 'ms';

// Access Token
export interface AccessTokenPayloadCreate {
  userId: string;
  roleId: string;
  roleName: string;
}

export interface AccessTokenPayload extends AccessTokenPayloadCreate {
  exp: number;
  iat: number;
}

// Refresh Token
export interface RefreshTokenPayloadCreate {
  userId: string;
}

export interface RefreshTokenPayload extends RefreshTokenPayloadCreate {
  exp: number;
  iat: number;
}

export interface TokenServicePort {
  signAccessToken(payload: AccessTokenPayloadCreate): Promise<string>;
  signRefreshToken(payload: RefreshTokenPayloadCreate): Promise<string>;
  verifyAccessToken(token: string): Promise<AccessTokenPayload>;
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
}

export type TokenServiceConfig = {
  algorithm: Algorithm;
  accessTokenSecret: Secret;
  refreshTokenSecret: Secret;
  accessTokenExpiresIn: StringValue;
  refreshTokenExpiresIn: StringValue;
};
