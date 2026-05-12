import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import {
  CacheStrategyPort,
  ReadThroughOptions,
  WriteThroughOptions
} from '@/modules/core/application/ports/cache-strategy.port';

type CacheValue<T> =
  | {
      type: 'hit';
      value: T;
    }
  | {
      type: 'null';
    };

export class CacheStrategy implements CacheStrategyPort {
  constructor(private readonly cache: CacheManagerPort) {}

  async get<T>(key: string, loader: () => Promise<T | null>, options: ReadThroughOptions): Promise<T | null> {
    const cached = await this.cache.get<CacheValue<T>>(key);

    if (cached) {
      if (cached.type === 'hit') return cached.value;
      if (cached.type === 'null') return null;
    }

    const lockKey = `lock:${key}`;
    const lock = await this.cache.acquireLock(lockKey, options.lockTtlMs ?? 5000);

    if (!lock) {
      return this.waitAndRetry(key, loader, options);
    }

    try {
      const cachedAgain = await this.cache.get<CacheValue<T>>(key);

      if (cachedAgain) {
        if (cachedAgain.type === 'hit') return cachedAgain.value;
        if (cachedAgain.type === 'null') return null;
      }

      const data = await loader();

      if (data === null) {
        await this.cache.set<CacheValue<T>>(
          key,
          { type: 'null' },
          {
            ttlSeconds: options.negativeTtlSeconds ?? 30
          }
        );

        return null;
      }

      await this.cache.set<CacheValue<T>>(
        key,
        {
          type: 'hit',
          value: data
        },
        {
          ttlSeconds: this.withJitter(options.ttlSeconds, options.jitterRatio ?? 0.1)
        }
      );

      return data;
    } finally {
      await this.cache.releaseLock(lockKey, lock.token);
    }
  }

  async write<T>(key: string, writer: () => Promise<T>, options: WriteThroughOptions): Promise<T> {
    const data = await writer();

    try {
      await this.cache.set(
        key,
        {
          type: 'hit',
          value: data
        },
        {
          ttlSeconds: this.withJitter(options.ttlSeconds, options.jitterRatio ?? 0.1)
        }
      );
    } catch {
      if (options.rollbackCacheOnError) {
        await this.cache.del(key);
      }

      // DB đã ghi thành công nhưng Redis lỗi.
      // Không nên rollback DB chỉ vì cache lỗi.
      // Có thể log error hoặc đẩy job retry sau.
    }

    return data;
  }

  async delete(key: string, deleter: () => Promise<void>): Promise<void> {
    await deleter();
    await this.cache.del(key);
  }

  async invalidate(key: string): Promise<void> {
    await this.cache.del(key);
  }

  private async waitAndRetry<T>(
    key: string,
    loader: () => Promise<T | null>,
    options: ReadThroughOptions
  ): Promise<T | null> {
    const waitMs = options.waitMs ?? 100;
    const maxAttempts = options.maxWaitAttempts ?? 20;

    for (let i = 0; i < maxAttempts; i++) {
      await sleep(waitMs);

      const cached = await this.cache.get<CacheValue<T>>(key);

      if (cached) {
        if (cached.type === 'hit') return cached.value;
        if (cached.type === 'null') return null;
      }
    }

    // Quan trọng:
    // Không gọi DB trực tiếp ở đây.
    // Quay lại tranh lock tiếp để đảm bảo mỗi key chỉ có 1 loader chạy.
    return this.get(key, loader, options);
  }

  // Thêm một lượng ngẫu nhiên nhỏ vào TTL để các key không hết hạn cùng một thời điểm.
  // Ví dụ: thay vì 10.000 key cùng expire đúng giây thứ 300, chúng rải ra trong khoảng 300-330 giây.
  // Giảm spike Redis/DB do expire hàng loạt.
  private withJitter(ttlSeconds: number, ratio: number): number {
    const jitter = Math.floor(ttlSeconds * ratio * Math.random());
    return ttlSeconds + jitter;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
