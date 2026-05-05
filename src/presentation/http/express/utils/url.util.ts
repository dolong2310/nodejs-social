import { ParamsDictionary } from 'express-serve-static-core';

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
