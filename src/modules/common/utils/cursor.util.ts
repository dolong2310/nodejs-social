import { DateIdCursor } from '@/modules/common/domain/value-objects/date-id-cursor.value-object';

/**
 * Encode cursor chỉ chứa id (không có date) — dùng khi sort theo _id tự nhiên.
 * Encode cursor chứa date + id — dùng khi sort theo date DESC rồi tie-break bằng _id.
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
 * Decode cursor thành DateIdCursor { id, createdAt } — dùng cho date+id cursors.
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
