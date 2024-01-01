/* eslint-disable */
const js = require('@eslint/js');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const eslintConfigPrettier = require('eslint-config-prettier');
const globals = require('globals');

module.exports = [
	eslintConfigPrettier,
	{
		languageOptions: {
			parser: tsParser,
			parserOptions: { project: ['tsconfig.json'] },
		},
		plugins: { '@typescript-eslint': tsPlugin },
		rules: {
			...js.configs.recommended.rules,
			...tsPlugin.configs.all.rules,
			'@typescript-eslint/consistent-type-definitions': 'off',
			'@typescript-eslint/prefer-readonly-parameter-types': 'off',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/naming-convention': 'warn',
		},
	},
	{
		files: ['**/*.ts'],
		languageOptions: {
			globals: { ...globals.node, myCustomGlobal: 'readonly' },
		},
	},
];
