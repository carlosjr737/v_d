// functions/eslint.config.mjs
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    ignores: ['lib/**', 'node_modules/**'],
    languageOptions: {
      ecmaVersion: 'latest',
      // O código gerado é CommonJS, não vamos trocar package para "type: module"
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      // Permite variáveis/args iniciando com _ para “unused”
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
    },
  }
);
