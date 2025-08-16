import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Disable fast refresh for development to prevent double mounting issues
      fastRefresh: false,
    }),
    tailwindcss(),
  ],
  server: {
    hmr: {
      overlay: false, // Disable error overlay that can interfere with Clerk
    },
  },
  define: {
    // Ensure process.env is available for Clerk
    'process.env': {},
  },
})
