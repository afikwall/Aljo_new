import js from '@eslint/js';
import globals from 'globals';
import reactRefresh from 'eslint-plugin-react-refresh';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import autoImport from '@blocksdiy/eslint-plugin-auto-import';
import path from 'path';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
  { ignores: ['dist'] },
  // Regular JS/TS files

  {
    extends: [],
    files: ['**/*.{ts,tsx}'],
    ignores: [
      '**/*.config.ts',
      '**/*.test.ts',
      '**/components/ui/**/*.tsx',
      '**/sdk/**/*.ts',
      '**/test/**/*.{ts,tsx}',
      '**/types/**/*.{ts,tsx}',
      '**/hooks/**/*.{ts,tsx}',
      '**/vite-env.d.ts',
      '**/product-types.ts',
      'dist',
      'node_modules',
      '*.d.ts',
      '*.d.tsx',
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        require: 'readonly',
        NodeJS: true,
      },
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-refresh': reactRefresh,
      'react-hooks': reactHooks,
      'auto-import': autoImport,
      import: importPlugin,
      '@typescript-eslint': tseslint.plugin,
    },
    // settings: {
    //   'import/resolver': {
    //     typescript: {
    //       project: './tsconfig.app.json',
    //     },
    //   },
    // },
    rules: {
      //'react-hooks/rules-of-hooks': 'error',
      //'react-hooks/exhaustive-deps': 'warn',
      'no-undef': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.name="require"]',
          message:
            'require is not allowed. use ES modules (import/export) instead of require().',
        },
      ],
      'auto-import/auto-import': [
        'error',
        {
          // Scan directories for exported components
          scanDirs: {
            '@/components/ui': {
              dir: path.join(import.meta.dirname, 'src/components/ui'),
              cacheable: true,
            },
            'lucide-react': {
              dir: path.join(
                import.meta.dirname,
                'node_modules/lucide-react/dist',
              ),
              file: 'lucide-react.d.ts',
              cacheable: true,
              barrelPattern: true,
            },
            'date-fns': {
              dir: path.join(import.meta.dirname, 'node_modules/date-fns'),
              cacheable: true,
              recursive: false,
              barrelPattern: true,
            },
            'react-hook-form': {
              dir: path.join(
                import.meta.dirname,
                'node_modules/react-hook-form/dist',
              ),
              cacheable: true,
              recursive: false,
              barrelPattern: true,
            },
            sonner: {
              dir: path.join(import.meta.dirname, 'node_modules/sonner/dist'),
              file: 'index.d.ts',
              cacheable: true,
              recursive: false,
              barrelPattern: true,
            },
            '@blocksdiy/blocks-client-sdk/reactSdk': {
              dir: path.join(
                import.meta.dirname,
                'node_modules/@blocksdiy/blocks-client-sdk/dist',
              ),
              file: 'ReactClientSdk.d.ts',
              barrelPattern: true,
              cacheable: true,
            },
            '@lib/utils': {
              dir: path.join(import.meta.dirname, 'src/lib'),
              file: 'utils.ts',
              cacheable: true,
              recursive: false,
              barrelPattern: true,
            },
            // Product types are different between apps, so we don't want to cache them
            '@/product-types': {
              dir: path.join(import.meta.dirname, 'src'),
              file: 'product-types.ts',
              barrelPattern: true,
              cacheable: false,
            },
          },
          mappings: {
            BaseEntityType: {
              path: '@blocksdiy/blocks-client-sdk',
              isDefault: false,
            },
            useCallback: {
              path: 'react',
              isDefault: false,
            },
            useEffect: {
              path: 'react',
              isDefault: false,
            },
            useState: {
              path: 'react',
              isDefault: false,
            },
            useRef: {
              path: 'react',
              isDefault: false,
            },
            useMemo: {
              path: 'react',
              isDefault: false,
            },
            useContext: {
              path: 'react',
              isDefault: false,
            },
            JSX: {
              path: 'react',
              isDefault: false,
            },
            React: {
              path: 'react',
              isDefault: true,
            },
          },
        },
      ],
      //'import/named': 'error', // catches missing exports
      //'@typescript-eslint/no-use-before-define': ['error'],
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
      noInlineConfig: false,
    },
  },
  // Config files without type checking
  {
    files: ['**/*.config.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      parser: tseslint.parser,
      parserOptions: {
        project: null,
      },
    },
  },
);
