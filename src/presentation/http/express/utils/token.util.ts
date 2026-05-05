import { Request } from 'express';

export function extractTokenFromHeader(request: Request): string | undefined {
  const raw = request.headers.authorization;
  if (typeof raw !== 'string' || raw.length < 7) {
    return undefined;
  }
  if (!raw.toLowerCase().startsWith('bearer ')) {
    return undefined;
  }
  const token = raw.slice(7).trim();
  return token.length > 0 ? token : undefined;
}

export function extractApiKeyFromHeader(request: Request, key: string = 'x-api-key'): string | string[] | undefined {
  return request.headers[key];
}
