import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@/utils': resolve(__dirname, 'utils'),
      '@/api': resolve(__dirname, 'api'),
      '@/store': resolve(__dirname, 'store'),
    }
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['tests/setup.js'],
  }
})
