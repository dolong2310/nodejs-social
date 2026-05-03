import { EmailServicePort } from '@/infrastructure/services/email.service';
import { TokenServicePort } from '@/modules/auth/application/services/token.service.type';
import { OtpRepositoryPort } from '@/modules/auth/domain/repositories/otp.repository';
import { FileStoragePort } from '@/modules/media/application/ports/file-storage.port';
import { StoragePort } from '@/modules/core/application/ports/storage.port';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { VideoStatusRepositoryPort } from '@/modules/media/domain/repositories/video-status.repository';
import { NotificationRepositoryPort } from '@/modules/notification/domain/repositories/notification.repository';
import { PostCommandRepositoryPort } from '@/modules/post/application/ports/command/post-command.repository';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { ISocketFeature } from '@/presentation/socket/socket.type';

export interface IContainer {
  getRouters(): BaseRoute[];
  getSocketDeps(): {
    tokenService: TokenServicePort;
    userService: UserServicePort;
    features: ISocketFeature[];
  };
  getWorkerDeps(): {
    emailService: EmailServicePort;
    otpRepository: OtpRepositoryPort;
    postCommandRepository: PostCommandRepositoryPort;
    notificationRepository: NotificationRepositoryPort;
    mediaRepository: VideoStatusRepositoryPort;
    s3Service: StoragePort;
    fileStorage: FileStoragePort;
  };
  getLogger(): LoggerPort;
}
