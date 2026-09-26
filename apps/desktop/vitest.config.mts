/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

/**
 * Unit / component test configuration for the Euclid desktop app.
 *
 * Mirrors the renderer's Vite pipeline (Vue SFC + auto-imports + auto-registered
 * components) so that .vue components can be mounted with @vue/test-utils without
 * touching application code.
 *
 * E2E tests live in ./e2e and are run by Playwright (see playwright.config.ts).
 */
export default defineConfig({
  plugins: [
    vue(),
    // Same auto-imports the renderer build uses (ref, computed, onMounted, ...)
    AutoImport({
      imports: ['vue'],
      dts: false,
      eslintrc: { enabled: false },
    }),
    // Same global component discovery the renderer build uses (src/components/**)
    Components({
      dts: false,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.vue', '.json'],
  },
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/*.spec.ts'],
    setupFiles: [resolve(__dirname, 'src/__tests__/setup.ts')],
    css: false,
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 15_000,
    hookTimeout: 15_000,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage/unit',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        'src/**/*.spec.ts',
        'src/**/*.d.ts',
        'src/types/**',
        'src/worker/**',
        'src/assets/**',
      ],
    },
  },
})
