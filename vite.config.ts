import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import sitemap from 'vite-plugin-sitemap';

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 5173,
  },
  plugins: [
    react(),
    sitemap({
      hostname: 'https://goalmine.ai',
      routes: [
        '/',
        '/auth',
        '/#features',
        '/#pricing'
      ],
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 1.0,
      outDir: 'dist'
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Use temp directory for cache to avoid permission issues
  cacheDir: '/tmp/vite-cache-goalmine',
}));
