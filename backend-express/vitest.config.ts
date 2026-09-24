import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Expose gc() to allow forced garbage collection in stress tests
    pool: 'forks',
    execArgv: ['--expose-gc'],
  },
});
