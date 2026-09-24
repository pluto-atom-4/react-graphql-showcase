import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // vitest 4 no longer excludes dist by default; skip compiled test copies
    exclude: [...configDefaults.exclude, 'dist/**'],
  },
});
