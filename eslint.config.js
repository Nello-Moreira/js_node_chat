const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = [
	'eslint:recommended',
	eslintConfigPrettier,
	{ rules: tsPlugin.configs['eslint-recommended'].overrides[0].rules },
	{ rules: tsPlugin.configs.recommended.rules },
	{
		files: ['**/*.ts'],
		languageOptions: { parser: tsParser },
		plugins: { '@typescript-eslint': tsPlugin },
	},
];
