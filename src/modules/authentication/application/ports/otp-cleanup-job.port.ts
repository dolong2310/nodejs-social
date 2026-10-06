export const OTP_CLEANUP_SCHEDULE_QUEUE_NAME = 'otp-cleanup-schedule';

export interface OtpCleanupJobData {}

export interface OtpCleanupJobResult {
  deletedCount: number;
}
