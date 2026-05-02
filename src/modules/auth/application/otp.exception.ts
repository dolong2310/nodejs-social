export const InvalidOtpCodeException = new Error('Invalid OTP code');
export const ExpiredOtpCodeException = new Error('Expired OTP code');

export const UserAlreadyHas2FAException = new Error('User already has 2FA');
export const UserNotEnabled2FAException = new Error('User not enabled 2FA');
