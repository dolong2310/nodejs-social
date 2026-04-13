// Decode chuỗi cursor (base64url JSON { t: timestamp, i: messageId }) thành { createdAt, id } — điểm neo “tin cũ nhất trong trang trước”.
// Vì sao: Repository cần thời gian + id để truy vấn ổn định khi nhiều tin cùng createdAt (trùng millisecond).
export function decodeCursorOrThrow<TDecoded, TException>(
  cursor: string | undefined,
  decodeFn: (raw: string) => TDecoded,
  invalidCursorException: TException
): TDecoded | undefined {
  if (!cursor) {
    return undefined;
  }

  try {
    return decodeFn(cursor);
  } catch {
    throw invalidCursorException;
  }
}
