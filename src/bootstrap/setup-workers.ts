import { IContainer } from '@/bootstrap/container';
import { dbConfig } from '@/infrastructure/persistence/configurations/database.config';
import { buildBullMQConnection } from '@/infrastructure/queue/bullmq/bullmq-connection';
import { EmailWorker } from '@/infrastructure/queue/email/email.worker';
import { NotificationTrimWorker } from '@/infrastructure/queue/notification-trim/notification-trim.worker';
import { PostViewsWorker } from '@/infrastructure/queue/post-views/post-views.worker';
import { VideoHLSWorker } from '@/infrastructure/queue/video-hls/video-hls.worker';

export function setupWorkers(container: IContainer) {
  const connection = buildBullMQConnection(dbConfig.redis);
  const logger = container.getLogger();
  const {
    emailService,
    postRepository,
    notificationRepository,
    mediaRepository,
    s3Service,
    fileStorage,
    mimeService,
    pathService
  } = container.getWorkerDeps();

  new EmailWorker(emailService, logger).run(connection);
  new PostViewsWorker(postRepository, logger).run(connection);
  new NotificationTrimWorker(notificationRepository, logger).run(connection);
  new VideoHLSWorker(mediaRepository, s3Service, fileStorage, mimeService, pathService, logger).run(connection);
}
