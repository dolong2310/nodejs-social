import jwt from 'jsonwebtoken';

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

export interface JwtPort {
  signAsync(payload: string, options?: Omit<JwtSignOptions, keyof jwt.SignOptions>): Promise<string>;
  signAsync(payload: Buffer, options?: JwtSignOptions): Promise<string>;
  signAsync<T extends object>(payload: T, options?: JwtSignOptions): Promise<string>;
  verifyAsync<T extends object>(token: string, options?: JwtVerifyOptions): Promise<T>;
  decode<T>(token: string, options?: jwt.DecodeOptions): T;
}

export class JwtService implements JwtPort {
  constructor(private readonly options: JwtModuleOptions = {}) {}

  signAsync(payload: string, options?: Omit<JwtSignOptions, keyof jwt.SignOptions>): Promise<string>;
  signAsync(payload: Buffer, options?: JwtSignOptions): Promise<string>;
  signAsync<T extends object>(payload: T, options?: JwtSignOptions): Promise<string>;
  signAsync(payload: string | Buffer | object, options?: JwtSignOptions): Promise<string> {
    const signOptions = this.mergeJwtOptions({ ...options }, 'signOptions') as jwt.SignOptions;
    const secret = this.getSecretKey(payload, options!, 'privateKey', JwtSecretRequestType.SIGN);

    const allowedSignOptKeys = ['secret', 'privateKey'];
    const signOptKeys = Object.keys(signOptions);
    if (typeof payload === 'string' && signOptKeys.some((k) => !allowedSignOptKeys.includes(k))) {
      throw new Error('Payload as string is not allowed with the following sign options: ' + signOptKeys.join(', '));
    }

    return new Promise((resolve, reject) =>
      Promise.resolve()
        .then(() => secret)
        .then((scrt: GetSecretKeyResult) => {
          jwt.sign(payload, scrt, signOptions, (err, encoded) => (err ? reject(err) : resolve(encoded!)));
        })
    );
  }

  verifyAsync<T extends object>(token: string, options?: JwtVerifyOptions): Promise<T> {
    const verifyOptions = this.mergeJwtOptions({ ...options }, 'verifyOptions');
    const secret = this.getSecretKey(token, options!, 'publicKey', JwtSecretRequestType.VERIFY);

    return new Promise((resolve, reject) =>
      Promise.resolve()
        .then(() => secret)
        .then((scrt: GetSecretKeyResult) => {
          jwt.verify(token, scrt, verifyOptions as jwt.VerifyOptions, (err, decoded) =>
            err ? reject(err) : resolve(decoded as T)
          );
        })
        .catch(reject)
    );
  }

  decode<T>(token: string, options?: jwt.DecodeOptions): T {
    return jwt.decode(token, options) as T;
  }

  private mergeJwtOptions(
    options: JwtVerifyOptions | JwtSignOptions,
    key: 'verifyOptions' | 'signOptions'
  ): jwt.VerifyOptions | jwt.SignOptions {
    delete options.secret;
    if (key === 'signOptions') {
      delete (options as JwtSignOptions).privateKey;
    } else {
      delete (options as JwtVerifyOptions).publicKey;
    }
    return options ? ({ ...(this.options[key] || {}), ...options } as jwt.VerifyOptions) : this.options[key]!;
  }

  private getSecretKey(
    token: string | object | Buffer,
    options: JwtVerifyOptions | JwtSignOptions,
    key: 'publicKey' | 'privateKey',
    secretRequestType: JwtSecretRequestType
  ): GetSecretKeyResult | Promise<GetSecretKeyResult> {
    const secret = this.options.secretOrKeyProvider
      ? this.options.secretOrKeyProvider(secretRequestType, token, options)
      : options?.secret ||
        this.options.secret ||
        (key === 'privateKey'
          ? (options as JwtSignOptions)?.privateKey || this.options.privateKey
          : (options as JwtVerifyOptions)?.publicKey || this.options.publicKey) ||
        this.options[key];

    return secret instanceof Promise ? secret.then((sec) => sec) : secret!;
  }
}
