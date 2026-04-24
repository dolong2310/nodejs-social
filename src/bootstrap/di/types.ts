import { IFileStorage } from '@/application/ports/file-storage.port';
import { LoggerPort } from '@/application/ports/logger.port';
import { IMimeService } from '@/application/ports/mime.port';
import { IPathService } from '@/application/ports/path.port';
import { RealtimePort } from '@/application/ports/realtime.port';
import { IS3Service } from '@/application/ports/s3.port';
import { ITokenService } from '@/application/services/token/token.service.type';
import { IUserService } from '@/application/services/user/user.service';
import { NotificationRepositoryPort } from '@/domain/repositories/notification/notification.repository';
import { OtpRepositoryPort } from '@/domain/repositories/otp/otp.repository';
import { PostRepositoryPort } from '@/domain/repositories/post/post.repository';
import { VideoStatusRepositoryPort } from '@/domain/repositories/video-status/video-status.repository';
import { IEmailService } from '@/infrastructure/services/email.service';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { ChatFeature } from '@/presentation/socket/chat.feature';
import { PresenceFeature } from '@/presentation/socket/presence.feature';

export interface IContainer {
  getRouters(): BaseRoute[];
  getSocketDeps(): {
    tokenService: ITokenService;
    userService: IUserService;
    presenceFeature: PresenceFeature;
    chatFeature: ChatFeature;
  };
  getWorkerDeps(): {
    emailService: IEmailService;
    otpRepository: OtpRepositoryPort;
    postRepository: PostRepositoryPort;
    notificationRepository: NotificationRepositoryPort;
    mediaRepository: VideoStatusRepositoryPort;
    s3Service: IS3Service;
    fileStorage: IFileStorage;
    mimeService: IMimeService;
    pathService: IPathService;
  };
  getLogger(): LoggerPort;
  bindRealtimeEmitter(emitter: RealtimePort | null): void;
}
