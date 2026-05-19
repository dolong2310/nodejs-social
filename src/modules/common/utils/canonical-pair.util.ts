/**
 * Map two user ids to canonical storage order based on string comparison.
 */
export function normalizeFriendshipPair(a: string, b: string): { userIdLow: string; userIdHigh: string } {
  const cmp = a.localeCompare(b);
  if (cmp === 0) {
    throw new Error('Friendship pair requires two distinct user ids');
  }
  return cmp < 0 ? { userIdLow: a, userIdHigh: b } : { userIdLow: b, userIdHigh: a };
}
