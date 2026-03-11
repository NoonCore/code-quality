import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import sonarjs from 'eslint-plugin-sonarjs'
import unicorn from 'eslint-plugin-unicorn'

// Import optional plugins - these may or may not be installed
let nextPlugin
let jsxA11yPlugin
let prettierPlugin

try {
  const nextModule = await import('eslint-plugin-next')
  nextPlugin = nextModule.default || nextModule
} catch {
  // Next.js plugin not installed, skip Next.js rules
}

try {
  const jsxA11yModule = await import('eslint-plugin-jsx-a11y')
  jsxA11yPlugin = jsxA11yModule.default || jsxA11yModule
} catch {
  // jsx-a11y plugin not installed, skip accessibility rules
}

try {
  const prettierModule = await import('eslint-plugin-prettier')
  prettierPlugin = prettierModule.default || prettierModule
} catch {
  // eslint-plugin-prettier not installed, skip prettier rules
}

const eslintConfig = [
  {
    ignores: [
      'node_modules/',
      '.pnp',
      '.pnp.js',
      '.next/',
      'out/',
      'dist/',
      'build/',
      '.env*',
      '*.log',
      'pids',
      '*.pid',
      '*.seed',
      '*.pid.lock',
      'coverage/',
      '.nyc_output',
      '.cache/',
      '.parcel-cache/',
      '*.tsbuildinfo',
      '.DS_Store',
      '.DS_Store?',
      '._*',
      '.Spotlight-V100',
      '.Trashes',
      'ehthumbs.db',
      'Thumbs.db',
      '.vscode/',
      '.idea/',
      'tmp/',
      'temp/',
      '*.tmp',
      '*.temp',
      'public/',
      '.code-quality/',
      '**/.code-quality/**', // More specific pattern
      'eslint.config.mjs',
      'next.config.ts',
      '.venv/',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        HeadersInit: 'readonly',
        RequestInit: 'readonly',
        TextEncoder: 'readonly',
        btoa: 'readonly',
        crypto: 'readonly',
        sessionStorage: 'readonly',
        // React globals
        React: 'readonly',
        // DOM types
        HTMLDivElement: 'readonly',
        // Node.js globals
        Buffer: 'readonly',
        // Type globals
        Item: 'readonly',
        Bundle: 'readonly',
        ConstStallCategory: 'readonly',
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      react,
      'react-hooks': reactHooks,
      sonarjs,
      unicorn,
      import: importPlugin,
      ...(nextPlugin ? { '@next/next': nextPlugin } : {}),
      ...(jsxA11yPlugin ? { 'jsx-a11y': jsxA11yPlugin } : {}),
      ...(prettierPlugin ? { prettier: prettierPlugin } : {}),
    },
    rules: {
      // React
      'react/jsx-no-literals': 'off',
      'react/prop-types': 'off',
      'react/self-closing-comp': 'warn',
      'react/jsx-sort-props': [
        'warn',
        {
          callbacksLast: true,
          shorthandFirst: true,
          noSortAlphabetically: false,
          reservedFirst: true,
        },
      ],
      'react/jsx-fragments': ['warn', 'syntax'],
      'react/jsx-no-useless-fragment': 'warn',
      'react/jsx-pascal-case': 'warn',
      'react/no-array-index-key': 'warn',
      'react/react-in-jsx-scope': 'off',
      // JSX quotes consistency with Prettier jsxSingleQuote: true
      'jsx-quotes': ['error', 'prefer-single'],

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_.*$',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-interface': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-as-const': 'warn',

      // Next.js (if available)
      ...(nextPlugin
        ? {
            '@next/next/no-html-link-for-pages': 'off',
            '@next/next/no-img-element': 'warn',
            '@next/next/no-sync-scripts': 'warn',
          }
        : {}),

      // Accessibility (if jsx-a11y plugin available)
      ...(jsxA11yPlugin
        ? {
            'jsx-a11y/alt-text': 'warn',
            'jsx-a11y/interactive-supports-focus': 'off',
            'jsx-a11y/click-events-have-key-events': 'warn',
            'jsx-a11y/no-static-element-interactions': 'warn',
          }
        : {}),

      // Import ordering
      'import/order': [
        'error',
        {
          groups: [
            'type',
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
          ],
          pathGroups: [
            {
              pattern: '~/**',
              group: 'external',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-duplicates': 'error',
      'import/no-unresolved': 'error',
      'import/no-cycle': 'error',

      // Code quality
      'no-console': ['error', { allow: ['warn', 'error'] }],
      ...(prettierPlugin
        ? {
            'prettier/prettier': [
              'error',
              {
                endOfLine: 'auto',
              },
            ],
          }
        : {}),
      'padding-line-between-statements': [
        'warn',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        {
          blankLine: 'any',
          prev: ['const', 'let', 'var'],
          next: ['const', 'let', 'var'],
        },
      ],

      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'no-param-reassign': 'warn',
      'no-return-await': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      'no-unused-expressions': 'error',
      // Semicolons consistency with Prettier semi: false
      semi: ['error', 'never'],

      // SonarJS
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-duplicate-string': 'warn',

      // Unicorn
      'unicorn/no-array-for-each': 'error',
      'unicorn/prefer-node-protocol': 'error',
    },
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "MemberExpression[object.object.name='process'][object.property.name='env'][property.type='Identifier'][property.name=/^NEXT_PUBLIC_/]",
          message:
            'Do not access process.env.NEXT_PUBLIC_* directly. Use src/constants/environment.ts instead.',
        },
        {
          selector:
            "MemberExpression[object.object.name='process'][object.property.name='env'][property.type='Literal'][property.value=/^NEXT_PUBLIC_/]",
          message:
            'Do not access process.env.NEXT_PUBLIC_* directly. Use src/constants/environment.ts instead.',
        },
      ],
    },
  },
  {
    files: ['src/constants/environment.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  prettier,
]

export default eslintConfig
