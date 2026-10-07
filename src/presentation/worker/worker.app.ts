import { envConfig } from '@/bootstrap/config/env.config';
import type { IWorkerContainer } from '@/bootstrap/worker-container';
import type { BaseWorker } from '@/presentation/worker/core/base.worker';
import { CacheWarmupWorker } from '@/presentation/worker/features/cache-warmup.worker';
import { NotificationTrimWorker } from '@/presentation/worker/features/notification-trim.worker';
import { OtpCleanupWorker } from '@/presentation/worker/features/otp-cleanup.worker';
import { OtpEmailWorker } from '@/presentation/worker/features/otp-email.worker';
import { PostViewsWorker } from '@/presentation/worker/features/post-views.worker';
import { RefreshTokenCleanupWorker } from '@/presentation/worker/features/refresh-token-cleanup.worker';
import { SystemHealthWorker } from '@/presentation/worker/features/system-health.worker';
import { VideoStreamWorker } from '@/presentation/worker/features/video-stream.worker';
import type { ConnectionOptions } from 'bullmq';

export type WorkerApp = {
  close(): Promise<void>;
};

export const createWorkerApp = (connection: ConnectionOptions, container: IWorkerContainer): WorkerApp => {
  const logger = container.getLogger();
  const {
    sendOtpEmailUC,
    deleteOtpUC,
    increasePostsViewsUC,
    trimNotificationsUC,
    encodeVideoStreamUC,
    markVideoEncodingFailedUC,
    deleteExpiredOtpsUC,
    deleteExpiredRefreshTokensUC,
    warmRedisCacheUC,
    checkSystemHealthUC
  } = container.getWorkerDeps();

  const workers: Pick<BaseWorker<unknown, unknown>, 'close'>[] = [
    new OtpEmailWorker(connection, sendOtpEmailUC, deleteOtpUC, logger),
    new PostViewsWorker(connection, increasePostsViewsUC),
    new NotificationTrimWorker(connection, trimNotificationsUC, logger),
    new VideoStreamWorker(connection, encodeVideoStreamUC, markVideoEncodingFailedUC, logger),
    new OtpCleanupWorker(connection, deleteExpiredOtpsUC, logger),
    new RefreshTokenCleanupWorker(connection, deleteExpiredRefreshTokensUC, logger),
    new CacheWarmupWorker(connection, warmRedisCacheUC, logger)
  ];

  if (envConfig.SYSTEM_HEALTH_MONITOR_ENABLED) {
    workers.push(new SystemHealthWorker(connection, checkSystemHealthUC, logger));
  }

  return {
    close: async () => {
      await Promise.allSettled(workers.map((worker) => worker.close()));
    }
  };
};
