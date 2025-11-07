import confs from '@minimaltech/eslint-react';

const configs = [
  ...confs,
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
];

export default configs;
