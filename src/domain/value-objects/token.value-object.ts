import { ETokenType } from '@/domain/enums/token.enum';

export interface TokenPayloadCreate {
  userId: string;
  type: ETokenType;
}

export class TokenPayload implements TokenPayloadCreate {
  private _userId: string;
  private _type: ETokenType;
  private _exp: number;
  private _iat: number;
  get userId(): string {
    return this._userId;
  }
  get type(): ETokenType {
    return this._type;
  }
  get exp(): number {
    return this._exp;
  }
  get iat(): number {
    return this._iat;
  }
  private constructor(userId: string, type: ETokenType, exp: number, iat: number) {
    this._userId = userId;
    this._type = type;
    this._exp = exp;
    this._iat = iat;
  }
  static create({
    userId,
    type,
    exp,
    iat
  }: {
    userId: string;
    type: ETokenType;
    exp: number;
    iat: number;
  }): TokenPayload {
    return new TokenPayload(userId, type, exp, iat);
  }
}
