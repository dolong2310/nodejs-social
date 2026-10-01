import type { DatabasePort } from '@/infrastructure/persistence/database.port';
import type { RedisClientPort } from '@/infrastructure/persistence/redis/redis-client';
import type { TokenServicePort } from '@/modules/authentication/application/services/token.service.types';
import type { DeleteExpiredOtpsPort } from '@/modules/authentication/application/use-cases/delete-expired-otps/delete-expired-otps.port';
import type { DeleteExpiredRefreshTokensPort } from '@/modules/authentication/application/use-cases/delete-expired-refresh-tokens/delete-expired-refresh-tokens.port';
import type { OtpRepositoryPort } from '@/modules/authentication/domain/repositories/otp.repository';
import type { EmailSenderPort } from '@/modules/core/application/ports/email-sender.port';
import type { LoggerPort } from '@/modules/core/application/ports/logger.port';
import type { FileStoragePort } from '@/modules/media/application/ports/file-storage.port';
import type { ObjectStoragePort } from '@/modules/media/application/ports/object-storage.port';
import type { VideoStatusRepositoryPort } from '@/modules/media/domain/repositories/video-status.repository';
import type { NotificationServicePort } from '@/modules/notification/application/services/notification.service';
import type { CheckSystemHealthPort } from '@/modules/operations/application/use-cases/check-system-health/check-system-health.port';
import type { WarmRedisCacheUseCase } from '@/modules/operations/application/use-cases/warm-redis-cache/warm-redis-cache.usecase';
import type { PostCommandRepositoryPort } from '@/modules/post/domain/repositories/post.command.repository';
import type { UserServicePort } from '@/modules/user/application/services/user.service';
import type { BaseRoute } from '@/presentation/http/express/core/base.route';
import type { ISocketFeature } from '@/presentation/socket/socket.types';
import type { Server as SocketServer } from 'socket.io';

export interface IContainer {
  getRouters(): BaseRoute[];
  getContext(): {
    database: DatabasePort;
    redis: RedisClientPort;
    socket: SocketServer;
  };
  getSocketDeps(): {
    tokenService: TokenServicePort;
    userService: UserServicePort;
    features: ISocketFeature[];
  };
  getWorkerDeps(): {
    emailSender: EmailSenderPort;
    otpRepository: OtpRepositoryPort;
    postCommandRepository: PostCommandRepositoryPort;
    notificationService: NotificationServicePort;
    mediaRepository: VideoStatusRepositoryPort;
    s3Service: ObjectStoragePort;
    fileStorage: FileStoragePort;
    deleteExpiredOtpsUC: DeleteExpiredOtpsPort;
    deleteExpiredRefreshTokensUC: DeleteExpiredRefreshTokensPort;
    warmRedisCacheUC: WarmRedisCacheUseCase;
    checkSystemHealthUC: CheckSystemHealthPort;
  };
  getLogger(): LoggerPort;
}
