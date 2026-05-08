// segment normal: user, v1, post-id (allow dot inside)
const SEGMENT = '[a-z0-9-]+(?:\\.[a-z0-9-]+)*';

// segment underscore
const SEGMENT_WITH_UNDERSCORE = '[a-z0-9_-]+(?:\\.[a-z0-9_-]+)*';

// param: :userId
const PARAM = ':[a-z0-9_]+';

// không có param
export const PATH_REGEX = new RegExp(`^\\/(?:${SEGMENT}(?:\\/${SEGMENT})*)?$`);

// underscore
export const PATH_REGEX_WITH_UNDERSCORE = new RegExp(
  `^\\/(?:${SEGMENT_WITH_UNDERSCORE}(?:\\/${SEGMENT_WITH_UNDERSCORE})*)?$`
);

// param
export const PATH_REGEX_WITH_PARAMS = new RegExp(
  `^\\/(?:(?:${SEGMENT_WITH_UNDERSCORE}|${PARAM})(?:\\/(?:${SEGMENT_WITH_UNDERSCORE}|${PARAM}))*)?$`
);

type ValidatePathOptions = {
  allowTrailingSlash?: boolean;
  allowUnderscore?: boolean;
  allowParams?: boolean;
};

export function validatePath(pathRaw: string, options: ValidatePathOptions = {}): boolean {
  const { allowTrailingSlash = false, allowUnderscore = true, allowParams = true } = options;
  const path = pathRaw.toLowerCase();

  if (!path || typeof path !== 'string') return false;

  // Basic checks
  if (!path.startsWith('/')) return false;
  if (path.includes('?') || path.includes('#')) return false;
  if (path.includes('//')) return false;
  if (path.includes('..') || path.includes('./')) return false;

  try {
    if (decodeURIComponent(path) !== path) return false;
  } catch {
    return false;
  }

  if (/\s/.test(path)) return false; // whitespace check
  if (path !== path.toLowerCase()) return false;

  // Trailing slash
  if (!allowTrailingSlash && path.length > 1 && path.endsWith('/')) {
    return false;
  }

  let regex: RegExp;

  if (allowParams) {
    regex = PATH_REGEX_WITH_PARAMS;
  } else if (allowUnderscore) {
    regex = PATH_REGEX_WITH_UNDERSCORE;
  } else {
    regex = PATH_REGEX;
  }

  return regex.test(path);
}
