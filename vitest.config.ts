import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './test')
    }
  },
  test: {
    environment: 'node',
    include: [
      'src/**/*.test.ts',
      'test/architecture/**/*.test.ts',
      'test/integration/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      'test/e2e/**/*.test.ts'
    ],
    setupFiles: ['./test/architecture/arch.setup.ts'],
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 60_000,
    hookTimeout: 60_000
  }
});
