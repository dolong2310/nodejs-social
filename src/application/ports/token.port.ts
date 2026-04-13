import { TokenPayload, TokenPayloadCreate } from '@/domain/value-objects/token.value-object';

export interface ITokenService {
  signAccessToken(input: TokenPayloadCreate): Promise<string>;
  signRefreshToken(input: TokenPayloadCreate & { exp?: number }): Promise<string>;
  signEmailVerificationToken(input: TokenPayloadCreate): Promise<string>;
  signForgotPasswordToken(input: TokenPayloadCreate): Promise<string>;

  verifyAccessToken(token: string): Promise<TokenPayload>;
  verifyRefreshToken(token: string): Promise<TokenPayload>;
  verifyEmailVerificationToken(token: string): Promise<TokenPayload>;
  verifyForgotPasswordToken(token: string): Promise<TokenPayload>;

  signAccessTokenSync(input: TokenPayloadCreate): string;
  signRefreshTokenSync(input: TokenPayloadCreate & { exp?: number }): string;
  signEmailVerificationTokenSync(input: TokenPayloadCreate): string;
  signForgotPasswordTokenSync(input: TokenPayloadCreate): string;

  verifyAccessTokenSync(token: string): TokenPayload;
  verifyRefreshTokenSync(token: string): TokenPayload;
  verifyEmailVerificationTokenSync(token: string): TokenPayload;
  verifyForgotPasswordTokenSync(token: string): TokenPayload;
}
