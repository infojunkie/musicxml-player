import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom', // For DOM testing (MuseScoreRenderer needs DOM)
    globals: true, // Enable global test functions (describe, it, expect)
    include: ['src/**/*.test.ts', 'src/__tests__/**/*.spec.js'], // Include both unit tests and integration tests
    exclude: ['src/**/*.spec.js'], // Exclude existing .spec.js files
    // Handle unhandled rejections gracefully
    onUnhandledRejection: 'warn', // Warn instead of failing tests
    // Suppress console errors from SaxonJS during tests
    silent: false,
    // Add setup to handle SaxonJS errors
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      // Allow importing from src directly
      '@': './src'
    }
  }
})
