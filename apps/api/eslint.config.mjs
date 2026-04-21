import { nestJsConfig } from '@repo/eslint-config/nest-js';

export default [
  ...nestJsConfig,
  {
    ignores: ['eslint.config.mjs'],
  },
];
