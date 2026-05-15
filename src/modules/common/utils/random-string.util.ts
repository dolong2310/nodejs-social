export function generateUniqueString(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  const randomValues = crypto.getRandomValues(new Uint8Array(length));

  return Array.from(randomValues, (x) => chars[x % chars.length]).join('');
}
