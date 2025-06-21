module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'expo',
    '@typescript-eslint/recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'no-console': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}; 