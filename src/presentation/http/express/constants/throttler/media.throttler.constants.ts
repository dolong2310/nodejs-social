import { ONE_MINUTE_MS, FIVE_MINUTES_MS } from '@/modules/common/constants/time.constants';
import type { ThrottlePolicy } from '@/presentation/http/express/guards/throttler-proxy.guard';

export const MEDIA_THROTTLE_CONFIG = {
  UPLOAD_IMAGE: {
    key: 'media:upload-image',
    windowMs: FIVE_MINUTES_MS,
    limit: 20
  },
  UPLOAD_VIDEO: {
    key: 'media:upload-video',
    windowMs: FIVE_MINUTES_MS,
    limit: 10
  },
  UPLOAD_VIDEO_STREAM: {
    key: 'media:upload-video-stream',
    windowMs: FIVE_MINUTES_MS,
    limit: 10
  },
  GET_VIDEO_STATUS: {
    key: 'media:get-video-status',
    windowMs: ONE_MINUTE_MS,
    limit: 60
  }
} as const satisfies Record<string, ThrottlePolicy>;
