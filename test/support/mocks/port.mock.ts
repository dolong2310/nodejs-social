import type { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import type { UnitOfWorkPort } from '@/modules/core/application/ports/unit-of-work.port';
import { vi } from 'vitest';

export function mockPort<TPort extends object>(implementation: Partial<TPort> = {}): TPort {
  return implementation as TPort;
}

export function mockCache(): CacheManagerPort {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    acquireLock: vi.fn().mockResolvedValue({ token: 'mock-lock-token' }),
    releaseLock: vi.fn().mockResolvedValue(undefined),
    read: vi.fn((_key: string, loader: () => Promise<unknown>) => loader()) as unknown as CacheManagerPort['read'],
    write: vi.fn((_key: string, writer: () => Promise<unknown>) => writer()) as unknown as CacheManagerPort['write'],
    delete: vi.fn((_key: string, deleter: () => Promise<void>) => deleter()),
    invalidate: vi.fn().mockResolvedValue(undefined)
  };
}

/** Runs the work directly, without a transaction. */
export function mockUnitOfWork(): UnitOfWorkPort {
  return {
    run: vi.fn((work: () => Promise<unknown>) => work()) as unknown as UnitOfWorkPort['run']
  };
}
