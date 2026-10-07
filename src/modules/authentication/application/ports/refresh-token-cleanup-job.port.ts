export const REFRESH_TOKEN_CLEANUP_SCHEDULE_QUEUE_NAME = 'refresh-token-cleanup-schedule';

export interface RefreshTokenCleanupJobData {}

export interface RefreshTokenCleanupJobResult {
  deletedCount: number;
}
