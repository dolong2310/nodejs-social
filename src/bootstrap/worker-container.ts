import { APP_CONFIG } from '@/bootstrap/config/app.config';
import { envConfig } from '@/bootstrap/config/env.config';
import { createContainerRepositories } from '@/bootstrap/di/repositories';
import type { IWorkerContainer } from '@/bootstrap/di/worker-types';
// import { SesEmailSender } from '@/infrastructure/email/ses-email-sender';
import { ResendEmailSender } from '@/infrastructure/email/resend-email-sender';
import logger from '@/infrastructure/logger/create-logger';
import type { DatabasePort } from '@/infrastructure/persistence/database.port';
import { CacheManager } from '@/infrastructure/persistence/redis/cache-manager';
import type { RedisClientPort } from '@/infrastructure/persistence/redis/redis-client';
import type { DeleteExpiredOtpsPort } from '@/modules/authentication/application/use-cases/delete-expired-otps/delete-expired-otps.port';
import { DeleteExpiredOtpsUseCase } from '@/modules/authentication/application/use-cases/delete-expired-otps/delete-expired-otps.usecase';
import type { DeleteExpiredRefreshTokensPort } from '@/modules/authentication/application/use-cases/delete-expired-refresh-tokens/delete-expired-refresh-tokens.port';
import { DeleteExpiredRefreshTokensUseCase } from '@/modules/authentication/application/use-cases/delete-expired-refresh-tokens/delete-expired-refresh-tokens.usecase';
import type { DeleteOtpPort } from '@/modules/authentication/application/use-cases/delete-otp/delete-otp.port';
import { DeleteOtpUseCase } from '@/modules/authentication/application/use-cases/delete-otp/delete-otp.usecase';
import type { SendOtpEmailPort } from '@/modules/authentication/application/use-cases/send-otp-email/send-otp-email.port';
import { SendOtpEmailUseCase } from '@/modules/authentication/application/use-cases/send-otp-email/send-otp-email.usecase';
import type { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import type { EmailSenderPort } from '@/modules/core/application/ports/email-sender.port';
import type { LoggerPort } from '@/modules/core/application/ports/logger.port';
import type { FileStoragePort } from '@/modules/media/application/ports/file-storage.port';
import type { ObjectStoragePort } from '@/modules/media/application/ports/object-storage.port';
import type { EncodeVideoStreamPort } from '@/modules/media/application/use-cases/encode-video-stream/encode-video-stream.port';
import { EncodeVideoStreamUseCase } from '@/modules/media/application/use-cases/encode-video-stream/encode-video-stream.usecase';
import type { MarkVideoEncodingFailedPort } from '@/modules/media/application/use-cases/mark-video-encoding-failed/mark-video-encoding-failed.port';
import { MarkVideoEncodingFailedUseCase } from '@/modules/media/application/use-cases/mark-video-encoding-failed/mark-video-encoding-failed.usecase';
import { CloudinaryService } from '@/modules/media/infrastructure/services/cloudinary-storage.service';
import { FfmpegVideoStreamEncoder } from '@/modules/media/infrastructure/services/ffmpeg-video-stream-encoder.service';
import { LocalFileStorage } from '@/modules/media/infrastructure/services/file-storage.service';
// import { S3Service } from '@/modules/media/infrastructure/services/s3-storage.service';
import type { TrimNotificationsPort } from '@/modules/notification/application/use-cases/trim-notifications/trim-notifications.port';
import { TrimNotificationsUseCase } from '@/modules/notification/application/use-cases/trim-notifications/trim-notifications.usecase';
import type { CheckSystemHealthPort } from '@/modules/operations/application/use-cases/check-system-health/check-system-health.port';
import { CheckSystemHealthUseCase } from '@/modules/operations/application/use-cases/check-system-health/check-system-health.usecase';
import type { WarmRedisCachePort } from '@/modules/operations/application/use-cases/warm-redis-cache/warm-redis-cache.port';
import { WarmRedisCacheUseCase } from '@/modules/operations/application/use-cases/warm-redis-cache/warm-redis-cache.usecase';
import { NodeSystemHealthProbe } from '@/modules/operations/infrastructure/system/node-system-health-probe';
import type { IncreasePostsViewsPort } from '@/modules/post/application/use-cases/increase-posts-views/increase-posts-views.port';
import { IncreasePostsViewsUseCase } from '@/modules/post/application/use-cases/increase-posts-views/increase-posts-views.usecase';
import { UPLOAD_DIR_VIDEO } from '@/presentation/http/express/constants/file.constants';
export type { IWorkerContainer } from '@/bootstrap/di/worker-types';

/**
 * Composition root of the worker process (src/worker.ts).
 * Builds only what the queue workers need: no HTTP routes, Socket.IO, or queue producers and schedules,
 * which belong to the API process (src/bootstrap/container.ts).
 */
export class WorkerContainer implements IWorkerContainer {
  private readonly logger: LoggerPort = logger;

  private readonly cacheManager: CacheManagerPort;
  private readonly fileStorage: FileStoragePort;
  private readonly s3Service: ObjectStoragePort;
  private readonly emailSender: EmailSenderPort;

  private readonly sendOtpEmailUC: SendOtpEmailPort;
  private readonly deleteOtpUC: DeleteOtpPort;
  private readonly increasePostsViewsUC: IncreasePostsViewsPort;
  private readonly trimNotificationsUC: TrimNotificationsPort;
  private readonly encodeVideoStreamUC: EncodeVideoStreamPort;
  private readonly markVideoEncodingFailedUC: MarkVideoEncodingFailedPort;
  private readonly deleteExpiredOtpsUC: DeleteExpiredOtpsPort;
  private readonly deleteExpiredRefreshTokensUC: DeleteExpiredRefreshTokensPort;
  private readonly warmRedisCacheUC: WarmRedisCachePort;
  private readonly checkSystemHealthUC: CheckSystemHealthPort;

  constructor(database: DatabasePort, redis: RedisClientPort) {
    const repos = createContainerRepositories(database, this.logger);

    this.cacheManager = new CacheManager(redis);
    this.fileStorage = new LocalFileStorage();
    // this.s3Service = new S3Service(this.logger, this.fileStorage, {
    //   region: envConfig.AWS_REGION,
    //   accessKeyId: envConfig.AWS_ACCESS_KEY_ID,
    //   secretAccessKey: envConfig.AWS_SECRET_ACCESS_KEY,
    //   bucketName: envConfig.AWS_S3_BUCKET_NAME
    // });
    this.s3Service = new CloudinaryService(this.logger, {
      cloudName: envConfig.CLOUDINARY_CLOUD_NAME,
      apiKey: envConfig.CLOUDINARY_API_KEY,
      apiSecret: envConfig.CLOUDINARY_API_SECRET
    });
    // this.emailSender = new SesEmailSender(this.logger, {
    //   region: envConfig.AWS_REGION,
    //   accessKeyId: envConfig.AWS_ACCESS_KEY_ID,
    //   secretAccessKey: envConfig.AWS_SECRET_ACCESS_KEY,
    //   fromAddress: envConfig.RESEND_FROM_ADDRESS
    // });
    this.emailSender = new ResendEmailSender(this.logger, {
      apiKey: envConfig.RESEND_API_KEY,
      fromAddress: envConfig.RESEND_FROM_ADDRESS
    });

    this.sendOtpEmailUC = new SendOtpEmailUseCase(this.emailSender);
    this.deleteOtpUC = new DeleteOtpUseCase(repos.otpRepository);
    this.increasePostsViewsUC = new IncreasePostsViewsUseCase(repos.postRepository);
    this.trimNotificationsUC = new TrimNotificationsUseCase(repos.notificationRepository);
    this.encodeVideoStreamUC = new EncodeVideoStreamUseCase(
      repos.videoStatusRepository,
      new FfmpegVideoStreamEncoder(this.fileStorage, { outputRootDir: UPLOAD_DIR_VIDEO }),
      this.s3Service,
      this.fileStorage
    );
    this.markVideoEncodingFailedUC = new MarkVideoEncodingFailedUseCase(repos.videoStatusRepository);
    this.deleteExpiredOtpsUC = new DeleteExpiredOtpsUseCase(repos.otpRepository);
    this.deleteExpiredRefreshTokensUC = new DeleteExpiredRefreshTokensUseCase(repos.refreshTokenRepository);
    this.warmRedisCacheUC = new WarmRedisCacheUseCase(
      this.cacheManager,
      repos.roleRepository,
      repos.roleQueryRepository,
      repos.userRepository,
      repos.userQueryRepository,
      repos.friendshipRepository
    );
    this.checkSystemHealthUC = new CheckSystemHealthUseCase(
      new NodeSystemHealthProbe({ diskPath: envConfig.SYSTEM_HEALTH_DISK_PATH }),
      this.cacheManager,
      this.emailSender,
      this.logger,
      {
        adminEmails: APP_CONFIG.SYSTEM_HEALTH.ADMIN_EMAILS,
        alertCooldownSeconds: envConfig.SYSTEM_HEALTH_ALERT_COOLDOWN_SECONDS,
        thresholds: {
          cpu: {
            warning: envConfig.SYSTEM_HEALTH_CPU_WARN,
            critical: envConfig.SYSTEM_HEALTH_CPU_CRITICAL
          },
          memory: {
            warning: envConfig.SYSTEM_HEALTH_RAM_WARN,
            critical: envConfig.SYSTEM_HEALTH_RAM_CRITICAL
          },
          disk: {
            warning: envConfig.SYSTEM_HEALTH_DISK_WARN,
            critical: envConfig.SYSTEM_HEALTH_DISK_CRITICAL
          },
          processMemoryMb: {
            warning: envConfig.SYSTEM_HEALTH_PROCESS_MEMORY_WARN_MB,
            critical: envConfig.SYSTEM_HEALTH_PROCESS_MEMORY_CRITICAL_MB
          }
        }
      }
    );
  }

  public getLogger(): LoggerPort {
    return this.logger;
  }

  public getWorkerDeps() {
    return {
      sendOtpEmailUC: this.sendOtpEmailUC,
      deleteOtpUC: this.deleteOtpUC,
      increasePostsViewsUC: this.increasePostsViewsUC,
      trimNotificationsUC: this.trimNotificationsUC,
      encodeVideoStreamUC: this.encodeVideoStreamUC,
      markVideoEncodingFailedUC: this.markVideoEncodingFailedUC,
      deleteExpiredOtpsUC: this.deleteExpiredOtpsUC,
      deleteExpiredRefreshTokensUC: this.deleteExpiredRefreshTokensUC,
      warmRedisCacheUC: this.warmRedisCacheUC,
      checkSystemHealthUC: this.checkSystemHealthUC
    };
  }
}

export default WorkerContainer;
