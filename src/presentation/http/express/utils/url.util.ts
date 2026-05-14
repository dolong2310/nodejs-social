import { ParamsDictionary } from 'express-serve-static-core';

/**
 * Chuẩn hóa đường dẫn logic (pattern + mount) để khớp quyền kiểu `METHOD-path` (vd. auth guard).
 *
 * Case A — `typeof path === 'string'` và `path !== '/'`: bỏ qua `params` / `originalUrl`.
 *   - { baseUrl: '', path: '/users/:id' } → '/users/:id'
 *   - { baseUrl: '/api/v1', path: '/users/:userId' } → '/api/v1/users/:userId'
 *
 * Case B — `path === '/'`: không nối thêm segment (tránh `//`).
 *   - { baseUrl: '/api/v1', path: '/' } → '/api/v1'
 *
 * Case C — `path` không phải string (vd. route RegExp ở runtime): pathname từ `originalUrl` (bỏ `?query`),
 *   thay mỗi `/<giá trị param>` bằng `/:<tên>`; giá trị rỗng bỏ qua; xử lý param có giá trị dài trước (sort).
 *   - { originalUrl: '/api/users/42?x=1', params: { userId: '42' }, path: <RegExp>, baseUrl: '/api' }
 *     → '/api/users/:userId'
 *   - Nếu `template` rỗng sau vòng lặp → trả `baseUrl`.
 *
 * Express thường dùng: `request.route.path` là string → hầu hết Case A/B.
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
