// @ts-check
import nextConfig from 'eslint-config-next'
import coreWebVitals from 'eslint-config-next/core-web-vitals'

/** @type {import('eslint').Linter.Config[]} */
const config = [
  // Next.js flat config (v16+)
  ...(Array.isArray(coreWebVitals) ? coreWebVitals : [coreWebVitals]),

  // Custom rules
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // Ignore generated/build files
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'prisma/migrations/**',
      'public/models/**',
      'scripts/**',
      'sdk/**',
    ],
  },
]

export default config
