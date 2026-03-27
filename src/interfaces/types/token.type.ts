import { ETokenType } from '@/interfaces';

export interface TokenPayloadCreate {
  userId: string;
  type: ETokenType;
}

export interface TokenPayload extends TokenPayloadCreate {
  exp: number;
  iat: number;
}
