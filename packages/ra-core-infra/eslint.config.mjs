import defaultConfigs from '@minimaltech/eslint-react';

const configs = [
  ...defaultConfigs,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*/*.ts'],
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['**/locales/*.ts'],
    rules: { '@typescript-eslint/naming-convention': ['off'] },
  },
  {
    files: ['**/index.{ts,tsx}'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
];

export default configs;
