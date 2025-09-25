module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [
    'import'
  ],
  rules: {
    // Security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-script-url': 'error',
    'no-alert': 'warn',
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',

    // Code quality
    'prefer-const': 'error',
    'no-var': 'error',
    'no-unused-vars': ['error', {
      vars: 'all',
      args: 'after-used',
      ignoreRestSiblings: true
    }],
    'no-undef': 'error',

    // Import rules
    'import/no-unresolved': 'off', // Webpack handles resolution
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'newlines-between': 'always'
    }],

    // Style rules (handled by Prettier mostly)
    'indent': ['error', 2, { SwitchCase: 1 }],
    'quotes': ['error', 'single', { allowTemplateLiterals: true }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],

    // Best practices
    'eqeqeq': ['error', 'always'],
    'no-throw-literal': 'error',
    'no-return-await': 'error',
    'require-await': 'error',
    'no-async-promise-executor': 'error'
  },
  globals: {
    // Firebase globals
    'firebase': 'readonly',
    'Firebase': 'writable',
    'FirebaseUtils': 'readonly',
    'SecureFirebaseUtils': 'readonly',
    'FirebaseErrorHandler': 'readonly',

    // Flow app globals
    'FlowAuth': 'writable',
    'FlowValidation': 'writable',
    'FlowI18n': 'readonly',
    'toast': 'readonly',

    // Service Worker
    'importScripts': 'readonly',
    'workbox': 'readonly',

    // Environment variables
    'process': 'readonly'
  },
  overrides: [
    {
      files: ['functions/**/*.js', 'functions/**/*.ts'],
      env: {
        node: true,
        browser: false
      },
      rules: {
        'no-console': 'off' // Allow console in Cloud Functions
      }
    }
  ]
};