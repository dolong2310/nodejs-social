export function encodeConversationListCursor(updatedAt: Date, conversationIdHex: string): string {
  return Buffer.from(JSON.stringify({ u: updatedAt.getTime(), c: conversationIdHex }), 'utf8').toString('base64url');
}

export function decodeConversationListCursor(raw: string): { updatedAt: Date; conversationId: string } {
  const o = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as { u: number; c: string };
  return { updatedAt: new Date(o.u), conversationId: o.c };
}

export function encodeMessageCursor(createdAt: Date, messageIdHex: string): string {
  return Buffer.from(JSON.stringify({ t: createdAt.getTime(), i: messageIdHex }), 'utf8').toString('base64url');
}

export function decodeMessageCursor(raw: string): { createdAt: Date; _id: string } {
  const o = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as { t: number; i: string };
  return { createdAt: new Date(o.t), _id: o.i };
}
