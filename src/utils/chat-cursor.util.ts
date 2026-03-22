import { ObjectId } from 'mongodb';

export function encodeChatListCursor(updatedAt: Date, chatId: ObjectId): string {
  return Buffer.from(JSON.stringify({ u: updatedAt.getTime(), c: chatId.toHexString() }), 'utf8').toString(
    'base64url'
  );
}

export function decodeChatListCursor(raw: string): { updatedAt: Date; chatId: ObjectId } {
  const o = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as { u: number; c: string };
  return { updatedAt: new Date(o.u), chatId: new ObjectId(o.c) };
}

export function encodeMessageCursor(createdAt: Date, id: ObjectId): string {
  return Buffer.from(JSON.stringify({ t: createdAt.getTime(), i: id.toHexString() }), 'utf8').toString(
    'base64url'
  );
}

export function decodeMessageCursor(raw: string): { createdAt: Date; _id: ObjectId } {
  const o = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as { t: number; i: string };
  return { createdAt: new Date(o.t), _id: new ObjectId(o.i) };
}
