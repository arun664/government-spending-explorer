import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  // GitHub Pages deployment configuration
  const isProduction = mode === 'production'
  const isGitHubPages = isProduction && (process.env.GITHUB_ACTIONS || process.env.DEPLOY_TARGET === 'github-pages')
  
  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: 'localhost',
      open: true
    },
    // Always use repository name for production builds (GitHub Pages)
    base: isProduction ? '/government-spending-explorer/' : './',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            d3: ['d3', 'topojson-client']
          }
        }
      },
      chunkSizeWarningLimit: 1000,
      // Ensure assets are properly referenced
      assetsInlineLimit: 0
    },
    optimizeDeps: {
      include: ['d3', 'topojson-client']
    },
    // Ensure proper asset handling
    publicDir: 'public'
  }
})