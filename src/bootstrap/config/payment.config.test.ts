import { describe, expect, it } from 'vitest';

const paymentEnvironment = {
  VNPAY_TMN_CODE: 'VNPAY_TEST_MERCHANT',
  VNPAY_SECURE_SECRET: 'vnpay-test-secret',
  VNPAY_HOST: 'https://sandbox.vnpayment.vn',
  MOMO_PARTNER_CODE: 'MOMO_TEST_PARTNER',
  MOMO_ACCESS_KEY: 'momo-test-access-key',
  MOMO_SECRET_KEY: 'momo-test-secret-key',
  MOMO_STORE_ID: 'MomoTestStore',
  MOMO_STORE_NAME: 'Social Test Store',
  PAYMENT_PUBLIC_BASE_URL: 'https://social-tunnel.example'
};

Object.assign(process.env, {
  PORT: '0',
  LOG_LEVEL: 'silent',
  FRONTEND_URL: 'http://localhost:3000',
  APP_URL: 'http://localhost:3000',
  CORS_ORIGINS: 'http://localhost:3000',
  DATABASE_ADAPTER: 'memory',
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
  SES_FROM_ADDRESS: 'no-reply@example.com',
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
  ...paymentEnvironment
});

const { createPaymentConfig } = await import('@/bootstrap/config/payment.config');

describe('payment config', () => {
  it('requires every sandbox credential and the public HTTPS callback base URL', () => {
    for (const key of Object.keys(paymentEnvironment) as Array<keyof typeof paymentEnvironment>) {
      expect(() => createPaymentConfig({ ...paymentEnvironment, [key]: '' })).toThrow(key);
    }
  });

  it('keeps VNPay pinned to the sandbox host', () => {
    expect(() => createPaymentConfig({ ...paymentEnvironment, VNPAY_HOST: 'https://vnpayment.vn' })).toThrow(
      'VNPAY_HOST must point to https://sandbox.vnpayment.vn'
    );
  });

  it('requires an HTTPS public base URL for provider callbacks', () => {
    expect(() =>
      createPaymentConfig({ ...paymentEnvironment, PAYMENT_PUBLIC_BASE_URL: 'http://localhost:3000' })
    ).toThrow('PAYMENT_PUBLIC_BASE_URL must use HTTPS');
  });

  it('requires the public callback URL to be an origin without an application path', () => {
    expect(() =>
      createPaymentConfig({ ...paymentEnvironment, PAYMENT_PUBLIC_BASE_URL: 'https://social.example/api' })
    ).toThrow('PAYMENT_PUBLIC_BASE_URL must be an HTTPS origin');
  });

  it('returns the ecommerce-compatible credentials and leaves provider mode pinned to sandbox', () => {
    expect(createPaymentConfig(paymentEnvironment)).toEqual({
      vnpay: {
        tmnCode: paymentEnvironment.VNPAY_TMN_CODE,
        secureSecret: paymentEnvironment.VNPAY_SECURE_SECRET,
        vnpayHost: paymentEnvironment.VNPAY_HOST
      },
      momo: {
        partnerCode: paymentEnvironment.MOMO_PARTNER_CODE,
        accessKey: paymentEnvironment.MOMO_ACCESS_KEY,
        secretKey: paymentEnvironment.MOMO_SECRET_KEY,
        storeId: paymentEnvironment.MOMO_STORE_ID,
        storeName: paymentEnvironment.MOMO_STORE_NAME
      },
      paymentPublicBaseUrl: paymentEnvironment.PAYMENT_PUBLIC_BASE_URL
    });
  });
});
