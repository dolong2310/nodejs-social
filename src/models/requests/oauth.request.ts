import { Query } from 'express-serve-static-core';

export interface IOAuthGoogleLoginRequestQuery extends Query {
  state: string;
  code: string;
}
