import { queryObject } from '@/presentation/http/express/utils/schema.util';
import { nonEmpty, optional, pipe, string } from 'valibot';

export const GoogleAuthUrlQuerySchema = queryObject({
  ip: optional(string(), ''),
  userAgent: optional(string(), '')
});

/** Google redirects back with extra params (scope, authuser, prompt...), `queryObject` strips them. */
export const GoogleLoginQuerySchema = queryObject({
  state: pipe(string(), nonEmpty()),
  code: pipe(string(), nonEmpty())
});
