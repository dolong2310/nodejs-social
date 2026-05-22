import { DateIdCursor } from '@/modules/common/domain/value-objects/cursor.value-object';

/**
 * Encode a cursor containing only id (no date), used when sorting by natural _id order.
 * Encode a cursor containing date + id, used when sorting by date DESC with _id as the tie-breaker.
 */
export function encodeCursor(id: string): string;
export function encodeCursor(date: Date, id: string): string;
export function encodeCursor(dateOrId: Date | string, id?: string): string {
  if (typeof dateOrId === 'string') {
    return Buffer.from(JSON.stringify({ i: dateOrId }), 'utf8').toString('base64url');
  }
  return Buffer.from(JSON.stringify({ t: dateOrId.getTime(), i: id }), 'utf8').toString('base64url');
}

/**
 * Decode a cursor into DateIdCursor { id, createdAt }, used for date+id cursors.
 */
export function decodeCursor(raw: string): DateIdCursor;
export function decodeCursor(raw: string, idOnly: true): string;
export function decodeCursor(raw: string, idOnly?: true): DateIdCursor | string {
  const o = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as { t?: number; i?: string };

  if (idOnly) {
    if (!o?.i || typeof o.i !== 'string') throw new Error('invalid cursor: missing id');
    return o.i;
  }

  if (typeof o?.t !== 'number' || !Number.isFinite(o.t) || typeof o?.i !== 'string' || !o.i) {
    throw new Error('invalid cursor: missing date or id');
  }
  return new DateIdCursor({ id: o.i, createdAt: new Date(o.t) });
}

// decodeCursorOrThrow
export function decodeCursorOrThrow<TDecoded, TException>(
  cursor: string | undefined,
  decodeFn: (raw: string) => TDecoded,
  invalidCursorException: TException
): TDecoded | undefined {
  if (!cursor) return undefined;
  try {
    return decodeFn(cursor);
  } catch {
    throw invalidCursorException;
  }
}
