import { TokenType } from '@/enums/token.enum';

// Access Token
export interface AccessTokenPayloadCreate {
  userId: string;
  type: TokenType;
}

export interface AccessTokenPayload extends AccessTokenPayloadCreate {
  exp: number;
  iat: number;
}

// Refresh Token
export interface RefreshTokenPayloadCreate {
  userId: string;
  type: TokenType;
}

export interface RefreshTokenPayload extends RefreshTokenPayloadCreate {
  exp: number;
  iat: number;
}

// Email Verification Token
export interface EmailVerificationTokenPayloadCreate {
  userId: string;
  type: TokenType;
}

export interface EmailVerificationTokenPayload extends EmailVerificationTokenPayloadCreate {
  exp: number;
  iat: number;
}

// Forgot Password Token
export interface ForgotPasswordTokenPayloadCreate {
  userId: string;
  type: TokenType;
}

export interface ForgotPasswordTokenPayload extends ForgotPasswordTokenPayloadCreate {
  exp: number;
  iat: number;
}
