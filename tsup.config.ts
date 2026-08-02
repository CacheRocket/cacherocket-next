import { defineConfig } from 'tsup';

const shared = {
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  target: 'node18' as const,
  outExtension({ format }: { format: 'cjs' | 'esm' | 'iife' }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' };
  },
};

export default defineConfig([
  {
    ...shared,
    entry: {
      index: 'src/index.ts',
      'image-loader': 'src/image-loader.ts',
      server: 'src/server.ts',
    },
    format: ['esm', 'cjs'],
  },
  {
    ...shared,
    clean: false,
    entry: {
      cli: 'src/cli.ts',
    },
    format: ['esm'],
    dts: false,
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
