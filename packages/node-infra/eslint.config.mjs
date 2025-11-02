import minimaltechLinter from '@minimaltech/eslint-node';

const configs = [
  ...minimaltechLinter,
  {
    rules: {
      'no-dupe-class-members': 'off',

      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-dupe-class-members': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/unified-signatures': 'off',
    },
  },
];

export default configs;
