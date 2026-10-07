import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/main.ts', 'src/worker.ts', 'src/start-all.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node24',
  sourcemap: true,
  clean: true,
  copy: [
    {
      from: 'src/infrastructure/email/templates/*.html',
      to: 'dist/templates',
      flatten: true
    }
  ]
});
