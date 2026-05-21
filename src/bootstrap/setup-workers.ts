import { IContainer } from '@/bootstrap/container';
import { dbConfig } from '@/infrastructure/persistence/config/database.config';
import { buildBullMQConnection } from '@/infrastructure/queue/bullmq/bullmq-connection';
import { OtpEmailWorker } from '@/modules/authentication/infrastructure/queue/otp-email.worker';
import { OtpCleanupWorker } from '@/modules/authentication/infrastructure/schedule/otp-cleanup.worker';
import { RefreshTokenCleanupWorker } from '@/modules/authentication/infrastructure/schedule/refresh-token-cleanup.worker';
import { VideoStreamWorker } from '@/modules/media/infrastructure/queue/video-stream.worker';
import { NotificationTrimWorker } from '@/modules/notification/infrastructure/queue/notification-trim.worker';
import { CacheWarmupWorker } from '@/modules/operations/infrastructure/schedule/cache-warmup.worker';
import { PostViewsWorker } from '@/modules/post/infrastructure/queue/post-views.worker';

export function setupWorkers(container: IContainer): void {
  const connection = buildBullMQConnection(dbConfig.redis);
  const logger = container.getLogger();
  const {
    emailSender,
    otpRepository,
    postCommandRepository,
    notificationService,
    mediaRepository,
    s3Service,
    fileStorage,
    deleteExpiredOtpsUC,
    deleteExpiredRefreshTokensUC,
    warmRedisCacheUC
  } = container.getWorkerDeps();

  new OtpEmailWorker(connection, emailSender, otpRepository, logger);
  new PostViewsWorker(connection, postCommandRepository, logger);
  new NotificationTrimWorker(connection, notificationService, logger);
  new VideoStreamWorker(connection, mediaRepository, s3Service, fileStorage, logger);
  new OtpCleanupWorker(connection, deleteExpiredOtpsUC, logger);
  new RefreshTokenCleanupWorker(connection, deleteExpiredRefreshTokensUC, logger);
  new CacheWarmupWorker(connection, warmRedisCacheUC, logger);
}
