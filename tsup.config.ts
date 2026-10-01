import { cp } from 'node:fs/promises';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts'],
  outDir: 'dist',
  format: ['esm'],
  target: 'node24',
  platform: 'node',
  splitting: false,
  sourcemap: false,
  clean: true,
  bundle: true,
  esbuildOptions(options) {
    // Resolve @/ aliases during bundling
    options.alias = {
      '@': './src'
    };
    // Keep all node_modules as external (not bundled into dist)
    options.packages = 'external';
  },
  async onSuccess() {
    // The bundle's import.meta.url is dist/main.js, so templates must live at dist/templates.
    await cp('src/infrastructure/email/templates', 'dist/templates', { recursive: true });
  }
});
