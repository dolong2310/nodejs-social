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

/**
 * Issues and verifies auth tokens. The token format (JWT today) is an infrastructure detail.
 * `verify*` rejects with ExpiredTokenException when the token has expired and InvalidTokenException
 * for any other invalid token, so callers never depend on the token library's errors.
 */
export interface TokenServicePort {
  signAccessToken(payload: AccessTokenPayloadCreate): Promise<string>;
  signRefreshToken(payload: RefreshTokenPayloadCreate): Promise<string>;
  verifyAccessToken(token: string): Promise<AccessTokenPayload>;
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
}
