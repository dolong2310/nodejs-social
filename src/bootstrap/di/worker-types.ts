import type { DeleteExpiredOtpsPort } from '@/modules/authentication/application/use-cases/delete-expired-otps/delete-expired-otps.port';
import type { DeleteExpiredRefreshTokensPort } from '@/modules/authentication/application/use-cases/delete-expired-refresh-tokens/delete-expired-refresh-tokens.port';
import type { DeleteOtpPort } from '@/modules/authentication/application/use-cases/delete-otp/delete-otp.port';
import type { SendOtpEmailPort } from '@/modules/authentication/application/use-cases/send-otp-email/send-otp-email.port';
import type { LoggerPort } from '@/modules/core/application/ports/logger.port';
import type { EncodeVideoStreamPort } from '@/modules/media/application/use-cases/encode-video-stream/encode-video-stream.port';
import type { MarkVideoEncodingFailedPort } from '@/modules/media/application/use-cases/mark-video-encoding-failed/mark-video-encoding-failed.port';
import type { TrimNotificationsPort } from '@/modules/notification/application/use-cases/trim-notifications/trim-notifications.port';
import type { CheckSystemHealthPort } from '@/modules/operations/application/use-cases/check-system-health/check-system-health.port';
import type { WarmRedisCachePort } from '@/modules/operations/application/use-cases/warm-redis-cache/warm-redis-cache.port';
import type { IncreasePostsViewsPort } from '@/modules/post/application/use-cases/increase-posts-views/increase-posts-views.port';

export interface IWorkerContainer {
  getWorkerDeps(): {
    sendOtpEmailUC: SendOtpEmailPort;
    deleteOtpUC: DeleteOtpPort;
    increasePostsViewsUC: IncreasePostsViewsPort;
    trimNotificationsUC: TrimNotificationsPort;
    encodeVideoStreamUC: EncodeVideoStreamPort;
    markVideoEncodingFailedUC: MarkVideoEncodingFailedPort;
    deleteExpiredOtpsUC: DeleteExpiredOtpsPort;
    deleteExpiredRefreshTokensUC: DeleteExpiredRefreshTokensPort;
    warmRedisCacheUC: WarmRedisCachePort;
    checkSystemHealthUC: CheckSystemHealthPort;
  };
  getLogger(): LoggerPort;
}
