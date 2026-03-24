import { ObjectId } from 'mongodb';

export function encodeNotificationCursor(createdAt: Date, id: ObjectId): string {
  return Buffer.from(JSON.stringify({ t: createdAt.getTime(), i: id.toHexString() }), 'utf8').toString('base64url');
}

export function decodeNotificationCursor(raw: string): { createdAt: Date; _id: ObjectId } {
  const o = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as { t: number; i: string };
  return { createdAt: new Date(o.t), _id: new ObjectId(o.i) };
}
