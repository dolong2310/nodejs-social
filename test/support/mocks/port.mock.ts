import { vi } from 'vitest';

export function mockPort<TPort extends object>(implementation: Partial<TPort> = {}): TPort {
  return implementation as TPort;
}

export function mockCache() {
  return mockPort({
    get: vi.fn((_key, loader) => loader()),
    write: vi.fn((_key, writer) => writer()),
    delete: vi.fn((_key, deleter) => deleter()),
    invalidate: vi.fn().mockResolvedValue(undefined)
  });
}
