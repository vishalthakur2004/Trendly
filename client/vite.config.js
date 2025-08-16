import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Simplified React configuration
      fastRefresh: false,
    }),
    tailwindcss(),
  ],
  server: {
    hmr: {
      overlay: false,
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    // Include essential dependencies to prevent module resolution issues
    include: [
      'react',
      'react-dom',
      'react-redux',
      '@reduxjs/toolkit',
      'use-sync-external-store/shim',
      '@clerk/clerk-react'
    ],
  },
  resolve: {
    alias: {
      // Ensure proper resolution for use-sync-external-store
      'use-sync-external-store/shim': 'use-sync-external-store/shim/index.js',
    },
  },
})
