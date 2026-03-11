// ESLint config for code-quality-lib (Node.js library)
// This is a simplified config for linting the library itself
// For project configs, see .code-quality/eslint.config.mjs

import js from '@eslint/js'
import prettier from 'eslint-config-prettier'

const eslintConfig = [
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      '.code-quality/',
      '*.log',
      '.DS_Store',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        Buffer: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    rules: {
      // Code quality
      'no-console': 'off', // Allow console in Node.js library
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'prefer-const': 'warn', // Warn instead of error for flexibility
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      'no-debugger': 'error',
      'no-control-regex': 'off', // Allow ANSI color codes in regex
      'no-useless-escape': 'off', // Allow escape characters for clarity
      'no-undef': 'error',
    },
  },
  prettier,
]

export default eslintConfig
