import type { ParamsDictionary } from 'express-serve-static-core';

/**
 * Normalize the logical path (pattern + mount) so it matches `METHOD-path` permissions, e.g. auth guard checks.
 *
 * Case A - `typeof path === 'string'` and `path !== '/'`: ignore `params` / `originalUrl`.
 *   - { baseUrl: '', path: '/users/:id' } -> '/users/:id'
 *   - { baseUrl: '/api/v1', path: '/users/:userId' } -> '/api/v1/users/:userId'
 *
 * Case B - `path === '/'`: do not append another segment, avoiding `//`.
 *   - { baseUrl: '/api/v1', path: '/' } -> '/api/v1'
 *
 * Case C - `path` is not a string (for example, a runtime RegExp route): take pathname from `originalUrl`
 *   without `?query`, replace each `/<param value>` with `/:<name>`, skip empty values, and handle longer
 *   values first through sorting.
 *   - { originalUrl: '/api/users/42?x=1', params: { userId: '42' }, path: <RegExp>, baseUrl: '/api' }
 *     -> '/api/users/:userId'
 *   - If `template` is empty after the loop, return `baseUrl`.
 *
 * Express commonly uses `request.route.path` as a string, so most routes use Case A/B.
 */
export function resolveUrlPath(data: {
  path: string;
  baseUrl: string;
  params: ParamsDictionary;
  originalUrl: string;
}): string {
  const { path, baseUrl, params, originalUrl } = data;

  if (typeof path === 'string') {
    const suffix = path === '/' ? '' : path;
    return `${baseUrl}${suffix}`;
  }

  const pathname = (originalUrl ?? '').split('?')[0] ?? '';
  let template = pathname;
  for (const [paramName, raw] of Object.entries(params).sort((a, b) => String(b[1]).length - String(a[1]).length)) {
    const value = String(raw);
    if (!value) continue;
    template = template.split(`/${value}`).join(`/:${paramName}`);
  }

  return template || baseUrl;
}
