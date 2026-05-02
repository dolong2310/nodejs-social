import { IEmailQueue } from '@/modules/auth/application/ports/email-job.port';
import { INotificationTrimQueue } from '@/modules/notification/application/ports/notification-trim-job.port';
import { IPostViewsQueue } from '@/modules/post/application/ports/post-views-job.port';
import { IVideoStreamQueue } from '@/modules/media/application/ports/video-stream-job.port';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { dbConfig } from '@/infrastructure/persistence/config/database.config';
import { buildBullMQConnection } from '@/infrastructure/queue/bullmq/bullmq-connection';
import { BullMQEmailQueue } from '@/infrastructure/queue/email/email.queue';
import { BullMQNotificationTrimQueue } from '@/infrastructure/queue/notification-trim/notification-trim.queue';
import { BullMQPostViewsQueue } from '@/infrastructure/queue/post-views/post-views.queue';
import { BullMQVideoStreamQueue } from '@/infrastructure/queue/video-stream/video-stream.queue';

export type ContainerQueues = {
  emailQueue: IEmailQueue;
  videoStreamQueue: IVideoStreamQueue;
  notificationTrimQueue: INotificationTrimQueue;
  postViewsQueue: IPostViewsQueue;
};

export function createContainerQueues(logger: LoggerPort): ContainerQueues {
  const connection = buildBullMQConnection(dbConfig.redis);
  return {
    emailQueue: new BullMQEmailQueue(connection, logger),
    videoStreamQueue: new BullMQVideoStreamQueue(connection, logger),
    notificationTrimQueue: new BullMQNotificationTrimQueue(connection, logger),
    postViewsQueue: new BullMQPostViewsQueue(connection, logger)
  };
}
