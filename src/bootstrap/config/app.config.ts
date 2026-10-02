import { envConfig, isProduction } from '@/bootstrap/config/env.config';

/**
 * Allowed origins for Express CORS and Socket.IO.
 * - `CORS_ORIGINS` (optional): comma-separated, for example `http://localhost:3001,http://localhost:5173`
 * - Production default: only `FRONTEND_URL`
 * - Development default: `FRONTEND_URL` + common local origins
 */
function getCorsAllowedOrigins(): string[] {
  const raw = envConfig.CORS_ORIGINS;
  if (raw !== undefined && raw.trim() !== '') {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (isProduction) {
    return [envConfig.FRONTEND_URL];
  }

  const DEFAULT_DEV_CORS_ORIGINS = [] as const;

  return [...new Set([envConfig.FRONTEND_URL, ...DEFAULT_DEV_CORS_ORIGINS])];
}

function parseCsv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

// Derived values and constants only; plain env values are read from `envConfig` directly.
export const APP_CONFIG = {
  API: {
    PREFIX: '/api'
  },

  CORS: {
    ORIGIN: getCorsAllowedOrigins(),
    CREDENTIALS: true
  },

  RATE_LIMIT: {
    STANDARD_HEADERS: 'draft-8' as const, // Return standard rate-limit headers using the IETF draft-8 format.
    LEGACY_HEADERS: false, // Disable legacy X-RateLimit-* headers.
    IPV6_SUBNET: 56 // Group IPv6 clients by subnet to avoid one machine creating too many distinct clients.
  },

  SYSTEM_HEALTH: {
    ADMIN_EMAILS: parseCsv(envConfig.SYSTEM_HEALTH_ADMIN_EMAILS)
  }
};
