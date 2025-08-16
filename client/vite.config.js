import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // More aggressive settings to prevent Clerk issues
      fastRefresh: false,
      include: "**/*.{jsx,tsx}",
      babel: {
        plugins: [],
      },
    }),
    tailwindcss(),
  ],
  server: {
    hmr: {
      overlay: false,
      clientPort: 5173,
    },
    cors: true,
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['@clerk/clerk-react'],
    include: ['react', 'react-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          clerk: ['@clerk/clerk-react'],
        },
      },
    },
  },
})
