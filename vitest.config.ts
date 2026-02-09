import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/__tests__/unit/**/*.{test,spec}.{js,ts,tsx}'],
    exclude: [
      'node_modules',
      '__tests__/components/**', // Skip component tests (use Expo CLI for those)
      'dist',
      '.expo',
      'ios',
      'android',
      'web-build',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '__tests__/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        'babel.config.js',
        'metro.config.js',
      ],
    },
    // Mock React Native and Expo modules for pure logic testing
    setupFiles: ['./__tests__/vitest.setup.ts'],
    server: {
      deps: {
        external: ['react-native'],
      },
    },
  },
  resolve: {
    alias: [
      { find: /^react-native$/, replacement: path.resolve(__dirname, './__tests__/mocks/react-native.ts') },
      { find: /^@react-native-async-storage\/async-storage$/, replacement: path.resolve(__dirname, './__tests__/mocks/async-storage.ts') },
      { find: /^expo-constants$/, replacement: path.resolve(__dirname, './__tests__/mocks/expo-constants.ts') },
      { find: /^expo-font$/, replacement: path.resolve(__dirname, './__tests__/mocks/expo-font.ts') },
      { find: /^expo$/, replacement: path.resolve(__dirname, './__tests__/mocks/expo.ts') },
      { find: /^expo-notifications$/, replacement: path.resolve(__dirname, './__tests__/mocks/expo-notifications.ts') },
      { find: /^@react-navigation\/native$/, replacement: path.resolve(__dirname, './__tests__/mocks/react-navigation-native.ts') },
      { find: /^expo-router$/, replacement: path.resolve(__dirname, './__tests__/mocks/expo-router.ts') },
      { find: /^@expo\/vector-icons$/, replacement: path.resolve(__dirname, './__tests__/mocks/vector-icons.ts') },
      { find: /^react-native-purchases$/, replacement: path.resolve(__dirname, './__tests__/mocks/react-native-purchases.ts') },
      { find: /^react-native-purchases-ui$/, replacement: path.resolve(__dirname, './__tests__/mocks/react-native-purchases-ui.ts') },
      { find: /^react-native-toast-message$/, replacement: path.resolve(__dirname, './__tests__/mocks/react-native-toast-message.ts') },
      { find: '@', replacement: path.resolve(__dirname, './') },
    ],
  },
});
