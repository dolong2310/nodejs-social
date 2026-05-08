import { IContainer } from '@/bootstrap/container';
import { dbConfig } from '@/infrastructure/persistence/config/database.config';
import { buildBullMQConnection } from '@/infrastructure/queue/bullmq/bullmq-connection';
import { OtpEmailWorker } from '@/modules/authentication/infrastructure/queue/otp-email.worker';
import { VideoStreamWorker } from '@/modules/media/infrastructure/queue/video-stream.worker';
import { NotificationTrimWorker } from '@/modules/notification/infrastructure/queue/notification-trim.worker';
import { PostViewsWorker } from '@/modules/post/infrastructure/queue/post-views.worker';

export function setupWorkers(container: IContainer): void {
  const connection = buildBullMQConnection(dbConfig.redis);
  const logger = container.getLogger();
  const {
    otpEmailSender,
    otpRepository,
    postCommandRepository,
    notificationService,
    mediaRepository,
    s3Service,
    fileStorage
  } = container.getWorkerDeps();

  new OtpEmailWorker(otpEmailSender, otpRepository, logger).run(connection);
  new PostViewsWorker(postCommandRepository, logger).run(connection);
  new NotificationTrimWorker(notificationService, logger).run(connection);
  new VideoStreamWorker(mediaRepository, s3Service, fileStorage, logger).run(connection);
}
