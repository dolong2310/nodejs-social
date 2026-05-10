import { dbConfig } from '@/infrastructure/persistence/config/database.config';
import { buildBullMQConnection } from '@/infrastructure/queue/bullmq/bullmq-connection';
import { OtpEmailQueuePort } from '@/modules/authentication/application/ports/otp-email-job.port';
import { OtpEmailQueue } from '@/modules/authentication/infrastructure/queue/otp-email.queue';
import { OtpCleanupSchedule } from '@/modules/authentication/infrastructure/schedule/otp-cleanup.schedule';
import { RefreshTokenCleanupSchedule } from '@/modules/authentication/infrastructure/schedule/refresh-token-cleanup.schedule';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { VideoStreamQueuePort } from '@/modules/media/application/ports/video-stream-job.port';
import { VideoStreamQueue } from '@/modules/media/infrastructure/queue/video-stream.queue';
import { NotificationTrimQueuePort } from '@/modules/notification/application/ports/notification-trim-job.port';
import { NotificationTrimQueue } from '@/modules/notification/infrastructure/queue/notification-trim.queue';
import { PostViewsQueuePort } from '@/modules/post/application/ports/post-views-job.port';
import { PostViewsQueue } from '@/modules/post/infrastructure/queue/post-views.queue';

export type ContainerQueues = {
  otpEmailQueue: OtpEmailQueuePort;
  videoStreamQueue: VideoStreamQueuePort;
  notificationTrimQueue: NotificationTrimQueuePort;
  postViewsQueue: PostViewsQueuePort;
};

export function createContainerQueues(logger: LoggerPort): ContainerQueues {
  const connection = buildBullMQConnection(dbConfig.redis);

  // register schedules
  new OtpCleanupSchedule(connection, logger);
  new RefreshTokenCleanupSchedule(connection, logger);

  // register queues
  return {
    otpEmailQueue: new OtpEmailQueue(connection),
    videoStreamQueue: new VideoStreamQueue(connection),
    notificationTrimQueue: new NotificationTrimQueue(connection),
    postViewsQueue: new PostViewsQueue(connection)
  };
}
