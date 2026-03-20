import { Query } from 'express-serve-static-core';

export interface OAuthGoogleLoginQueryDTO extends Query {
  state: string;
  code: string;
}
