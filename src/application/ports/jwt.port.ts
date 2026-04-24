import * as jwt from 'jsonwebtoken';

export enum JwtSecretRequestType {
  SIGN,
  VERIFY
}

export interface JwtModuleOptions {
  global?: boolean;
  signOptions?: jwt.SignOptions;
  secret?: jwt.Secret;
  publicKey?: jwt.Secret;
  privateKey?: jwt.Secret;
  secretOrKeyProvider?: (
    requestType: JwtSecretRequestType,
    tokenOrPayload: string | object | Buffer,
    options?: jwt.VerifyOptions | jwt.SignOptions
  ) => jwt.Secret | Promise<jwt.Secret>;
  verifyOptions?: jwt.VerifyOptions;
}

export interface JwtSignOptions extends jwt.SignOptions {
  secret?: jwt.Secret;
  privateKey?: jwt.Secret;
}

export interface JwtVerifyOptions extends jwt.VerifyOptions {
  secret?: jwt.Secret;
  publicKey?: jwt.Secret;
}

export type GetSecretKeyResult = string | Buffer | jwt.Secret;

export interface IJwtService {
  signAsync(payload: string, options?: Omit<JwtSignOptions, keyof jwt.SignOptions>): Promise<string>;
  signAsync(payload: Buffer, options?: JwtSignOptions): Promise<string>;
  signAsync<T extends object>(payload: T, options?: JwtSignOptions): Promise<string>;
  verifyAsync<T extends object>(token: string, options?: JwtVerifyOptions): Promise<T>;
  decode<T>(token: string, options?: jwt.DecodeOptions): T;
}
