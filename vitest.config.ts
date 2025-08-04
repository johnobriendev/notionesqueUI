import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: './src/test-utils/setupTests.ts', // or './src/setupTests.ts'
    environment: 'jsdom',
  },
})
