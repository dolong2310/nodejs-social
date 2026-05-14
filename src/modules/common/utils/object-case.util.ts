export function convertObjectToSnakeCase(
  object: Record<string, unknown>,
  excludeKeys: string[] = [],
  fallbackKey: string
) {
  return Object.entries(object).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (excludeKeys.includes(key)) {
      acc[fallbackKey] = value;
      return acc;
    }
    const UPPERCASE_LETTER_REGEX = /[A-Z]/g; // Tìm tất cả ký tự viết hoa (A-Z) trong chuỗi
    const snakeKey = key.replace(UPPERCASE_LETTER_REGEX, (letter) => `_${letter.toLowerCase()}`);
    acc[snakeKey] = value;
    return acc;
  }, {});
}
