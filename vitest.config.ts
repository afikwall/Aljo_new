import { defineConfig } from 'vitest/config';
import path, { resolve } from 'path';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';

export default defineConfig({
  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],
  test: {
    environment: 'jsdom',
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@blocks/client-sdk': '@blocksdiy/blocks-client-sdk/clientSdk',
      '@blocks/react-sdk': '@blocksdiy/blocks-client-sdk/reactSdk',
    },
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@blocks/client-sdk': '@blocksdiy/blocks-client-sdk/clientSdk',
      '@blocks/react-sdk': '@blocksdiy/blocks-client-sdk/reactSdk',
    },
  },
});
