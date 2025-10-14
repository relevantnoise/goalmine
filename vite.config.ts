import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 5173,
  },
  plugins: [
    react(),
    // Removed sitemap plugin - using static /public/sitemap.xml + dynamic /api/sitemap instead
    // This prevents plugin conflicts and gives us full control over sitemap content
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Use temp directory for cache to avoid permission issues
  cacheDir: '/tmp/vite-cache-goalmine',
}));
