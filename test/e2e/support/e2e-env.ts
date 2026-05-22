const defaults: Record<string, string> = {
  PORT: '0',
  LOG_LEVEL: 'silent',
  FRONTEND_URL: 'http://localhost:3000',
  APP_URL: 'http://localhost:3000',
  CORS_ORIGINS: 'http://localhost:3000',
  PERSISTENCE_DRIVER: 'memory',
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
  RATE_LIMIT_MAX: '1000'
};

export function installE2eEnv(): void {
  for (const [key, value] of Object.entries(defaults)) {
    process.env[key] ??= value;
  }
}
