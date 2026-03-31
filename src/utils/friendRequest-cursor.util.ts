export function encodeFriendRequestCursor(createdAt: Date, requestIdHex: string): string {
  return Buffer.from(JSON.stringify({ t: createdAt.getTime(), i: requestIdHex }), 'utf8').toString('base64url');
}

export function decodeFriendRequestCursor(raw: string): { createdAt: Date; _id: string } {
  const o = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as { t?: number; i?: string };
  if (typeof o?.t !== 'number' || !Number.isFinite(o.t) || typeof o?.i !== 'string' || o.i.length === 0) {
    throw new Error('invalid friendRequest cursor');
  }
  return { createdAt: new Date(o.t), _id: o.i };
}
