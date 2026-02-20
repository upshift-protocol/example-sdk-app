import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Some SDK dependencies reference `global`
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Polyfill buffer for browser environment
      buffer: 'buffer/',
    },
  },
  build: {
    commonjsOptions: {
      // Handle CJS default export interop for the SDK
      defaultIsModuleExports: true,
    },
  },
})
