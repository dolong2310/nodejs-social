export abstract class BaseService {
  /**
   * In-memory cache with TTL and max-entries cap.
   * - TTL (ms) tính từ thời điểm set.
   * - Khi vượt quá số lượng entry, cache sẽ quét key hết hạn và remove dần từ key cũ nhất.
   * - Áp dụng cho bất kỳ loại value nào (generic).
   */
  protected createTtlCapCache<K, V>(ttlMs: number, maxEntries: number) {
    const store = new Map<K, { value: V; expiresAt: number }>();

    const sweepExpired = (now: number) => {
      for (const [key, entry] of store) {
        if (entry.expiresAt <= now) {
          store.delete(key);
        }
      }
    };

    const enforceCap = (now: number) => {
      if (store.size < maxEntries) return;
      sweepExpired(now);
      while (store.size >= maxEntries) {
        const oldestKey = store.keys().next().value as K | undefined;
        if (oldestKey === undefined) break;
        store.delete(oldestKey);
      }
    };

    return {
      get(key: K, now: number = Date.now()): V | undefined {
        const entry = store.get(key);
        if (!entry) return undefined;
        if (entry.expiresAt <= now) {
          store.delete(key);
          return undefined;
        }
        return entry.value;
      },
      set(key: K, value: V, now: number = Date.now()): void {
        enforceCap(now);
        store.set(key, { value, expiresAt: now + ttlMs });
      }
    };
  }

  /**
   * Replace ObjectId to string in the object
   */
  // protected replaceObjectIdToString<T>(obj: unknown): T {
  //   return Object.fromEntries(
  //     Object.entries(obj as Record<string, unknown>).map(([key, value]) => [
  //       key,
  //       value instanceof ObjectId ? value.toString() : value
  //     ])
  //   ) as T;
  // }
  // Method to handle errors
  // protected handleError(error: unknown) {}
  /*
   * Validates required fields in the provided data object.
   * Throws an AppError if any required field is missing.
   */
  // protected validateRequiredFields(data: Record<string, any>, requiredFields: string[]): void {}
  /*
   * Sanitizes a string by trimming whitespace and replacing multiple spaces with a single space.
   * Returns the sanitized string.
   */
  // protected sanitizeString(str: string): string {
  //   return str.trim().replace(/\s+/g, ' ');
  // }
  /*
   * Validates an email address format.
   * Returns true if valid, false otherwise.
   */
  // protected isValidEmail(email: string): boolean {
  //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //   return emailRegex.test(email);
  // }
}
