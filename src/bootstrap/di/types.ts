import { TokenServicePort } from '@/modules/authentication/application/services/token.service.type';
import { DeleteExpiredOtpsPort } from '@/modules/authentication/application/use-cases/delete-expired-otps/delete-expired-otps.port';
import { DeleteExpiredRefreshTokensPort } from '@/modules/authentication/application/use-cases/delete-expired-refresh-tokens/delete-expired-refresh-tokens.port';
import { OtpRepositoryPort } from '@/modules/authentication/domain/repositories/otp.repository';
import { SesOtpEmailSender } from '@/modules/authentication/infrastructure/email/ses-otp-email-sender';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { FileStoragePort } from '@/modules/media/application/ports/file-storage.port';
import { ObjectStoragePort } from '@/modules/media/application/ports/object-storage.port';
import { VideoStatusRepositoryPort } from '@/modules/media/domain/repositories/video-status.repository';
import { NotificationServicePort } from '@/modules/notification/application/services/notification.service';
import { PostCommandRepositoryPort } from '@/modules/post/domain/repositories/post.command.repository';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import { BaseRoute } from '@/presentation/http/express/core/base.route';
import { ISocketFeature } from '@/presentation/socket/socket.type';

export interface IContainer {
  getRouters(): BaseRoute[];
  getSocketDeps(): {
    tokenService: TokenServicePort;
    userService: UserServicePort;
    features: ISocketFeature[];
  };
  getWorkerDeps(): {
    otpEmailSender: SesOtpEmailSender;
    otpRepository: OtpRepositoryPort;
    postCommandRepository: PostCommandRepositoryPort;
    notificationService: NotificationServicePort;
    mediaRepository: VideoStatusRepositoryPort;
    s3Service: ObjectStoragePort;
    fileStorage: FileStoragePort;
    deleteExpiredOtpsUC: DeleteExpiredOtpsPort;
    deleteExpiredRefreshTokensUC: DeleteExpiredRefreshTokensPort;
  };
  getLogger(): LoggerPort;
}
