export const THROTTLE = {
  DEFAULT: {
    WINDOW_MS: 5 * 60 * 1000, // 5 minutes
    MAX: 100 // 100 requests
  },
  AUTH: {
    WINDOW_MS: 5 * 60 * 1000,
    MAX: 5
  },
  POSTS: {
    WINDOW_MS: 5 * 60 * 1000,
    MAX: 30
  }
};
