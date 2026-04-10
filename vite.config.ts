import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
const plugins = [react(), tailwindcss(), jsxLocPlugin()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "aegis-frontend", "src"),
      "@shared": path.resolve(import.meta.dirname, "aegis-frontend", "shared"),
      buffer: "buffer/",
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "aegis-frontend"),
  publicDir: path.resolve(import.meta.dirname, "aegis-frontend", "public"),
  define: {
    "process.env": {},
    global: "globalThis",
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-solana': ['@solana/web3.js', '@solana/wallet-adapter-react', '@solana/wallet-adapter-base'],
          'vendor-motion': ['framer-motion'],
          'vendor-trpc': ['@trpc/client', '@trpc/react-query', '@tanstack/react-query'],
        }
      }
    }
  },
  server: {
    host: true,
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
