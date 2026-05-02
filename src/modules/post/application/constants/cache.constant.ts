import { GetBlockedPostIdsPayload } from '@/modules/post/application/services/post.service.type';
import { createHash } from 'crypto';

export const CACHE_KEYS = {
  blockedPostIds: (payload: GetBlockedPostIdsPayload): string => {
    const fingerprint = JSON.stringify(payload);
    const hash = createHash('sha256').update(fingerprint).digest('hex').slice(0, 40);
    return `social:posts:blocked-interaction:v1:${hash}`;
  }
} as const;

export const CACHE_TTL = {
  BLOCKED_INTERACTION_POST_IDS: 30, // short-lived: used for feed/search block-interaction exception checks
  BLOCKED_USER_IDS: 30 // short-lived: block graph can change frequently
} as const;
