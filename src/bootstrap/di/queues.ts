import { LoggerPort } from '@/application/ports/logger.port';
import { INotificationTrimQueue } from '@/application/ports/notification-trim-job.port';
import { IPostViewsQueue } from '@/application/ports/post-views-job.port';
import { IVideoStreamQueue } from '@/application/ports/video-stream-job.port';
import { dbConfig } from '@/infrastructure/persistence/config/database.config';
import { buildBullMQConnection } from '@/infrastructure/queue/bullmq/bullmq-connection';
import { BullMQNotificationTrimQueue } from '@/infrastructure/queue/notification-trim/notification-trim.queue';
import { BullMQPostViewsQueue } from '@/infrastructure/queue/post-views/post-views.queue';
import { BullMQVideoStreamQueue } from '@/infrastructure/queue/video-stream/video-stream.queue';

export type ContainerQueues = {
  videoStreamQueue: IVideoStreamQueue;
  notificationTrimQueue: INotificationTrimQueue;
  postViewsQueue: IPostViewsQueue;
};

export function createContainerQueues(logger: LoggerPort): ContainerQueues {
  const connection = buildBullMQConnection(dbConfig.redis);
  return {
    videoStreamQueue: new BullMQVideoStreamQueue(connection, logger),
    notificationTrimQueue: new BullMQNotificationTrimQueue(connection, logger),
    postViewsQueue: new BullMQPostViewsQueue(connection, logger)
  };
}
