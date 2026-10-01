import { afterEach, describe, expect, it, vi } from 'vitest';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';

Object.assign(process.env, {
  NODE_ENV: 'development',
  PORT: '3000',
  LOG_LEVEL: 'silent',
  FRONTEND_URL: 'http://localhost:3000',
  APP_URL: 'http://localhost:3000',
  CORS_ORIGINS: 'http://localhost:3000',
  DATABASE_ADAPTER: 'mongo',
  MONGO_URI: 'mongodb://localhost:27017/nodejs-social-test',
  MONGO_SECONDARY_URI: 'mongodb://localhost:27017/nodejs-social-test',
  MONGO_DB_NAME: 'nodejs-social-test',
  POSTGRES_URI: 'postgres://localhost/nodejs_social_test',
  POSTGRES_REPLICA_URIS: 'postgres://localhost/nodejs_social_test',
  POSTGRES_SSL: '0',
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
  REDIS_PASSWORD: 'test',
  REDIS_DB: '15',
  JWT_ALGO: 'HS256',
  ACCESS_TOKEN_SECRET: 'test-access-token-secret',
  REFRESH_TOKEN_SECRET: 'test-refresh-token-secret',
  ACCESS_TOKEN_EXPIRES_IN: '15m',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  API_KEY: 'test-api-key',
  OTP_EXPIRES_AT: '5m',
  GOOGLE_CLIENT_ID: 'test-google-client-id',
  GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
  GOOGLE_REDIRECT_URI: 'http://localhost:3000/oauth/google',
  AWS_ACCESS_KEY_ID: 'test-aws-access-key-id',
  AWS_SECRET_ACCESS_KEY: 'test-aws-secret-access-key',
  AWS_REGION: 'us-east-1',
  AWS_S3_BUCKET_NAME: 'test-bucket',
  RESEND_API_KEY: 're_test_key',
  RESEND_FROM_ADDRESS: 'no-reply@example.com',
  CLOUDINARY_CLOUD_NAME: 'test-cloud-name',
  CLOUDINARY_API_KEY: 'test-cloudinary-api-key',
  CLOUDINARY_API_SECRET: 'test-cloudinary-api-secret',
  RATE_LIMIT_ENABLED: '0',
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX: '1000',
  SYSTEM_HEALTH_MONITOR_ENABLED: '0',
  SYSTEM_HEALTH_CRON: '*/5 * * * *',
  SYSTEM_HEALTH_TIMEZONE: 'UTC',
  SYSTEM_HEALTH_DISK_PATH: '/tmp',
  SYSTEM_HEALTH_CPU_WARN: '75',
  SYSTEM_HEALTH_CPU_CRITICAL: '90',
  SYSTEM_HEALTH_RAM_WARN: '75',
  SYSTEM_HEALTH_RAM_CRITICAL: '90',
  SYSTEM_HEALTH_DISK_WARN: '75',
  SYSTEM_HEALTH_DISK_CRITICAL: '90',
  SYSTEM_HEALTH_PROCESS_MEMORY_WARN_MB: '512',
  SYSTEM_HEALTH_PROCESS_MEMORY_CRITICAL_MB: '1024',
  SYSTEM_HEALTH_ALERT_COOLDOWN_SECONDS: '300',
  SYSTEM_HEALTH_ADMIN_EMAILS: 'test@example.com',
  VNPAY_TMN_CODE: 'VNPAY_TEST_MERCHANT',
  VNPAY_SECURE_SECRET: 'vnpay-test-secret',
  VNPAY_HOST: 'https://sandbox.vnpayment.vn',
  MOMO_PARTNER_CODE: 'MOMO_TEST_PARTNER',
  MOMO_ACCESS_KEY: 'momo-test-access-key',
  MOMO_SECRET_KEY: 'momo-test-secret-key',
  MOMO_STORE_ID: 'MomoTestStore',
  MOMO_STORE_NAME: 'Social Test Store',
  PAYMENT_PUBLIC_BASE_URL: 'https://social-tunnel.test'
});

const [{ buildHttpRouters }, { HttpRoutePermissionCatalog }] = await Promise.all([
  import('@/bootstrap/di/http-routes'),
  import('@/modules/operations/presentation/http-route-permission-catalog')
]);

afterEach(() => vi.useRealTimers());

function buildRoutes() {
  const logger = {
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    debug: () => undefined,
    child: () => logger
  };
  const context = new Proxy({}, { get: (_target, property) => (property === 'logger' ? logger : {}) }) as Parameters<
    typeof buildHttpRouters
  >[0];
  return buildHttpRouters(context).filter((route) => route.getPath().startsWith('payments'));
}

describe('payment bootstrap wiring', () => {
  it('mounts checkout and callback routes independent of app environment', () => {
    const previousEnvironment = process.env.NODE_ENV;
    try {
      for (const environment of ['development', 'staging', 'production']) {
        process.env.NODE_ENV = environment;
        expect(buildRoutes().map((route) => route.getPath())).toEqual(['payments', 'payments/callbacks']);
      }
    } finally {
      if (previousEnvironment === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousEnvironment;
    }
  });

  it('gives the payment HTTP route 45 seconds to persist the result of the 35-second MoMo request', async () => {
    const [paymentRoute] = buildRoutes();
    const timeoutInterceptor = (paymentRoute as unknown as { timeoutInterceptor: TimeoutInterceptor })
      .timeoutInterceptor;
    vi.useFakeTimers();
    const execution = timeoutInterceptor.intercept({} as never, {} as never, () => new Promise(() => undefined));
    const timeout = expect(execution).rejects.toMatchObject({ name: 'RequestTimeoutException' });

    await vi.advanceTimersByTimeAsync(44_999);
    await vi.advanceTimersByTimeAsync(1);
    await timeout;
  });

  it('registers authenticated checkout and owner-read paths in the permission catalog', () => {
    const paths = new HttpRoutePermissionCatalog({ apiPrefix: '/api' })
      .getAvailableRoutes()
      .map((route) => `${route.method} ${route.path}`);

    expect(paths).toContain('POST /api/v1/payments');
    expect(paths).toContain('GET /api/v1/payments/:paymentId');
  });
});
