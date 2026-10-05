import { ONE_MINUTE_MS, FIVE_MINUTES_MS } from '@/modules/common/constants/time.constants';
import type { ThrottlePolicy } from '@/presentation/http/express/guards/throttler-proxy.guard';

export const CONVERSATION_THROTTLE_CONFIG = {
  CREATE_DIRECT: {
    key: 'conversations:create-direct',
    windowMs: FIVE_MINUTES_MS,
    limit: 30
  },
  CREATE_GROUP: {
    key: 'conversations:create-group',
    windowMs: FIVE_MINUTES_MS,
    limit: 20
  },
  LIST: {
    key: 'conversations:list',
    windowMs: ONE_MINUTE_MS,
    limit: 120
  },
  GET: {
    key: 'conversations:get',
    windowMs: ONE_MINUTE_MS,
    limit: 120
  },
  UPDATE: {
    key: 'conversations:update',
    windowMs: FIVE_MINUTES_MS,
    limit: 30
  },
  INVITE_MEMBER: {
    key: 'conversations:invite-member',
    windowMs: FIVE_MINUTES_MS,
    limit: 30
  },
  LEAVE: {
    key: 'conversations:leave',
    windowMs: FIVE_MINUTES_MS,
    limit: 20
  },
  KICK_MEMBER: {
    key: 'conversations:kick-member',
    windowMs: FIVE_MINUTES_MS,
    limit: 30
  },
  UPDATE_MEMBER_ROLE: {
    key: 'conversations:update-member-role',
    windowMs: FIVE_MINUTES_MS,
    limit: 30
  },
  TRANSFER_ADMIN: {
    key: 'conversations:transfer-admin',
    windowMs: FIVE_MINUTES_MS,
    limit: 10
  },
  LIST_MESSAGES: {
    key: 'conversations:list-messages',
    windowMs: ONE_MINUTE_MS,
    limit: 120
  },
  SEND_MESSAGE: {
    key: 'conversations:send-message',
    windowMs: ONE_MINUTE_MS,
    limit: 60
  },
  MARK_READ: {
    key: 'conversations:mark-read',
    windowMs: ONE_MINUTE_MS,
    limit: 120
  }
} as const satisfies Record<string, ThrottlePolicy>;
