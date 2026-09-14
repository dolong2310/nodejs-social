import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  target: 'node22',
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
  }
});
