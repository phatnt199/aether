import confs from '@minimaltech/eslint-react';

const configs = [
  ...confs,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
  {
    files: ['**/locales/*.ts'],
    rules: { '@typescript-eslint/naming-convention': ['off'] },
  },
];

export default configs;
