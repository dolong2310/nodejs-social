import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(globalIgnores(['dist/', 'node_modules/']), {
  files: ['**/*.{ts,mts,cts}'],
  extends: [js.configs.recommended, tseslint.configs.recommended, eslintConfigPrettier],
  rules: {
    'no-undef': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-empty-object-type': 'off',
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }]
  }
});
