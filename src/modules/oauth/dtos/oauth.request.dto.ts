import { Query } from 'express-serve-static-core';

export interface GetGoogleAuthUrlQueryDTO extends Query {
  ip: string;
  userAgent: string;
}

export interface OAuthGoogleLoginQueryDTO extends Query {
  state: string;
  code: string;
}
