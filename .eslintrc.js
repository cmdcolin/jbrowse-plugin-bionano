module.exports = {
  extends: ['react-app', 'plugin:prettier/recommended'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'prefer-const': 2,
    'import/no-anonymous-default-export': 0,
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        args: 'after-used',
        ignoreRestSiblings: true,
      },
    ],
  },
}
