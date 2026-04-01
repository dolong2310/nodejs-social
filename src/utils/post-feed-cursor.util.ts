import { DateIdCursor } from '@/interfaces/types/cursor.type';

export function encodePostFeedCursor(createdAt: Date, postIdHex: string): string {
  return Buffer.from(JSON.stringify({ t: createdAt.getTime(), i: postIdHex }), 'utf8').toString('base64url');
}

export function decodePostFeedCursor(raw: string): DateIdCursor {
  const o = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as { t: number; i: string };
  return { createdAt: new Date(o.t), _id: o.i };
}
