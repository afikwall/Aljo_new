import { defineConfig, loadEnv, PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { jsonErrorReporterPlugin } from './vite-plugin-json-error-reporter';
import componentDebugger from 'vite-plugin-component-debugger';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isStandalone = process.env.VITE_BUILD_STANDALONE === '1';

const externalDeps = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'react/compiler-runtime',
  'react-router',
  '@blocksdiy/blocks-client-sdk/clientSdk',
  '@blocksdiy/blocks-client-sdk/reactSdk',
  '@blocksdiy/react-common/agent-chat',
];

export default defineConfig(({ mode, command }) => {
  let env = 'production';
  if (isStandalone) {
    const envFromFile = loadEnv(mode, __dirname, '');
    const apiHost = envFromFile.VITE_BLOCKS_API_HOST ?? '';
    console.log('apiHost', apiHost);
    if (apiHost?.includes('localhost')) {
      env = 'development';
    }
  }
  console.log('env', env);

  // Dev server (command === 'serve') must use index.html so / serves the standalone app.
  // When rollupOptions.input is ./src/index.tsx (cloud build), the dev server won't serve index.html at / and you get a blank page.
  const useHtmlEntry = isStandalone || command === 'serve';

  return {
    // Explicit root so dev server finds index.html when run from any cwd (e.g. workspace root)
    root: __dirname,
    plugins: [
      componentDebugger({
        enabled: true,
        includeAttributes: ['id', 'name', 'path', 'line', 'file'],
        includePaths: ['src/pages/**', 'src/components/**', 'src/layout.tsx'],
        includeContent: true,
        customAttributes: ({ content }) => {
          const attrs: Record<string, string> = {};
          const staticText = content?.trim();

          // Only set when plugin extracted compile-time JSX text.
          if (staticText) {
            attrs['data-dev-static-text'] = staticText;
          }

          return attrs;
        },
      }),
      react({
        babel: {
          plugins: ['babel-plugin-react-compiler'],
        },
      }) as PluginOption,
      jsonErrorReporterPlugin(),
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html.replaceAll('__ENV__', env);
        },
      },
    ],
    // Use '/' so asset URLs work from any path (e.g. /auth/magic-login, /auth/app-login)
    base: '/',
    mode: 'production',
    resolve: {
      // Single React instance so react/jsx-runtime resolves with correct exports (avoids "does not provide export named 'jsx'").
      dedupe: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
      ],
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@blocks/client-sdk': '@blocksdiy/blocks-client-sdk/clientSdk',
        '@blocks/react-sdk': '@blocksdiy/blocks-client-sdk/reactSdk',
        '@/product-types': path.resolve(__dirname, './src/product-types.ts'),
        // CJS lodash has no default export in ESM; use ESM build in dev so subpath imports work.
        lodash: 'lodash-es',
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      __ENV__: `"${env}"`,
    },
    optimizeDeps: {
      // CJS deps that don't expose default for ESM; pre-bundle so Vite handles interop.
      // React runtimes: pre-bundle so CJS → ESM gives proper named exports (jsx, jsxs, etc.).
      include: [
        'pusher-js',
        'lodash-es',
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
      ],
    },
    build: {
      minify: false,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 2000,
      target: 'es2022',
      sourcemap: false,
      cssCodeSplit: true,
      manifest: false,
      outDir: `dist/`,
      rolldownOptions: useHtmlEntry
        ? {
            input: './index.html',
          }
        : {
            treeshake: true,
            preserveEntrySignatures: 'exports-only',
            input: {
              main: './src/index.tsx',
            },
            external: externalDeps,
            output: {
              format: 'umd',
              entryFileNames: () => {
                return `index.js`;
              },
              name: `compiler`,
              globals: {
                react: 'React',
                'react-dom': 'ReactDOM',
                'react/jsx-runtime': 'jsxRuntime',
                'react/compiler-runtime': 'reactCompilerRuntime',
                'react-router': 'react-router',
                '@blocksdiy/blocks-client-sdk/clientSdk':
                  '@blocksdiy/blocks-client-sdk/clientSdk',
                '@blocksdiy/blocks-client-sdk/reactSdk':
                  '@blocksdiy/blocks-client-sdk/reactSdk',
                '@blocksdiy/react-common/agent-chat':
                  '@blocksdiy/react-common/agent-chat',
              },
            },
          },
    },
  };
});
