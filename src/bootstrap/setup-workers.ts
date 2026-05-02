import { IContainer } from '@/bootstrap/container';
import { dbConfig } from '@/infrastructure/persistence/config/database.config';
import { buildBullMQConnection } from '@/infrastructure/queue/bullmq/bullmq-connection';
import { EmailWorker } from '@/infrastructure/queue/email/email.worker';
import { NotificationTrimWorker } from '@/infrastructure/queue/notification-trim/notification-trim.worker';
import { PostViewsWorker } from '@/infrastructure/queue/post-views/post-views.worker';
import { VideoStreamWorker } from '@/infrastructure/queue/video-stream/video-stream.worker';

export function setupWorkers(container: IContainer) {
  const connection = buildBullMQConnection(dbConfig.redis);
  const logger = container.getLogger();
  const {
    emailService,
    otpRepository,
    postCommandRepository,
    notificationRepository,
    mediaRepository,
    s3Service,
    fileStorage
  } = container.getWorkerDeps();

  new EmailWorker(emailService, otpRepository, logger).run(connection);
  new PostViewsWorker(postCommandRepository, logger).run(connection);
  new NotificationTrimWorker(notificationRepository, logger).run(connection);
  new VideoStreamWorker(mediaRepository, s3Service, fileStorage, logger).run(connection);
}
