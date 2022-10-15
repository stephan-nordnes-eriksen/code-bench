module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
		'jest',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
	rules: {
		'@typescript-eslint/no-explicit-any': 'error',
		'indent': ['error', 'tab'],
		'jest/no-disabled-tests': 'error',
	},
}
