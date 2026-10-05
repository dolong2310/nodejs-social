import { ONE_MINUTE_MS } from '@/modules/common/constants/time.constants';
import type { ThrottlePolicy } from '@/presentation/http/express/guards/throttler-proxy.guard';

export const STATIC_THROTTLE_CONFIG = {
  GET_IMAGE: {
    key: 'static:get-image',
    windowMs: ONE_MINUTE_MS,
    limit: 300
  },
  GET_VIDEO_STREAM: {
    key: 'static:get-video-stream',
    windowMs: ONE_MINUTE_MS,
    limit: 300
  },
  GET_VIDEO_STREAM_MASTER: {
    key: 'static:get-video-stream-master',
    windowMs: ONE_MINUTE_MS,
    limit: 300
  },
  GET_VIDEO_STREAM_SEGMENT: {
    key: 'static:get-video-stream-segment',
    windowMs: ONE_MINUTE_MS,
    limit: 600
  }
} as const satisfies Record<string, ThrottlePolicy>;
