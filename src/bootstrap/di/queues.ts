import { dbConfig } from '@/infrastructure/persistence/config/database.config';
import { buildBullMQConnection } from '@/infrastructure/queue/bullmq/bullmq-connection';
import { OtpEmailQueuePort } from '@/modules/authentication/application/ports/otp-email-job.port';
import { BullMQOtpEmailQueue } from '@/modules/authentication/infrastructure/queue/otp-email.queue';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { VideoStreamQueuePort } from '@/modules/media/application/ports/video-stream-job.port';
import { BullMQVideoStreamQueue } from '@/modules/media/infrastructure/queue/video-stream.queue';
import { NotificationTrimQueuePort } from '@/modules/notification/application/ports/notification-trim-job.port';
import { BullMQNotificationTrimQueue } from '@/modules/notification/infrastructure/queue/notification-trim.queue';
import { PostViewsQueuePort } from '@/modules/post/application/ports/post-views-job.port';
import { BullMQPostViewsQueue } from '@/modules/post/infrastructure/queue/post-views.queue';

export type ContainerQueues = {
  otpEmailQueue: OtpEmailQueuePort;
  videoStreamQueue: VideoStreamQueuePort;
  notificationTrimQueue: NotificationTrimQueuePort;
  postViewsQueue: PostViewsQueuePort;
};

export function createContainerQueues(logger: LoggerPort): ContainerQueues {
  const connection = buildBullMQConnection(dbConfig.redis);
  return {
    otpEmailQueue: new BullMQOtpEmailQueue(connection, logger),
    videoStreamQueue: new BullMQVideoStreamQueue(connection, logger),
    notificationTrimQueue: new BullMQNotificationTrimQueue(connection, logger),
    postViewsQueue: new BullMQPostViewsQueue(connection, logger)
  };
}
