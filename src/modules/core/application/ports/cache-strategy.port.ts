export type ReadThroughOptions = {
  /**
   * TTL cho cache hit, tính bằng giây. Khi loader trả data thật, data sẽ được cache trong khoảng này.
   */
  ttlSeconds: number;
  /**
   * TTL cho cache null. Dùng chống cache penetration. Ví dụ user không tồn tại, cache { type: 'null' } trong 30 giây để request sau không query DB lại.
   */
  negativeTtlSeconds?: number;
  /**
   * TTL của lock chống cache stampede, tính bằng milliseconds. Request đầu tiên miss cache sẽ giữ lock và gọi DB. Lock cần đủ dài để loader chạy xong.
   */
  lockTtlMs?: number;
  /**
   * Thời gian mỗi request không lấy được lock sẽ đợi trước khi đọc cache lại.
   */
  waitMs?: number;
  /**
   * Số lần retry đọc cache khi không lấy được lock. Nếu quá số lần, nó quay lại tranh lock tiếp bằng cách gọi lại get().
   */
  maxWaitAttempts?: number;
  /**
   * Tỷ lệ random cộng thêm vào TTL để tránh nhiều key hết hạn cùng lúc. Ví dụ ttlSeconds = 300, jitterRatio = 0.1 thì TTL thực tế khoảng 300-330 giây.
   */
  jitterRatio?: number;
};

export type WriteThroughOptions = {
  ttlSeconds: number;
  jitterRatio?: number;
  /**
   * Nếu DB đã ghi thành công nhưng set cache lỗi, option này cho phép xóa cache key để tránh giữ data cũ.
   * Lưu ý: nó không rollback DB. DB là source of truth; cache lỗi thì chỉ xử lý cache.
   */
  rollbackCacheOnError?: boolean;
};

export interface CacheStrategyPort {
  get<T>(key: string, loader: () => Promise<T | null>, options: ReadThroughOptions): Promise<T | null>;
  write<T>(key: string, writer: () => Promise<T>, options: WriteThroughOptions): Promise<T>;
  delete(key: string, deleter: () => Promise<void>): Promise<void>;
  invalidate(key: string): Promise<void>;
}
