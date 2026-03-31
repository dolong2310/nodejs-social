export function encodeFriendListCursor(friendIdHex: string): string {
  return Buffer.from(JSON.stringify({ i: friendIdHex }), 'utf8').toString('base64url');
}

export function decodeFriendListCursor(raw: string): string {
  const o = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as { i: string };
  if (!o?.i || typeof o.i !== 'string') {
    throw new Error('invalid friend cursor');
  }
  return o.i;
}
